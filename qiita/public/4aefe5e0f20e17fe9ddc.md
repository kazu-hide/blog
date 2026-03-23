---
title: stripeを使ってflaskのWebページに決済ページを作成する方法
tags:
  - Flask
  - stripe
private: false
updated_at: '2023-02-13T10:47:50+09:00'
id: 4aefe5e0f20e17fe9ddc
organization_url_name: null
slide: false
ignorePublish: false
---
## tl;dr
* Stripe (https://stripe.com/ )を使えば、簡単に決済画面を導入できました (ノーコードでもできるようです)
* 商品登録は手動とAPIの2種類があり、今回はテストなので手動登録したが、APIもいつか触ってみたいです


### What I did?
*`stripe`を使って`Flask`で作成したWebサイトに決済ページを作成しました。
* 手順に沿ってコピペすることでテストコードはほぼ手間をかけずに実装可能、ローカルドメイン周りで若干詰まったが全体としてかなり楽に実装できました。
* 実際にはstripeに登録した商品からユニークな`Price ID`を取得し、`POST`リクエストに含める必要があるため、そこはDBなどを使って実装する必要があります。

```python app.py
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    'price': 'price_XXXXXXXX',
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=YOUR_DOMAIN + '/success.html',
            cancel_url=YOUR_DOMAIN + '/cancel.html',
            automatic_tax={'enabled': False},
        )
    except Exception as e:
        return str(e)
    return redirect(checkout_session.url, code=303)

@app.route("/success")
def success():
    return render_template('success.html')

@app.route("/cancel")
def cancel():
    return render_template('cancel.html')
```
