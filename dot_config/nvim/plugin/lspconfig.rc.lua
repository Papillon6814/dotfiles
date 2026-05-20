-- Neovim 0.11+ native LSP configuration

-- Lua
vim.lsp.config("lua_ls", {
  settings = {
    Lua = {
      diagnostics = {
        globals = { "vim" },
      },
    },
  },
})

-- Python
vim.lsp.config("pyright", {})

-- TypeScript
vim.lsp.config("ts_ls", {
  filetypes = { "typescript", "typescriptreact", "typescript.tsx" },
  cmd = { "typescript-language-server", "--stdio" },
})

-- Elixir
vim.lsp.config("elixirls", {
  filetypes = { "elixir" },
  cmd = { "elixir-ls" },
})

-- Rust
vim.lsp.config("rust_analyzer", {})

-- Go
vim.lsp.config("gopls", {
  cmd = { "gopls", "serve" },
  filetypes = { "go", "gomod" },
  root_markers = { "go.work", "go.mod", ".git" },
  settings = {
    gopls = {
      analyses = {
        unusedparams = true,
      },
      staticcheck = true,
    },
  },
})

-- Dart
vim.lsp.config("dartls", {})

-- Enable all configured LSP servers
vim.lsp.enable({
  "lua_ls",
  "pyright",
  "ts_ls",
  "elixirls",
  "rust_analyzer",
  "gopls",
  "dartls",
})
