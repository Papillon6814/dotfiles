local keymap = vim.keymap

-- Tab
keymap.set('n', 'te', ':tabedit<Return>')
keymap.set('n', 'tc', ':tabc<Return>')
-- Control Tab
keymap.set('n', 'glt', ':-tabmove<Return>')
keymap.set('n', 'grt', ':+tabmove<Return>')
-- Split window
keymap.set('n', 'ss', ':split<Return><C-w>w')
keymap.set('n', 'sv', ':vsplit<Return><C-w>w')
-- Move Window
keymap.set('n', 'sh', '<C-w>h')
keymap.set('n', 'sk', '<C-w>k')
keymap.set('n', 'sj', '<C-w>j')
keymap.set('n', 'sl', '<C-w>l')
keymap.set('n', 'sH', '<C-w>H')
keymap.set('n', 'sK', '<C-w>K')
keymap.set('n', 'sJ', '<C-w>J')
keymap.set('n', 'sL', '<C-w>L')
-- Control Window
keymap.set('n', 'swq', '<C-w>q')

vim.g.UltiSnipsExpandTrigger = '<c-j>'
vim.g.UltiSnipsJumpForwardTrigger = '<c-b>'
vim.g.UltiSnipsJumpBackwardTrigger = '<c-z>'
