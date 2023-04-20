local status, nvim_lsp = pcall(require, "lspconfig")
if (not status) then return end

local protocol = require('vim.lsp.protocol')
local util = require('lspconfig/util')

-- TypeScript
nvim_lsp.tsserver.setup {
  filetypes = { "typescript", "typescriptreact", "typescript.tsx" },
  cmd = { "typescript-language-server", "--stdio" }
}

-- Elixir
nvim_lsp.elixirls.setup {
  filetypes = { "elixir" },
  cmd = { "elixir-ls" }
}

-- Rust
nvim_lsp.rust_analyzer.setup {}

-- Go
nvim_lsp.gopls.setup {
  cmd = {"gopls", "serve"},
  filetypes = {"go", "gomod"},
  root_dir = util.root_pattern("go.work", "go.mod", ".git"),
  settings = {
    gopls = {
      analyses = {
        unusedparams = true,
      },
      staticcheck = true,
    }
  }
}

-- Solidity
--nvim_lsp.solc.setup {
--  on_attach = nil
--}

