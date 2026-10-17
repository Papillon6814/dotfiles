# Spotify UX／UIマネージャー — 検証記録

> 作成・更新：2026-10-17。出所：承認済み設計、監督経由の本人承認済み補修方針、固定架空課題、ネイティブ原本、独立レビュー。目的：共通知識と専用定義の受入れを判断します。**Task 3は改訂受入基準で合格。Task 4のmain統合・push・apply・公開・導入は未実施です。**

## 目次
1. 結論・決定事項
2. 親側ゲートとTDD
3. 追加live 5試行
4. 過去の検証と指摘対応
5. 限界・残課題・関連資料

# 1．結論・決定事項

共通スキルとPi／ClaudeのUX・UI各専用定義を作成しました。残っていた形式欠落には、指示文の追加反復ではなく、**親側の形式検査＋1回だけの補修**を実装しました。失格した実出力で不足検出・依頼生成を確認し、合格済み43件の誤差し戻しは0でした。

承認されたClaude UX microの追加5試行は、**5件とも初回で必須欄が揃い合格**でした。補修起動0回、子の起動5回です。累計152論理試行で停止します。【確度：高／固定課題の観測結果】

| 論点 | 決定 | 理由・補足 |
|---|---|---|
| 実装 | **別担当** | マネージャーは設計・レビュー・引き渡し |
| Pi子tools | **read / anchor_grep / contact_supervisor** | 親相談例外を承認済み。変更なし |
| Claude子tools | **Read / Grep / Glob** | 全5件のnative initで確認。変更なし |
| 実行経路 | **変更しない** | Claudeは既存external-cli、--no-session-persistence、resume:falseを維持 |
| 補修経路 | **正規continueを優先、未対応なら補修起動1回** | 同じ定義・同じtools。今回のClaude経路は継続非対応 |
| 補修入力 | **元入力・前回返答全文・不足欄名の3項目だけ** | 親は欄の答えを推測・追加しない |
| 失格 | **補修後の不足、既存値改変、解析不能等を採用しない** | 3回目は起動せず本人へ返す |
| 試行上限 | **152論理試行、使用152** | 今回5論理試行、子起動は最大10回の承認。実際は5回 |
| 受入れ | **Task 3合格** | 今回承認された「必須欄5/5、補修後も可」という基準。実際は初回5/5 |
| Task 4 | **未実施** | main統合・push・apply・公開・導入を行わず停止 |

# 2．親側ゲートとTDD

実装commit：`0a215b1`。子定義の本文・tools、認証・モデル・MCP・Profile・グローバル指示は変更していません。共有スキルの親手順とcontracts.mdへ方針を追加しました。

親の入口は`tests/spotify_design_output_checks.py`の`assess_parent_reply`です。`python3 tests/spotify_design_output_checks.py --parent-check`へJSONをstdinで渡しても使えます。通常の評価起動では`--parent-contract-gate`で有効化します。子へのPython・シェル追加ではありません。

| 対象 | 検査 |
|---|---|
| 外側 | unverified、handoff、findingsの存在・型 |
| finding | finding_id／target／observation／impact／priority／evidence_status／basis／change／acceptanceの9欄 |
| 複合欄 | handoffの3配列、priorityのlevel・reason、basisのID・年次・区分・scope、acceptanceの4欄 |
| 補修後 | 上記に加え、既存JSON値・finding順序・件数の保持。依頼外の追加を拒否 |
| 対象外 | task_mode=designをレビューJSON欠落と誤判定しない |

初回の不足は、機械生成した欄名だけを指定して1回補修します。渡すデータは`original_input`／`previous_response`／`missing_fields`。依頼文は「前回の返答を保ったまま、欠けた欄だけを補った完全な JSON を返す」です。今回のClaude経路では公開RPCのspawnを同一定義・同一toolsで使います。正規resume可能なruntimeでは公開resumeを優先します。経路失敗を別CLIや権限拡大で回避しません。

## モデルを呼ばないRED→GREEN

失格原本run `a8ffddd2-a777-4baa-8341-8b819cf48968`を改変せず使用しました。必要な部分は追試可能な自作課題のfixtureとして保持しています。

検出結果：

```text
unverified
handoff
findings[0].change
findings[0].acceptance
```

- `parent-gate-red.log`：親向けAPIがない状態で失敗。
- `parent-gate-green.log`：実原本の不足検出と3項目だけの補修依頼生成、既存値保持を確認。
- `parent-orchestrator-red.log`→`parent-orchestrator-green.log`：親の実検査器・経路選択・1回上限を確認。遅いnative/model境界だけを置き換え、実Python検査器を呼びました。
- 合格済み43件：39レビューJSONをaccept、4設計出力をnot-applicableとして、誤差し戻し0。元の出力hashも照合。
- 補修後も不足、既存の観察の書き換え、finding追加はreject。再補修依頼なし。
- 全体suite：**105 tests、失敗0、既存live gate 5件skip**。この検証でモデル呼出しは0です。

ログは`.superpowers/sdd/2026-10-17-spotify-design-managers/`以下です。過去の失格原本はそのまま失格として保持し、今回の合格回答へ差し替えません。

# 3．追加live 5試行

原本：`work/spotify-design-validation/claude-ux-micro-parentgate-20261017k/`。

| 論理試行 | exact run | 初回 | 補修回数 | 最終 |
|---|---|---|---|---|
| 0 | 4be9c93e-17ca-4128-ada1-a76b53d00a59 | 合格 | 0 | 合格 |
| 1 | de0e159c-b249-4f62-a420-722688b14fb9 | 合格 | 0 | 合格 |
| 2 | 86fa188c-b44f-4d6e-9e14-329b5f62d07d | 合格 | 0 | 合格 |
| 3 | 5638f0b1-e580-4647-b219-e8b951680e6f | 合格 | 0 | 合格 |
| 4 | dcfa2119-967a-4e45-ab21-1fcb3f142aa1 | 合格 | 0 | 合格 |

全5件で公開RPC経由の成功・process-terminal observed、Read/Grep/Globの3tools、必須資料の読込、範囲監査を確認しました。親の必須欄ゲートだけでなく、既存の出典年次・区分等の`review_errors`も全5件で0でした。親は全5件の観察・修正案を読解しました。

**補修経路は今回のliveでは発動していません。** 実際にモデルが補修できたとは主張しません。実原本による検出・依頼生成と、モデルなしの補修成功／再失格分岐は検証済みです。受入基準は本人承認済みの追加5試行によります。

## 起動数とusage

- 今回：論理5、子起動5（最大10）、補修0、補修後合格0、初回合格5。
- 子のClaude usage合計：input_tokens 20、output_tokens 25,900、cache_creation_input_tokens 98,409、cache_read_input_tokens 52,238。
- 親のassistantメッセージ4、tokens合計3,988。完了通知への応答を含みます。親モデル0とは報告しません。
- これらはnative metadata上の計数で、論理試行数や実請求額と同一ではありません。

`contract-gate.json`に判定・run ID・子別usage、`summary.json`に親usage、`acceptance.json`に受入れ集計を保存しました。初回・補修の原文は別artifactに残す実装です。生session・OAuth・画像base64は公開しません。

# 4．過去の検証と指摘対応

旧評価を遡って合格にしません。今回より前は147論理試行でした：baseline20、初回treatment20、修正後micro20（形式17/20）、旧シナリオ21（正常19・タイムアウト2）、追加44（内容42/44）、追加Claude22（内容21/22）。今回5で152です。モデル0の起動前設定失敗は別記しています。

独立レビューworkflow `cbe3533b-ffb0-42cd-8ccb-afe2bafb1f10`／child `625640c3-a356-4e6f-8cab-7d7f69b4fc1a`の当時の判定はNot readyです。最新変更への独立レビュー合格を取得したとは報告しません。今回の指示に従い追加の子レビューは起動していません。

| 重要指摘・旧失敗 | 対応 |
|---|---|
| 親相談を返信せずタイムアウト | SDK親の正規subagent_supervisor返信receiptと回収を先行4件確認。停止受付を終端としない |
| 検索範囲・Claude混入が未監査 | Read/readに加えGrep/Glob/anchor_grepを監査。実パス・symlink・pattern、固定catalogを検査 |
| C3の画像・通常仕様不一致 | 学習完了用自作画像と通常仕様へ改訂。旧原本を保持 |
| Pi baselineの2tools宣言とvalidator3tools | 自動追加を確認しcontrolを3toolsへ明示。旧対照の全実効tools未観測という限界を保持 |
| 出典結合・必須欄欠落 | 出典ごとの完成例、提出前確認に加え、今回親のゲート・1回補修を追加 |
| 接続断→未変更という断定 | 未送信・確定拒否・結果不明・確定成功を区別。送信後の応答消失条件を追加 |
| Claudeの状態網羅・日本語本文 | Claude2定義の提出前確認を補強し、前段22試行で対象の改善を確認 |

旧資料・評価一覧は`claude-adapterfix-final-assessment.json`、`reviewfix-final-assessment-v2.json`等に保持します。未変更Pi22と旧Claude評価の異なる版・未使用definition hash差分を記録済みで、最新版全体を44件fresh検証したとは扱いません。今回の合格は**親側ゲート導入後のClaude UX micro 5件という改訂受入基準**に限定します。

# 5．限界・残課題・関連資料

- 形式の合格は意味・実装・実ユーザー成果の合格ではありません。実機a11y、APIの照合・冪等性、全Profile運用は未検証です。
- 読込trace・catalog・canaryの検査は、OS全体のsandboxや未観測経路の完全な非漏洩証明ではありません。
- 実HOMEへの配置・公開は未実施です。仮HOME・対象限定source・実chezmoiによる配置検証と区別します。
- 保留（2026-10-17）：malformed source IDのTypeErrorを型ごとの失格一覧へ改善、完了通知への不要な親モデル応答抑制。今回の形式ゲートによる採用判定と混同しません。
- Task 4はmain統合・push・applyを含め未実施。今回の作業は結果とcommitの報告で停止します。

関連：[設計](superpowers/specs/2026-10-17-spotify-design-managers-design.md)、[計画](superpowers/plans/2026-10-17-spotify-design-managers.md)、[調査](../research_spotify-encore_20261017.md)。GitHub Issue案は設計書末尾にあり、外部投稿は未実施です。
