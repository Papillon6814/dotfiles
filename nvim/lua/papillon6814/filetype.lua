local M = {}

local function set_indent(tab_length, is_hard_tab)
  if is_hard_tab then
    vim.bo.expandtab = false
  else
    vim.bo.expandtab = true
  end

  vim.bo.shiftwidth  = tab_length
  vim.bo.softtabstop = tab_length
  vim.bo.tabstop     = tab_length
end

M.help = function()
  vim.api.nvim_buf_set_keymap(0, 'n', 'q', 'ZZ', { noremap = true })
end

M.python          = function() set_indent(4, false) end
M.java            = function() set_indent(4, false) end
M.javascript      = function() set_indent(2, false) end
M.typescript      = function() set_indent(2, false) end
M.javascriptreact = function() set_indent(2, false) end
M.typescriptreact = function() set_indent(2, false) end
M.lua             = function() set_indent(2, false) end
M.rust            = function() set_indent(4, true) end
M.c               = function() set_indent(4, true) end
M.cpp             = function() set_indent(4, true) end
M.elixir          = function() set_indent(2, false) end
M.md              = function() set_indent(2, false) end
M.markdown        = function() set_indent(2, false) end
M.go              = function() set_indent(8, true) end

return setmetatable(M, {
  __index = function()
    return function()
      print('Unexpected filetype! (neovim filetype plugin)')
      set_indent(2, false)
    end
  end
})
