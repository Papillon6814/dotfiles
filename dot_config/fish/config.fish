# Keep exec $SHELL using fish even when the parent app exports another shell.
set -gx SHELL /opt/homebrew/bin/fish

set PATH /opt/homebrew/bin /opt/homebrew/sbin /usr/local/bin /usr/bin /bin /usr/sbin /sbin  $PATH
set -x PYENV_ROOT $HOME/.pyenv
set -x PATH $PYENV_ROOT/shims $PATH
set -x PATH $HOME/.local/bin $PATH
set -x PATH $HOME/.rbenv/bin $PATH

set -x ANDROID_SDK $HOME/Library/Android/sdk
set -x PATH $ANDROID_SDK/platform-tools $PATH 

type -q pyenv; and pyenv init - | source

set -x PATH $HOME/Library/Android/sdk/platform-tools $PATH
set -x PATH $HOME/go/bin $PATH
set -x JAVA_HOME /opt/homebrew/opt/openjdk
set -x ZELLIJ_AUTO_EXIT true
export PATH="$HOME/.cargo/bin:$PATH"

set -x GOPATH $HOME/go

set fish_greeting Blacks are humble, sit down.

# dotfiles bare repo management
alias dotfiles='git --git-dir=$HOME/.dotfiles --work-tree=$HOME'

# alias
# alias cdg='cd ~/Library/Mobile\ Documents/com\~apple\~CloudDocs/Documents/Github/'
alias cdg='cd ~/Documents/Github'
alias clrcache='sudo rm /var/log/asl/*.asl'
alias docc='docker-compose'
alias l='eza -a'
alias kali='docker exec -it (docker run -itd --name kali --net=host papillon6814/kali /bin/bash) /bin/bash'
alias gce='gcloud compute instances create example-instance --image-family=ubuntu-1804-lts-arm64 --image-project=ubuntu-os-cloud --zone asia-east1-a'
alias gcessh='gcloud compute ssh example-instance --zone asia-east1-a'
alias gcedel='gcloud compute instances delete example-instance --zone asia-east1-a'
alias obs='obsidian-cli'
# Neovim wrapper function to prevent socket address conflicts
# Each instance gets a unique socket using mktemp
function nvim
    set has_listen 0
    for arg in $argv
        if string match -q -- '--listen*' $arg
            set has_listen 1
            break
        end
    end

    if test $has_listen -eq 0
        # Create unique socket name using mktemp
        set socket_name (mktemp -u /tmp/nvim.XXXXXX)
        command nvim --listen $socket_name $argv
    else
        # If --listen is already specified, don't interfere
        command nvim $argv
    end
end

# alias for recent development
alias cdc='cd ~/Documents/Github/e-players-webapp'
alias cds='cd ~/Documents/Github/e-server'
alias cdz='cd ~/Documents/Github/zenn'

set -g fish_user_paths "/usr/local/opt/llvm/bin" $fish_user_paths

#source /opt/homebrew/opt/asdf/libexec/asdf.fish
fish_add_path /opt/homebrew/opt/openjdk/bin

## Attach tmux session if it does not exist
#function attach_tmux_session_if_needed
#    set ID (tmux list-sessions)
#    if test -z "$ID"
#        tmux new-session
#        return
#    end
#
#    set new_session "Create New Session" 
#    set ID (echo $ID\n$new_session | peco --on-cancel=error | cut -d: -f1)
#    if test "$ID" = "$new_session"
#        tmux new-session
#    else if test -n "$ID"
#        tmux attach-session -t "$ID"
#    end
#end
#
#if test -z $TMUX && status --is-login
#    attach_tmux_session_if_needed
#end

# zellij setup
# if set -q ZELLIJ
# else
#   zellij
# end

status --is-interactive; and type -q rbenv; and rbenv init - | source

# The next line updates PATH for the Google Cloud SDK.
if test -f "$HOME/Downloads/google-cloud-sdk/path.fish.inc"; source "$HOME/Downloads/google-cloud-sdk/path.fish.inc"; end
set -gx VOLTA_HOME "$HOME/.volta"
set -gx PATH "$VOLTA_HOME/bin" $PATH

# Send bell on prompt to notify tmux (monitor-bell)
function __bell_on_prompt --on-event fish_prompt
    printf '\a'
end

# Added by Antigravity
fish_add_path $HOME/.antigravity/antigravity/bin

# Chrome remote debugging mode for pi agent browser automation
function chrome-debug
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --remote-allow-origins="*" --user-data-dir="$HOME/.chrome-debug-profile" $argv &
    disown
end

# Alias to start Chrome in debug mode by default
alias chrome='chrome-debug'

# --- Claude Code multi-account (claude-profile) ---
# finn(既定): 通常どおり `claude` で起動
# 2つ目アカウント: `claude-personal`
alias claude-personal='claude-profile -P personal'
# c / cw: 引数なしの対話起動で Profile（なし／Development）を選ぶ。定義は claude-scaffold 側
test -f ~/Documents/Github/claude-scaffold/shell/c.fish; and source ~/Documents/Github/claude-scaffold/shell/c.fish

# --- Happy (スマホ承認・通知) ---
# Happy を通すのは firstmate の親と、明示的に cwh で起動したときだけ。
# 素の claude / c / cw / co は Happy を通さない。
# firstmate の親: `fm`
function fm
    cd ~/Code/firstmate; and happy claude --dangerously-skip-permissions $argv
end
# personal + 権限スキップ + Happy: `cwh`
# claude-profile も Happy もラッパーで直列につなげないので CLAUDE_CONFIG_DIR を直接渡す
function cwh
    env CLAUDE_CONFIG_DIR=$HOME/.claude-profiles/personal/config happy claude --dangerously-skip-permissions $argv
end

# Codex: skip approvals and sandbox
alias co='codex --dangerously-bypass-approvals-and-sandbox'

# Codex work account: separate authentication via codex-profile
function cow
    codex-profile cli work --dangerously-bypass-approvals-and-sandbox $argv
end

# Letta: resume Finn
alias le='letta -n Finn'

# マシン固有の設定（dotfiles では管理しない。秘密情報もここに置かない方針だが、置く場合はこのファイルに限る）
test -f ~/.config/fish/config.local.fish; and source ~/.config/fish/config.local.fish

# --- Muxy では pi の Markdown リンクをクリックできるようにする（2026-10-18） ---
# pi-tui は TERM_PROGRAM=muxy をリンク非対応と判定し、下線の文字と (パス) を並べるだけになるため、OSC 8 を強制する。
# herdr の中でも TERM_PROGRAM=muxy が残るので、herdr へ移る前に置いて引き継がせる。
if test "$TERM_PROGRAM" = muxy
    set -gx PI_HYPERLINKS 1
end

# --- Muxy で開いたシェルは herdr に入る（2026-10-15） ---
# Muxy Beta は端末を muxy-server が fish -l で直接起動し、ghostty.conf の command を使わないため、ここで herdr へ移る。
# セッション名はディレクトリ名（firstmate だけ default）。herdr がタブ・ペイン・エージェント（resume_agents_on_restore）を復元する。
# PATH を全部足した後に置くこと（herdr サーバーとプラグインがこの PATH を引き継ぐ）。素の fish が欲しいときは MUXY_NO_HERDR=1。
if status is-interactive; and test "$TERM_PROGRAM" = muxy; and not set -q HERDR_ENV; and not set -q MUXY_NO_HERDR; and type -q herdr
    set -l __herdr_session (path basename -- $PWD)
    if test "$__herdr_session" = firstmate
        exec herdr
    else
        exec herdr --session $__herdr_session
    end
end
