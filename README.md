# dotfiles

`chezmoi` + 1Password CLI で管理する個人 dotfiles。

## 含まれるもの

| パス | 用途 |
|---|---|
| `~/.zshrc`, `~/.bashrc`, `~/.gitconfig` | シェル・git |
| `~/.config/fish` | fish shell（ログイン shell は zsh、tmux default が fish）|
| `~/.config/nvim` | Neovim（lazy.nvim 構成）|
| `~/.config/ghostty` | Ghostty ターミナル |
| `~/.config/zellij` | Zellij マルチプレクサ |
| `~/.config/herdr` | herdr（エージェント向けマルチプレクサ）。`config.toml` とプラグイン個別設定。プラグイン本体は `install-plugins.sh` でコミット固定のまま再導入。ログ・ソケット・セッション・`plugins.json` は追跡しない |
| `~/Library/Application Support/Muxy/ghostty.conf` | Muxy ターミナル。`command` 行で herdr を起動（Ghostty 側は tmux）。`settings.json` は Muxy が起動中に上書きするので追跡しない |
| `~/.config/muxy` | Muxy 拡張。`extensions/muxy-herdr-agent-status` は `~/Code/muxy-herdr-agent-status`（自作、herdr のエージェント状態をプロジェクト色に反映）への symlink。本体は `install-extensions.sh` で clone + build。有効化とループ起動（⌘⇧P）は手動。公式拡張 `files` は Muxy が入れるので追跡しない |
| `~/.config/git`, `~/.config/karabiner`, `~/.config/iterm2` | 各種 |
| `~/.pi/` | pi (pi-coding-agent) 設定一式（auth/cache は除外）|
| `~/.claude/` | Claude Code グローバル設定（CLAUDE.md, rules, agents, hooks）|
| `~/.local/bin/ai-init` | 既存リポジトリへ個人用 AI 指示ファイルを追加する CLI |

履歴・キャッシュ・OAuth トークンなど、再生成可能 or マシン固有のものは `.chezmoiignore` で除外。

## シークレットの扱い

API キー類は 1Password Vault `Personal` に保管。chezmoi テンプレートから `op://` URI で参照する。

| 項目 | Vault item | フィールド |
|---|---|---|
| Exa API key | `Exa API Key` | `credential` |
| Notion API token | `Notion API Token` | `credential` |
| OpenRouter API key | `OpenRouter API Key` | `credential` |
| Pushover | `Pushover` | `user key`, `api token` |

参照しているテンプレート: `dot_zshrc.tmpl`, `dot_config/fish/config.fish.tmpl`, `dot_pi/web-tools.json.tmpl`, `dot_pi/agent/mcp.json.tmpl`, `dot_pi/agent/extensions/poly-notify/notify.json.tmpl`

## 新しい Mac でのセットアップ

```bash
# 1. Homebrew で必要なツール
brew install chezmoi 1password-cli
brew install --cask 1password

# 2. 1Password アプリにサインインし、Settings → Developer → "Integrate with 1Password CLI" を ON
op account list   # アカウントが見えれば OK

# 3. chezmoi の sourceDir を ~/Code/dotfiles に向ける
mkdir -p ~/.config/chezmoi
cat > ~/.config/chezmoi/chezmoi.toml <<'EOF'
sourceDir = "~/Code/dotfiles"
# 実ファイルをこのリポジトリへの symlink にする（テンプレ・実行ファイル・private はコピー）
mode = "symlink"

[edit]
  command = "nvim"

[git]
  autoCommit = false
  autoPush = false

[add]
  # 秘密情報らしきものを含むファイルの chezmoi add を拒否する
  secrets = "error"
EOF

# 4. このリポジトリをクローン
mkdir -p ~/Documents/Github
git clone git@github.com:KendrickMalar/dotfiles ~/Code/dotfiles

# 4.5 コミット前の検査（gitleaks・JSON）を有効にする
brew install gitleaks
cat > ~/Code/dotfiles/.git/hooks/pre-commit <<'HOOK'
#!/bin/sh
hook="$(git rev-parse --show-toplevel)/scripts/git-hooks/pre-commit"
[ -x "$hook" ] || { echo "pre-commit: $hook がありません" >&2; exit 1; }
exec "$hook" "$@"
HOOK
chmod +x ~/Code/dotfiles/.git/hooks/pre-commit

# 5. 反映前にプレビュー
chezmoi diff

# 6. 反映
chezmoi apply -v
```

## 関連リポジトリ（別途クローンが必要）

dotfiles の `settings.json` で参照しているパッケージ:

```bash
# pi 関連
git clone --recurse-submodules https://github.com/noahsaso/my-pi ~/.my-pi
git clone git@github.com:KendrickMalar/pi-claude-auth ~/Documents/Github/pi-claude-auth
cd ~/Documents/Github/pi-claude-auth && npm install
```

MCP サーバ実体（使う場合のみ）:

- `notion_local` → `~/Documents/Github/mcp-notion-server`
- `Roblox_Studio` → `/Applications/RobloxStudioMCP.app`
- `serena` → `~/.local/bin/serena`

## 仕組みと注意（2026-10 時点）

- **symlink モード**: ホーム側の多くのファイルは、このリポジトリのファイルへのリンク。ホームで編集すると、その場でリポジトリが変わる（`chezmoi re-add` は不要）
- **コピーのまま残るもの**: テンプレート（`.tmpl`。秘密情報を 1Password から埋め込むもの）、実行ファイル、`private_` のファイル。これらはホームで編集したら `chezmoi re-add` が必要
- **置き場所は `~/Code/dotfiles`**。`~/Documents` は macOS のプライバシー保護の対象で、launchd や GUI アプリがリンク越しに読めなくなるため置かない
- **自動同期**: `scripts/install-dotfiles-sync.sh` で launchd ジョブを設置すると、5分ごとに `scripts/dotfiles-sync.sh` が外れたリンクの修復・検査つきの commit と push・ずれの通知を行う（ログは `~/Library/Logs/dotfiles-sync.log`、通知は `scripts/notify.sh`）
- **このリポジトリの main checkout でブランチを切り替えない**。リンク先が変わり、ホームの設定が即座に変わる。作業は worktree で行い、`chezmoi --source <worktree> add ...` を使う
- **コミット前の検査**: `scripts/git-hooks/pre-commit`（gitleaks と JSON の構文）。`~/.git-hooks` のディスパッチャから、`.git/hooks/pre-commit` 経由で呼ばれる
- **Homebrew**: `brew/Brewfile.<ホスト名>` に一覧を置く。自動では入れない。新しい Mac では `brew bundle --file=brew/Brewfile.<ホスト名>` を手で実行する。更新は `brew bundle dump --file=brew/Brewfile.$(chezmoi execute-template '{{ .chezmoi.hostname }}') --force`
- **Claude の personal プロファイル**: `~/.claude-profiles/personal/config` の設定は `~/.claude` へのリンク（MacBook のみ）
- **管理しないもの**: `~/.codex/config.toml`（平文の API キーとマシン固有の状態を含み、Codex が実行中に書き換える）、各ツールの認証・履歴・キャッシュ

## 普段の使い方

```bash
# 設定ファイルを編集
chezmoi edit ~/.zshrc
chezmoi apply        # ホームに反映

# ホームで編集した内容を取り込む
chezmoi re-add        # 既存トラッキング対象を取り直し

# 新しいファイルをトラッキング対象に
chezmoi add ~/.config/something/config

# テンプレートの解決結果を確認
chezmoi execute-template < ~/Code/dotfiles/dot_zshrc.tmpl

# 変更をコミット & push（autoCommit/autoPush は無効にしてある）
chezmoi cd
git add -A && git commit && git push
```

## AI 指示ファイルの初期化

`ai-init` は絵文字つきの8問ウィザードで、既存プロジェクトに AI 指示ファイルを作る。概要、技術スタック、開発コマンド、返答言語、AI に期待する作業、テスト方針、Git 方針、追加ルールを聞く。技術スタックと開発コマンドは manifest から候補を出す。生成した AGENTS.md と CLAUDE.md の内容を表示して確認を求め、既存ファイルは上書きしない。Python 3 が必要。

```bash
chezmoi apply ~/.local/bin/ai-init
cd ~/Code/my-project
ai-init

# 別の既存リポジトリを指定
ai-init ~/Code/another-project

# 質問と最終確認を省略し、自動検出値で作成
ai-init --yes
```

コマンドは manifest の読み取りだけを行い、Git 初期化、依存インストール、MCP・フック・権限設定の追加は行わない。

### npx 形式

npm パッケージのソースは npm/ai-init/ にあります。パッケージ名は ai-init-papillon6814 です。公開後は npm をグローバルインストールせずに実行できます。

    npx --yes ai-init-papillon6814
    npx --yes ai-init-papillon6814 ~/Code/another-project

公開前にこの checkout から動かす場合:

    node npm/ai-init/bin/ai-init.js [path] [--yes]

## シークレットを追加するときの流れ

1. 1Password に新しい item を作る (`op item create` または GUI)
2. 該当ファイルを `chezmoi add --template <path>` で `.tmpl` 化（または手動で `mv x x.tmpl`）
3. 平文の値を `{{ onepasswordRead "op://Personal/<item>/<field>" }}` に置換
4. `chezmoi execute-template < <path>.tmpl` で復元確認
5. commit & push
