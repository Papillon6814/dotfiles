set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'VundleVim/Vundle.vim'

Plugin 'rust-lang/rust.vim'
Plugin 'airblade/vim-gitgutter'
Plugin 'scrooloose/nerdtree'
Plugin 'dracula/vim'
Plugin 'tpope/vim-commentary'
Plugin 'racer-rust/vim-racer'
Plugin 'sickill/vim-monokai'
Plugin 'simeji/winresizer'
Plugin 'elixir-editors/vim-elixir'
Plugin 'ayu-theme/ayu-vim'

call vundle#end()
filetype plugin indent on

set termguicolors
let ayucolor="mirage"
colorscheme ayu

set number
"colorscheme monokai
set clipboard+=unnamed

nnoremap <silent><C-r> :NERDTreeToggle<CR>
nnoremap <silent><C-t> :vsplit<CR>
inoremap { {}<Left>
inoremap {<Enter> {}<Left><CR><ESC><S-o>
inoremap ( ()<ESC>i
inoremap (<Enter> ()<Left><CR><ESC><S-o>

set shell=/bin/bash

set hidden
let g:racer_cmd = '~/.cargo/bin/racer'
let g:racer_experimental_completer = 1

set cursorline

:syntax on
syntax on

if has("autocmd")
    filetype plugin on
    filetype indent on
    autocmd FileType yml    setlocal sw=2 sts=2 ts=2 et
    autocmd FileType yaml   setlocal sw=2 sts=2 ts=2 et
endif

func! STL()
  let barWidth = &columns / 6
  let barWidth = barWidth < 3 ? 3 : barWidth
  let n = line('$') > 1 ? line('$') - 1 : line('$')
  let buf_top    = (line('w0') - 1) * (barWidth - 1) / n
  let buf_bottom = (line('w$')    ) * (barWidth - 1) / n
  let cursor     = (line('.')  - 1) * (barWidth - 1) / n
  let n1 = buf_top
  let n2 = cursor - n1
  let n2 = n1 + n2 >= barWidth ? barWidth - n1 - 1 : n2
  let n3 = buf_bottom - cursor
  let n3 = n1 + n2 + n3 >= barWidth ? barWidth - n1 - n2 - 1 : n3
  let n4 = barWidth - n1 - n2 - n3 - 1
  let bar = '['.repeat(' ', n1).repeat('-', n2).'@'.repeat('-', n3).repeat(' ', n4).']'
  let stl_left = ' '
  let stl_right = ' %<%F %m%r%h%w%=[%{&fenc},%{&ff},%Y] (%03l/%03L,%03v) '
  return stl_left.bar.stl_right
endfunc
set laststatus=2
set statusline=%!STL()
