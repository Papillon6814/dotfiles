※ この文書はscaffoldスキルの一部であり、説明資料ではなく今回の工程で従う手順書である。scaffoldで工程を確認してから全文読む。共通規律はDevelopmentの `instructions.md` を正本とし、役割・承認・権限の条件を併せて守る。

# 工程2: 仕様策定

## 本工程について

- 工程1の`環境セットアップ`を終えて本工程に到達しているはず。そのため、下書きの`Epic Issue`が対象プロジェクトに存在するはず。
- scaffoldにおいては`Epic Issue`を仕様の正本として扱う。
- 本工程では、変数が埋まるまで、ユーザーヒアリングもしくは調査を行い、`Epic Issue`を完成させる。

## 本工程のゴール

- `scaffold_handoff_basic_design`が正しく実行され、次の工程「`基本設計`」用のセッションが別タブで開始したことをもって本工程のクリアとする。

## 実施内容

1. `ask_user`を使いユーザーに質問をしながら、`scaffold_specification_update`コマンドに必要な情報を整理する。
2. `scaffold_research_begin`コマンドにより`Epic Issue`に記載された調査項目の解消に取り掛かる。それぞれ、ユーザーへのヒアリングと調査を組み合わせて解消していく。
3. 調査項目の調査が終わったら、`scaffold_research_resolve`を実行し、調査項目を`Epic Issue`上でも解消する。
4. 人にしかできない事前作業（ログイン、プラグインの有効化、権限の許可、キーの登録、外部サービスでの初期作成など）があれば、一覧と確かめ方（コマンド）、依頼の文面を`Epic Issue`の制約に書く（表が大きければ表は `docs/spec/` に置き、制約にはそのパスと sha256 を書く。下の手順5）。Epic の制約を書けるのは本工程だけである。基本設計では再確認だけを行い、結果は設計書に書く。プロジェクトの案内（`AGENTS.md`）に事前作業の一覧があれば、それを使う。
5. Epic の大きさを確かめる。上限は、管理ブロックの JSON が 16 KiB（16,384 バイト）、本文全体が 65,536 バイト（文字数ではない）。基本設計で JSON が増えるので余裕を残す。表のたぐい（シナリオ表、通し確認の全項目、人の事前作業の表、要件の対応表）は最初から `docs/spec/` に置き、Epic にはパスと sha256（とコミットID）を書く。更新する前と `scaffold_handoff_basic_design` の前に、両方を測る（測り方は Development の `instructions.md` の「Issue の作成・更新」）。
   - `docs/spec/` のファイルは Epic ブランチ `epic/<Epic番号>-<slug>`（例：`epic/7-todo-cli`。`<slug>` は Epic の内容を表す短い英小文字とハイフンの語）にコミットし、origin へ push する。Epic ブランチは、この工程で main から作ってよい。作業は worktree で行う（例：`git worktree add -b epic/7-todo-cli ~/.config/superpowers/worktrees/<repo名>/epic-7-todo-cli main`）。main worktree でコミットしない。基本設計はこのブランチを使い続ける（`references/basic-design.md` の「設計文書のコミット先」）。
6. `Epic Issue`が完成したら`scaffold_handoff_basic_design`を実行し、次の工程「`基本設計`」へと移る。

### 注意事項

- 基本設計や製品コード実装は行わない。
- 基本設計セッションに移る前に、調査項目はすべて必ず完了する。
