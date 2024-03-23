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
		"eex",
		"elixir",
		"go",
		"graphql",
		"heex",
		"hcl",
		"html",
		"javascript",
		"json",
		"lua",
		"markdown",
		"php",
		"prisma",
		"ruby",
		"rust",
		"swift",
		"terraform",
		"toml",
		"tsx",
		"yaml",
		"commonlisp",
	},
})
