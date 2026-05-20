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
| `~/.config/git`, `~/.config/karabiner`, `~/.config/iterm2` | 各種 |
| `~/.pi/` | pi (pi-coding-agent) 設定一式（auth/cache は除外）|
| `~/.claude/` | Claude Code グローバル設定（CLAUDE.md, rules, agents, hooks）|

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

## シークレットを追加するときの流れ

1. 1Password に新しい item を作る (`op item create` または GUI)
2. 該当ファイルを `chezmoi add --template <path>` で `.tmpl` 化（または手動で `mv x x.tmpl`）
3. 平文の値を `{{ onepasswordRead "op://Personal/<item>/<field>" }}` に置換
4. `chezmoi execute-template < <path>.tmpl` で復元確認
5. commit & push
