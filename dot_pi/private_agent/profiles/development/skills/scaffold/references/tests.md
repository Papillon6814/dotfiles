※ この文書はscaffoldスキルの一部であり、説明資料ではなく今回の工程で従う手順書である。scaffoldで工程を確認してから全文読む。共通規律はDevelopmentの `instructions.md` を正本とし、役割・承認・権限の条件を併せて守る。

# 工程5: 検証

- 工程4の`詳細設計・実装`を終えて本工程に到達しているはず。
- 本工程では、システムの動作確認を行う。

## 本工程のゴール

- 動作確認表が正しく作成され、main へ統合したコミットでの動作確認結果がすべてクリアされ、`scaffold_epic_complete` で `Epic Issue` が閉じていること。

## 実施内容

順番を守る。合格していないものは main に入れない。

1. `Epic Issue`の内容をもとに、動作確認計画を立てる。動作確認事項のリストはチェックボックスにする。プロジェクトの案内（`AGENTS.md`）が通し確認の手順と合否基準を示していれば、そのチェックリストを動作確認表にする（例：Roblox Roguelite Factory のゲームなら AI 自動試遊の合否基準）。
2. **Epic のブランチの先端で、全項目を確認する。** 本数を減らさない。Roblox Studio はランナーだけが操作する（`references/implementation.md` の「Roblox Studio の操作」）。
   - 流用：Epic のブランチの先端が、最後の Wave の通し確認 Feature（`references/basic-design.md`）が最後に合格したときと同じコミットなら、その合格の結果（証拠の場所とコミット）を流用してよい。コミットが違えば流用しない。
   - 見積もり（仮置き）：AI 自動試遊を全本数（固定10＋ランダム50 を PC とエミュレーターで）行うと1回約30時間かかる。手順2と手順6で2回行うので、合計約60時間を見込む（手順2を流用できれば約30時間）。
3. **公開前監査（1回目）を受ける。** プロジェクトの案内が公開前の監査を求めていれば、書いた本人ではない担当に監査させる。案内が指定する担当（例：`director`）が pi に無いときは、備え付けの `reviewer`（pi-subagents）に、その担当の定義ファイルと監査の資料のパス、証拠の場所を渡して使う。この回で対象外とする項目（例：Creator Hub の設定）は案内に従い、対象外と明記する。
   - UI/UX の監査：案内が UI/UX の担当（例：`rbx-uiux-designer`）の監査も求めていれば、同じ `reviewer` に、その担当の定義ファイルと資料のパスも渡す。この回は、機械で判定できる指標（例：`ui_defects`・`input_feedback`）で判定させる。reviewer は動画を見られないので、見た目の確認は未検証として監査結果に書く。
   - 監査結果は、案内が示す長期保存先と、Epic（管理ブロックの外への追記）に残す。
4. **不合格や監査の指摘（阻害・重大）があれば、本工程の中で直す。**
   - 実装工程へは戻れない（Epic の工程は戻せず、`scaffold_handoff_implementation` は基本設計からしか動かない）。検証の親が、最後の Wave の通し確認 Feature（`references/basic-design.md`）の `coding-manager` を `context: fresh` と Feature 指定のモデル・thinking、`timeoutMs: 259200000`（72時間。仮置き。`references/implementation.md` の「長い通し確認の manager の期限」）で起こし、その Feature の目的・`editScope` の範囲で直させる。coder・tester の起動と Task の作成は manager が行う（`references/implementation.md` と同じ規則）。
   - 修正は Epic のブランチから切ったブランチで行い、検証に合格してから Epic のブランチへ統合する。閉じた Feature に追記するときは管理ブロックの外へ `gh_issue_edit_if_current` で書く。Projects は操作しない。
   - 修正で影響を受けた Feature の受け入れ要件の証拠を、修正後の ref で取り直す。
   - 範囲（承認済みの仕様・基本設計、Feature の `editScope`）を超える修正が要るときは、その部分を止めて最終報告に書く。
   - 直したら手順2からやり直す（全項目・全本数）。
5. **合格したら main へ統合する。** Epic のブランチのまだ main に入っていない分を、親が `git merge --no-ff` で main へマージして origin の main へ push する。squash・rebase はしない（証拠の ref が main の祖先でなくなり、手順7が `REF_NOT_INTEGRATED` で止まる）。ユーザーの承認は取らない。条件（テストと型検査の合格）は Development の `instructions.md` の「Issue投稿と承認の境界」に従う。
6. **統合したコミットで、全項目を再確認する（最終証拠）。** 本数は手順2と同じ。不合格なら手順4と同じやり方で、main から切ったブランチで直し、そのブランチの先端で全項目に合格してから main へ統合し、統合したコミットで本手順をやり直す。
7. **`scaffold_epic_complete` で `Epic Issue` を閉じる。**
   - `verifiedRef` は手順6で確認した統合コミットにする。origin の既定ブランチに含まれている必要がある。手元に無ければ、親が自分で `git fetch origin` する（merge・push はしない）。fetch できなければ、その旨を最終報告に書く。
   - 最終証拠（`finalEvidenceRefs`）は全 Feature に1つずつ渡す。各レポートの `productRef`・`suiteRef` は `verifiedRef` と同じか、その祖先でなければならない。各受け入れ要件の `status` は `pass`、`exitCode` は 0（記録できる範囲は -1〜255）。Epic の要件がすべて Feature の受け入れ要件で覆われているかも、ここで再び検査される。
   - `project` は渡さない（Projects の操作は許可ファイルに無く、人の承認が要る）。
8. **完了を知らせる。** Mac の通知（`osascript -e 'display notification "Epic #<番号> が完了しました" with title "pi-scaffold"'`）と最終報告で知らせる。完了の知らせに `ask_user` は使わない。後続の作業（プロジェクトの案内にある、Issue への結果の保存や公開など）は本セッションでは行わず、人が別のセッションで始める。最終報告にその作業と入力（Epic、証拠の場所、統合コミット）を書く。

- 人にしかできない事前作業が欠けて確認が止まったときは、Mac の通知を出してから `【事前作業】` で始まる `ask_user` で依頼する。「済んだ」なら同じタブで確かめ直して再開する。「今はできない」なら Studio とその事前作業を使わない作業を先に済ませ、最終報告を書き、Mac の通知を出して止まる。同じタブに「再開」と送られたら続ける（Development の `instructions.md` の「質問と判断」）。未検証のまま完了へ進めない。
- 注意：本工程の途中で pi を終了・再起動しない。再起動すると、このセッションが受け取った引き継ぎの記録が失われ、pi-scaffold の工程の判定が効かなくなる（最終受け入れなどの内容承認に人の確認が要るようになる）。止まるときはセッションを開いたまま最終報告を書いて待つ。

## Note

- Use Computerは積極的に使ってよい
