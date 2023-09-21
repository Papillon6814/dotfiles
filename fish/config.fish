set PATH /opt/homebrew/bin /opt/homebrew/sbin /usr/local/bin /usr/bin /bin /usr/sbin /sbin $PATH

set -x PYENV_ROOT $HOME/.pyenv
set -x PATH $PYENV_ROOT/shims $PATH
set -x PATH $HOME/.local/bin:$PATH

eval (anyenv init - | source)
source (pyenv init - | psub)

set -x PATH /Users/papillon/Library/Android/sdk/platform-tools $PATH
set -x PATH /Users/kuno-soichiro/.rover/bin $PATH
set -x JAVA_HOME /opt/homebrew/Cellar/openjdk/16.0.1/libexec/openjdk.jdk/Contents/Home
set PATH /opt/homebrew/opt/php@7.4/bin $PATH

# e-server
set -x CLOUD_SQL_HOST /tmp/cloudsql/e-server-339914:asia-northeast1:e-server-database/.s.PGSQL.5432
set -x CLOUD_SQL_PASSWORD EhO9KMjIu?FJuhaP
#set -x DATABASE_URL postgres://postgres:EhO9KMjIu%3FFJuhaP@34.85.0.85:5432/e_server_prod
set -x SECRET_KEY_BASE gfjEWDcEOLGjZr8UzMIWb6iu4En+O6h81CMSOHqzIdIss2o5gM4yz3+OJp0wB0uY

export PATH="$HOME/.cargo/bin:$PATH"

set -gx LDFLAGS "-L/opt/homebrew/opt/php@8.0/lib"
set -gx CPPFLAGS "-I/opt/homebrew/opt/php@8.0/include"

set fish_greeting Blacks are humble, sit down.

#set -x CC clang
set -x KERL_BUILD_DOCS no
set -x KERL_CONFIGURE_OPTIONS --with-ssl=(brew --prefix openssl)

#set -x DATABASE_URL localhost://postgres:postgres@localhost:5432/milka
#set -x SECRET_KEY_BASE KL6jdYa8VzDIg1TjqQcGZsaGSnd43grQYWrl95dYjn/SJB7KABj7N4BWgaCxSF81
set -x RUST_BACKTRACE 1

# alias
# alias cdg='cd ~/Library/Mobile\ Documents/com\~apple\~CloudDocs/Documents/Github/'
alias cdg='cd ~/Documents/Github'
alias clrcache='sudo rm /var/log/asl/*.asl'
alias docc='docker-compose'
alias l='exa -a'
alias kali='docker exec -it (docker run -itd --name kali --net=host papillon6814/kali /bin/bash) /bin/bash'
alias gce='gcloud compute instances create example-instance --image-family=ubuntu-1804-lts-arm64 --image-project=ubuntu-os-cloud --zone asia-east1-a'
alias gcessh='gcloud compute ssh example-instance --zone asia-east1-a'
alias gcedel='gcloud compute instances delete example-instance --zone asia-east1-a'

# alias for recent development
alias cdc='cd ~/Documents/Github/e-players-webapp'
alias cds='cd ~/Documents/Github/e-server'
alias cdz='cd ~/Documents/Github/zenn'

# nodebrew
# set -x PATH $PATH $HOME/.nodebrew/current/bin

# tkinter
set -x PATH "/usr/local/opt/tcl-tk/bin" $PATH
set -x LDFLAGS "-L/usr/local/opt/tcl-tk/lib"
set -x CPPFLAGS "-I/usr/local/opt/tcl-tk/include"
set -x PKG_CONFIG_PATH "/usr/local/opt/tcl-tk/lib/pkgconfig"
set -x PYTHON_CONFIGURE_OPTS "--with-tcltk-includes='-I/usr/local/opt/tcl-tk/include' --with-tcltk-libs='-L/usr/local/opt/tcl-tk/lib -ltcl8.6 -ltk8.6'"

# Golang
set -x GOBIN /opt/homebrew/bin
set -x PATH $GOBIN $PATH
#eval "$(goenv init -)"
set -x GOROOT /opt/homebrew/opt/go@1.20/libexec

#set -x GOROOT /opt/homebrew/Cellar/go/1.20.3/libexec
#set -x GOPATH /opt/homebrew/Cellar/go/1.20.3/
# source ~/.asdf/asdf.fish

test -e {$HOME}/.iterm2_shell_integration.fish ; and source {$HOME}/.iterm2_shell_integration.fish

alias medis '/bin/bash ~/papillon-bin/medis'
set -g fish_user_paths "/usr/local/opt/llvm/bin" $fish_user_paths

#source /usr/local/bin/asdf/asdf.fish
source /opt/homebrew/opt/asdf/libexec/asdf.fish
fish_add_path /opt/homebrew/opt/openjdk/bin


# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/papillon/Downloads/google-cloud-sdk/path.fish.inc' ]; . '/Users/papillon/Downloads/google-cloud-sdk/path.fish.inc'; end

export PATH="$PATH:/Users/kuno-soichiro/.foundry/bin"
export STARSHIP_CONFIG=~/.starship.toml

#starship init fish | source

# Attach tmux session if it does not exist
function attach_tmux_session_if_needed
    set ID (tmux list-sessions)
    if test -z "$ID"
        tmux new-session
        return
    end

    set new_session "Create New Session" 
    set ID (echo $ID\n$new_session | peco --on-cancel=error | cut -d: -f1)
    if test "$ID" = "$new_session"
        tmux new-session
    else if test -n "$ID"
        tmux attach-session -t "$ID"
    end
end

if test -z $TMUX && status --is-login
    attach_tmux_session_if_needed
end

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
if test -f /Users/kuno-souichiro/.anyenv/envs/pyenv/versions/anaconda3-2023.07-2/bin/conda
    eval /Users/kuno-souichiro/.anyenv/envs/pyenv/versions/anaconda3-2023.07-2/bin/conda "shell.fish" "hook" $argv | source
end
# <<< conda initialize <<<

