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
end)
