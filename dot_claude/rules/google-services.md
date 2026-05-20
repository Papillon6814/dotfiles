# Google サービス操作

## 基本方針
Google 系サービス（Gmail / Calendar / Chat / Classroom / Drive / Contacts / Tasks / Sheets / Docs / Slides / People / Keep / Groups）の操作は、CLI ツール `gog` を **最優先** で使用する。`gog` で対応できない操作のみ、MCP ツール（`mcp__gmail__*` など）にフォールバックしてよい。

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
