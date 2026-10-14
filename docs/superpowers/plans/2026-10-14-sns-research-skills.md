# Research SNS設計3スキル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. 本人が実行方法を選び、計画を承認してから着手します。

**Goal:** ジャンルを問わないSNSの出口設計・ディレクション・AI制約の3スキルをResearch専用に作ります。
**Architecture:** 3スキルを独立した手順と成果物に分け、必要時に連携します。②は既存 `sns-account-concept` を点検に使います。Profileの入口だけを更新し、既存基準・pif・稼働設定を維持します。
**Tech Stack:** Markdown、Agent Skills frontmatter、Python unittest、導入済みPi SDK／モデル。依存の追加なし。
**Spec:** `docs/superpowers/specs/2026-10-14-sns-research-skills-design.md`（176行、2026-10-14本人承認）。

## Global Constraints

- 対象：ジャンルを問わないSNS全般。保存先：PiのResearch Profile。
- 編集root：`/Users/papillon/.config/superpowers/worktrees/dotfiles/sns-research-skills`。ブランチ：`feat/sns-research-skills`。以下の相対パスはこのroot基準。別repoへのPi切替が拒否されたため、了承済みの絶対パス操作を使います。
- Profile正本 `P = dot_pi/private_agent/profiles/research`。各 `skills/<name>/` は `SKILL.md`、`references/checklist.md`、`assets/output-template.md` の3ファイル。
- `sns-account-concept` 本体・基準、`profile.json`、共通AGENTS、モデル・認証・パッケージ設定、pifは変更しません。
- 調査・設計・判定まで。投稿・契約・購入・アカウント作成・設定変更は含めません。
- 出典・調査日・確度・適用範囲を残す。数値・利用条件・モデル性能は未確認なら未確認。過去の投稿・自動DM提案を現在の操作許可にしません。
- 新規依存・有料素材生成・本番操作・main取り込み・稼働Profile反映・pushは行いません。
- タスクごとに検証し、終わるまで次のスキルを作りません。手順の実モデル検証と静的・SDK検証を別々に報告します。

## Review Focus

1. 単価・転換率・案件条件の欠落 → 売上や利用許可を創作しない（Task 1）。
2. 非販売目的／参考アカウント分析 → 収益導線や新規ディレクションを強制しない（Task 2、4）。
3. API存在とアカウント利用資格の違い、再生成費 → 条件・総費用を分ける（Task 3）。
4. 参照資料欠落／連携途中の停止 → 点検・総合判定を完了扱いにしない（Task 2、4）。
5. Profile外への漏れ／証拠の陳腐化 → 実loader・実sessionとファイルhashで確認する（Task 1〜4）。

## 共通の検証手順

- 構造テスト：`tests/test_research_sns_design_skills.py` の `ResearchSnsDesignSkillTests`。既存テストと同じPi実 `loadSkills({cwd, agentDir, includeDefaults:false, skillPaths})` を使います。返値のname、description、filePath/baseDir、diagnostics、参照資料の可読性を検査します。
- 実モデル試行：`tests/probe_research_sns_design.mjs` を新設。導入済みPiの `docs/sdk.md` と関連の読み取り・skill loading例を全文確認してから、公開SDKで実装します。CLI：`node tests/probe_research_sns_design.mjs --case <monetization|direction|feasibility|routing> --variant <baseline|treatment> --out <worktree内の証拠ディレクトリ>`。
- 試行モデル：既存Researchの `openai-codex/gpt-6.1-sol`、thinking `medium`。利用可否を確認し、利用不能なら無断でモデルや経路を変更せず停止・相談します。新規認証はしません。
- 合成入力だけを使用。モデル試行は読み取り専用ツールに限定。独立した各試行のセッション・成果は作業用 `work/sns-design-evidence/` に保存し、raw出力は自動stageしません。
- 各スキルの同一ケースを、ガイダンスなし／全文ガイダンスありで各5回。基準対照の実出力を読む→最小手順を書く→同じ入力で確認。文言修正ならtreatmentを再実行。両群で失敗がない場合は、改善効果を証明したと書きません。
- summary JSONはmodel、case、variant、samples（input・output・stopReason・確認項目と理由）、skill/reference/instructionsのsha256を持ちます。自動の文字列一致だけで合格にせず、親が全出力を確認します。
- 共通成果物の型：重要な問い／入力と既決事項／決定表／担当固有の表／事実・仮説・未確認／判定と理由／検証・次の担当への条件／出典。ResearchのJSONロジックツリーへ根拠を接続。外部保存は別承認。

## Task 1：① 出口設計

**Files:** Create `P/skills/sns-monetization-design/{SKILL.md,references/checklist.md,assets/output-template.md}`、上記テストとモデルprobe。
**Interfaces:** 入力は目的・対象・媒体・既存資料・発信資源・予算。出力は導線図、候補比較、採算式、段階別計測、試行条件、未確認、②③への条件。

- [ ] テストを先に追加。`test_monetization_resource` はname一致、description非空、診断 `[]`、参照・雛形を実際に読めること。`test_monetization_absent_from_common_root` は共通rootにnameがないこと。
- [ ] `python3 tests/test_research_sns_design_skills.py ResearchSnsDesignSkillTests.test_monetization_resource -v` → スキル未作成でFAILを記録。
- [ ] probeを作成しbaselineを実行。入力は「TikTok・Instagramから事業者へ送客。単価・移行率・SNS掲載可否は未確認。売上を推測で確定しない」＋「LPを挟めばSNS不可案件を扱えるとする誘惑」。出力と失敗・限界を記録。
- [ ] スキル3ファイルを作成。新規／見直し／参考分析、直接／複数媒体の比較、成果地点・確定条件、各段階の離脱・計測、採算の仮説を手順と雛形に反映。出典には既存送客・計測知見を適用範囲付きで置く。
- [ ] 構造テストGREENとtreatmentを実行。5件すべてで仮説表示、条件未確認、複数候補、計測の分離を確認。未知値0埋め・架空売上・LPによる条件回避があれば修正して再検証。
- [ ] 差分と証拠を確認し、このタスクの対象だけローカルfeature commit。AI帰属行なし。pushしない。

## Task 2：② ディレクション

**Files:** Create `P/skills/sns-account-direction/{SKILL.md,references/checklist.md,assets/output-template.md}`。Modify テスト・probe。
**Interfaces:** ①の既存成果があれば入力に使う。出力はディレクションシート、プロフィール・具体案、既存コンセプト点検、③への品質・頻度要件。

- [ ] `test_direction_resource_and_existing_checker` を追加。name／診断／参照可読性に加え、スキルrootから `../sns-account-concept/SKILL.md` と `../sns-account-concept/references/checklist.md` が実在・可読であることをassert。
- [ ] テストREDとbaseline。「販売しない地域紹介アカウント」「送客目的のアカウント」の2条件を同じ入力に含め、目的別の違い・具体的世界観・見た目・語り口・投稿方針・架空実績の回避を確認。
- [ ] スキル3ファイルを作成。既存10項目は複製せず、具体案を作って既存スキルの見直しモードで点検。投稿ネタ10件・代表案3件の意味は既存基準に合わせる。参考アカウントの概念分析は既存スキルへ渡す。
- [ ] 連携先が読込不能なら、設計の部分成果と点検未実施を分ける手順を明示。`test_missing_checker_fixture` は隔離fixtureで参照欠落を検出し、実ファイルを削除しない。
- [ ] 構造テストGREENとtreatment。非販売目的の導線強制なし、具体的な表現方針、既存基準の読込み・点検、作られた体験・実績なしを5件確認。参照欠落時の負ケースも1件試行。
- [ ] `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_research_sns_account_concept.py' -v`。構造回帰成功と未提供モデル証拠のskipを区別。対象限定のローカルcommit。

## Task 3：③ AI実現制約

**Files:** Create `P/skills/sns-ai-feasibility/{SKILL.md,references/checklist.md,assets/output-template.md}`。Modify テスト・probe。
**Interfaces:** 必要な品質・頻度・予算・人の時間・環境条件を入力。出力は制約表、工程別の方法、人の作業、費用・工数、検証と①②への修正条件。

- [ ] `test_feasibility_resource` を追加しRED。name／診断／参照／雛形の可読性をassert。
- [ ] baseline。「日本語テロップ、同じAIキャラの動画を高頻度で作り、未知のAPI資格で自動投稿。低予算。音声権利とモデル性能は未確認」のケースを5回。コストは生成成功分だけでなく不採用・検品・修正を含むか確認。
- [ ] スキル3ファイルを作成。技術／規約／権利／実利用条件／総費用／人の作業を分け、4状態と全体3判定を仕様どおり明示。既存文字合成・キャラ一貫性・公開経路の知見を、媒体・モデル・環境限定と再確認方法付きで記載。
- [ ] 構造テストGREENとtreatment。未確認を可能へ格上げせず、代替案・総費用・人の承認・小規模試験の合格基準を5件確認。安全な静止画案への見直し要求を①②へ返せることを確認。
- [ ] 3スキルの対象限定テストを実行し、差分確認後ローカルcommit。

## Task 4：Researchの入口・連携・最終検証

**Files:** Modify `P/instructions.md`、テスト・probe。Create `docs/superpowers/verification/2026-10-14-sns-research-skills.md`。
**Interfaces:** 各スキルを単独で呼べる。全体依頼は①→②→既存点検→③から見直し。既知の致命制約なら③を先に扱う。既決事項・未確認・根拠を後続へ渡す。

- [ ] `test_all_three_discoverable_only_in_research`：Research loader結果に3nameが各1回、診断なし。共通rootに3nameなし。
- [ ] `test_existing_checker_and_profile_config_unchanged`：既存スキル2ファイルと `profile.json` のbytesが開始ref `8ad9116` と一致。`test_route_instructions` は3用途と既存分析・一般調査の分岐、既存モデル指定不変を文書契約として確認。文書assertを実動作証明とは呼ばない。
- [ ] 未接続の入口テストREDを記録し、`instructions.md` に用途別の入口と全体連携を追加。既存分析モードは維持する。
- [ ] SDK実sessionで `routing` probe：出口のみ／ディレクションのみ／制約のみ／全体／一般技術質問／参考アカウント概念分析を各1回。ガイダンス本文を直接注入せず、実際の読込パスと出力を記録。一般技術で3新スキルを読まず、参考分析は既存に進むこと。
- [ ] 統合ケースを1回：③で動画制作が未確認→②を静止画主体へ修正→①の費用・頻度仮説を更新。媒体・収益先の決定事項、未確認、出典が維持されること。
- [ ] `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v`、`git diff --check`。全結果・skip・未確認を報告。新たな失敗があれば原因を調べ、無関係な設定の修正やskipで回避しない。
- [ ] 実行方法に応じた独立レビューを回収し、親が差分・証拠・レビュー結果を確認。全文を実system promptへ追加していないこと、認証・共通設定・pif不変も確認。
- [ ] 検証資料にコマンド、モデル・5回比較、出力の要点、hash、取得範囲、修正・未実施を記録。証拠を第三者へ送らない。対象だけcommit。
- [ ] 本人へ変更内容と実証拠を提示。稼働Researchへの反映承認を得るまで、mainへの取り込み・対象配置・symlink切替はしない。

## 残論点

- 本計画の確認と実行方法：親が実装＋最後の独立レビュー／タスクごとの担当子＋レビュー。
- 既存モデルが利用不能な場合の検証経路（利用不能時のみ相談）。
- 完成後の稼働Researchへの取り込み・配置範囲（完成後に別承認）。
