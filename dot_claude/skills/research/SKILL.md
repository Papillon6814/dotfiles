---
name: research
description: Run /deep-research on the given question, then immediately open the resulting report in Plannotator (/plannotator-last) so the user can add inline comments. Notion sync is NOT done unless the user explicitly asks afterwards.
---

# Research (Deep Research + Plannotator)

`/deep-research` のラッパー。リサーチ完了後、レポートにユーザーがコメントを入れられるよう Plannotator を自動起動する。

## 手順

1. **`/deep-research` を起動する**
   - ユーザーが渡したテーマ・質問をそのまま `args` として `Skill` tool で `deep-research` を呼ぶ
   - リサーチが完了し、最終レポートをアシスタントメッセージとして出力するまで待つ
   - レポート本文はこのスキル自身の最終応答として 1 メッセージにまとめて出すこと（次手順の `/plannotator-last` がそのメッセージを対象にするため）

2. **`/plannotator-last` を即座に起動する**
   - レポート出力直後、追加のコメント・前置きを書かずに `Skill` tool で `plannotator-last` を呼ぶ
   - 前置きを書くと「最後のアシスタントメッセージ」がコメント文になってしまい、レポートに注釈できなくなる
   - Plannotator から返ってきたアノテーションがあれば、それを反映してレポートを改訂する

3. **Notion 連携はしない**
   - レポートを Notion に書き込む、Notion DB に登録する、などは **このスキル内では一切行わない**
   - ユーザーから「Notion にも入れて」「ページにして」等の明示的指示があった場合のみ、別途 `mcp__notion__notion-create-pages` を使う

## 注意

- 手順 1 → 2 の間で「リサーチ完了しました、続いて Plannotator を起動します」のような前置きを書かないこと（`/plannotator-last` の対象がそれになる）
- `/deep-research` の引数として渡すリサーチ質問が曖昧な場合は、`/deep-research` 起動前に `AskUserQuestion` で具体化する
