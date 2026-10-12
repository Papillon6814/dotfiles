※ この文書はscaffoldスキルの一部であり、説明資料ではなく今回の工程で従う手順書である。scaffoldで工程を確認してから全文読む。共通規律はDevelopmentの `instructions.md` を正本とし、役割・承認・権限の条件を併せて守る。

# 工程3: 基本設計

## 本工程について

- 工程2の`仕様策定`を終えて本工程に到達しているはず。
- scaffoldにおいては`Epic Issue`を仕様の正本として扱う。
- 本工程では、策定された仕様を基に、システムの基本設計を行う。

## 本工程のゴール

- `scaffold_handoff_implementation`が正しく実行され、次の工程「`詳細設計・実装`」用のセッションが別タブで開始したことをもって本工程のクリアとする。

## 実施内容

1. `Epic Issue`を基準に下記事項を定める。`ask_user`でユーザーに質問を行う。

| 項目               | 説明                                                    |
| ------------------ | ------------------------------------------------------- |
| 言語               | 最適な言語を選定する。詳しくは[#言語の選定]を参照する。 |
| フレームワーク     | 最適なフレームワークを選定する                          |
| アーキテクチャ     | 最適なアーキテクチャを選定する                          |
| 責務・データの流れ | 必要であればデータベース設計や、API設計を行う           |
| 認証・権限         | 必要であれば、認証などの権限を事前設計する              |

2. 設計文書を`docs/spec/`に保存し、Epic ブランチにコミットして push する（[設計文書のコミット先](#設計文書のコミット先)）。`Epic Issue`へ要点・参照先を記録する。
3. `Epic Issue`を`Feature Issue`へ分解する。`Feature Issue`を作成する際は`scaffold_feature_create`コマンドで作成する。受け入れ要件をそれぞれ記録する。
4. 依存計画を作成する。作成方法は[こちら](#依存計画の作成)
5. 作成した依存計画のレビューを行う。問題があればステップ4に戻り修正を行う。問題なければ6に進む。
6. 並列実装計画を作成する。作成方法は[こちら](#並列実装計画の作成方法)。
7. すべての`Feature Issue`、依存計画、並列実装計画が完成したら`scaffold_handoff_implementation`を実行し、次の工程「`詳細設計・実装`」へと移る。

## 基本設計セッション

1. 承認済みEpicを基準に、構成・責務・データの流れと保存先・主要なデータ構造・公開API・外部接続・認証/権限・障害時挙動・技術選定を必要な範囲で設計する。既存環境と公式資料を確認する。
2. 設計文書を`docs/spec/`に保存し、Epic ブランチにコミットして push する。Epicへ要点・参照先・版を記録する。
3. EpicをFeatureへ分解し、受け入れ要件、依存関係・並列実行計画を整理する。
4. 基本設計、Feature分解、受け入れ要件・計画についてはユーザーの承認を不要とする。
5. 実装工程の先行setup Task（`references/implementation.md`）で導入するボイラープレートと依存について、対象・依存・install command・実行場所/保存先・install script等の副作用と設定変更を示し、`ask_user` でsetup内容の一括承認を得る（質問の形は下の「承認の質問の形」）。承認は、設計書と Epic（管理ブロックの外への追記）の両方に記録する。実装工程では人に質問できないので、ここで漏れなく承認を得る。
6. 人の事前作業を再確認する（下の「人の事前作業の再確認」）。
7. 実装・検証の工程で確認なしに行う操作の承認を、`ask_user` でまとめて得る（質問の形は下の「承認の質問の形」）。承認は、設計書と Epic（管理ブロックの外への追記）の両方に記録する。記録した範囲は、実装・検証の工程で確認なしに行う（Development の `instructions.md` の「外部書き込みの例外」）。
   - 外部書き込み（例：Open Cloud への画像アップロード）：対象・使うキーと置き場所・行う担当（親だけ。coder・tester は行わない）・回数の目安。
   - Studio のロックの削除：自分（または自分が起動したランナー）が作ったロックと、記録した手順（`references/implementation.md` の「Roblox Studio の操作」）で持ち主が止まっていると確かめた古いロック。
   - 孤児の `rbx-studio-mcp`（親が launchd）の停止：ランナーを起動する前に限る。
8. すべて完了したら、別の実装セッションへ引き継ぐ。

- 製品コード実装は行わない。重要な設計判断を未確定のまま実装担当へ渡さない。
- 各Featureに、目的、具体的な担当編集範囲、対象外、親Epic、承認した基本設計の版・関連資料、依存関係、識別可能な受け入れ要件と検証方法・期待結果、担当モデル・thinking・選定理由を記載する。
- 受け入れ要件には、必要な正常系・異常系・境界条件・回帰・UI確認を含める。対象外や依存がない場合も、理由付きで「なし」と明記する。架空のIssue番号や要件を補わない。

### 人の事前作業の再確認

- 仕様策定で Epic の制約に書いた人の事前作業（ログイン、プラグインの有効化、権限の許可、キーの登録など）を、記録された確かめ方（コマンド）で一つずつ確かめる。Epic の制約は本工程では書き換えない。
- 欠けていれば、本工程のうちに `ask_user` で人に作業を依頼し、終わったら確かめ直す。結果（項目、確かめたコマンド、出力の要点、日時）は設計書に書く。
- 実装・検証の工程で欠けていると分かったときは、親が `【事前作業】` の依頼で止めて再開する（Development の `instructions.md` の「質問と判断」）。未検証のまま先へ進めない。
- Roblox のゲームでは、Factory のセッションなどほかのセッションが Studio MCP を持っていないことも、実装開始の前に確かめる（`pgrep -fl rbx-studio-mcp` と親のプロセス）。持っていれば、そのセッションを閉じるよう人に依頼する。

### 承認の質問の形

- 上の手順5・7の承認は、グローバルの `~/.pi/agent/AGENTS.md` の規律（インストール・削除・外部サービス投稿は実行直前に `ask_user` で確認、lock ファイルは消さない）と衝突する。グローバルの「衝突を明示して確認する」形に従い、質問文に衝突を書いて明示の了承を得る。
- 例：「次の操作を、実装・検証の工程で確認なしに行います。グローバル AGENTS.md の『〜は実行直前に ask_user で確認』のルールと衝突しますが進めますか。対象：…／影響：…／範囲：…」。選択肢は「進める」「進めない」とし、項目ごとに分けてよい。
- 了承が無い項目は記録しない。その操作が要る作業は、実装・検証の工程で止めて最終報告に書く。

### 設計文書のコミット先

- 設計文書（`docs/spec/`）は、Epic ブランチ `epic/<Epic番号>-<slug>`（例：`epic/7-todo-cli`）にコミットし、origin へ push する。
- Epic ブランチが仕様策定で既に作られていれば、それを使う（作り直さない）。無ければ、この工程で設計文書をコミットするときに main から作る。作業は worktree で行う（例：`git worktree add -b epic/7-todo-cli ~/.config/superpowers/worktrees/<repo名>/epic-7-todo-cli main`）。main worktree で設計文書をコミットしない。
- 設計文書をコミットした後、親は Epic ブランチを `git merge --no-ff` で main へマージして push してよい。条件は Development の `instructions.md` の「Issue投稿と承認の境界」に従う。
- `scaffold_feature_create` の `designRef` と `scaffold_dependencies_apply` の `design` の `gitRef` には、Epic ブランチ上の設計文書のコミット（完全なコミットID）を渡す。ツールは、そのコミットが手元にあり、`path` のファイルの sha256 が合うことを確かめる。
- Epic ブランチは、実装工程で Feature・Task のブランチの起点と統合先になる。

### 最後の Wave の通し確認 Feature

- 全体の通し確認（例：Roblox のゲームなら AI 自動試遊。手順と合否基準はプロジェクトの案内が示す資料に従う）が要るときは、その Feature を最後の Wave に単独で置く。ほかの Feature すべてに依存させる。
- この Feature は通し確認の不合格の修正も担う。目的に「通し確認の合否基準を満たすための修正を含む」と書き、`editScope` を修正に要る範囲まで広げる（例：`src/**` と `tests/**`。広く要るなら `.`）。最後の Wave に単独で置くので、ほかの Feature と競合しない。
- 受け入れ要件には、合否基準の項目ごとに `AC###` と判定コマンド（終了コード0が合格）を書く。Epic の要件のうち通し確認で確かめるものを、この Feature の受け入れ要件で覆う。
- 修正したら、修正で影響を受けたほかの Feature の受け入れ要件も、修正後の ref で取り直す（実装工程の終わりの `scaffold_handoff_verification` は、全 Feature のレポートがそろって合格していることを求める）。
- 検証工程で不合格が出たときも、この Feature の範囲で直す（`references/tests.md`）。

### 依存計画の作成

- `scaffold_dependencies_apply`コマンドで、各`Feature Issue`を依存関係でつなぐ。`scaffold_dependencies_apply`コマンドはGithubのProject機能を利用して、依存関係図を作成する。
  - 並列作業の前提となる契約を固める
  - API、型、データ形式などを先に確定する必要があれば、それを小さな先行タスクにします。後続タスクは、その契約に対して並列で進められます。
- 仕様・受け入れ要件・着手条件の正本はIssue、担当・進捗・依存関係/並列計画の一覧は Issue の親子・依存と Wave ラベルとする（Projects は本工程でだけ更新できる。実装・検証の工程では人の承認が要るので更新しない）。EpicにはIssueリンク、先行作業、必要な成果物、着手条件、完了条件/検証、並列可能な組と制約をまとめる。投稿前は案ID、投稿後は実Issue番号・URLで対応づける。

### 言語の選定

- 言語と用途を選び、下表の言語READMEから用途別READMEを全文読み、導入するボイラープレートを確定する。基本設計では選定と導入計画を記録し、設定コピー・依存インストールは工程4の先行初期setup Taskへ引き継ぐ。

| 言語       | リポジトリ |
| ---------- | ---------- |
| TypeScript | [typescript/README.md](https://github.com/KendrickMalar/lang-boilerplates/blob/main/typescript/README.md)       |
| Rust       | [rust/README.md](https://github.com/KendrickMalar/lang-boilerplates/blob/main/rust/README.md) |
| Swift      | [swift/README.md](https://github.com/KendrickMalar/lang-boilerplates/blob/main/swift/README.md) |
| Roblox（Luau） | [roblox/README.md](https://github.com/KendrickMalar/lang-boilerplates/blob/main/roblox/README.md) |

- Roblox（Luau）は、Rojo でファイル管理するゲームに `roblox/rojo` を使う。Rokit、Apple Silicon で Wally を使う場合の Rosetta 2、Git フックの有効化は global tool・OS・Git 設定の変更を含む。対象と影響を示してこの工程で承認を得て、設計書と Epic（管理ブロックの外への追記）に記録する。実装工程では人に質問できない。
- Git フックの有効化（このMacの方式）：このMacには global の `core.hooksPath=~/.git-hooks` があり、その中の各フック（`_chain` と同じ作り）が `$(git rev-parse --git-common-dir)/hooks/<名前>` を実行できれば呼ぶ（`commit-msg` は AI 帰属行を消してから呼ぶ）。
  - ゲームリポジトリでは local の `core.hooksPath` を設定しない（設定すると global のフックが隠れる。ボイラープレートの README の `git config --local core.hooksPath .githooks` は使わない）。
  - 代わりに、`.git/hooks/<名前>`（`pre-commit` と `pre-push`）にラッパーを置き、実行権限を付ける。中身は `#!/bin/sh` と `exec sh "$(git rev-parse --show-toplevel)/.githooks/<名前>" "$@"` の2行。ラッパーは今いる worktree の `.githooks` を使う（シンボリックリンク `../../.githooks/...` は main の作業ツリーを指すので使わない）。
  - 確かめ方：`git config --show-origin --get-all core.hooksPath` が global の `~/.git-hooks` だけを示す。`git config --local --get core.hooksPath` が何も返さない（終了コード1）。`test -x "$(git rev-parse --git-common-dir)/hooks/pre-commit"`（`pre-push` も）が成功し、そのファイルに `.githooks/pre-commit` を呼ぶ `exec sh "$(git rev-parse --show-toplevel)/...` の行がある（`grep -F` で確かめる）。
- 対応表に書かれていない言語は、先にユーザーにリポジトリの作成を求め、これ以上本工程を前に進めない。

### 初期setupの設計・引き継ぎ

- ボイラープレート導入・依存インストール・適用検証を、機能実装より前の必須セットアップとして基本設計と先行Featureへ記録する。共通setupを担当するFeatureを最初のWaveに置き、後続Featureはその完了に依存させる。Taskへの分割は工程4でmanagerが行う。
- 記録する内容は、選定した用途、導入元README・取得するcommit/ref、コピー元→対象project内のコピー先、既存設定との統合差分、必要なtool版、依存とpackage manager、install command・実行場所・保存先、lockの利用／初回生成、install script・build.rs/proc macro等の副作用、適用・検証のcommandと期待結果とする。
- TypeScriptはNode/Web/libraryを区別する。TauriはRust/backendだけでfrontendは別途選定する。SwiftはmacOS/iOS・iPadOSを区別し、標準Xcode project/targetへのxcconfig接続を含める。用途が未対応なら別用途の設定を流用せず相談する。
- setup内容を親がユーザーへ提示し、対象・command・保存先・副作用を含む一括承認を得る（「承認の質問の形」に従い、グローバルの規律との衝突を書く）。承認は設計書と Epic（管理ブロックの外への追記）の両方に記録する。その同一範囲の依存インストールは直前の再確認を不要とし、承認記録を先行Feature／setup Taskへ引き継ぐ。単なる言語選択・設計承認・実装開始指示だけからインストール許可を推定しない。
- 範囲変更、予定外の依存・版／source変更、既存設定の上書き、global tool導入、OS/署名/権限変更は追加承認を得る。未承認事項や必要環境の不足はsetupのブロッカーとして記録する。

### 並列実装計画の作成方法

1. `Feature Issue`の依存と競合を別々に確認する。
   依存上は並列でも、複数タスクが同じファイルや共有状態を変更するなら衝突する可能性があります。担当範囲を分けるか、作業順を直します。

2. 実行ウェーブに並べる
   たとえば、次のような計画です。

```
Wave 0: #101 API契約を確定
Wave 1: #102 サーバー実装
        #103 UI実装
Wave 2: #104 機能A
```

3. `scaffold_waves_apply`コマンドで、各実行ウェーブを各`Feature Issue`にラベルを割り当てる。
4. `scaffold_waves_verify`コマンドを実行し、すべての`Feature Issue`にウェーブのラベルが割り当てられたことを確認する。正常に通ればクリアとする。
