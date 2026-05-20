local opts = { noremap = true, silent = true }
vim.keymap.set("n", "<c-g>b", "<Cmd>Git blame_line<CR>", opts)
vim.keymap.set("n", "<c-g>d", "<Cmd>Git diffthis<CR>", opts)
vim.keymap.set("n", "<c-g>r", "<Cmd>Git reset_buffer<CR>", opts)
vim.keymap.set("n", "<c-g>a", "<Cmd>Git stage_buffer<CR>", opts)
