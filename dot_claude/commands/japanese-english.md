---
description: 日本語（または英語下書き）を、日本人が自分の言葉として使えるシンプルな英語に変換する（Slack メッセージ向け）
argument-hint: "[日本語テキスト or 英語下書き] [--formal]"
---

# /japanese-english — 日本人が使えるシンプル英語への変換

入力されたテキストを、**日本人の非ネイティブ話者が自分で書いたと自然に見える、シンプルで正しい英語**に変換するスキル。主な用途は Slack での海外メンバーとのやり取り。

入力: `$ARGUMENTS`

引数が空の場合は「変換したい日本語（または英語の下書き）を貼ってください」と聞く。

---

## 変換ルール

### 語彙・文法

- 語彙は **中学〜高校レベル（CEFR A2〜B1）** に限定する。迷ったら簡単な方を選ぶ
- 文法は正しく保つ。「わざと壊した英語」にはしない。目標は *broken English* ではなく *plain English*
- 1文1アイデア。長い文は分割する。関係代名詞の多重ネストや分詞構文は使わない
- 避ける語の例と言い換え:
  - constructively → let's think together
  - facilitate / leverage / utilize → help / use
  - moreover / furthermore / therefore → also / so
  - ensure / guarantee → make sure
  - feasible / viable → possible / can we do it?
  - address (問題に対処する) → fix / work on
- イディオム・スラング・文化依存の表現（"ballpark", "touch base", "circle back" など）は使わない
- 句動詞は基本的なもののみ（find out, set up, follow up は OK）

### トーン（既定: Slack カジュアル）

- 小文字始まりカジュアル OK、短縮形（it's, we'll）OK
- ユーザー（くのさん）が実際に使う文体に合わせる。アンカー例:
  - "is my understanding correct?"
  - "okay good"
  - "let me know"
  - "i want to ..." / "we have to ..."
  - "so let's ..."
- `--formal` 指定時のみ、メール向けに大文字始まり・丁寧語（Could you / I would like to）に切り替える。ただし語彙レベルは変えない

### 内容の忠実性

- 意味を足さない・削らない。原文にないヘッジ（I think maybe...）や社交辞令を勝手に追加しない
- 数字・日付・固有名詞はそのまま保持する
- 原文が英語の下書きなら、意味を保ったまま上記ルールで簡素化する

## 出力フォーマット

1. **メイン案** — そのまま Slack に貼れる形（コードブロックではなく引用ブロックで提示）
2. **短縮カジュアル版** — より砕けた・短い別案（トーンや長さが変わる場合のみ）
3. **言い換えメモ** — 難しい語を避けた箇所があれば1〜2行で補足（例: 「建設的に → let's think together」）。なければ省略

余計な解説はしない。ユーザーがコピーして使うことが目的。
