vim.g.mapleader = ' '

require('plugins')
require('maps')

vim.api.nvim_exec('language en_US', true)
vim.api.nvim_exec('colorscheme sonokai', true)
vim.api.nvim_exec('syntax on', true)
vim.api.nvim_exec('autocmd TermOpen * startinsert', true)
vim.api.nvim_exec('set clipboard=unnamed', true)

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

--vim.opt.clipboard:append{'unnamedplus'}

-- Indent Size
local my_filetype = require('filetype')

-- GitSign
require('gitsigns').setup()

vim.api.nvim_create_augroup('vimrc_augroup', {})
vim.api.nvim_create_autocmd('FileType', {
  group = 'vimrc_augroup',
  pattern = '*',
  callback = function(args) my_filetype[args.match]() end
})

local null_ls = require("null-ls")

null_ls.setup({
	sources = {
		null_ls.builtins.diagnostics.credo
	},
})

vim.api.nvim_exec('augroup fmt', true)
vim.api.nvim_exec('autocmd!', true)
vim.api.nvim_exec('autocmd BufWritePre,TextChanged *.js,*.jsx,*.mjs,*.ts,*.tsx,*.css,*.less,*.scss,*.json,*.graphql,*.md,*.vue,*.svelte,*.yaml,*.html Prettier', true)
vim.api.nvim_exec('augroup END', true)
