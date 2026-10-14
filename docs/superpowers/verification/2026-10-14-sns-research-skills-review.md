## Architecture Review

対象：`8ad91164899be9784e3381cbf7e1f1fc50fba8ef..659e88a`、変更15ファイル。

### Strengths / OK
- ①出口、②ディレクション、③AI制約の責務と判定を分離。固定ゲートや収益化の一律強制になっていません。
- 単価・転換率・案件条件を未確認として扱い、LPによる条件回避やAPI存在だけの利用可能判定を禁止しています。
- ②は既存基準を参照し、基準を複製していません。既存本体・基準・`profile.json` のbaseとのbytes一致を確認しました。
- 参照欠落時の部分成果・点検未実施・再開条件が明確です。欠落fixtureの保存出力も整合しています。
- 過去調査の媒体・モデル・環境依存を限定し、採用時の一次資料再確認を要求しています。
- 配置変更はResearch正本内に限定。稼働反映・main取り込み・push・外部操作の承認を分離しています。
- `routing-final` の7件はrawとsummaryが一致。instructionsと記録済み12リソースの現行hash一致を確認しました。

### Critical
なし。

### Warning / Important
なし。

### Info / Minor
- **[tests/probe_research_sns_design.mjs:77–83、tests/test_research_sns_design_skills.py:65–67] 実際に読んだ外部依存がhash検査対象外です。**
  - **確認事実・条件：** `routing-final/sample-3.json` と `sample-6.json` は `/Users/papillon/.claude/rules/knowledge-work-style.md` をreadしていますが、`sourceHashes` にその文書はありません。
  - **影響：** この外部文書だけが変更されても証拠の陳腐化検査は検出しません。記録済みSNSリソースの一致や今回の出力を否定する問題ではありません。
  - **修正案：** 今後のprobeで、追加readした依存文書も内容hashとして記録・検査するか、検証記録に「外部文書の同一性は未検証」と追記してください。過去試行時のhashを現在値で補完しないでください。

### probeのFS影響
- モデル側はreadのみですが、probe自体は証拠ディレクトリ・JSON・欠落fixtureを作成します。`--prepare-only` もfixture作成を伴います。
- 既存出力ディレクトリは再利用せず、JSONも`wx`で保存する設計です。欠落試験は実基準を削除しません。
- readにはProfile境界の強制がありません。実際の外部文書readもあり、Profile外アクセス拒否の証明にはできません。
- 出力先の検査は字句上のパス検査です。symlink経由の実体パス隔離までは保証していません。今回の逸脱書込みは確認していません。

### Declined to judge
- 合成入力のSDK試行を、Profile選択UI・実manager／子の協働・本番E2Eの証明として扱うこと。
- 実案件の掲載許可、本人API資格、生成品質、運用採算、SNS横断の成功保証。
- baselineでも成立していた安全性を、新スキルによる一般的な改善効果と評価すること。

### Ready to merge
**Yes — ブランチ成果物として。** Minorは非阻害です。実際のmain取り込み・稼働配置・pushには別承認が必要です。

### 未確認
- 追加テスト・実モデル呼出しは実施していません。最終suiteの「50件中46成功・既存証拠4skip」は親の確認と検証記録によります。
- 個別3スキルは保存済み件数・状態・hashと代表出力を確認しました。各5件の全文再判定は行っていません。
- SDK内部のFS副作用、稼働Profile反映、本番生成・公開・計測は未確認です。
- 編集・stage・commit・外部書込みは行っていません。
