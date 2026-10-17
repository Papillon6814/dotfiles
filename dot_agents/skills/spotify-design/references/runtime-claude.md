# Claude Codeアダプター

専用subagentはspotify-ux-manager / spotify-ui-manager。親の許可されたAgent手段で明示起動します。skillsでspotify-designを事前読み込みし、Read / Grep / Globだけを持ちます（S25, S26）。allowed-toolsをスキルへ足しても権限削減の代わりにはなりません。
モデル指定は省略し環境の既定を継承します。Write/Edit/Bash/Agent/MCP操作を付けません。レビュー結果や保存先指定は親へ返し、子が保存する必要はありません。

~/.claude/skills/spotify-designは~/.agents/skills/spotify-designへのリンクです。実際の起動時に参照が解決できることを確認します。子のロールは役割別referencesを自分で読む必要があります。
omitClaudeMdで無関係な文脈を暗黙に引き継がず、親が上位制約と対象の既決事項を入力へ渡します。別プロジェクトの記憶・認証・機密を探索しません。
CLIで--agentを使う検証と、汎用モデルに本文だけ渡す検証は別です。native initの実効toolsと共通スキルの読込記録を別々に確認します。
