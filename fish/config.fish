source (pyenv init - | psub)
eval (anyenv init - | source)

set -x GOPATH $HOME/go
set -x PATH $PATH $GOPATH/bin

set -x GOENV_ROOT $HOME/.goenv
set -x PATH $PATH $GOENV_ROOT/bin
eval (goenv init - | source)

set fish_greeting Blacks are humble, sit down.

set -x CC clang
set -x KERL_BUILD_DOCS no
set -x KERL_CONFIGURE_OPTIONS --with-ssl=(brew --prefix openssl)

set -x DATABASE_URL localhost://postgres:postgres@localhost:5432/milka
set -x SECRET_KEY_BASE KL6jdYa8VzDIg1TjqQcGZsaGSnd43grQYWrl95dYjn/SJB7KABj7N4BWgaCxSF81
set -x RUST_BACKTRACE 1

# alias
alias b='bat'
alias bi='brew install'
alias bu='brew update'
alias cdg='cd ~/Documents/Github'
alias cdr='cd -'
alias clrcache='sudo rm /var/log/asl/*.asl'
alias d='docker'
alias docc='docker-compose'
alias k='kubectl'
alias l='exa -a'
alias v='vim'

# nodebrew
set -x PATH $PATH $HOME/.nodebrew/current/bin

# tkinter
set -x PATH "/usr/local/opt/tcl-tk/bin" $PATH
set -x LDFLAGS "-L/usr/local/opt/tcl-tk/lib"
set -x CPPFLAGS "-I/usr/local/opt/tcl-tk/include"
set -x PKG_CONFIG_PATH "/usr/local/opt/tcl-tk/lib/pkgconfig"
set -x PYTHON_CONFIGURE_OPTS "--with-tcltk-includes='-I/usr/local/opt/tcl-tk/include' --with-tcltk-libs='-L/usr/local/opt/tcl-tk/lib -ltcl8.6 -ltk8.6'"


# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/kunosouichirou/google-cloud-sdk/path.fish.inc' ]; . '/Users/kunosouichirou/google-cloud-sdk/path.fish.inc'; end

source ~/.asdf/asdf.fish
