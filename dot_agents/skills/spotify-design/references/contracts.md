# 共通契約

本書の構造・優先度・statusはour-recommendationです。Spotify社内の採点仕様ではありません。

## 入力

task_mode、role、visual_mode、objective、platform、scope、constraints、evidence（取得元・条件）、upstream。
目的・OS・モード・対象が欠けたら、必要な決定と選択肢を親へ返します。既存レビューで目的・制約が分かる場合は、UI設計upstreamがないことだけでレビューを止めません。UI新規設計にはUX成果が必要です。

## 設計の出力

1. 対象・目的・制約・証拠・モード・status。
2. 担当の設計成果。UXは導線/状態/言葉、UIは部品/階層/役割別表現。
3. 代案、推奨理由、トレードオフ。未提供のニーズや効果は仮説と表示。
4. 維持事項、実装担当への仕様、条件→操作→期待結果→必要証拠、親の残判断。

## レビューの出力

冒頭に対象・証拠・visual_mode・status・総合所見。続いて実際に確認できた良い点、findings、未検証事項、実装担当への引き渡し。良い点は観察と理由を書く。指摘を作るための指摘は不要です。

各findingは下記9欄を一組にして返します。レビューは後述のJSONを一つ返し、欄名をそのまま使います。finding_idは見出しへの置換、evidence_statusは複数値の混在、basisはIDだけへの省略をしません。短くする場合は近い指摘を集約し、全必須欄を保持します。

| 欄 | 内容 |
|---|---|
| finding_id | そのレビュー内で一意 |
| target | 画面/要素/状態/導線 |
| observation | 証拠から直接確認できた事実。根拠のない動作を足さない |
| impact | 誰のどのタスクへの影響。未実測は可能性/仮説と表示 |
| priority | blocker / major / minor ＋理由 |
| evidence_status | confirmed / recommendation / needs-evidence |
| basis | ソースID・年次・区分・対象/適用範囲。独自提案はour-recommendationと理由 |
| change | 具体案と維持すべき点。未承認の仕様は候補と表示 |
| acceptance | 条件→操作→期待結果→必要証拠 |

blocker＝主要タスク不能・重大な誤操作/損失/アクセス不能。major＝理解/操作/再利用への大きな影響。minor＝局所的表現。優先度は事実の確度ではありません。証拠不足はblockerの確定不具合にしません。

例：observation=画像で同じ「詳細」が2つ／impact=対象を取り違える可能性／evidence_status=needs-evidence／change=読み上げ名の実装と実機記録を親に依頼。可視ラベルだけから「読み上げで区別不能」と結論しません。

## レビューJSONの完成例

```json
{
  "target": "予約確認画面 / iOS・Android",
  "evidence": ["静止画。意味構造・実機記録は未提供"],
  "visual_mode": "brand-adapted",
  "status": "needs-evidence",
  "summary": "視覚の確認と操作の未検証を分ける",
  "good_points": ["カードごとに予約名がまとまっているため対象を視覚で追いやすい"],
  "findings": [{
    "finding_id": "UX-01",
    "target": "詳細リンク",
    "observation": "画像に同じ可視ラベルが2つある",
    "impact": "読み上げ時に対象を取り違える可能性。未実測",
    "priority": {"level": "major", "reason": "主要タスクの対象選択に関係する"},
    "evidence_status": "needs-evidence",
    "basis": [{"source_id": "S06", "year": "2023", "category": "case-study", "scope": "主にWebの体験全体の検証。nativeへの確認手順は独自推奨"}],
    "change": "カード構造は維持。読み上げ名の仕様とVoiceOver/TalkBack記録を親へ依頼する",
    "acceptance": {"condition": "両OSの読み上げを使用", "action": "各リンクへ移動", "expected": "対象名を区別できる", "evidence": "名前・OS・条件付き実機記録"}
  }],
  "unverified": ["読み上げ名・順序・フォーカス復帰"],
  "handoff": {"changes": ["意味構造の確認後に必要な修正を判断"], "preserve": ["承認済みブランド"], "parent_decisions": ["実機証拠の手配"]}
}
```

basis.categoryはpublic-principle / case-study / external-standard / our-recommendation。独自提案だけならsource_id="our"、year="2026"、scopeに理由を明記します。更新型の標準はyear="更新型"。S01は2020、S03は2022、S04は2023など台帳と合わせます。
優先度・証拠状態は一つだけ選びます。視覚上の事実と未検証動作が混ざる場合、指摘を分けるか動作の判定をneeds-evidenceへ残します。
必要入力が欠けた場合も同じ外側の欄を返し、status=needs-clarification、findings=[]、unverifiedとparent_decisionsに確認事項を置きます。未指定のtargetやvisual_modeはnullにします。推測のレビューを埋めません。
設計（task_mode=design）はJSON例の対象外で、上記の設計成果を返します。

## status

| 値 | 意味 |
|---|---|
| needs-clarification | 必要な目的・OS・範囲・モード・UX判断が欠ける |
| needs-evidence | 判定に必要な証拠が足りない |
| changes-required | 確認済みの必須修正がある。改善提案だけならこの値にしない |
| ready-for-implementation | 設計を親の承認に提示できる。実装合格ではない |
| reviewed-within-scope | 指定証拠・範囲の確認を終えた。範囲外の品質保証ではない |

総合statusと各findingの確度を別にします。視覚上の確認済み課題があっても、読み上げ等は未検証のまま残します。総合点で証拠不足を隠しません。
親が保存・承認・衝突解決を担当します。マネージャーは実装・ファイル変更・シェル・外部操作・他agent起動を行いません。保存先指定があっても返答を渡し、保存は親へ依頼します。
