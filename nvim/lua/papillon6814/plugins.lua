local status, packer = pcall(require, "packer")
if (not status) then
  print("Packer is not installed")
  return
end

vim.cmd [[packadd packer.nvim]]

packer.startup(function(use)
  use 'wbthomason/packer.nvim'



  -- Color Theme
  use 'tanvirtin/monokai.nvim'
  use 'sainnhe/sonokai'

  -- Indent Indicator
  use "lukas-reineke/indent-blankline.nvim"

  -- Status line decorator
  use {
    'nvim-lualine/lualine.nvim',
    requires = { 'kyazdani42/nvim-web-devicons', opt = true }
  }
  -- LSP config
  use 'neovim/nvim-lspconfig'

  -- LSP package manager
  use 'williamboman/mason.nvim'
  use 'williamboman/mason-lspconfig.nvim'

  -- Formatter
  use { "jose-elias-alvarez/null-ls.nvim", requires = "nvim-lua/plenary.nvim" }

  -- Highlight Parser
  use {
    'nvim-treesitter/nvim-treesitter',
    run = ':TSUpdate'
  }

  -- Autotag
  use 'windwp/nvim-ts-autotag'

  -- Auto pair brackets
  use 'windwp/nvim-autopairs'

  -- Iconset for Fuzzy Finder
  use 'kyazdani42/nvim-web-devicons'

  -- Fuzzy Finder
  use {
    'nvim-telescope/telescope.nvim',
    requires = { {'nvim-lua/plenary.nvim'} }
  }
  -- Fuzzy Finder as a file browser
  use { "nvim-telescope/telescope-file-browser.nvim" }

  -- Prettier
  use 'MunifTanjim/prettier.nvim'
  use 'prettier/vim-prettier'

  -- Git Change indicator
  use 'lewis6991/gitsigns.nvim'

  -- Annotaion comments
  use {
    "folke/todo-comments.nvim",
    requires = "nvim-lua/plenary.nvim",
    config = function() require("todo-comments").setup{} end
  }

  -- Search a first unique character in line
  use 'unblevable/quick-scope'

  -- Visible color
  use 'norcalli/nvim-colorizer.lua'

  -- Auto close brackets
  use 'rstacruz/vim-closer'

  -- GoToDefinition
  use({
    "glepnir/lspsaga.nvim",
    branch = "main",
    config = function()
        require("lspsaga").setup({})
    end,
    requires = { {"nvim-tree/nvim-web-devicons"} }
  })

  -- Snippet
  use 'honza/vim-snippets'
  use 'SirVer/ultisnips'

  -- Highlight same spell words
  use 'RRethy/vim-illuminate'

  -- ==========================================================
  -- Settings for each language
  -- ==========================================================


  -- Elixir
  use "elixir-editors/vim-elixir"
  use { "mhanberg/elixir.nvim", requires = { "neovim/nvim-lspconfig", "nvim-lua/plenary.nvim" }}

  -- Go
  use "johejo/gomod.vim"
end)