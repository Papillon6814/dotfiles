set PATH /opt/homebrew/bin /opt/homebrew/sbin /usr/local/bin /usr/bin /bin /usr/sbin /sbin  $PATH
set -x PYENV_ROOT $HOME/.pyenv
set -x PATH $PYENV_ROOT/shims $PATH
set -x PATH $HOME/.local/bin $PATH
set -x PATH $HOME/.rbenv/bin $PATH

set -x ANDROID_SDK /Users/papillon/Library/Android/sdk
set -x PATH $ANDROID_SDK/platform-tools $PATH 

source (pyenv init - | psub)

set -x PATH /Users/papillon/Library/Android/sdk/platform-tools $PATH
set -x PATH /Users/kuno-soichiro/.rover/bin $PATH
set -x JAVA_HOME /opt/homebrew/opt/openjdk
export PATH="$HOME/.cargo/bin:$PATH"

set fish_greeting Blacks are humble, sit down.

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

set -g fish_user_paths "/usr/local/opt/llvm/bin" $fish_user_paths

source /opt/homebrew/opt/asdf/libexec/asdf.fish
fish_add_path /opt/homebrew/opt/openjdk/bin

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/papillon/Downloads/google-cloud-sdk/path.fish.inc' ]; . '/Users/papillon/Downloads/google-cloud-sdk/path.fish.inc'; end

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

status --is-interactive; and source (rbenv init -|psub)

source ~/.asdf/plugins/java/set-java-home.fish
