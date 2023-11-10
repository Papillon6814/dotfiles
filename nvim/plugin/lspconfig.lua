local status, nvim_lsp = pcall(require, "lspconfig")
if not status then
  return
end

local util = require("lspconfig/util")

-- Lua
nvim_lsp.lua_ls.setup({
  settings = {
    Lua = {
      diagnostics = {
        globals = { "vim" },
      },
    },
  },
})

-- Python
nvim_lsp.pyright.setup({})

-- TypeScript
nvim_lsp.tsserver.setup({
  filetypes = { "typescript", "typescriptreact", "typescript.tsx" },
  cmd = { "typescript-language-server", "--stdio" },
})

-- Elixir
nvim_lsp.elixirls.setup({
  filetypes = { "elixir" },
  cmd = { "elixir-ls" },
})

-- Rust
nvim_lsp.rust_analyzer.setup({})

-- Go
nvim_lsp.gopls.setup({
  cmd = { "gopls", "serve" },
  filetypes = { "go", "gomod" },
  root_dir = util.root_pattern("go.work", "go.mod", ".git"),
  settings = {
    gopls = {
      analyses = {
        unusedparams = true,
      },
      staticcheck = true,
    },
  },
})

-- Terraform LS
--nvim_lsp.terraformls.setup({
--	cmd = { "terraform-ls", "serve" },
--	filetypes = { "terraform" },
--	root_dir = require("lspconfig").util.root_pattern(".terraform", ".git"),
--})

-- Solidity
--nvim_lsp.solc.setup {
--  on_attach = nil
--}
