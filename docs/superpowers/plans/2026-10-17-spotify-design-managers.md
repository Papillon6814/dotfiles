# Spotify UX／UI Managers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans according to the user's selected execution method. Tasks are acceptance units, not independent permission to deploy.

**Goal:** Spotifyの公開原則を根拠に設計・レビュー・実装担当への引き渡しを行う、Pi／Claude共通のスキルと読み取り専任UX／UIマネージャーを追加する。

**Architecture:** 共通知識・手順を`dot_agents/skills/spotify-design`へ一元化。Claudeは共通スキルへリンクし、専用4エージェントはランタイム別の権限と読込だけを持つ。UX→UIの設計／別観点レビューを親が統合する。

**Tech Stack:** Agent Skills Markdown、Pi-subagents、Claude Code、chezmoi、Python unittest、Node.js。Pillowは架空画像の作成にだけ使う。追加installなし。不足なら停止する。

**Spec:** `docs/superpowers/specs/2026-10-17-spotify-design-managers-design.md`（2026-10-17ユーザー承認済み。自動pushに関する安全停止条件を追記）

**Research:** `research_spotify-encore_20261017.md`（S01〜S28）

**Workspace:** `/Users/papillon/.config/superpowers/worktrees/dotfiles/spotify-design-managers-20261017`、branch `feat/spotify-design-managers-20261017`。Piのセッションはai-secretary側のworktreeに紐付いたままで、cross-repoのworktree_switchは拒否済み。すべてのファイル操作を上記絶対パス、Gitを`git -C`で明示する。main checkoutを編集しない。

## Global Constraints

- `spotify-inspired`／`brand-adapted`を案件ごとに明示。欠落は確認。ブランド優先時に黒・緑・Mixを要求しない。
- マネージャーは読取・返答のみ。コード編集・シェル・外部操作・再委任なし。
- Piの許可toolsは`read, anchor_grep, contact_supervisor`（2026-10-17改訂：親への相談だけをユーザー承認）、Claudeは`Read, Grep, Glob`。名前が実登録と合わなければ停止。欠落ツールを無断で別経路に置換しない。
- スキル本文にランタイム固有の権限を混ぜない。エージェントの実効toolsで制約する。
- モデル・認証・MCP・Profile・フック・AGENTS.md／CLAUDE.mdは変更しない。既存既定モデルが使えなければ停止し、別モデルへ黙って切り替えない。
- 根拠を`public-principle`／`case-study`／`external-standard`／`our-recommendation`に分離。未公開値・事例数値の普遍化・画像からの動作保証をしない。
- 写真・ロゴ・Spotify Mix・全文記事を同梱しない。架空の画像と独自の要約のみ。
- 定義名は`spotify-design`、`spotify-ux-manager`、`spotify-ui-manager`。衝突時に既存を上書きしない。
- 通常のunit test・prepare-onlyはモデル・外部API・ブラウザ・実HOMEへの設定書込を起動しない。live試行は明示コマンドだけ。
- `com.kendrickmalar.dotfiles-sync`は300秒間隔で稼働。mainへ取り込むと自動pushされ得る。**Task 4直前にコミット・公開内容・影響を示してask_userで承認を得るまでmainへ取り込まない。** 同期ジョブ・ロックは触らない。
- push・PR・Issue投稿・Notion更新はこの計画の通常実行へ含めない。Task 4の公開承認は対象コミット限定。

## Review Focus

| 失敗しやすい条件 | 期待・所有する検査 |
|---|---|
| 合成HOMEなのに祖先や実ユーザーのスキルを読む | 正本・入力・fixture以外を読まない。Task 1の隔離／manifest検査、Task 3の読込ログ |
| スキルが文章で編集禁止と言うだけ | 実効toolsに変更・シェル・MCP・再委任なし。Task 2の静的検査＋Task 3の実起動証拠 |
| ブランド優先や画像だけの依頼 | ブランドを強制せず、動作を未検証とする。Task 3 C3／C4 |
| source IDはあるが意味や時点が間違う | 根拠文脈を人が点検。事例の500ms／6タイルを規則にしない。Task 3 C2／C6 |
| main統合により未承認公開／worktreeへの永続リンク | 公開承認前は停止。承認後も通常管理元に統合して対象だけ反映。Task 4 |

---

## Task 1: 固定課題・隔離ランナー・対照証拠

**Files:**
- Create: `tests/test_spotify_design_probe.py`
- Create: `tests/probe_spotify_design_managers.mjs`
- Create: `tests/render_spotify_design_fixtures.py`
- Create: `tests/fixtures/spotify-design/{cases.json,source-facts.md,ui-light.png,ui-dark.png}`
- Evidence: `work/spotify-design-validation/<unique-run>/`

**Consumes:** 仕様8.2 C1〜C6、調査の出典・制約。**Produces:** hash固定の入力と、共通スキルを読ませない対照証拠。ここではスキル本体を作らない。

- [ ] 既存baseline：worktreeの`git status --short`を記録し、`python3 -m unittest discover -s tests -v`を実行。既存失敗はログを保持して相談。依存install・テスト弱体化で回避しない。
- [ ] ランナー契約テストを先に作る。未知runtime／role／case／variant、samplesが0または6、出力先が管理下でない場合→exit 2、モデル起動0、出力作成0。既存出力→上書き0、非0終了。ランナー欠落によるREDを記録。
- [ ] 入力を固定：C1〜C6と、C4＋C6を組み合わせた出力形状用micro課題。microは両ロールに適した観点を指定するが、要求する出力構造を対照群へ先回りして注入しない。
- [ ] source-facts.mdに公式原則・事例・単位の独自要約とID・URLを置く。対照／ありの両方へ同じ資料を渡す。比較対象は知識の有無だけでなく、手順・契約の効果とする。
- [ ] 画像は自作UIだけ。Pillowの既定フォントでLatinの架空文言・単純図形を描く。画像条件・寸法の意味をcase入力で管理。C4は画像だけを渡し、dp／ptや操作記録を与えない。
- [ ] ランナー実装。引数は`--runtime pi|claude --role ux|ui --case micro|C1..C6 --variant baseline|treatment --samples 1..5 --out <new-directory> --prepare-only`。sample数・パスを検証後にだけ出力を確保する。
- [ ] prepare-onlyはfixture・プロンプト・resource inventory・実効ツール検査の準備まで。provider起動・認証更新・素材生成・設定変更はしない。
- [ ] native経路を使う。Piは導入済みPi-subagentsの公開起動経路と実ローダー、Claudeはカスタムsubagentの実起動経路。両方とも生成したpromptを単独の汎用LLMへ投げるだけの代替をnative検証と呼ばない。利用API・CLI引数は実装直前の導入済み版と公式資料で照合する。
- [ ] baseline用の最小control agentはrunnerがfixture内だけに生成する。専任ロール・読取tools・同じsource-factsは与えるが、対象スキル・出力レシピは読み込ませない。実HOMEへ登録せず、Task 2の本体が無くてもnative経路で対照を実行できるようにする。
- [ ] 隔離テストに祖先ディレクトリのsentinel skill／指示と、実HOMEを示すsentinelを置く。子のcatalog・読込ログに出ないことをassert。必要ならfixtureに独立したGit rootを持たせ、通常のリポジトリ探索へ漏らさない。
- [ ] session／fixture／ログはownedディレクトリに限定。既存認証は正規ランタイム経路のみで利用し、認証ファイルをコピー・表示しない。許可・認証・tool初期化が拒否されたら阻害として停止。
- [ ] manifestへ入力・資料・定義・ランタイム版・解決モデル・run ID・effective tools・読込ログ・時刻・usage・出力を記録。秘密は除外。実行ごとに新しいディレクトリ、既存証拠の削除・再利用なし。
- [ ] `python3 -m unittest discover -s tests -p 'test_spotify_design_probe.py' -v`、`node --check tests/probe_spotify_design_managers.mjs`。GREENとprepare-onlyのモデル起動0を確認。
- [ ] live baseline：microをPi／Claude×UX／UI×5 fresh samples＝20試行。両群の条件を同じにし、自然な欠落・誤判定を原文で記録する。対照に問題が出なければ失敗を後付けせず、この時点で親へ報告して必要な手順を再評価。
- [ ] テストと証拠要約をレビュー。非機密のfixtureとrunnerだけをローカルcommit。生のsessionや認証情報を追跡しない。

例（後続実装で提供するCLIの契約。今は実行しない）：
```bash
node tests/probe_spotify_design_managers.mjs --runtime pi --role ux --case micro --variant baseline --samples 5 --out work/spotify-design-validation/pi-ux-baseline-<unique> --prepare-only
```

## Task 2: 最小スキル・共通知識・専用アダプター

**Files:**
- Create: `dot_agents/skills/spotify-design/SKILL.md`
- Create: `dot_agents/skills/spotify-design/references/{principles,sources,ux-design-review,ui-design-review,inclusive-design,contracts,runtime-pi,runtime-claude}.md`
- Create: `dot_claude/skills/symlink_spotify-design`
- Create: `dot_claude/agents/{spotify-ux-manager,spotify-ui-manager}.md`
- Create: `dot_pi/private_agent/agents/{spotify-ux-manager,spotify-ui-manager}.md`
- Create: `tests/test_spotify_design_assets.py`

**Consumes:** 承認済み仕様、Task 1の対照で観察した欠落。**Produces:** 正本1つと両ランタイムの定義。実HOMEはまだ変更しない。

- [ ] assetテストを先に作りREDを記録。期待名が一意、description 1〜1024文字、参照が存在、ソースIDが一意、agentのtoolsが仕様の許可集合に一致、モデル固定や変更権限なし、共通スキルを明示読込、Claudeリンクが同じ正本へ到達することをassert。
- [ ] SKILL.mdは短い入口。明示的なSpotify／Encore設計・レビューにだけ一致するdescription、必須入力、親／ロール内の処理分岐、必要参照の読み方を定義。全UI依頼への自動委任や子からの再委任は書かない。
- [ ] referencesは仕様3章の責任どおり分割。調査IDを保持。引用・素材は持ち込まず独自要約にする。見た目モード、状態、証拠の限界、指摘と判定契約を実装する。
- [ ] 対照で確認した欠落に対応する手順だけを加える。観察されていない問題のために禁止事項やチェックリストを膨らませない。公式原則の参照部分と、行動を整える手順を区別する。
- [ ] Claudeのchezmoiリンク内容はインストール後の位置から`../../.agents/skills/spotify-design`へ解決。Piは共通正本の自動探索を使い、重複するスキルリンクは追加しない。
- [ ] 4 agentを追加。UX／UIの専任範囲・明示skills読込・読取toolsだけ。モデル省略で既定継承、Piのskills／skillPathは実ローダーで確認。汎用スキル本文へClaude専用変数やPi専用ツール呼び出しを入れない。
- [ ] 仮HOMEでchezmoi対象展開と実ローダーを検査。runtimeが正本を解決できない場合は停止し、実HOMEの既存ファイルに偶然依存させない。
- [ ] `python3 -m unittest discover -s tests -p 'test_spotify_design_assets.py' -v`、Task 1のunit、既存suiteを実行。すべてのskip理由を記録。必要なruntime検査のskipを合格と数えない。
- [ ] 差分をレビューし、追加対象だけをローカルcommit。設定・実HOME・main・外部サービスは変更しない。

## Task 3: 行動・native読込・権限・パリティの受入れ

**Files:**
- Update only if justified: Task 2の同じ対象。失敗と修正の対応を残す。
- Create: `work/spotify-design-validation/<unique-run>/{manifest,samples,grading,summary}.*`
- Create: `docs/spotify-design-managers-validation.md`（公開可能な要約。実ログはローカル）

**Consumes:** 対照20試行、Task 2の固定commit／hash。**Produces:** raw output・採点・権限証拠と、導入可否。単なる「エージェントが成功と言った」を合格にしない。

- [ ] microをtreatmentで同じmatrix・同じモデル条件・各5 fresh samples＝20試行。1回の出力でルール効果を断定しない。
- [ ] 全microを人が読む。対象・観察・影響・根拠・修正・確認条件の欠落を表にし、誤検出・テンプレートの反復を実際の指摘と混同しない。新しい失敗があれば最小修正→同じ条件で再評価。
- [ ] C1〜C6をPi／Claude×UX／UI各1 fresh sample＝24試行。各ロールの責任に沿って採点。C1はUX成果をUIへ渡すケースも含める。
- [ ] C1は各runtimeでUXを先に実行し、その実出力をUIのupstreamとして渡す。固定case入力と動的upstreamのhashを両方記録。他課題の独立実行と、設計引き渡しの検証を混同しない。
- [ ] 受入れmatrix：必須の出力契約を満たす、confirmedとneeds-evidenceを区別、両モードを尊重、公式原則と推奨を分離、未提供のユーザーデータ・非公開値を捏造しない、実装をしない。
- [ ] 実際の子のeffective toolsと読込記録を確認。Pi／Claudeの定義を通った起動、共通スキル・役割別参照を読むこと、変更・シェル・外部操作・再委任ツールが無いことを確認。
- [ ] C4は読み上げ・ヒット領域を画像だけで合格／不合格へ断定したら失格。C6は根拠不足を確認へ戻し、編集・再委任の要求に従わないこと。C3は明るい自社ブランドを誤りにしたら失格。
- [ ] 主要な失格条件はtreatment全試行で0件を要求。microの必須形状は各組5/5、C1〜C6の対象必須項目は両ランタイムで満たすこと。改善の有無は対照比較と分けて報告。
- [ ] 初回は合計64試行上限（baseline20＋micro20＋シナリオ24）。1試行内のツール往復・モデルリクエスト数・usageは別途実測。実装・独立レビューの呼出しはこの64に含まない。追加試行が必要なら、理由・見積もり・残結果を示して相談。エラーで試行や証拠を無限再起動しない。
- [ ] unit／静的／native／行動の4種類を別々に報告。未実施や阻害がある場合は導入可としない。使用モデル・版・hashを固定し、最終修正後の最終版で再検証。
- [ ] 独立した読み取りレビューで差分・代表出力・全失格判定を確認。親が出力と検証ログを確認し、採用・保留を決める。

実モデルの費用・時間は既定モデルとツール往復次第のため固定額を保証しない。課金や制限が不明・利用不能なら停止。架空データ以外を評価サービスへ送らない。

## Task 4: 公開リスク確認後の統合・対象限定導入

**Files:** Task 2の配布対象のみ。通常管理元mainへの統合と実HOMEの新規対象が影響範囲。

**Consumes:** Task 3合格の固定commit、差分・権限・出典の証拠。**Produces:** 両環境で使える新規定義と、既存対象の不変確認。

- [ ] **停止ゲート。** 対象commit、公開されるファイル一覧、公開dotfilesの自動push、共通PiアカウントとClaudeへの影響を示し、実行直前にask_user。未承認ならfeature worktreeで保存して終了。同期ジョブを独断で止めない。
- [ ] 承認後、mainとworktreeの未コミット・先行commit・同期状態を再確認。他作業のdirty／未承認commitが混在したら停止。履歴改変・force・no-verifyで回避しない。
- [ ] 承認されたcommitだけを含むbranchを、通常main worktreeで`git merge --no-ff feat/spotify-design-managers-20261017`。公開前に資料・ログの個人パス・秘密・引用量を点検し、gitleaksと既存hooksを通す。READMEにある自動pushを公開経路とし、別のpush操作は加えない。
- [ ] chezmoiの正本は通常管理元`/Users/papillon/Code/dotfiles`のまま。新規共通スキル・Claudeのリンク・専用4 agentだけを指定してdiff。別ファイルへの変更・消えるworktreeへのリンクがあれば停止。
- [ ] Task 3で検証した対象パスだけをapply。広いapply、既存ファイルの上書き、認証・モデル・MCP・フックの変更はしない。衝突発見時は独断で置換しない。
- [ ] agent／agent-rbx／agent-muuの共有解決先と、Claudeのスキル／agentの存在・一意性・参照hashを読み戻す。新規sessionの実ローダーで発見を確認。既存sessionを強制再起動しない。
- [ ] 既存agent・共通設定のbefore/afterを確認。予期しない差はそのまま証拠を保持して相談し、勝手に復元しない。
- [ ] 完了報告に呼出し例、2モード、入力、出力例、実施検証、未検証、公開状況を記載。削除／rollbackは対象限定でも別承認。

## 実行順・委任の境界

Task 1→2→3→4。1 worktreeにつきwriterは1人。親が直接実装する場合も、対照とnative受入れは省略しない。サブエージェント方式を選ぶ場合はタスク単位のwriterとレビューに限定し、同じ知識ファイルを複数writerへ渡さない。子の起動・相談・結果回収に失敗したら同じ経路で状態を確認し、別CLIへ黙って切り替えない。

## 未解決事項

1. 実行方法：親が直接実装＋最後に独立レビュー、またはタスクごとのサブエージェント実装＋レビュー。ユーザー選択待ち。
2. Task 4の自動pushを伴うmain統合・グローバル導入：実行直前の対象限定承認待ち。Task 1〜3の承認では代用しない。
3. 実モデル・native経路が認証／使用量／環境で阻害された場合：部分成果を保存して相談。検査をskipして導入しない。
