source (pyenv init - | psub)
eval (anyenv init - | source)

set -x GOPATH $HOME/go
set -x PATH $PATH $GOPATH/bin

set -x GOENV_ROOT $HOME/.goenv
set -x PATH $PATH $GOENV_ROOT/bin
eval (goenv init - | source)

# alias
alias b='bat'
alias d='docker'
alias l='exa'
alias v='vim'
alias cdg='cd ~/Documents/Github'

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
