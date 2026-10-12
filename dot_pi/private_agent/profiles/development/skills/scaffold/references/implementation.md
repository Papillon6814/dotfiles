※ この文書はscaffoldスキルの一部であり、説明資料ではなく今回の工程で従う手順書である。scaffoldで工程を確認してから全文読む。共通規律はDevelopmentの `instructions.md` を正本とし、役割・承認・権限の条件を併せて守る。

# 工程4: 詳細設計・実装

## 本工程について

- 工程3の`基本設計`を終えて本工程に到達しているはず。
- scaffoldにおいては`Epic Issue`、そして`Feature Issue`を仕様の正本として扱う。
- 本工程では、策定された仕様を基に、システムの詳細設計と実装を行う。

## 本工程のゴール

- `scaffold_handoff_verification`が正しく実行され、次の工程「`検証`」用のセッションが別タブで開始したことをもって本工程のクリアとする。

## 実施内容

1. 基本設計、Feature受け入れ要件、依存計画、並列実行計画が揃い、実装開始指示を受けたら先行初期setup Taskから着手する。後続の機能実装はsetupの適用・検証完了後に開始する。
2. 並列実行計画に則って実装を進める。1つの`Feature Issue`につき1人の`coding-manager`を割り当て、並列で開発作業を進める。
3. 各`coding-manager`は担当`Feature Issue`に詳細設計を追加コメントし、`Task Issue`へ分解する。
4. コード実装・修正は`coder`へ、独立検証は`tester`へ委任する。テスト追加はtesterの明示許可範囲に限り、製品コードや期待値の変更権限を与えない。
5. 該当Wave内の`Feature Issue`がすべて完了になったら、次のWaveへと進む。最後の Wave の通し確認 Feature（`references/basic-design.md`）は、ほかの Feature をすべて Epic へ統合した後、Epic のブランチで全項目を通す。この Feature の manager は `timeoutMs: 259200000`（72時間。仮置き）を渡して起動する（下の「長い通し確認の manager の期限」）。不合格なら同じ Feature の中で直し、影響を受けた Feature の証拠も取り直す。
6. すべての`Feature Issue`が完了したら、`Epic Issue`はそのまま、`scaffold_handoff_verification`コマンドを実行する。正常に実行されれば、次の工程「`検証`」へと移る。

既存の能力・同時実行数・深度・累積起動数の上限内で最大限並列化する。着手条件・編集競合を確認し、独立Taskを原則並列割当する。全員の終了を不要に待たず、空いた枠と後続条件を再評価する。

## 詳細設計・実装セッション

- 承認済み仕様と基本設計・Feature受け入れ要件が揃い、ユーザーの実装開始指示を受けてから開始する。
- 親はユーザー対応、承認管理、Feature間の調整、Epicへの統合、最終受け入れを担当する。
- managerは担当Featureに詳細設計を記載し、Taskへ分解する。承認範囲内の詳細設計・Task分解はmanagerに委ね、個別ユーザー承認を必須にしない。
- managerは担当Featureの詳細設計追記、配下Taskの作成・本文更新・親子/依存関係設定を直接行い（Projects は操作しない。Development の `instructions.md` の「Issue投稿と承認の境界」）、親へ結果と証拠を報告する。
- 各Taskには目的、担当編集範囲、対象外、親Feature、Feature要件との対応、依存関係、成果物単位の着手条件、実際のcoder/testerモデル・thinking・理由、個別受け入れ要件・検証方法・期待結果を記載する。設計資料とmanagerは親Featureを参照する。
- 製品コード実装・修正はcoderへ、独立検証はtesterへ委任する。coder/testerは再委任しない。テスト追加はtesterの明示許可範囲に限り、製品コードや期待値の変更権限を与えない。
- manager/coder/testerは起動時に`context: fresh`と指定モデル・thinkingを明示する。定義のdefaultだけで保証したと扱わない。必要なIssue・設計版・対象ref・制約を明示して渡す。
- 既存の能力・同時実行数・深度・累積起動数の上限内で最大限並列化する。着手条件・編集競合を確認し、独立Taskを原則並列割当する。全員の終了を不要に待たず、空いた枠と後続条件を再評価する。
- 直列化・待機には具体的な理由と再開条件を記録する。上限変更や別経路による迂回はしない。費用/時間の見積もりと事前予算確認は必須にしないが、明示された予算・期限・利用制約を守る。
- Roblox Studio は1台の Mac で共有する資源で、`editScope` では競合を表せない。下の「Roblox Studio の操作」に従う。Studio を使わない作業（コード、Lune のテスト、check.sh）は並列でよい。
- 人の事前作業が欠けて止まったとき（Studio にログインしていない、MCP プラグインが無効、画面収録の許可が無い、キーが無いなど）：manager は人に依頼できない。親への質問として返す。親は Mac の通知を出してから `【事前作業】` で始まる `ask_user` で人に依頼する。「済んだ」なら同じタブで確かめ直して再開する。「今はできない」なら Studio とその事前作業を使わない作業を先に済ませ、最終報告を書き、Mac の通知を出して止まり、同じタブに「再開」と送られたら続ける（Development の `instructions.md` の「質問と判断」）。該当の受け入れ要件を unverified にして先へ進めない。
- 画像のアップロード（Open Cloud など、基本設計で承認した外部書き込み）：manager は、必要な画像（生成したファイルのパス、用途、名前）を親への質問として返す。親が承認された範囲でアップロードし、得た asset ID を manager の続きを起動するときの指示に入れる。coder は、その ID をプロジェクトの設定モジュール（ID をまとめて書く場所）に書く。coder・tester はアップロードしない。キーが無い・失効しているときは、人の事前作業として扱う。

### 長い通し確認の manager の期限

- pi-subagents は、単一の担当を非同期で起動すると、期限を渡さなければ30分で打ち切る（`timeoutMs` の既定。pi-subagents の `docs/tool-reference.md`）。通し確認（例：AI 自動試遊は全本数で約30時間）を担う manager は30分では終わらない。
- そのため、最後の Wave の通し確認 Feature（`references/basic-design.md`）の `coding-manager` を起動するときだけ、起動の引数に `timeoutMs: 259200000`（72時間。仮置き）を渡す。検証工程で直すために起こす manager も同じ（`references/tests.md`）。例：`subagent({ agent: "coding-manager", task: "...", context: "fresh", ..., timeoutMs: 259200000 })`。
  - `timeoutMs` は起動1回ごとの全体の期限（ミリ秒、正の整数、上限 2,147,483,647）。別名 `maxRuntimeMs` も使えるが、両方を渡すなら同じ値にする。期限が来るとその実行は終わる（再開はできない）。
  - pi-subagents の共通設定（`config.timeoutMs`）と担当定義の `timeoutMs` は変えない。ほかの manager・coder・tester は既定の30分のまま。
  - この manager が起こす coder・tester も30分の既定のままなので、30時間かかるランナーの完了を coder・tester に待たせない。manager がランナーを切り離して（例：`nohup`）起動し、終わるのを待ってから、判定コマンド（`--metric`）の実行と読み取りを tester に頼む。

### Roblox Studio の操作

- Studio を操作するのは、ゲームリポジトリの試遊用の実行スクリプト（ランナー。例：`tests/playtest/run.*`）だけである。ランナー自身が `rbx-studio-mcp` を stdio の子プロセスとして起動し、終わったら止める。親・manager・coder・tester は Studio MCP の道具を使わない。ゲームリポジトリに Studio MCP を登録しない（pi で自動起動させない設定は Development の `instructions.md` の「作業の細則」）。
- ランナーが行うこと：Studio のロックの取得・30分ごとの時刻更新（ハートビート）・解放、起動前に通信口 44755 の LISTEN が無いことの確認（`lsof -nP -iTCP:44755 -sTCP:LISTEN` が空）、全ラン（シード×端末）の実行、ログ・動画の長期保存先への書き出し、指標ごとの判定コマンド（`--metric <id>`。終了コード0が合格）の材料づくり。
- 担当（manager など）はランナーをバックグラウンドで起動し、終わったら判定コマンドの結果だけを読む。ランナーの途中の出力を会話に流さない。
- Lune の単体テストや一時の小さな確認でも、Studio を触るなら同じランナー（または同じ方式の小さなスクリプト）を通す。Studio 用の一時ファイルは `/tmp` に置かない。
- ロック：`~/.config/superpowers/studio.lock`。
  - 取り方：既にあれば失敗する作り方で新規作成する（例：`sh -c 'set -C; printf ... > ~/.config/superpowers/studio.lock'`）。作れたときだけ Studio を使う。既にあれば待ち、待機の理由と再開条件を記録する。
  - 中身：取得したセッション（herdr の agent 名）、pi の実行 ID（親ならセッション ID、サブエージェントなら pi-subagents の run ID）、PID（ランナーが書くならランナーの PID）、Feature、取得時刻。
  - 時刻更新：持っている間は30分ごとにファイルの最終更新時刻を更新する（例：`touch ~/.config/superpowers/studio.lock`）。
  - 古いロック：最終更新から2時間（仮置き）以上たち（`stat -f %m` で確かめる）、かつ中身の PID が生きていない（`kill -0 <PID>` が失敗する）ものだけを古いとみなす。消すのは親だけで、中身と持ち主の状態を確かめてから消す（基本設計で承認した例外。Development の `instructions.md` の「外部書き込みの例外」）。manager・coder・tester は他人のロックを消さない。
  - 自分（または自分が起動したランナー）が作ったロックは、終わったら消す。
- ランナーの起動前に、親が launchd（PID 1）になった孤児の `rbx-studio-mcp` が通信口を持っていれば止めてよい（`ps -o ppid= -p <PID>` が 1。基本設計で承認した例外）。親が生きているプロセス（Factory のセッションなど）の `rbx-studio-mcp` は止めない。人の事前作業が欠けたときと同じく、親が `【事前作業】` でそのセッションを閉じるよう依頼する（Factory のセッションの Studio MCP は、実装開始の前に止めておく前提）。

### 必須の先行初期setup Task

機能実装より前に、選定済みボイラープレートの導入・依存インストール・適用検証を完了する。managerは共通setupを担当する先行Feature内の最初のTaskとして扱い、全後続Feature/Taskの着手条件にする。

1. **導入元を確認する。** 基本設計で記録した言語READMEと用途別READMEを全文読み、取得ref、対象project、コピーする設定一覧、tool版、依存・command・保存先・副作用、検証条件をsetup Taskへ記載する。README参照だけで導入済みとしない。
2. **既存状態を確認する。** 既存設定・manifest/lock・symlink・Gitフックを読み、差分統合とライセンス表示の保持を計画する。既存設定を丸ごと上書きしない。同じrefの適用・依存・検証済み証拠があれば不足だけを補い、無条件の再コピー／再installはしない。
3. **setup内容の一括承認を確認する。** setup内容（対象・依存・install command・実行場所/保存先・install script等の副作用と設定変更）の承認は、基本設計の工程で人から得て、設計書と Epic（管理ブロックの外への追記）の両方に記録してある（`references/basic-design.md`）。実装工程では人に聞かない。記録された承認の範囲内の依存インストールは、確認せず実行してよい。記録が無い、または範囲外なら、managerは親への質問として返し、親はその部分を止めて最終報告に書く。
4. **設定を導入し依存をインストールする。** coderが承認範囲内の対象worktree/projectへ設定を取り込み、manifestの製品名/entry等を合わせ、READMEと選定package managerに従って実際に依存を導入する。既存lockは維持して固定installし、lock不在なら初回生成を承認内容に含める。生成lockと取得refを記録する。予定外の依存・版/source変更、保存先変更、追加build script、既存設定の上書き、global tool/OS/署名/権限変更は止めて、親への質問として返す（親は人に聞かず、その部分を止めて最終報告に書く）。Gitフック有効化も依存導入に紛れ込ませない。
5. **適用を検証する。** testerが導入設定と実効値、tool版、依存/lock、format/lint/type-check、build/testを用途別READMEと受け入れ要件に従って確認する。Swiftは実Xcode targetへのxcconfig接続、Tauriはbackendとfrontendの責務分離を確認する。必要な最小entry/実testはsetupの編集範囲へ含め、source/test/tool不足や0件testを成功にしない。不足や不合格を設定緩和・自動upgrade・ignore-exitで隠さない。
6. **完了証拠を引き継ぐ。** 適用ファイル/取得ref、実installと検証command・exit・出力、承認対象と未実施範囲をTask/Featureへ記録する。setup検証合格と上位統合後だけ後続機能Taskを開始する。未完了/ブロック中は後続を開始しない。

### 作業領域

- 1Issue=1ブランチで対応を記録する。Epic のブランチ（`epic/<Epic番号>-<slug>`）は仕様策定か基本設計で作られているので、それを使い続ける（作り直さない。無ければ止めて最終報告に書く）。Feature着手時にEpicからFeature、Task着手時にFeatureからTaskのブランチを作る。下書き投稿時点のブランチ作成は不要。
- 親はEpic・Featureの統合領域を用意する。managerは配下Taskとtester用worktreeを準備・管理する。
- コード編集前に`superpowers:using-git-worktrees`に従って隔離領域を確認/準備する。main worktreeで製品コードを編集せず、同じworktreeのwriterは1人にする。
- 既存変更・不明なworktreeを上書き/削除しない。文書のみの修正と軽微な設定変更はworktree不要。

## 検証・統合・完了判断

- testerは承認済み要件を基準に独立検証する。coderの自己評価や現在の実装挙動を正しい期待値の代用にしない。
- 検証対象refを固定し、要件IDごとの合格/不合格/未検証、コマンド、終了コード、実出力/ログを記録する。修正後は新refで再検証する。テスト追加がある場合は製品refと検証suite refを区別する。
- Task独立検証に加え、Feature/Epic統合後にも影響に応じた回帰/結合テストと必要な独立確認を行う。必須UI確認は実機経路で行い、不足は未検証とする。ブラウザ方針はグローバルAGENTS.mdに従う。
- 必須要件に不合格・未検証が残る場合は上位統合/完了にしない。テスト成功だけで仕様充足と判断しない。
- Task/Featureは上位統合と必要検証合格後に担当manager/親が自動closeする。Epicはmainマージと最終確認後に親が自動closeする。
- Issue closeやProject Done、Blockedなしを、後続の着手条件や検証合格の証拠と同一視しない。
- 承認済みの仕様・基本設計を超える変更が要るときは、その部分の作業を止め、理由と影響を最終報告に書く。人には質問しない（Development の `instructions.md` の「質問と判断」）。
- 親は報告だけで受け入れず、実差分と検証出力を確認して最終判断する。構造化acceptance-reportにはその担当の証拠義務と未完了の後続工程を分けて正直に記載する。native gate状態を人工的に成功へ書き換えない。
- 非対話managerが同ターンで子結果を消費する必要のある依存バリアには、明示許可/提供された待機工具を使う。通常の対話sessionではnative完了通知に任せる。問い合わせの反復や無限pollingで待機を代用せず、工具不足・委任/モデル/拡張初期化失敗は成果と証拠を保全して停止/相談する。別CLI・モデル・親直接実装への黙った切替をしない。
