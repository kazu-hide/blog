# Blog

個人ブログとQiita記事を一元管理するモノリポ。

## 構造

```
blog/
├── app/              # ブログアプリ（React + Vite + TypeScript）
├── content/
│   ├── tech/         # 技術記事（myBlog + Qiita に投稿）
│   └── personal/     # 個人ログ（myBlog のみ）
├── qiita/
│   └── public/       # Qiita CLI 用（既存記事 + sync で生成）
├── scripts/
│   └── sync-to-qiita.ts  # tech/ → qiita/public/ 変換スクリプト
└── .github/workflows/
    ├── deploy-blog.yml    # GitHub Pages デプロイ
    └── publish-qiita.yml  # Qiita 公開
```

## 開発

```bash
npm run dev       # ローカル開発サーバー起動
npm run build     # ビルド
npm run preview   # ビルド結果のプレビュー
```

## 記事の書き方

### 技術記事（myBlog + Qiita）

`content/tech/` に Markdown を作成：

```markdown
---
title: "記事タイトル"
date: "2026-03-23"
excerpt: "概要"
threadTitle: "スレッド名"
qiita:
  tags: ["Python", "FastAPI"]
  emoji: "🐍"
---
本文
```

`qiita` フィールドがある記事は push 時に自動で Qiita にも公開されます。

### 個人ログ（myBlog のみ）

`content/personal/` に Markdown を作成：

```markdown
---
title: "タイトル"
date: "2026-03-23"
excerpt: "概要"
threadTitle: "スレッド名"
---
本文
```

## デプロイ

- **myBlog**: `main` に push → GitHub Actions → GitHub Pages
- **Qiita**: `content/tech/` に変更を push → sync スクリプト → Qiita API
