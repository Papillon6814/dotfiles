#!/bin/sh
# herdr プラグインの再導入。コミット固定（2026-11-01 更新: herdr-agent-quota を修正版に）。
# plugins.json は絶対パス入りの herdr 管理ファイルなので追跡せず、これで再現する。
set -eu
herdr plugin install -y --ref 99002e24525a9ae327450cd83a17b1e86b2ee81f plannotator/herdr-annotate  # annotate 0.5.0
herdr plugin install -y --ref 23ad3448b7f77d46756e5901b583c372ac33e72a mo-arvan/herdr-claude-auto-retry  # claude-auto-retry 1.3.0
herdr plugin install -y --ref 6fe22de9a90c569f2186595cfddc3707f55ba1bd wyattjoh/herdr-plugin-gh-pr  # gh-pr 0.4.0
# herdr-agent-quota は Pi の別アカウント枠を出す修正版（private リポジトリの fix/pi-own-auth-quota）をコミット固定で入れる
quota="$HOME/Code/herdr-agent-quota"
[ -d "$quota/.git" ] || gh repo clone KendrickMalar/herdr-agent-quota-private "$quota"
git -C "$quota" fetch origin fix/pi-own-auth-quota
git -C "$quota" checkout --detach 3c65904d301f5c17a8146c7c7b81b35a795654bb  # herdr-agent-quota 1.6.2 + pi-own-auth
(cd "$quota" && cargo build --release)
herdr plugin link "$quota" --enabled
herdr plugin install -y --ref fcf54929cce37fd925f9b76ca1e4173528c5845a yankewei/herdr-focus-notify  # herdr-focus-notify 0.7.0
herdr plugin install -y --ref 5afa6755d4f35c62c7522ba4fd04922d1ac69602 ntindle/herdr-resurrect  # ntindle.herdr-resurrect 0.2.0
herdr plugin install -y --ref c13ef573452b211b6097ddd0ce197be88e9a4b53 tdi/herdr-worktree-setup  # tdi.worktree-setup 0.3.0
