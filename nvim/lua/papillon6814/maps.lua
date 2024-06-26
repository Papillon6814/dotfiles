local keymap = vim.keymap

-- Tab
keymap.set("n", "te", ":tabedit<Return>")
keymap.set("n", "tc", ":tabc<Return>")

-- Control Tab
keymap.set("n", "glt", ":-tabmove<Return>")
keymap.set("n", "grt", ":+tabmove<Return>")

-- Split window
keymap.set("n", "ss", ":split<Return><C-w>w")
keymap.set("n", "sv", ":vsplit<Return><C-w>w")

-- Move Window
keymap.set("n", "sh", "<C-w>h")
keymap.set("n", "sk", "<C-w>k")
keymap.set("n", "sj", "<C-w>j")
keymap.set("n", "sl", "<C-w>l")
keymap.set("n", "sH", "<C-w>H")
keymap.set("n", "sK", "<C-w>K")
keymap.set("n", "sJ", "<C-w>J")
keymap.set("n", "sL", "<C-w>L")

-- Control Window
keymap.set("n", "swq", "<C-w>q")
keymap.set("n", "swe", ":wincmd =<Return>")

vim.g.UltiSnipsExpandTrigger = "<c-j>"
vim.g.UltiSnipsJumpForwardTrigger = "<c-b>"
vim.g.UltiSnipsJumpBackwardTrigger = "<c-z>"

-- LSP
keymap.set("n", "gf", "<cmd>lua vim.lsp.buf.formatting()<CR>")
keymap.set("n", "gr", "<cmd>lua vim.lsp.buf.references()<CR>")
keymap.set("n", "gd", "<cmd>lua vim.lsp.buf.definition()<CR>")
keymap.set("n", "gD", "<cmd>lua vim.lsp.buf.declaration()<CR>")
keymap.set("n", "gi", "<cmd>lua vim.lsp.buf.implementation()<CR>")
keymap.set("n", "gh", "<cmd>lua vim.lsp.buf.hover()<CR>")
keymap.set("n", "gdt", "<cmd>lua vim.lsp.buf.type_definition()<CR>")
keymap.set("n", "gn", "<cmd>lua vim.lsp.buf.rename()<CR>")
keymap.set("n", "ga", "<cmd>lua vim.lsp.buf.code_action()<CR>")
keymap.set("n", "ge", "<cmd>lua vim.diagnostic.open_float()<CR>")
keymap.set("n", "g]", "<cmd>lua vim.diagnostic.goto_next()<CR>")
keymap.set("n", "g[", "<cmd>lua vim.diagnostic.goto_prev()<CR>")
