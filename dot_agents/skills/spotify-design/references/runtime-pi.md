# Piアダプター

親からspotify-ux-manager / spotify-ui-managerを明示的に使います。インストール済みPi-subagentsの利用可能定義を確認し、許可された公開起動手段を使います。設計はUX→UI、レビューの並列化は独立する場合だけ。子からの再委任はありません。

専用定義のskillsでspotify-designを明示選択します。共有の正本は~/.agents/skills/spotify-design。Pi側に重複コピーを置きません。inheritSkills=falseでも指定skillsは選択されます（S28）。
実効toolsはread, anchor_grepと、親への相談だけを行うcontact_supervisor。2026-10-17にこの例外を承認。これはツールをロードする機能ではありません。欠落時は停止し、Bashや編集ツールで代替しません。モデルは省略し環境の既定を継承します。

この専任ロールはfresh・replaceで、リポジトリ/グローバルの文脈や他スキルを暗黙に取り込みません。親が対象の上位制約・既決事項・証拠パスを入力へ引き渡します。読める範囲はOS sandboxではなく運用上の境界です。
導入や既存定義の置換は呼出し権限とは別です。スキルが見つからない場合は停止し、同名の別資料や汎用LLMへのprompt投入をnative読込と呼びません。
