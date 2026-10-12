---
name: research
description: ユーザーが research を指定した場合や、深い調査と Plannotator でのレポート確認をまとめて依頼した場合に使う。通常の簡単な検索には使わない。
---
# Research + Plannotator

1. 利用可能な deep-research スキルを読み、その手順で指定テーマの調査と出典付きレポートを作成する。現在の対応スキルは deep-research-work:deep-research。利用できない場合はその旨を伝え、利用可能な検索ツールで調査する。
2. 完成したレポートを Markdown ファイルに保存する。関連する作業フォルダまたは一時フォルダを使い、保存先を把握する。
3. `~/.codex/skills/plannotator-annotate/SKILL.md` を読み、そのファイルを対象に Plannotator を開く。現在のターンの最終応答を last で誤って取得することを避けるため、ファイルを直接指定する。
4. 注釈が返ったらレポートに反映する。UI を開くための実行承認が必要な環境では通常の承認手順に従う。
5. Notion への登録はユーザーが明示的に依頼した場合にだけ行う。
