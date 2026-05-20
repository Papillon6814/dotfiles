vim.cmd("autocmd!")

-- Set leader key before plugins load (required for keymaps)
vim.g.mapleader = " "

-- Set termguicolors before plugins load (required for colorizer)
vim.o.termguicolors = true

require("papillon6814.plugins")
require("papillon6814.base")
require("papillon6814.maps")
require("papillon6814.zellij")
local my_filetype = require("papillon6814.filetype")

-- Indent Size
vim.api.nvim_create_augroup("vimrc_augroup", {})
vim.api.nvim_create_autocmd("FileType", {
	group = "vimrc_augroup",
	pattern = "*",
	callback = function(args)
		my_filetype[args.match]()
	end,
})

-- Podfile as Ruby file
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
	pattern = "Podfile",
	command = "set filetype=ruby",
})
