local status, icons = pcall(require, "nvim-web-devicons")
if not status then
  return
end

icons.setup({
  -- your personnal icons can go here (to override)
  -- DevIcon will be appended to `name`
  override_by_extension = {
    ["cl"] = {
      icon = "λ",
      color = "#81e043",
      name = "Log",
    },
  },
  -- globally enable default icons (default to false)
  -- will get overriden by `get_icons` option
  default = true,
})
