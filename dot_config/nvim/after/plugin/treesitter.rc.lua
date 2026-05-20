local status, ts = pcall(require, "nvim-treesitter.configs")
if not status then
  return
end

ts.setup({
  autotag = {
    enable = true,
  },
  highlight = {
    enable = true,
    disable = {},
  },
  indent = {
    enable = true,
    disable = {},
  },
  ensure_installed = {
    "css",
    "c_sharp",
    "fish",
    "dart",
    "eex",
    "elixir",
    "go",
    "graphql",
    "heex",
    "hcl",
    "html",
    "javascript",
    "json",
    "kdl",
    "lua",
    "markdown",
    "php",
    "prisma",
    "ruby",
    "rust",
    "swift",
    "terraform",
    "typescript",
    "toml",
    "tsx",
    "yaml",
    "commonlisp",
  },
})
