#!/bin/bash

set -u

# 実行場所のディレクトリを取得
THIS_DIR=$(cd $(dirname $0); pwd)

cd $THIS_DIR
git submodule init
git submodule update

echo "Setting up symbolic link..."
for f in .??*; do
    [ "$f" = ".git" ] && continue
    ln -snfv ~/dotfiles/"$f" ~/
done
echo "DONE"

echo "fishの設定"
ln -sf ~/dotfiles/fish ~/.config/fish
echo "DONE"

echo "fisherで管理されているものの"
ln -sf ~/dotfiles/fisher ~/.config/fisher
echo "DONE"

echo "Neovimの設定"
cd ~
mkdir ~/.config/nvim/
mkdir ~/.config/nvim/plugin
mkdir ~/.config/nvim/lua
mkdir ~/.config/nvim/after
mkdir ~/.config/nvim/after/plugin
ln ~/dotfiles/nvim/init.lua ~/.config/nvim/init.lua
ln ~/dotfiles/nvim/lua/plugins.lua ~/.config/nvim/lua/plugins.lua

for f in ~/dotfiles/nvim/after/plugin/*.rc.lua; do
    ln ~/dotfiles/nvim/after/plugin/"$f" ~/.config/nvim/after/plugin
done
echo "DONE"

cat << END

**************************************************
DOTFILES SETUP FINISHED! bye.
**************************************************

END
