---
title: Lambdaを使って、S3のデータをアカウントを跨いでコピーする
tags:
  - AWS
  - S3
  - lambda
private: false
updated_at: '2025-01-17T15:35:11+09:00'
id: c0aedfabebc9849a4eee
organization_url_name: joolen
slide: false
ignorePublish: false
---
すでに多くの解説ページが存在するが、ロールの一時的な引き受け (信頼関係)の基本が学べたため個人的なメモとして方法をまとめる。

参考: 
https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html

以下が、今回設定する内容の全体像。

![StyleAlert AWS-アカウントを跨いだLambdaのロール.drawio.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/386347/9ef7ae96-4dc2-948d-f41d-f0c123044a03.png)


①, ② Lambdaにてアカウントを跨いで、roleを引き受ける。(assume role)
③ Lambdaが存在するアカウントのS3バケットを取得。
④ アカウントを跨いで、取得したバケットをコピー。
⑤ Lambda実行ログを CLoudWatch Logsに保存。
⑥ Lambda関数のエラーをCloudWatch Alarmにて監視。
⑦ アラームが出た場合、SNSにて通知。

### 今回のキーとなるサービス

AWS STS (AWS Security Token Service):
AWS リソースへのアクセスをコントロールできる一時的セキュリティ認証情報を発行できるサービス。

IAMロール:
信頼ポリシー: 誰が(ユーザー / ロール) このIAMロールを引き受けできるかを定義。
IAMポリシー: このロールで何ができるかを定義。

## 設定方法

### 1. 事前準備

今回使用した、Lambda関数は以下。Python3.13で実装。

```python
import boto3
import os
import logging

# ロガーの設定
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    source_s3_bucket = os.environ['s3_bucket']
    source_s3_key = os.environ['s3_key']
    target_s3_bucket = os.environ['target_s3_bucket']
    target_account_role_arn = os.environ['target_account_role_arn']
    timeout = 3600

    
    sts_client = boto3.client('sts')
		s3_client = boto3.client('s3')

    try:
        # クロスアカウントのS3 role引き受け
        try:
            assumed_role = sts_client.assume_role(
                RoleArn=target_account_role_arn,
                RoleSessionName='S3CrossAccountRole'
            )
            logger.info("Successfully assumed role")
        except Exception as assume_error:
            logger.error(f"Failed to assume role: {str(assume_error)}")
            raise assume_error

        try:
            target_s3_client = boto3.client(
                's3',
                aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
                aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
                aws_session_token=assumed_role['Credentials']['SessionToken']
            )
            logger.info("Successfully created target S3 client")
        except Exception as client_error:
            logger.error(f"Failed to create S3 client: {str(client_error)}")
            raise client_error

        paginator = s3_client.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=source_s3_bucket, Prefix=source_s3_key):
            for obj in page.get('Contents', []):                
                try:
                    target_s3_client.copy_object(
                        CopySource={'Bucket': source_s3_bucket, 'Key': obj['Key']},
                        Bucket=target_s3_bucket,
                        Key=obj['Key']
                    )
                    logger.info(f"Successfully copied {obj['Key']}")
                except Exception as copy_error:
                    logger.error(f"Failed to copy {obj['Key']}: {str(copy_error)}")
                    raise copy_error

        return {
            'statusCode': 200,
            'body': 'File successfully copied.'
        }

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise e

```

テストで環境変数を設定。
```python
{
  "s3_bucket": "{account111のS3bucket名}",
  "s3_key": "{account111のS3bucket prefix}",
  "target_account_role_arn": "{account222から引き受けするRoleのARN}", # 作成後に設定
  "target_s3_bucket": "{account222のS3bucket名}"
}
```

Lambda関数の実行ロールが作成されるため、ARNを控えておく。

### 2. account222 にてrole, S3 bucket policy を設定

account222 にログインし、IAMからロールを作成する。
今回は、`s3-PutObject-assumedRole-by-Lambda-in-account111` という名前で作成した。

このロールに IAMポリシーと信頼ポリシーを設定する。コンソールでは、ロールの中の許可、信頼関係がそれぞれポリシーの設定箇所となる。

![Screenshot 2025-01-17 at 10.09.45.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/386347/5257e1a0-8f53-8104-8cb6-a4e2b9ff5baf.png)


上記ではS3FullAccessを許可しているが、Put操作に必要な最小権限としては以下を設定する。

```python
# s3-PutObject-assumedRole-by-Lambda-in-account111
# 許可ポリシー

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::{s3bucket名}/*",
                "arn:aws:s3:::{s3bucket名}"
            ]
        }
    ]
}
```

また信頼関係では、誰がこのロールを使用できるかを定義する。
今回は、account111のLambdaがこのロールを引き受けるため、account111のLambdaを信頼関係に定義する。
```python
# s3-PutObject-assumedRole-by-Lambda-in-account111
# 信頼ポリシー

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "{1で作成したLambdaの実行ロールARN}",
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

ここで作成したロールのARNを控えておく。

続いて、account222 の S3 bucket policy を設定する。S3 bucketはいま作成した、`s3-PutObject-assumedRole-by-Lambda-in-account111` ロールからアクセスされるため、s3 bucket policyにアクセス許可を設定する。

```python
# account222 s3 bucket policy

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowPutObject",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::222(アカウントID):role/s3-PutObject-assumedRole-by-Lambda-in-account111" # 作成したRoleのARN
            },
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::{s3bucket名}",
                "arn:aws:s3:::{s3bucket名}/*"
            ]
        }
    ]
}
```

### account 111 の Lambdaロール追加設定とs3 bucket policy設定

account111に戻る。
2 の手順で作成した、roleのARNをLambdaのテスト環境変数に設定する。

続いて、Lambdaの実行ロールに、2で作成したロールを引き受けできる権限を追加する。以下ポリシーを作成し、Lambda実行ロールの許可ポリシーに追加する。

```python
# Lambda実行ロール
# 許可ポリシー

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "allowAssumeRole",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::222(アカウントID):role/s3-PutObject-assumedRole-by-Lambda-in-account111" # 2で作成したRoleのARN
        }
    ]
}
```

続いてs3 bucket policy を設定する。
今回、コピーは Lambdaがaccount222のロールを引き受けた状態で行われる。そのため、account222のロールに対して、許可が必要。

```python
# account111 s3 bucket policy

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCopyObjectFromLambda",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::222(アカウントID):role/s3-PutObject-assumedRole-by-Lambda-in-account111" # 2で作成したRoleのARN
            },
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::{s3bucket名}",
                "arn:aws:s3:::{s3bucket名}/*"
            ]
        }
    ]
}
```

### Lambda関数をテスト実行する。

テストで試してみる。

### (オプション) Lambda関数の監視設定

今回は、このLambda関数をEvent駆動させるため、処理が失敗したら通知を飛ばすようにする。
CloudWatch AlarmのメトリクスをLambda関数別の ”Errors”で作成し、期間内に0より大きい場合はアラーム状態となるように設定する。
アラーム状態になった時のアクションとしてSNSを使い、メール通知を送るように設定する。SNSのトピックを作成し、CloudWatchAlarmに設定する。またSNSの設定から、作成したトピックに合わせたサブスクリプションを作成することで実装可能。

### 最後に
同様の構成の説明は既にいろいろな方が記事にしており新しい情報は特にないが、　実際に手を動かしてみることで、ロールによる認証の理解を進めることができた。
