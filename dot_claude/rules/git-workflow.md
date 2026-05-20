# Git ワークフロー

## ブランチ運用
- **main 直コミット禁止**: 必ず feature branch で作業し、完了後に main へマージ
- ブランチ命名規則: `feat/xxx`, `fix/xxx`, `refactor/xxx`
- プロジェクト CLAUDE.md で main 直コミットが許可されている場合はそちらに従う

## Worktree 運用（必須）
- **コード変更を伴う作業は必ず worktree で行うこと**。ブランチを切るだけでは不十分 — `superpowers:using-git-worktrees` スキルで worktree を作成してから作業を開始する
- main worktree で直接 `git checkout` して作業することは禁止
- worktree 作成後に `npm install` を実行すること（独立した node_modules を使う）
- 既に worktree 内にいる場合（`git rev-parse --show-toplevel` が worktree パスを返す場合）のみ、そのまま作業を継続してよい

## Claude の動作ルール
- 起動時に `git branch --show-current` と `git worktree list` で現在の状態を確認すること
- **main worktree にいる場合**: コード編集の前に必ず worktree を作成して移動する。例外なし
- main worktree での許可される作業: マージ操作（`git merge --no-ff`）、worktree 管理、`rules/` や CLAUDE.md の軽微な設定変更のみ
- CLAUDE.md 編集も feature branch で行うこと（pre-commit hook で main 直接コミットがブロックされるため）

## Issue の自己アサイン
- タスクに着手する際、対応する GitHub Issue が存在する場合は `gh issue edit <番号> --add-assignee @me` で自分をアサインする
- Issue 番号が不明な場合は `gh issue list` で確認する
- ブランチ名に Issue 番号を含めると望ましい（例: `feat/39-tree-hp`）

## PR 作成前
- feature branch で `git fetch origin main && git merge origin/main` を実行し、main の最新を取り込む
- コンフリクトがあれば解消してからコミット
- ビルド・テストが通ることを確認してから PR を作成する

## マージ方針
- feature branch → main へのマージは main worktree で実行
- `git merge --no-ff feat/xxx` でマージコミットを残す
- マージ後: `git branch -d feat/xxx`（worktree はセッション終了時に片付け）
