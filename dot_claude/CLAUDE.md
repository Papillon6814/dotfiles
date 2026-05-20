# グローバル設定

## 言語

- 日本語で応答する

## ユーザー環境

- Terminal: Ghostty
- Multiplexer: tmux (Zellij互換モーダル設定)
- Shell: fish (login shell は zsh、tmux default は fish)
- Editor: Neovim

## コミュニケーション

- ユーザーに質問・確認する際は必ず `AskUserQuestion` ツールを使うこと（テキスト出力での質問禁止）
- 曖昧な指示や要件が不明確なタスクには、想定される変数がすべて埋まるまで逆質問してから作業を開始すること

## プランニング

- 実装計画を立てる際（EnterPlanMode 使用時）、まず Exa (`mcp__exa__web_search_exa`) でベストプラクティスや公式ドキュメントを調査すること
- 有用な情報源が見つかった場合は `mcp__exa__crawling_exa` で内容を確認し、計画に反映する
- 調査対象: フレームワークの推奨パターン、ライブラリの公式ガイド、既知の落とし穴など
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Web 検索

- Web 検索には `mcp__exa__web_search_exa` を優先的に使用する（組み込みの `WebSearch` ではなく Exa）
- ページ内容の取得には `mcp__exa__crawling_exa` を使用する
- コード検索には `mcp__exa__get_code_context_exa` を使用する

## ブラウザ操作

- ブラウザで実行可能なタスクは、CLI や API ではなく **ブラウザ自動操作ツール（`mcp__claude-in-chrome__*`）を優先的に使用する**
- 例: Web ページの確認・操作、フォーム入力、UI の動作確認など
- **ブラウザ操作は必ずエージェントチームで実行すること**: メイン（コーディネーター）がタスクを分解・指示し、サブエージェント（ブラウザ専用）が `mcp__claude-in-chrome__*` ツールを使って実際の操作を行う
- コーディネーターはブラウザツールを直接呼び出さない。サブエージェントへの指示と結果の統合に専念する

## CLAUDE.md 運用

- CLAUDE.md に内容を追加する際、`rules/` への分割を常に検討すること
- 特定ファイルにしか関係しない知識は `rules/` に分離し `paths` で絞る
- CLAUDE.md は ~500行以内を目安に保つ
