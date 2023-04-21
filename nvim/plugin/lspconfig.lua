local status, nvim_lsp = pcall(require, "lspconfig")
if (not status) then return end

local util = require('lspconfig/util')

-- Lua
nvim_lsp.lua_ls.setup {
  settings = {
    Lua = {
      diagnostics = {
        globals = { 'vim' }
      }
    }
  }
}

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
  cmd = { "gopls", "serve" },
  filetypes = { "go", "gomod" },
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

--vim.api.nvim_exec('augroup fmt', true)
--vim.api.nvim_exec('autocmd!', true)
--vim.api.nvim_exec('autocmd BufWritePost *.js,*.jsx,*.mjs,*.ts,*.tsx,*.css,*.less,*.scss,*.json,*.graphql,*.md,*.vue,*.svelte,*.yaml,*.html !prettier -w "%"', true)
--vim.api.nvim_exec('autocmd BufWritePost *.go !gofmt -w %', true)
--vim.api.nvim_exec('augroup END', true)
--vim.api.nvim_exec('autocmd BufWritePost *.go !gofmt -w %', true)
--vim.api.nvim_exec('augroup END', true)
