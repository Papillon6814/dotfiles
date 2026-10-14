# Research SNS設計3スキル：検証記録

> 作成日／最終更新：2026-10-14。出所：dotfiles専用worktreeの実テスト・合成ケースのPi SDK試行。
> 目的：リソース発見、3手順の出力、用途別の読込みを確認します。稼働Profileへの配置・本番SNSの動作証明ではありません。

## 目次
1. 結論と変更範囲
2. 実行条件・出力
3. 実モデルの比較
4. 用途別読込み・統合
5. 失敗・修正・限界
6. 判定・次のアクション

## 1．結論と変更範囲

Research専用に① `sns-monetization-design`、② `sns-account-direction`、③ `sns-ai-feasibility` を作成しました。入口は用途別に読ませます。既存 `sns-account-concept` の基準・本体と `profile.json` は開始ref `8ad9116` とbytes一致です。

| 論点 | 決定・実施状態 | 理由 |
|---|---|---|
| 配置 | **dotfiles feature worktree内だけ** | 稼働反映は別承認。main・既存symlink未変更 |
| 判定 | **構造・合成入力の手順／読込みを検証** | 本番アカウントの運用成功や未来のモデル遵守は保証しない |
| 個別基準 | **既存の正本を維持** | ②から既存見直しモードで点検 |
| 外部操作 | **未実施** | 生成、投稿、契約、購入、Notion保存、認証変更、pushなし |

## 2．実行条件・出力

作業先：`~/.config/superpowers/worktrees/dotfiles/sns-research-skills`、branch `feat/sns-research-skills`。
モデル：`openai-codex/gpt-6.1-sol`、thinking `medium`。導入済みPi公開SDK、ModelRuntime、in-memory session/settings、拡張なし、readのみ。

```bash
SNS_DESIGN_ROUTING_EVIDENCE_DIR=work/sns-design-evidence/routing-final \
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
```

実出力：
```text
Ran 50 tests in 24.192s
OK (skipped=4)
```

46件成功。skipは既存 `test_research_sns_account_concept.py` の専用モデル証拠未提供4件。今回の新しいrouting・既存分析ケースは別probeで実行済みですが、旧テスト専用JSONの代わりとして注入していません。
`git diff --check`：出力なし、exit 0。新設スキルは実 `loadSkills` でname・description・参照・雛形の可読性・診断なし・Research限定の配置を確認。

## 3．実モデルの比較

証拠root：作業先の `work/sns-design-evidence/`。生出力は合成入力とread記録を含み、Gitにはstageしません。必要な証拠は原ディレクトリに保全します。

| スキル | 対照の成功5件 | 新手順の成功5件 | 観測した差と限界 |
|---|---|---|---|
| ① | `monetization-baseline` | `monetization-treatment-retry` | 対照5件は出口だけの依頼にコンセプト10項目・投稿10ネタ・代表3案まで生成。新手順5件は出口・採算・計測・引渡しに限定。未知の単価・利用許可を創作しない点は対照でも成立 |
| ② | `direction-baseline` の0/1/2/4＋`direction-baseline-supplement` | `direction-treatment` | 新手順5件は具体的視覚・語り口、非販売Aと送客B、既存10項目、各10ネタ・3案、③への品質を返す。共有／個別の時間解釈を両方残す。読者価値と点検自体は対照でも成立 |
| ③ | `feasibility-baseline` の0/2/3/4＋`feasibility-baseline-supplement` | `feasibility-treatment` | 新手順5件は要件4状態、全体3判定、工程・人手・総費用、母数と条件付き試験、①②への変更提案をそろえる。未知の性能・権利を可能扱いしない点は対照でも成立 |

親が全成功出力を読みました。改善効果の一般的な因果証明ではなく、出力契約と合成入力での遵守を確認した結果です。

②の欠落テスト：`direction-missing-retry`。同じworktree内のfixtureへ②だけを複製し、既存基準は置かずに実施。実ENOENT後、「点検未実施」、設計部分成果、欠落2パス、再開方法を返しました。実基準は削除していません。これは不足資料時の手順試行であり、FS全域へのアクセス拒否ガードの証明ではありません。

## 4．用途別読込み・統合

`routing-final`：実SDKセッション7件、本文ガイダンスの直接注入なし。ProfileのinstructionsとSKILLカタログを提示し、モデルがreadで本文・資料を取得しました。

| ケース | 結果 |
|---|---|
| 出口のみ | ①と参照・雛形を読込。世界観・投稿案の過剰生成なし |
| ディレクションのみ | ②と既存点検を読込。非販売図解案、10ネタ・3案、既存10項目と不足を記載 |
| AI制約のみ | ③を読込。31日予算超過、権利・本人資格・品質未確認、代替と試験条件 |
| 全体 | ①②③＋既存点検を読込。具体案と採算・制約・保留条件を統合 |
| 一般技術 | map／forEachの説明。read 0件、SNSスキル未読 |
| 参考概念分析 | 既存スキルと基準だけ。対象別10項目の5列。自作案・内部売上の創作なし |
| 再開・統合 | ③の予算超過から②の静止画・無音・週1案と①の費用・頻度仮説を見直し。媒体・販売先・予算・時間・未確認を維持。変更は提案として残す |

reader経路・instructionとリソースhashはsummaryに記録し、テストで現在bytesとの一致を確認します。最終7件も親が全文読みました。分担・本番情報取得は合成入力で禁止しており、実manager／子の協働を検証したわけではありません。

## 5．失敗・修正・限界

| 記録 | 実際の失敗と扱い |
|---|---|
| 初期probe | 手書きのモデル確認コマンド構文エラー、旧AuthStorage非export。現行公式SDK例のModelRuntimeに修正。実モデルの成功証拠にしない |
| ①並列 | `monetization-treatment` 1/5 error、4成功。詳細未保存で原因は確認不能。保全して逐次5件の新規試行を実施。並列の安全性を証明した扱いにしない |
| ②対照・欠落 | 各1件Codexリクエスト処理error。詳細と部分記録を保全。同じSDK・モデル・入力で各1件補充 |
| ③対照 | 1件WebSocket error・途中出力。保全、同じ経路で1件補充 |
| 初期routing | `routing-baseline-instructions` 技術質問が新3スキルを含む全スキルを読込、consumerテストFAIL。入口更新後 `routing-treatment` 7件成功、一般技術0readでGREEN |
| routing入力 | 「生成禁止」が投稿案の文章具体化まで禁止と解釈された。「画像動画音声の素材生成禁止」と明確化し、`routing-final` 全7件を再試行。旧証拠は経路確認に限定 |

判定・運用上の決定：
- 現行SDKのModelRuntimeを使う。モデル・認証を差し替えない。
- 並列化で1件失敗したため以降逐次。失敗も保全し成功数だけで安定性を主張しない。
- retryは同じSDK・モデル・入力の新規証拠ディレクトリへ。失敗原本は消さない。
- 評価入力の誤制約は明確化し再実行。スキル本体の成功と混同しない。

未検証：稼働Researchへの配置・/reload、新規Profile選択UI、manager→子への実読込み、実SNS・契約条件、API資格、有料生成・品質、投稿・計測E2E。

## 6．判定・次のアクション

| できていること | できていないこと |
|---|---|
| 3スキル、既存点検との接続、用途別入口、SDK構造・実モデル合成入力試行 | 独立レビューの終端結果、稼働反映の本人承認・配置・確認 |

> 判定：△ worktreeでの検証段階です。Researchへ導入済みとは報告しません。

- [ ] 独立レビューを回収し、重要な指摘を修正・再検証する。
- [ ] 本人へ実証拠・差分と未検証を提示する。
- [ ] 稼働反映は別承認。main取り込み・対象限定配置・Researchでの読込み確認の範囲を決める。
- 意図的保留（2026-10-14）：push、全体chezmoi apply、本番SNS・課金・Notion保存。
