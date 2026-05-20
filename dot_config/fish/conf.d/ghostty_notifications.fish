# ghostty プロセス完了通知の設定
# コマンド実行完了時にmacOS通知を送る

# 通知を送る最小コマンド実行時間（ミリ秒）
# デフォルト: 5000ms (5秒)
if not set -q GHOSTTY_NOTIFY_THRESHOLD
    set -g GHOSTTY_NOTIFY_THRESHOLD 5000
end

# 通知機能の有効/無効
# デフォルト: true (有効)
if not set -q GHOSTTY_NOTIFY_ENABLED
    set -g GHOSTTY_NOTIFY_ENABLED true
end

# 通知に表示するコマンドの最大文字数
# デフォルト: 50文字
if not set -q GHOSTTY_NOTIFY_MAX_COMMAND_LENGTH
    set -g GHOSTTY_NOTIFY_MAX_COMMAND_LENGTH 50
end
