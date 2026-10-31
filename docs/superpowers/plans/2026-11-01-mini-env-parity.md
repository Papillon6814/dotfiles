# mini の Muxy 周り環境を MBP にそろえる 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans。チェックボックスで進捗管理。

**Goal:** MBP（正）の Muxy・Muxy Beta・拡張・herdr・常駐ジョブ・エージェント連携を、Mac mini で同じ状態にし、以後は chezmoi で自動的にそろう形にする。

**Architecture:** 変更は dotfiles（`~/Code/dotfiles`）の worktree `feat/mini-env-parity` で行い、main にマージ → mini で pull・apply。Muxy が自分で書き直す `settings.toml`・`terminal.toml` は chezmoi の modify テンプレートで「管理する項目だけ」上書きする。拡張・herdr・launchd など apply の外のものは、冪等なインストール用スクリプトにまとめて mini で実行。

**Tech Stack:** chezmoi（symlink モード、modify テンプレート＋`fromToml`/`mergeOverwrite`/`toToml`）、sh、Homebrew、launchd、herdr 0.9.1、Muxy 2.0.0 / Muxy Beta 2.3.0。

**Spec:** この会話の調査結果（3担当の報告）。実行時に `docs/superpowers/plans/2026-11-01-mini-env-parity.md` として dotfiles に写す。

## Context
- ユーザーは MBP の Muxy 系設定を mini に「完全に」適用したい。範囲は「全部まとめて」（Claude settings.json・固定パス・herdr-agent-quota 修正版も含む）。
- dotfiles は両機とも同じコミット `e79e631`、chezmoi 管理分の差は 0。差は chezmoi の外にある。
- Muxy は settings.toml に設定と作業状態（project_recent など）を混在させ、起動中に書き直す → 丸ごと管理は不可。

## Global Constraints
- 正は MBP。mini 独自の値は、明記したもの以外は MBP に合わせる。
- 写さない: `remote.json`・`approved-devices.json`・`sessions/`・`desktop-state.json`・`*.log`・`*.sock`・`pending-update.json`・`Backups/`・`app-backup-*`・`~/.config/muxy-ask-relay/*`（機械固有・状態）。
- settings.toml の `project_recent`・`worktree_recent`・`hidden_worktrees`・`sidebar_expanded` は管理しない（機械ごとの ID・状態）。
- 機械依存パスは `{{ .chezmoi.homeDir }}`、または shell が展開するフィールドなら `$HOME`。
- mini の Muxy / Muxy Beta を終了するのは、ユーザーの確認を取ってから（mini 上の作業セッションが止まる）。
- コミットに AI 帰属行を付けない。main 直コミット禁止。

## Review Focus
1. Muxy が書き戻すとき modify テンプレートの値を消す／未知キーを落とす → Task 2 の検証で「再起動後に再 apply して diff 0」を確認。
2. Beta が ghostty.conf を terminal.toml に再取り込みして keybindings を上書きする → Task 2 で ghostty.conf と terminal.toml を同時に MBP と同じにして、再起動後の terminal.toml を比較。
3. mini の `dotfiles-sync`（launchd）が、Muxy 起動中に自動で apply する → Task 0 で動作を確認し、必要なら作業中は止める。
4. Claude settings.json の `$HOME` 化で、`$HOME` を展開しないフィールド（例: `otelHeadersHelper`、`statusLine` 以外のパス欄）が壊れる → Task 6 でフィールドごとに分類。
5. Muxy が `~/.claude/settings.json` に自分の hook を再挿入して重複させる → Task 6 で Muxy 再起動後に hook 数を数える。

---

### Task 0: 準備と安全確認
- [ ] dotfiles の worktree `feat/mini-env-parity` を作成（superpowers:using-git-worktrees）。
- [ ] mini の `dotfiles-sync` の plist と実行内容を読む。apply まで自動なら、作業中だけ止めることを AskUserQuestion で確認。
- [ ] mini の `~/.config/fish/config.fish.bak-20261011` の中身を確認 → 削除（承認済み）。`config.local.fish` 以外にキーの写しがないか `grep -rl OPENROUTER ~/.config ~/.zshrc` で確認。
- [ ] OpenRouter のキー差し替えはユーザーに依頼。新キーを mini の `config.local.fish` へ入れるのはユーザーか、ユーザーから受け取って実施。

### Task 1: Muxy 用の静的ファイルを chezmoi に追加
**Files（source は `private_Library/private_Application Support/`）:**
- Create: `private_Muxy Beta/ghostty.conf`、`private_Muxy 2/ghostty.conf`（MBP の現物）
- Create: `private_Muxy Beta/extension-enabled.json`、`extension-grants.json`、`extension-folders.json.tmpl`
- Create: `private_Muxy 2/extension-enabled.json`、`extension-grants.json`、`extension-folders.json.tmpl`
- Create: `.chezmoidata/muxy.toml`（`stable_release = "826273a"`）
- Modify: `.chezmoiignore`（上記以外の Muxy ファイルを触らないことの確認のみ。変更不要なら変更しない）

- [ ] MBP で `chezmoi diff` が 0 件（MBP の現物と同一）であることを確認。
- [ ] folders テンプレートの出力が、MBP では現在のファイルとバイト単位で同一。mini 想定は `chezmoi execute-template` に `--init --promptString`…ではなく、`homeDir` を差し替えて目視で確認。
- [ ] Commit `feat(muxy): manage ghostty.conf and extension registrations`

### Task 2: settings.toml・terminal.toml を modify テンプレートで部分管理
**Files:**
- Create: `.chezmoitemplates/muxy-beta-settings.toml`、`.chezmoitemplates/muxy2-settings.toml`（MBP の現物から管理対象の節だけ抜粋: `[keymap]` 全体、`[composer]`、`[quick_terminal]`、`[window]`、`[openers]`、`[panes]`、`[clipboard]`、`[appearance]` の `dark_theme`/`light_theme`/`layout`/`tips_visible`/`worktree_order_by_mru`/`sidebar_vibrancy*`/`sidebar_collapsed_style`/`sidebar_expanded_width`/`status_bar_visible`/`auto_expand_worktrees`/`worktree_show_unread`/`tab_focused_*`）
- Create: `.chezmoitemplates/muxy-beta-terminal.toml`（`keybindings`、`font_families`、`font_size`、`cell_height`、`macos_option_as_alt`、`[font]`、`[options]`。`diagnostics` は除外）
- Create: `private_Muxy Beta/modify_settings.toml`、`private_Muxy 2/modify_settings.toml`、`private_Muxy Beta/modify_terminal.toml`

各 modify ファイルの中身（同型）:
```
{{- /* chezmoi:modify-template */ -}}
{{- $cur := dict -}}{{- if .chezmoi.stdin }}{{ $cur = fromToml .chezmoi.stdin }}{{ end -}}
{{- $want := fromToml (includeTemplate "muxy-beta-settings.toml" .) -}}
{{- mergeOverwrite $cur $want | toToml -}}
```
- `[keymap]` は「MBP に無いキーを mini に残さない」ため、merge 前に `$cur` から `keymap` を `unset` してから merge（完全一致させる）。
- [ ] MBP で `chezmoi diff` を見て、出る差が「キーの並び・書式」だけで値の差が無いことを確認。値の差が出たら抜粋を直す。
- [ ] 比較スクリプト `scripts/muxy-settings-compare.py <file-a> <file-b> <fragment>`（tomllib で、fragment に含まれるキーだけ比較し差を列挙、差が無ければ exit 0）を作り、`tests/test_muxy_settings_compare.py` に「同じ→0」「keymap 1キー違い→1」「管理外キーの違いは無視→0」の3テスト。
- [ ] MBP で apply（Muxy 起動中でも、設定が変わらないので無害なことを diff で確認してから）→ Muxy Beta を再起動 → 再度 `chezmoi diff` が値の差 0。
- [ ] Commit `feat(muxy): partially manage settings.toml and terminal.toml`

### Task 3: 拡張の導入スクリプトを完全化
**Files:**
- Modify: `dot_config/muxy/executable_install-extensions.sh`
- Create: `dot_config/muxy/extensions/symlink_muxy-tab-names.tmpl`
- Create: `dot_local/bin/executable_muxy-stable-release`（`muxy-stable-release <commit>`: `muxy-herdr-agent-status` の指定コミットを一時 worktree で `npm ci && npm run build`、`dist-stable/` を `~/.local/share/muxy-herdr-agent-status/stable/releases/<commit>/` へ。既にあれば何もしない）
- [ ] `install-extensions.sh` を: 2拡張（`muxy-herdr-agent-status`、`muxy-tab-names`）それぞれ clone or `git pull --ff-only` → `npm ci && npm run build`。最後に `muxy-stable-release {{ stable_release }}`（install-extensions.sh を `.tmpl` 化して data から読む）。
- [ ] MBP で `muxy-stable-release 826273a` を実行し、既存の releases/826273a と `diff -r` が一致（作り方の再現性確認）。一致しなければ差を報告して止まる。
- [ ] Commit `feat(muxy): install tab-names and reproducible stable release`

### Task 4: herdr を MBP と同じ入れ方に
**Files:**
- Modify: `brew/Brewfile.MacMininoMac-mini-4`（`brew "herdr"` 追加）
- Modify: `dot_config/herdr/executable_install-plugins.sh`（herdr-agent-quota の参照先を修正版へ）
- [ ] herdr-agent-quota の `fix/pi-own-auth-quota`（3c65904）が origin に push 済みか確認。未 push なら、push してよいか AskUserQuestion。
- [ ] install-plugins.sh: herdr-agent-quota を `~/Code/herdr-agent-quota` に clone/checkout `fix/pi-own-auth-quota` → ビルド → `herdr plugin link`。MBP で実行し、`herdr plugin list` が実行前と同一。
- [ ] Commit `fix(herdr): install agent-quota from pi-own-auth branch; add herdr to mini Brewfile`

### Task 5: 固定パス `/Users/papillon` の除去（.zshrc・pi）
**Files:**
- Modify: `dot_zshrc.tmpl:2` → `export PATH="$HOME/.local/bin:$PATH"`
- Modify: `dot_pi/private_agent/settings.json:4`
- [ ] pi が拡張パスで `~` を展開するか、pi のソース／ドキュメントで確認。展開するなら `~/Library/...` に、しないなら `settings.json.tmpl` 化（ただし symlink でなくなり pi の書き込みが source に戻らなくなる点を報告して AskUserQuestion）。
- [ ] mini に `ai-improvement`（pi 拡張の参照先）が無い。MBP での入れ方を確認し、Task 7 の mini 作業に追加。
- [ ] Commit `fix: replace hardcoded home paths in zshrc and pi settings`

### Task 6: Claude settings.json を両機共通に
**Files:**
- Modify: `dot_claude/settings.json`（29 か所の `/Users/papillon` を `$HOME` に）
- Modify: `.chezmoiignore:113-121`（`.claude/settings.json` を mini 除外から外す）
- [ ] 29 か所を「shell で実行されるフィールド（hooks の command、statusLine.command、otelHeadersHelper 等）」と「それ以外」に分類。それ以外が1つでもあれば、その欄だけの扱いを AskUserQuestion（テンプレート化は symlink を失い、Claude の書き込みが source に戻らなくなるため）。
- [ ] mini の現 `~/.claude/settings.json` と新ファイルの差を一覧化し、mini 独自の項目（statusLine の `~/ai-env-staging/...` など）を MBP 版に寄せてよいか確認。mini 側を `~/.claude/settings.json.bak-20261101` に退避。
- [ ] 依存の存在確認: aideck（`~/Code/ccdeck-profiles`）、gog メール送信確認のスクリプト、otel helper が mini にあるか。無いものを Task 7 に追加。
- [ ] MBP で Claude を新規起動し、hooks が動く（Muxy 通知・herdr 状態）ことを確認。
- [ ] Commit `refactor(claude): share settings.json across machines via $HOME`

### Task 7: main へマージし mini に適用
- [ ] `git fetch origin main && git merge origin/main`、`pytest tests/`、main worktree で `git merge --no-ff feat/mini-env-parity`、push（push は確認を取る）。
- [ ] mini: `git -C ~/Code/dotfiles pull`、ユーザーに `op signin` を依頼、`chezmoi diff` を提示。
- [ ] mini の Muxy・Muxy Beta 終了の可否を AskUserQuestion → 終了 → `chezmoi apply`。
- [ ] mini: `brew trust muxy-app/tap`、`brew bundle --file brew/Brewfile.MacMininoMac-mini-4`、手で張った herdr のリンク2本（`/opt/homebrew/bin/herdr`、`~/.local/bin/herdr`）を brew のものへ置き換え（置き換え前に中身確認）。
- [ ] mini: `~/.config/herdr/install-plugins.sh`、`~/.config/muxy/install-extensions.sh`、`scripts/install-muxy-herdr-cleanup.sh`・`install-alerter-reaper.sh`・`install-tmp-cleanup.sh`、plannotator・ai-improvement・Task 6 で見つかった不足分を MBP と同じ方法で導入。
- [ ] mini の Muxy・Muxy Beta を起動。拡張の初回許可（python3・sleep）と「herdr Status: Start color sync loop」は画面操作が要る → ユーザーに依頼（または画面共有で実施）。

### Task 8: 検証と記録
- [ ] mini で `chezmoi diff` 値の差 0、`muxy-settings-compare.py` で MBP と mini の settings.toml（Beta・2）・terminal.toml が一致。
- [ ] 両機で `herdr plugin list`、`launchctl list | grep -E 'muxy|alerter|tmp-cleanup'`、`ls ~/.local/share/muxy-herdr-agent-status/stable/releases`、`cat "…/extension-folders.json"` の比較結果を提示。
- [ ] mini の Muxy を再起動 → 再度 diff 0（Review Focus 1・2）、`~/.claude/settings.json` の muxy hook 数が MBP と同じ（Review Focus 5）。
- [ ] dotfiles の README の Muxy 節を更新（管理方式・tab-names・stable release・mini 手順）。
- [ ] ai-secretary の `reference/` か引き継ぎメモに結果を記録。

### Task 9: 旧 1.x の片付けと mini 独自物の整理（2026-11-01 追加）
- [ ] 1.x の hooks 呼び出し（`muxy-notification-hook` の7か所、opencode の muxy-notify.js）が 2.x で不要か確認 → 不要なら dotfiles から外す。`private_Muxy/private_ghostty.conf` を管理対象から外す（ファイル自体は消さない）。
- [ ] mini 独自の looper（launchd）・`~/ai-env-staging` 配下・`~/Code/herdr-agent-quota-multi-account` について、何か・どこから参照されているかを調べ、一覧で「残す／MBP に寄せる／止める」を提案 → AskUserQuestion で決めてから実施（削除・停止は個別に確認）。
- [ ] Commit `chore: retire Muxy 1.x hook wiring`

---

## 残論点（決めてほしいこと）
1. mini の Muxy を終了するタイミング（mini で動いている作業があるか）。
2. herdr-agent-quota の修正ブランチが未 push だった場合、push してよいか。
3. Claude settings.json で mini 独自の項目（statusLine の参照先など）を MBP 版に置き換えてよいか。
4. 旧 1.x の `Muxy/ghostty.conf` の管理と、1.x の hooks を呼ぶ設定（毎回ソケット無しで失敗）は今回は触らない想定でよいか。
5. mini 独自のもの（launchd の looper、`ai-env-staging` 配下のツール）は残す想定でよいか。
