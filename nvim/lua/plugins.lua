local status, packer = pcall(require, "packer")
if (not status) then
  print("Packer is not installed")
  return
end

vim.cmd [[packadd packer.nvim]]

packer.startup(function(use)
  use 'wbthomason/packer.nvim'
  -- Your plugins go here
  -- Color Theme
  use 'tanvirtin/monokai.nvim'
  -- Indent Indicator
  use "lukas-reineke/indent-blankline.nvim"
  -- Status line decorator
  use {
    'nvim-lualine/lualine.nvim',
    requires = { 'kyazdani42/nvim-web-devicons', opt = true }
  }
  -- LSP config
  use 'neovim/nvim-lspconfig'
  -- Highlight Parser
  use 'nvim-treesitter/nvim-treesitter'
  -- Autotag
  use 'windwp/nvim-ts-autotag'
  -- Auto pair brackets
  use 'windwp/nvim-autopairs'
  -- Fuzzy Finder
  use {
    'nvim-telescope/telescope.nvim',
    requires = { {'nvim-lua/plenary.nvim'} }
  }
  -- Fuzzy Finder as a file browser
  use { "nvim-telescope/telescope-file-browser.nvim" }
  -- Iconset for Fuzzy Finder
  use 'kyazdani42/nvim-web-devicons'
end)
