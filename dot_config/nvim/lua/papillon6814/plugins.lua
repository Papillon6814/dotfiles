-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Plugin specifications
require("lazy").setup({
  -- Measure startup time
  { "dstein64/vim-startuptime" },

  -- Startify
  { "goolord/alpha-nvim" },

  -- Indent Indicator
  { "lukas-reineke/indent-blankline.nvim" },

  -- Color Theme
  { "tanvirtin/monokai.nvim" },
  { "sainnhe/sonokai" },

  -- Icons
  { "kyazdani42/nvim-web-devicons" },

  -- Status line decorator
  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "kyazdani42/nvim-web-devicons" },
  },

  -- LSP config
  { "neovim/nvim-lspconfig" },

  -- LSP package manager
  { "williamboman/mason.nvim" },
  { "williamboman/mason-lspconfig.nvim" },

  -- Formatter (null-ls)
  {
    "jose-elias-alvarez/null-ls.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
  },

  -- Highlight Parser
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
  },

  -- Autotag
  { "windwp/nvim-ts-autotag" },

  -- Auto pair brackets
  { "windwp/nvim-autopairs" },

  -- Fuzzy Finder
  {
    "nvim-telescope/telescope.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-telescope/telescope-file-browser.nvim",
    },
    config = function()
      local telescope = require("telescope")
      local actions = require("telescope.actions")
      local builtin = require("telescope.builtin")
      local fb_actions = telescope.extensions.file_browser.actions

      local function telescope_buffer_dir()
        return vim.fn.expand("%:p:h")
      end

      telescope.setup({
        defaults = {
          mappings = {
            n = {
              ["q"] = actions.close,
            },
          },
        },
        extensions = {
          file_browser = {
            theme = "dropdown",
            hijack_netrw = true,
            mappings = {
              ["i"] = {
                ["<C-w>"] = function()
                  vim.cmd("normal vbd")
                end,
              },
              ["n"] = {
                ["N"] = fb_actions.create,
                ["M"] = fb_actions.move,
                ["D"] = fb_actions.remove,
                ["R"] = fb_actions.rename,
                ["h"] = fb_actions.goto_parent_dir,
                ["/"] = function()
                  vim.cmd("startinsert")
                end,
              },
            },
          },
        },
      })

      telescope.load_extension("file_browser")

      -- Keymaps
      vim.keymap.set("n", "<Leader>p", function()
        builtin.find_files({
          no_ignore = false,
          hidden = true,
        })
      end)
      vim.keymap.set("n", "<Leader>g", function()
        builtin.live_grep()
      end)
      vim.keymap.set("n", "<Leader>b", function()
        builtin.buffers()
      end)
      vim.keymap.set("n", "<Leader>h", function()
        builtin.help_tags()
      end)
      vim.keymap.set("n", "<Leader>;", function()
        builtin.resume()
      end)
      vim.keymap.set("n", "<Leader>d", function()
        builtin.diagnostics()
      end)
      vim.keymap.set("n", "<Leader>r", function()
        telescope.extensions.file_browser.file_browser({
          path = "%:p:h",
          cwd = telescope_buffer_dir(),
          respect_gitignore = false,
          hidden = true,
          grouped = true,
          previewer = false,
          initial_mode = "normal",
          layout_config = { height = 40 },
        })
      end)
    end,
  },

  -- Git Change indicator
  { "lewis6991/gitsigns.nvim" },

  -- Git Blamer
  { "f-person/git-blame.nvim" },

  -- Annotation comments
  {
    "folke/todo-comments.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require("todo-comments").setup({})
    end,
  },

  -- Search a first unique character in line
  { "unblevable/quick-scope" },

  -- Visible color
  { "norcalli/nvim-colorizer.lua" },

  -- Auto close brackets
  { "rstacruz/vim-closer" },

  -- GoToDefinition
  {
    "glepnir/lspsaga.nvim",
    branch = "main",
    config = function()
      require("lspsaga").setup({})
    end,
    dependencies = { "nvim-tree/nvim-web-devicons" },
  },

  -- Highlight same spell words
  { "RRethy/vim-illuminate" },

  -- Quickfix Replacement
  { "thinca/vim-qfreplace" },

  -- Completion
  { "hrsh7th/cmp-nvim-lsp" },
  { "hrsh7th/cmp-buffer" },
  { "hrsh7th/cmp-path" },
  { "hrsh7th/cmp-cmdline" },
  { "hrsh7th/nvim-cmp" },

  -- ==========================================================
  -- Settings for each language
  -- ==========================================================

  -- Elixir
  { "elixir-editors/vim-elixir", ft = { "elixir", "eelixir" } },
  {
    "mhanberg/elixir.nvim",
    dependencies = { "neovim/nvim-lspconfig", "nvim-lua/plenary.nvim" },
    ft = { "elixir", "eelixir" },
  },

  -- Go
  { "johejo/gomod.vim", ft = { "go" } },

  -- ==========================================================
  -- New plugins (Phase 2)
  -- ==========================================================

  -- which-key: Keybinding popup
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    config = function()
      require("which-key").setup({})
    end,
  },

  -- trouble.nvim: Diagnostics list
  {
    "folke/trouble.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    cmd = "Trouble",
    keys = {
      { "<leader>xx", "<cmd>Trouble diagnostics toggle<cr>", desc = "Diagnostics" },
      { "<leader>xd", "<cmd>Trouble diagnostics toggle filter.buf=0<cr>", desc = "Buffer Diagnostics" },
    },
  },

  -- conform.nvim: Formatter (auto format on save)
  {
    "stevearc/conform.nvim",
    event = { "BufWritePre" },
    cmd = { "ConformInfo" },
    keys = {
      {
        "gf",
        function()
          require("conform").format({ async = true })
        end,
        desc = "Format",
      },
    },
    opts = {
      formatters_by_ft = {
        lua = { "stylua" },
        go = { "goimports" },
        javascript = { "prettier" },
        typescript = { "prettier" },
        typescriptreact = { "prettier" },
        javascriptreact = { "prettier" },
        json = { "prettier" },
        css = { "prettier" },
        html = { "prettier" },
        markdown = { "prettier" },
        python = { "black" },
        elixir = { "mix" },
        terraform = { "terraform_fmt" },
      },
      format_on_save = {
        timeout_ms = 500,
        lsp_fallback = true,
      },
    },
  },

})
