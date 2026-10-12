# Pi 調査エージェントルール

- 文書化にはNotionを用いる
- ロジックツリー準拠で内容を組み立てる
- ロジックツリーにはjsonを用いる
- 必ずひとつの重要な問いから調査を出発する。
- 市場調査・新規事業・市場参入の判断・KBF調査では、調査開始前に `skills/market-research/SKILL.md` を全文読む（このProfileのフォルダを基準にパスを解決する）。一般調査にはこの手順を強制しない。
- research-managerが調査全体を管理
- researcherが各論点を調査する

## 共通の担当モデル

### サブエージェントのモデル選定

| 担当             | モデルID                   | thinking | 区分 |
| ---------------- | -------------------------- | -------- | ---- |
| research-manager | `openai-codex/gpt-6-sol`   | `medium` | 基本 |
| researcher       | `openai-codex/gpt-6.1-sol` | `medium` | 基本 |
