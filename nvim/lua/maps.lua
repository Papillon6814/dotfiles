local keymap = vim.keymap

-- New tab
keymap.set('n', 'te', ':tabedit')
-- Split window
keymap.set('n', 'ss', ':split<Return><C-w>w')
keymap.set('n', 'sv', ':vsplit<Return><C-w>w')

-- Terminal mode
keymap.set('t', '<Esc>', '<C-\><C-n>')
