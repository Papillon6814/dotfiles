require('plugins')
require('maps')

vim.g.mapleader = ' '
vim.api.nvim_exec('language en_US', true)
vim.api.nvim_exec('colorscheme sonokai', true)
vim.api.nvim_exec('syntax on', true)
vim.api.nvim_exec('autocmd TermOpen * startinsert', true)
vim.api.nvim_exec('set clipboard=unnamed', true)
vim.api.nvim_exec('lang en_US.UTF-8', true)
vim.api.nvim_exec('set mouse=', true)
vim.o.termguicolors = true
vim.o.number = true
vim.o.wrap = false
vim.o.cursorline = true
vim.o.showmatch = true
vim.o.encoding = 'utf-8'
vim.g.airline_powerline_fonts = 1

-- Sonokai
vim.g.sonokai_style = 'shusia'
vim.g.sonokai_better_performance = 1

-- Indent Size
local my_filetype = require('filetype')

vim.api.nvim_create_augroup('vimrc_augroup', {})
vim.api.nvim_create_autocmd('FileType', {
  group = 'vimrc_augroup',
  pattern = '*',
  callback = function(args) my_filetype[args.match]() end
})

-- GitSign
require('gitsigns').setup()

require('colorizer').setup()
