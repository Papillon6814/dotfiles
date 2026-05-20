# ghosttyターミナルでコマンド完了時に通知を送る関数
# fish_postexecイベントにフックして、長時間実行コマンドの完了を通知

function notify_command_completion --on-event fish_postexec --description 'コマンド完了時に通知を送る'
    # 通知が無効化されている場合はスキップ
    if test "$GHOSTTY_NOTIFY_ENABLED" != "true"
        return
    end

    # CMD_DURATIONが設定されていない場合（1秒未満のコマンド）はスキップ
    if not set -q CMD_DURATION
        return
    end

    # 実行時間が閾値未満の場合はスキップ
    if test $CMD_DURATION -lt $GHOSTTY_NOTIFY_THRESHOLD
        return
    end

    # コマンドが空の場合（Enterのみ）はスキップ
    set -l cmd (string trim "$argv[1]")
    if test -z "$cmd"
        return
    end

    # コマンドを最大文字数で切り詰め
    if test (string length "$cmd") -gt $GHOSTTY_NOTIFY_MAX_COMMAND_LENGTH
        set cmd (string sub -l $GHOSTTY_NOTIFY_MAX_COMMAND_LENGTH "$cmd")"..."
    end

    # 実行時間を秒単位に変換（小数点1桁まで）
    set -l duration_sec (math -s1 "$CMD_DURATION / 1000")

    # 終了ステータスを取得
    set -l exit_status $argv[3]

    # 通知タイトルを設定
    set -l title
    if test $exit_status -eq 0
        set title "Command completed"
    else
        set title "Command failed (exit $exit_status)"
    end

    # 通知本文を構築
    set -l body "Command: $cmd"
    set body "$body\nDuration: {$duration_sec}s"
    set body "$body\nExit status: $exit_status"

    # Zellijセッション内の場合、セッション名を追加
    if set -q ZELLIJ_SESSION_NAME
        set body "$body\nSession: $ZELLIJ_SESSION_NAME"
    end

    # OSC 777シーケンスを使用してghosttyに通知を送信
    # フォーマット: \033]777;notify;{title};{body}\007
    printf '\033]777;notify;%s;%s\007' "$title" "$body"
end
