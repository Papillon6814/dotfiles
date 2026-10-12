# Pi 機能開発ルール

- このProfileは、ユーザーが何かしらの開発・実装の意欲があるときに呼び出される想定である。
- 開発・実装には `scaffold` という仕様策定から詳細設計／実装の一連の流れを通る方法と、 `jig` という中小規模の開発をスピーディに終わらせるための方法の2種類がある。

## 方法の分岐

### Scaffold

- ユーザーからの要望が、仕様策定・基本設計・詳細設計/実装の一連の流れを通るべき、大きな要望であれば、`/scaffold` スキルによる実装を行う。
- `scaffold` は大きなスキルだが確実なデリバリーを目的とする。

### Jig

- ユーザーからの要望の影響範囲が小さく、スピードを優先すべきであれば `/jig` スキルにて実装を進める。

## ゴール

- ユーザーからの要望に応じた開発タスクの完了をもって、セッションの完全なゴールとする。

## サブエージェントのモデル選定

- `scaffold`、`jig`のいずれでもサブエージェントが管理・実装を行う想定である。そのため、モデル選定表をここに記載する。

| 担当           | モデルID                   | thinking | 区分 |
| -------------- | -------------------------- | -------- | ---- |
| coding-manager | `openai-codex/gpt-6.1-sol` | `medium` | 基本 |
| coder          | `openai-codex/gpt-6.1-sol` | `medium` | 基本 |
| tester         | `openai-codex/gpt-6.1-sol` | `medium` | 基本 |

- 本表は pi-scaffold の owner policy（`~/.pi/agent/pi-scaffold/policy.json`）の `models` に合わせてある。Feature の担当指定は policy で検査され、policy に無い組み合わせは基本設計を通らない。policy と本表が食い違うときは policy を正とし、本表を直す（policy は本作業で変えない）。
- `Feature Issue` に全担当の指定、`Task Issue` に実際の `coder`/`tester`指定を記録する。`Task Issue`のmanager指定は親`Feature Issue`を参照し、重複させない。親セッションのモデルは本表で指定しない。
- 区分について：いまは基本だけを使う。上位の組み合わせは policy に無い。
- 担当・model・thinkingが完全一致する組み合わせだけを使う。

# Pi 機能開発時の注意事項

## Issue投稿と承認の境界

- このフローの規定された担当/範囲に限り、Issue新規投稿・本文更新・close、ラベル変更、親子/依存関係設定、通常pushは追加ユーザー承認不要とする。
- Projects の操作（Issue の登録、状態・field の更新、Project・view の作成）は、pi-gh の許可ファイル（`~/.pi/agent/pi-gh-permissions.json`）に無いので、毎回 TUI の承認ダイアログで人の操作が要る。人がいるセットアップ・仕様策定・基本設計の工程でだけ使う（`scaffold_dependencies_apply` の `projectId` など）。実装・検証の工程では Projects を操作しない（`scaffold_epic_complete` に `project` を渡さない、Task を Project に登録しない）。進捗と依存は Issue の親子・依存・Wave ラベルで表す。許可ファイルは本作業で変えない。
- coder/tester自身のpush・merge・Issue/Projects操作は禁止し、必要操作はmanager/親が行う。Task→Featureはmanager、Feature→Epicは親が、必要な検証合格後に統合する。
- Epic→mainのマージは親が行い、ユーザーの承認は不要とする。工程の区切りごとに随時マージしてよい（基本設計で設計文書を Epic のブランチにコミットした後、Feature を Epic へ統合した後、検証工程で動作確認が合格した後）。mainへの通常pushも追加承認不要とする。
- main へマージする前に、マージする Epic ブランチの内容でテストと型検査を実際に実行し、合格を出力で確かめる。不合格や実行できないときはマージしない。テストや型検査がまだ無い時点（設計文書だけの変更など）は、その旨を報告に書いてマージしてよい。main へマージするのは親だけで、manager・coder・tester はマージしない。
- main への統合は `git merge --no-ff` のマージで行う。squash・rebase はしない（Feature の証拠の ref が main の祖先でなくなり、`scaffold_epic_complete` が `REF_NOT_INTEGRATED` で止まる）。
- 外部書き込みの例外：基本設計でユーザーが承認し、設計書と Epic（管理ブロックの外への追記）の両方に記録した次の操作は、実装・検証の工程で確認なしに行ってよい。
  - 記録した外部書き込み（例：Open Cloud への画像アップロード）。
  - 自分（または自分が起動したランナー）が作った Studio のロックファイル（`~/.config/superpowers/studio.lock`）の削除。
  - 古い Studio のロックの削除。記録した手順（`skills/scaffold/references/implementation.md` のロックの規則）で、持ち主が止まっていると確かめたものに限る（最終更新から2時間（仮置き）以上たち、かつ中身の PID が生きていない）。消すのは親だけ。
  - 親が launchd（PID 1）になった孤児の `rbx-studio-mcp` の停止。ランナーを起動する前に限る。
  - これは基本設計で得たユーザーの明示の事前承認として扱い、グローバルの `~/.pi/agent/AGENTS.md` の「外部サービス投稿・ファイル削除は ask_user で確認」「lock ファイルは消さず持ち主を調査」より優先する（承認の範囲に限る。範囲外は今までどおり止めて最終報告に書く）。
- テストと型検査は、基本設計で導入したボイラープレートの検査コマンドで行う。Roblox（Luau）は `sh scripts/check.sh all`（StyLua の書式検査、Selene の lint、luau-lsp の strict 型検査、Lune のテスト、`rojo build`）が終了コード0なら合格とする。Lune で動かない Roblox 上の動作（Studio での通しプレイ、StudioTestService のテスト）は check.sh に含まれない。受け入れ要件で検証方法を別に定め、実行できなければ未検証とする。
- 削除、force push、未コミット変更の上書き、権限/認証変更、依存インストール、CI/CD・OS・セキュリティ設定、タグ/リリース公開、本番データ変更、メール/フォーム等の送信、購入等には本例外を広げない。
- 仕様・基本設計・受け入れ要件の内容承認と実装開始指示は維持する。投稿できることと、内容が承認済みであることを混同しない。

### 質問と判断（厳守）

- 人に質問してよいのは、セットアップ・仕様策定・基本設計の工程の親セッションだけである。`ask_user` でも、文章での問いかけでも同じ扱いにする。
- 実装・検証の工程の親、`coding-manager`、`coder`、`tester` は、人に一切質問しない（下の「人の事前作業の依頼」の例外だけを除く）。確認・相談・承認の依頼も、「聞いてよいか」という問いかけも出さない。仕組みでも止めている（サブエージェントの `tools` には `ask_user` を入れない。実装・検証の工程の親は、pi-scaffold の policy の `agentDecisionStages` により `ask_user` が拒否される）。拒否されたら、言い換えて聞き直さない。
- 下位の質問は、上位がすべて捌く。`coder`/`tester` の質問は `manager` が答える。`manager` が自分で決められないことは、結果の中で親への質問として返し、親が答える。親は下位の質問を人へ中継しない。答えは、manager の続きを起動するときの指示に入れる。
- 実装・検証の工程の親は、承認済みの仕様・基本設計の範囲で自分で決めて進める。判断と理由は、該当する Issue（管理ブロックの外への追記）と最終報告に書く。範囲を超える変更が要るときは、その部分を止めて最終報告に書く（差し戻しや質問はしない）。
- 内容承認（最終受け入れ、止まった引き継ぎの放棄）は、実装・検証の工程では pi-scaffold が人の確認なしで記録する（policy の `agentDecisionStages`）。
- 例外（人の事前作業の依頼）：人にしかできない事前作業（Studio のログイン、MCP プラグインの有効化、画面収録の許可、キーチェーンへのキー登録など）が欠けて作業が止まったときだけ、実装・検証の工程の親は `ask_user` で作業を依頼してよい。質問文の先頭を必ず `【事前作業】` にする（複数の質問を出すときはすべての質問文）。何が欠けているか、人がやること、選択肢「済んだ」「今はできない」の2つだけを書き、判断を求めない。pi-scaffold はこの目印の質問だけを通す（pi-scaffold 0.5.1 以降で有効。0.5.0 では拒否されるので、その部分を止めて最終報告に書く）。manager・coder・tester は依頼しない。親への質問として返し、親が依頼する。
  - 知らせ：`ask_user` を出す前に、Mac の通知も出す（例：`osascript -e 'display notification "事前作業の依頼があります" with title "pi-scaffold"'`）。
  - 「済んだ」なら：同じタブ・同じセッションのまま、欠けていた事前作業をコマンドで確かめ直し、止めた作業から続ける。確かめられなければ、もう一度依頼する。未検証（unverified）にして先へ進めない（unverified が1件でもあると、検証工程への引き継ぎも完了もできない）。
  - 「今はできない」なら：Studio もその事前作業も使わない作業（コード、Lune のテスト、`sh scripts/check.sh all` など）を先に済ませる。それから最終報告（止めた所、欠けている事前作業、確かめ方、再開のしかた）を書き、Mac の通知を出して止まる。人が同じタブに「再開」と送ったら、確かめ直してから続ける。
  - 止まっている間も pi を終了・再起動しない。再起動すると、そのセッションが受け取った引き継ぎの記録が失われ、pi-scaffold の工程の判定（人の確認なしの内容承認と、質問の禁止）が効かなくなる。
  - Epic の完了の知らせは例外にしない。完了は Mac の通知（`osascript -e 'display notification "..." with title "..."'`）と最終報告で知らせる。
- pi-gh の許可ファイルの範囲外の書き込みは、TUI の承認ダイアログで人の操作が要る。実装・検証の工程では範囲外の書き込みをしない。許可ファイルにある操作（`gh_issue_submit`、`*_if_current`、`gh_subissue_add`、`gh_dependency_add` など）だけを使い、どうしても要るときはその部分を止めて最終報告に書く。

### Issue の作成・更新

- Issue の作成・更新は、pi-gh と pi-scaffold の Pi ツールだけで行う（旧 `gh-issueflow` CLI の手順は pi-gh に移管済みで、CLI は使わない）。Epic・Feature・仕様・依存・Wave・引き継ぎ・完了は `scaffold_*` を使う。`scaffold_*` に専用ツールが無い操作（Task Issue の作成など）は `gh_*` を使う。
- 新規 Issue は `gh_issue_validate` → `gh_issue_preview` → `gh_issue_submit` の順で作る。入力は `draftPath` と `template`（標準は `task`/`parent`）または `templatePath`。preview で投稿先・タイトル・本文・担当指定と digest を確認する。成否と実 Issue 番号を確かめてから、親子（`gh_subissue_add`）・依存（`gh_dependency_add`）・Project を設定し、読み戻す。
- `gh issue create` 等の直接の gh / API 呼び出しへ切り替えない。ツールが使えない、`gh_capabilities` で必要な操作が無い、検証が通らない場合は停止する。人に質問してよい工程なら相談し、実装・検証の工程では最終報告に書く。
- Epic と Feature の管理ブロック（`<!-- pi-scaffold:v1:start -->` から `end` まで）は、まず `scaffold_*` で書く。専用のツールが無い変更に限り、パッケージ内部の関数で作り直した本文を `gh_issue_edit_if_current` で書いてよい。そのときは、何をなぜ変えたかを報告に書く。
- pi-scaffold / pi-gh のパッケージ内部（README・`dist`・`src`・`extensions`）は、読んでも、import して本文や digest を計算してもよい。ただし GitHub への書き込みはツールを通して行う。合わないときはツールが返す `problems` を手がかりに直す。
- Feature の `editScope` は、repo 相対のディレクトリ・ファイル・glob（例：`src`、`src/a.ts`、`src/**/*.ts`）で書く。ルート（`.`）も書けるが、ほかの全 Feature と競合する。空文字、`..`、`/` 始まりの絶対パス、バックスラッシュは使わない。glob の重なりは、重ならないと示せない限り競合とみなされる（例：`src/**/*.ts` と `src/**/*.css` は並行できるが、`src/**` と `src/a.ts` は競合する）。並行させたい Feature は、重ならない範囲で書く。
- 既存 Issue の本文更新は `gh_issue_edit_if_current`、close は `gh_issue_close_if_current` を使う（どちらも許可ファイルにあり、更新前の本文の sha256 が必要）。`gh_issue_edit` / `gh_issue_close` は許可ファイルに無く毎回承認になるので使わない。Epic は検証工程の `scaffold_epic_complete` が閉じる。
- 結果が `partial` / `unknown`（成否不明）のときは、確認前に再投稿しない。同じ operationId で呼び直すか、`gh_issue_get` で確かめる。
- Epic の上限は2つある（pi-scaffold 0.5.1 の `LIMITS`。超えると `LIMIT_EXCEEDED` で拒否する）。
  - 管理ブロックの JSON：16 KiB（16,384 バイト）以下。基本設計で `design`・`wavePlan`・`decisions` などが増えるので、仕様策定の終わりで余裕を残す。
  - 本文全体：65,536 バイト以下（文字数ではない）。
  - 表のたぐい（シナリオ表、通し確認の全項目、人の事前作業の表、要件の対応表）は、最初から `docs/spec/` のファイルに置いて Epic ブランチにコミットし、Epic にはパスと sha256 を書く。
  - 仕様策定で、更新する前と `scaffold_handoff_basic_design` の前に両方を測る。例：`gh api repos/OWNER/REPO/issues/N --jq .body | node -e 'let s="";process.stdin.setEncoding("utf8").on("data",d=>s+=d).on("end",()=>{const a=s.lastIndexOf("\x60\x60\x60json\n"),b=s.indexOf("\n\x60\x60\x60\n</details>",a);console.log("body",Buffer.byteLength(s),"json",a<0||b<0?"none":Buffer.byteLength(s.slice(a+8,b)))})'`（`--jq` が末尾に改行を1つ足すので、本文は1バイト多く出る）。
- 受け入れ要件（`AC###`）に Epic と同じ ID を Feature で使うときは、`requirementIds`（並びを含む）・`verification`・`expectedResult` の全項目を Epic と完全に一致させる（違うと基本設計の検査が `CRITERION_MISMATCH` で止まる）。内容が違うものには別の番号を使う。
- 秘密情報の候補を含む内容は投稿しない。入力・template・policy が変わったら validate と preview をやり直す。digest はユーザー承認の証拠ではない。

## 共通編集規約と配布

- `any`型禁止。ファイル編集前にReadで現在内容を確認する。
- 完了宣言前に`superpowers:verification-before-completion`を読み、実際のtest/type-check/lint等の出力を確認して提示する。存在しないコマンドを実行済みと捏造しない。
- コミット/PRへAI帰属表記を付けない。既存のgit hookは本作業で変更しない。
- 関連skill: 新機能/仕様変更は`superpowers:brainstorming`、実装前のテストは`superpowers:test-driven-development`、不具合は`superpowers:systematic-debugging`、worktreeは`superpowers:using-git-worktrees`、レビューは`superpowers:requesting-code-review`。調査並列化skillは実際に独立した調査と委任許可がある場合に使う。
- 担当定義の配布先は各プロジェクトの`.pi/agents/coding-manager.md`、`.pi/agents/coder.md`、`.pi/agents/tester.md`。共通ルール例外・モデル/工具/能力・CLI稼働版を確認してから運用する。copi保存、検証用定義、恒久有効化は区別する。
- 進行中の旧フロー作業を黙って切り替えない。未処理・取得時点・依存条件・適用先を明示して移行する。

## 作業の細則

- 一時ファイルは、担当の worktree の中の、git に追加しない場所に置く。使い終わっても `rm -rf` で消さず、そのまま残す。
- `/tmp`・`/var/folders`・`$TMPDIR` などシステムの一時ディレクトリには、ログや作業ファイルを置かない（例：`/tmp/x` にログを書かない）。この規則は、工程ごとの親セッション・coding-manager・coder・tester のすべてに当てはまる。
- 対象repoのworktreeは、必ず `~/.config/superpowers/worktrees/<repo名>/` の下に作る。ほかの場所（`~/Documents/Github/<repo>-worktrees/` など）に作らない。
- pi はプロジェクトの指示を `AGENTS.md` から読む。同じディレクトリに `AGENTS.md` があると `CLAUDE.md` は読まない（`@AGENTS.md` のような取り込みも展開しない）。プロジェクトの案内（読む資料、手順書の場所、リポジトリの持ち主など）は `AGENTS.md` を見る。
- Roblox Studio を操作するのは、プロジェクトの試遊用の実行スクリプト（ランナー。例：`tests/playtest/run.*`）だけである。scaffold のセッション（全工程の親・manager・coder・tester）は Studio MCP の道具を使わない。手順は `skills/scaffold/references/implementation.md` の「Roblox Studio の操作」。
  - 事実（pi 1.1.0 の組み込み MCP。2026-10-12 にソースで確認）：pi はセッションを始めると、有効な MCP サーバーをすべて裏で接続する（使うまで待つ遅延起動ではない）。そのため 2026-10-12 のユーザー決定で、`~/.pi/agent/mcp.json` から `Roblox_Studio` を削除した（元は `mcp.json.bak-20261012-studio`）。pi のセッションは Studio MCP を起動しない。
  - プロジェクトの `.pi/mcp.json` で無効にする方法は使わない。作業フォルダごとに project trust の確認が人に出るうえ、裏で動く担当では読まれないため。pi の設定に `Roblox_Studio` を戻さない。
  - 確かめ方：セッションの開始後に `pgrep -fl rbx-studio-mcp` を実行し、見つかったものの親（`ps -o ppid=,command= -p <PID>`）がこのセッションの pi でないこと。
- GitHub リポジトリの持ち主（個人・Organization）は、プロジェクトの案内（`AGENTS.md`）に書かれていればそれに従い、ユーザーに聞かない。書かれていなければセットアップの工程でユーザーに聞く。
