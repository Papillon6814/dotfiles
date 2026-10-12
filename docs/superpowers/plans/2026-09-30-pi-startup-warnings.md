# Pi 起動警告の修正計画

- `dot_local/bin/executable_pi-account`：現行起動スクリプトを管理対象に追加。`~/.local/bin/pi-account:25` の共有対象判定からMCPのキャッシュ2件・プロジェクト承認記録を外し、認証と同じくプロファイル別に保持する。
- `dot_local/bin/executable_pi-extension-deps-patch`：対象6拡張のホスト提供依存だけを `peerDependencies: "*"` へ移す、再実行可能なローカル修正を追加。実行前バックアップと既存宣言保持を行う。
- `dot_local/bin/test_pi_startup_warnings.py`：偽HOME・偽Piで、プロファイル別状態、共有設定、auth非共有、起動引数、依存宣言修正・再実行・更新後再適用を検証。
- `~/.pi/agent/projects-memory/ai-secretary/skills/pl-clone/SKILL.md`：個人用の内容を削除せず `pl-clone-notes` へ改名。プロジェクト内の業務入口は変更しない。
- `~/.pi/agent/npm/node_modules/pi-hermes-memory/package.json`：Pi提供のTUIをpeer依存へ移す。
- `~/.pi/agent/npm/node_modules/pi-hashline-edit-pro/package.json`：Pi提供のtypeboxをpeer依存へ移す。
- `~/.pi/agent/npm/node_modules/@schovest/pi-goal/package.json`：重複したtypeboxの通常依存宣言を除き、既存peer依存を使用。
- `~/.pi/agent/npm/node_modules/@georgedong32/pi-review/package.json`：旧typeboxの通常依存宣言を、実際にimportしている `typebox` のpeer依存へ置き換える。
- `~/.pi/agent/git/github.com/danecando/pi-codex-computer-use/package.json`：typeboxをpeer依存へ移す。既存package-lock差分は触らない。
- `~/.pi/agent/pi-deep-research-exa/package.json`：Piがマッピングする旧typebox名をpeer依存へ移す。

適用前にローカル原本を権限0700のバックアップへ保存。適用後はSDKのリソース読込・3プロファイルの新規RPC起動で警告、拡張エラー、ツール欠落を照合し、モデルへのプロンプトは送信しない。

`python3 /Users/papillon/Code/dotfiles-pi-herdr/dot_local/bin/test_pi_startup_warnings.py -v`
