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

# 3. chezmoi の sourceDir を ~/Documents/Github/dotfiles に向ける
mkdir -p ~/.config/chezmoi
cat > ~/.config/chezmoi/chezmoi.toml <<'EOF'
sourceDir = "~/Documents/Github/dotfiles"

[edit]
  command = "nvim"

[git]
  autoCommit = false
  autoPush = false
EOF

# 4. このリポジトリをクローン
mkdir -p ~/Documents/Github
git clone git@github.com:Papillon6814/dotfiles ~/Documents/Github/dotfiles

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
git clone git@github.com:Papillon6814/pi-claude-auth ~/Documents/Github/pi-claude-auth
cd ~/Documents/Github/pi-claude-auth && npm install
```

MCP サーバ実体（使う場合のみ）:

- `notion_local` → `~/Documents/Github/mcp-notion-server`
- `Roblox_Studio` → `/Applications/RobloxStudioMCP.app`
- `serena` → `~/.local/bin/serena`

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
chezmoi execute-template < ~/Documents/Github/dotfiles/dot_zshrc.tmpl

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
