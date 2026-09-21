# Google サービス操作

## 基本方針
- **一般ユーザーとしての操作**（自分のメール・カレンダー・ドライブ等の読み書き）→ CLI ツール `gog` を最優先。`gog` で対応できない操作のみ MCP ツール（`mcp__gmail__*` など）にフォールバック
- **Google Workspace の管理者操作** → CLI ツール `gam`（GAM7）を最優先。管理コンソール（admin.google.com）のブラウザ操作より先に必ず `gam` で実現できないか確認する

## 管理者操作は GAM を使う
対象: ユーザー管理（作成・停止・退社処理）、グループ/メーリス管理、他ユーザーの設定変更（カレンダータイムゾーン・署名・転送等）、Drive ファイルの移管・棚卸し、監査レポート、ドメイン情報の取得など、管理者権限が必要な操作全般。

- 実行例: `gam info domain` / `gam update group <group> add member <email>` / `gam user <email> modify calendars primary timezone Asia/Tokyo`
- サブコマンドは `gam help` や公式 Wiki（https://github.com/GAM-team/GAM/wiki）で確認
- セットアップ済み環境: GAM 7.x、認証情報は `~/.gam/`、GCP プロジェクト `<project-id>`、ドメインワイド委任承認済み（経緯は ai-secretary リポジトリ `projects/2026-07-10-GAMセットアップ-引き継ぎ.md`）

### GAM 使用時の注意（厳守）
- **破壊的・一括操作は実行前に必ずユーザーに確認する**: `gam all users ...`、ユーザーの削除/停止、`deprovision`、転送設定の変更など影響範囲が大きいものは、対象と影響を提示して明示的な許可を得てから実行
- 単一ユーザーへの読み取り（`show` / `print` / `info`）は確認不要で実行してよい
- 再認証が必要になった場合（`gam oauth create` 等）は対話入力が必要なため、ユーザー自身のターミナルでの実行を依頼する（`!` 経由は stdin が使えず EOF になる）
- GAM で対応できない管理操作のみ、管理コンソールのブラウザ操作にフォールバックする。ただしセキュリティ設定の変更はブラウザ自動操作エージェントでは実行できないため、ユーザー本人に手順を提示する

## なぜ gog 優先か
- スクリプタブル: `--json` / `--plain` で構造化出力、`--no-input` で CI 安全
- 複数アカウント対応: `--account=<email>` で切り替え
- 一貫したインターフェース: 全サービスを同じ CLI で扱える
- ユーザー環境に明示的にインストールされている

## 使い方
- 詳細サブコマンドは `gog <command> --help` で確認（例: `gog gmail --help`, `gog drive --help`）
- スクリプトや解析が必要な出力は `--json` を付ける
- 破壊的操作は `--force` を付けない限り確認プロンプトが出る点に注意
- 複数アカウントを使い分ける場合は必ず `--account` を明示する

## 対象コマンド対応表
| サービス | gog コマンド |
|---|---|
| Gmail | `gog gmail` (`mail` / `email` でも可) |
| Calendar | `gog calendar` |
| Drive | `gog drive` |
| Docs | `gog docs` |
| Slides | `gog slides` |
| Sheets | `gog sheets` |
| Chat | `gog chat` |
| Classroom | `gog classroom` |
| Contacts | `gog contacts` |
| People | `gog people` |
| Tasks | `gog tasks` |
| Keep | `gog keep` |
| Groups | `gog groups` |
| 認証管理 | `gog auth` |

## フォールバック判断
- まず `gog <command> --help` で目的の操作が gog にあるか確認する
- 無い・あるいは明らかに表現力が足りない場合に限り、MCP ツール（`mcp__gmail__*` など）を使う
- フォールバックを選んだ理由を一言ユーザーに共有する（例: 「gog に該当機能がないため mcp__gmail__send_email を使用します」）
