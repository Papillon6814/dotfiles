set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'VundleVim/Vundle.vim'

Plugin 'airblade/vim-gitgutter'
Plugin 'junegunn/fzf.vim'
Plugin 'junegunn/fzf'
Plugin 'mileszs/ack.vim'
Plugin 'racer-rust/vim-racer'
Plugin 'rust-lang/rust.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'sheerun/vim-polyglot'
" Enable to resite easily
Plugin 'simeji/winresizer'
Plugin 'tpope/vim-commentary'
" Enable to run git commands as vim commands
Plugin 'tpope/vim-fugitive'
Plugin 'unblevable/quick-scope'

" Elixir
Plugin 'elixir-editors/vim-elixir'
Plugin 'c-brenn/phoenix.vim'
Plugin 'slashmili/alchemist.vim'
Plugin 'mhinz/vim-mix-format'
Plugin 'mattreduce/vim-mix'

" Colors
Plugin 'ayu-theme/ayu-vim'
Plugin 'dracula/vim'
Plugin 'sickill/vim-monokai'
Plugin 'jacoborus/tender.vim'

call vundle#end()

let mapleader = "\<Space>"
filetype plugin indent on

set termguicolors
colorscheme tender

set number
set clipboard+=unnamed
" Do not break line
set nowrap
set redrawtime=10000
set re=0

nnoremap <silent><C-r> :NERDTreeToggle<CR>
nnoremap <Leader>p :Files<CR>
nnoremap <Leader>u :redo<CR>

set shell=/bin/bash

set hidden
let g:racer_cmd = '~/.cargo/bin/racer'
let g:racer_experimental_completer = 1

set cursorline

syntax on

" Settings about tender colorscheme
" If you have vim >=8.0 or Neovim >= 0.1.5
if (has("termguicolors"))
 set termguicolors
endif

" For Neovim 0.1.3 and 0.1.4
let $NVIM_TUI_ENABLE_TRUE_COLOR=1

" Elixir
au BufRead,BufNewFile *.ex,*.exs set filetype=elixir
au BufRead,BufNewFile *.eex,*.heex,*.leex,*.sface,*.lexs set filetype=eelixir
au BufRead,BufNewFile mix.lock set filetype=elixir


" Settings about tender colorscheme ends

" If you have vim >=8.0 or Neovim >= 0.1.5
if (has("termguicolors"))
 set termguicolors
endif

" For Neovim 0.1.3 and 0.1.4
let $NVIM_TUI_ENABLE_TRUE_COLOR=1

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

"" vim grep
""" ignored files in vimgrep
let s:ignore_list  = ',.git/**,.svn/**,obj/**'
let s:ignore_list .= ',tags,GTAGS,GRTAGS,GPATH'
let s:ignore_list .= ',*.o,*.obj,*.exe,*.dll,*.bin,*.so,*.a,*.out,*.jar,*.pak'
let s:ignore_list .= ',*.zip,*gz,*.xz,*.bz2,*.7z,*.lha,*.lzh,*.deb,*.rpm,*.iso'
let s:ignore_list .= ',*.pdf,*.png,*.jp*,*.gif,*.bmp,*.mp*'
let s:ignore_list .= ',*.od*,*.doc*,*.xls*,*.ppt*'
let s:ignore_list .= ',deps/**,_build/**,cover/**'

if exists('+wildignore')
  autocmd QuickFixCmdPre  * execute 'setlocal wildignore+=' . s:ignore_list
  autocmd QuickFixCmdPost * execute 'setlocal wildignore-=' . s:ignore_list
endif

set laststatus=2
set statusline=%!STL()
