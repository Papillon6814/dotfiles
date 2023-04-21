vim.cmd("autocmd!")

require("papillon6814.base")
require("papillon6814.plugins")
require("papillon6814.maps")
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
