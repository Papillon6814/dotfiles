vim.g.mapleader = ' '

require('plugins')
require('maps')

vim.api.nvim_exec('language en_US', true)
vim.api.nvim_exec('colorscheme sonokai', true)
vim.api.nvim_exec('syntax on', true)
vim.api.nvim_exec('autocmd TermOpen * startinsert', true)
vim.api.nvim_exec('set clipboard=unnamed', true)
vim.api.nvim_exec('lang en_US.UTF-8', true)

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

require('colorizer').setup()

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

local mason = require('mason')
mason.setup({
 ui = {
   icons = {
     package_installed = "✓",
     package_pending = "➜",
     package_uninstalled = "✗"
   }
 }
})

local status, saga = pcall(require, "lspsaga")
if (not status) then return end

saga.init_lsp_saga {
  server_filetype_map = {
    typescript = 'typescript'
  }
}

local opts = { noremap = true, silent = true }
vim.keymap.set('n', '<C-j>', '<Cmd>Lspsaga diagnostic_jump_next<CR>', opts)
vim.keymap.set('n', 'K', '<Cmd>Lspsaga hover_doc<CR>', opts)
vim.keymap.set('n', 'gd', '<Cmd>Lspsaga lsp_finder<CR>', opts)
vim.keymap.set('i', '<C-k>', '<Cmd>Lspsaga signature_help<CR>', opts)
vim.keymap.set('n', 'gp', '<Cmd>Lspsaga preview_definition<CR>', opts)
vim.keymap.set('n', 'gr', '<Cmd>Lspsaga rename<CR>', opts)


vim.api.nvim_exec('augroup fmt', true)
vim.api.nvim_exec('autocmd!', true)
vim.api.nvim_exec('autocmd BufWritePre *.js,*.jsx,*.mjs,*.ts,*.tsx,*.css,*.less,*.scss,*.json,*.graphql,*.md,*.vue,*.svelte,*.yaml,*.html Prettier', true)
vim.api.nvim_exec('augroup END', true)
