require('plugins')

vim.api.nvim_exec('language en_US', true)
vim.api.nvim_exec('colorscheme monokai', true)
vim.api.nvim_exec('syntax on', true)

vim.o.termguicolors = true
vim.o.number = true
vim.o.wrap = false
vim.o.cursorline = true
vim.o.showmatch = true

vim.opt.clipboard:append{'unnamedplus'}
