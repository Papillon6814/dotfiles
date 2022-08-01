set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'VundleVim/Vundle.vim'

Plugin 'bronson/vim-trailing-whitespace'
Plugin 'dense-analysis/ale'
Plugin 'airblade/vim-gitgutter'
Plugin 'junegunn/fzf.vim'
Plugin 'junegunn/fzf'
Plugin 'mileszs/ack.vim'
Plugin 'racer-rust/vim-racer'
Plugin 'rust-lang/rust.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'sheerun/vim-polyglot'
Plugin 'APZelos/blamer.nvim'

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

" React
Plugin 'pangloss/vim-javascript'
Plugin 'MaxMEllon/vim-jsx-pretty'
Plugin 'heavenshell/vim-tslint'

" Colors
Plugin 'ayu-theme/ayu-vim'
Plugin 'dracula/vim'
Plugin 'sickill/vim-monokai'
Plugin 'jacoborus/tender.vim'
Plugin 'sainnhe/sonokai'

" Vim LSP
Plugin 'prabirshrestha/vim-lsp'
Plugin 'mattn/vim-lsp-settings'

call vundle#end()

let mapleader = "\<Space>"
filetype plugin indent on

" Important!! sonokai
" The configuration options should be placed before `colorscheme sonokai`.
let g:sonokai_style = 'shusia'
let g:sonokai_better_performance = 1

set termguicolors
colorscheme sonokai

set number
set clipboard+=unnamed
" Do not break line
set nowrap
set redrawtime=10000
set re=0
set encoding=utf-8
scriptencoding utf-8

nnoremap <silent><C-r> :NERDTreeToggle<CR>
nnoremap <Leader>p :Files<CR>
nnoremap <Leader>u :redo<CR>

set showmatch
hi MatchParen cterm=none ctermbg=green ctermfg=blue

set shell=/bin/bash

set hidden
let g:racer_cmd = '~/.cargo/bin/racer'
let g:racer_experimental_completer = 1

set cursorline

let NERDTreeShowHidden=1

syntax on

" Settings about tender colorscheme
" If you have vim >=8.0 or Neovim >= 0.1.5
if (has("termguicolors"))
 set termguicolors
endif

" Elixir
au BufRead,BufNewFile *.ex,*.exs set filetype=elixir
au BufRead,BufNewFile *.eex,*.heex,*.leex,*.sface,*.lexs set filetype=eelixir
au BufRead,BufNewFile mix.lock set filetype=elixir

" GitLens
let g:blamer_enabled = 1
let g:blamer_delay = 300

" Auto completion
inoremap <expr><CR>  pumvisible() ? "<C-y>" : "<CR>"

set completeopt=menuone,noinsert
inoremap <expr><C-n> pumvisible() ? "<Down>" : "<C-n>"
inoremap <expr><C-p> pumvisible() ? "<Up>" : "<C-p>"

" Lint with ALE
let g:ale_fixers = {
\   '*': ['remove_trailing_lines', 'trim_whitespace'],
\   'typescriptreact': ['prettier', 'eslint'],
\   'typescript': ['prettier'],
\   'javascript': ['prettier'],
\   'javascriptreact': ['prettier'],
\   'css': ['prettier'],
\}

let g:ale_sign_error = 'P>'
let g:ale_sign_warning = 'P-'
let g:ale_echo_msg_format = '[%linter%] %code: %%s'
let g:ale_statusline_format = ['E%d', 'W%d', 'OK']

let g:ale_linters = {
\   'javascript': ['eslint'],
\   'elixir': ['elixir-ls'],
\}

let g:ale_fix_on_save = 1
let g:ale_completion_enabled = 1
let g:ale_javascript_prettier_use_local_config = 1

let g:ale_set_loclist = 0
let g:ale_set_quickfix = 1

let g:ale_open_list = 1

" エラーと警告がなくなっても開いたままにする
let g:ale_keep_list_window_open = 1

" If you have vim >=8.0 or Neovim >= 0.1.5
if (has("termguicolors"))
 set termguicolors
endif

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
set wildignore=*/node_modules/*,*/target/*,*/tmp/*,*/_build/*,*/deps/*

set laststatus=2
set statusline=%!STL()
