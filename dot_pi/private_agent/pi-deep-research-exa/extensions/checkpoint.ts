import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
	// ── Tool: research_checkpoint ──
	// Hard gate: LLM must call this after each search round.
	// Code decides whether to continue searching or allow synthesis.

	const DEPTH_THRESHOLDS: Record<string, {
		minSearchRounds: number;
		maxSearchRounds: number;
		minSources: number;
		confidenceThreshold: number;
		minAnsweredRatio: number;
	}> = {
		quick:      { minSearchRounds: 1, maxSearchRounds: 3,  minSources: 3,  confidenceThreshold: 60, minAnsweredRatio: 0.6 },
		standard:   { minSearchRounds: 2, maxSearchRounds: 6,  minSources: 5,  confidenceThreshold: 75, minAnsweredRatio: 0.7 },
		deep:       { minSearchRounds: 3, maxSearchRounds: 10, minSources: 10, confidenceThreshold: 85, minAnsweredRatio: 0.8 },
		exhaustive: { minSearchRounds: 5, maxSearchRounds: 20, minSources: 15, confidenceThreshold: 95, minAnsweredRatio: 0.9 },
	};

	pi.registerTool({
		name: "research_checkpoint",
		label: "Research Checkpoint",
		description: [
			"MANDATORY after each search round during deep research.",
			"Submit current research state for evaluation.",
			"The tool will analyze your progress and return a VERDICT: CONTINUE (must search more) or PROCEED (may synthesize report).",
			"You MUST obey the verdict — if it says CONTINUE, you must do another search round before calling this again.",
			"Do NOT skip this tool or write the report without a PROCEED verdict.",
		].join(" "),
		parameters: Type.Object({
			depth: Type.String({
				description: 'Research depth level: "quick", "standard", "deep", or "exhaustive"',
			}),
			round: Type.Number({
				description: "Current search round number (1-indexed, increment after each search batch)",
			}),
			sub_questions: Type.Array(
				Type.Object({
					question: Type.String({ description: "The sub-question" }),
					answered: Type.Boolean({ description: "Whether this sub-question has been adequately answered" }),
					confidence: Type.Number({ description: "Confidence score 0-100 for this sub-question" }),
					source_count: Type.Number({ description: "Number of sources found for this sub-question" }),
					best_source_tier: Type.Number({ description: "Best source credibility tier (1=authoritative, 2=reliable, 3=community, 4=unverified)" }),
				}),
				{ description: "Status of each sub-question" }
			),
			total_sources: Type.Number({ description: "Total unique sources collected so far" }),
			contradictions: Type.Optional(
				Type.Array(Type.String(), { description: "List of contradictions found between sources" })
			),
			gaps: Type.Optional(
				Type.Array(Type.String(), { description: "Known information gaps that remain" })
			),
		}),

		async execute(_toolCallId, params) {
			const thresholds = DEPTH_THRESHOLDS[params.depth] ?? DEPTH_THRESHOLDS.standard;
			const totalQuestions = params.sub_questions.length;
			const answeredCount = params.sub_questions.filter(q => q.answered).length;
			const answeredRatio = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
			const avgConfidence = totalQuestions > 0
				? params.sub_questions.reduce((sum, q) => sum + q.confidence, 0) / totalQuestions
				: 0;
			const minConfidence = totalQuestions > 0
				? Math.min(...params.sub_questions.map(q => q.confidence))
				: 0;
			const hasContradictions = (params.contradictions?.length ?? 0) > 0;
			const lowConfidenceQuestions = params.sub_questions.filter(q => q.confidence < 40);
			const medConfidenceQuestions = params.sub_questions.filter(q => q.confidence >= 40 && q.confidence < thresholds.confidenceThreshold);

			// ── Evaluate ──
			const issues: string[] = [];
			let verdict: "CONTINUE" | "PROCEED" = "PROCEED";

			// Rule 1: Haven't done minimum search rounds
			if (params.round < thresholds.minSearchRounds) {
				verdict = "CONTINUE";
				issues.push(`⛔ Min search rounds not met: ${params.round}/${thresholds.minSearchRounds} rounds`);
			}

			// Rule 2: Not enough sources
			if (params.total_sources < thresholds.minSources) {
				verdict = "CONTINUE";
				issues.push(`⛔ Not enough sources: ${params.total_sources}/${thresholds.minSources} sources`);
			}

			// Rule 3: Too many unanswered questions
			if (answeredRatio < thresholds.minAnsweredRatio) {
				verdict = "CONTINUE";
				issues.push(`⛔ Answered ratio too low: ${answeredCount}/${totalQuestions} (${(answeredRatio * 100).toFixed(0)}% < ${(thresholds.minAnsweredRatio * 100).toFixed(0)}%)`);
			}

			// Rule 4: Average confidence below threshold
			if (avgConfidence < thresholds.confidenceThreshold) {
				verdict = "CONTINUE";
				issues.push(`⛔ Average confidence too low: ${avgConfidence.toFixed(0)}% < ${thresholds.confidenceThreshold}%`);
			}

			// Rule 5: Any question with very low confidence
			if (lowConfidenceQuestions.length > 0 && params.round < thresholds.maxSearchRounds) {
				verdict = "CONTINUE";
				const names = lowConfidenceQuestions.map(q => `"${q.question}" (${q.confidence}%)`).join(", ");
				issues.push(`⛔ Low-confidence sub-questions (<40%): ${names}`);
			}

			// Rule 6: Unresolved contradictions
			if (hasContradictions && params.round < thresholds.maxSearchRounds) {
				verdict = "CONTINUE";
				issues.push(`⚠️ Unresolved contradictions (${params.contradictions!.length}) — search for authoritative sources to verify`);
			}

			// Safety valve: don't exceed max rounds
			if (params.round >= thresholds.maxSearchRounds) {
				verdict = "PROCEED";
				if (issues.length > 0) {
					issues.push(`⚠️ Max search rounds reached (${thresholds.maxSearchRounds}). Proceeding to report. Remaining issues will be noted in "Uncertainties & Gaps".`);
				}
			}

			// ── Build response ──
			const statusBar = `${"█".repeat(Math.round(avgConfidence / 5))}${"░".repeat(20 - Math.round(avgConfidence / 5))}`;

			let text = `## Research Checkpoint — Round ${params.round}\n\n`;
			text += `**Depth:** ${params.depth} | **Verdict: ${verdict === "CONTINUE" ? "🔴 CONTINUE SEARCHING" : "🟢 PROCEED TO REPORT"}**\n\n`;
			text += `### Progress\n`;
			text += `- Search rounds: ${params.round} / ${thresholds.minSearchRounds}-${thresholds.maxSearchRounds}\n`;
			text += `- Sources collected: ${params.total_sources} / ${thresholds.minSources} (minimum)\n`;
			text += `- Sub-questions answered: ${answeredCount}/${totalQuestions} (${(answeredRatio * 100).toFixed(0)}%)\n`;
			text += `- Avg confidence: ${statusBar} ${avgConfidence.toFixed(0)}% (threshold: ${thresholds.confidenceThreshold}%)\n`;
			text += `- Min confidence: ${minConfidence.toFixed(0)}%\n`;

			text += `\n### Sub-question Status\n`;
			for (const q of params.sub_questions) {
				const icon = q.confidence >= thresholds.confidenceThreshold ? "✅" :
				             q.confidence >= 40 ? "🟡" : "🔴";
				text += `${icon} [${q.confidence}%] ${q.question} — ${q.source_count} sources (Tier ${q.best_source_tier})\n`;
			}

			if (issues.length > 0) {
				text += `\n### Issues\n`;
				for (const issue of issues) {
					text += `${issue}\n`;
				}
			}

			if (params.contradictions && params.contradictions.length > 0) {
				text += `\n### Contradictions\n`;
				for (const c of params.contradictions) {
					text += `- ⚡ ${c}\n`;
				}
			}

			if (params.gaps && params.gaps.length > 0) {
				text += `\n### Remaining Gaps\n`;
				for (const g of params.gaps) {
					text += `- ❓ ${g}\n`;
				}
			}

			if (verdict === "CONTINUE") {
				text += `\n### 📋 Next Actions Required\n`;
				text += `You MUST perform another search round addressing the issues above, then call \`research_checkpoint\` again.\n`;

				// Specific guidance
				if (lowConfidenceQuestions.length > 0) {
					text += `\n**Priority — Low confidence questions to focus on:**\n`;
					for (const q of lowConfidenceQuestions) {
						text += `- "${q.question}" — try different search queries, different angles\n`;
					}
				}
				if (medConfidenceQuestions.length > 0) {
					text += `\n**Secondary — Medium confidence questions to strengthen:**\n`;
					for (const q of medConfidenceQuestions) {
						text += `- "${q.question}" (${q.confidence}%) — find corroborating sources\n`;
					}
				}
				if (hasContradictions) {
					text += `\n**Resolve contradictions** by searching for authoritative (Tier 1) sources.\n`;
				}
			} else {
				text += `\n### ✅ Ready to Synthesize\n`;
				text += `All criteria met. Proceed to Phase 4 — write the research report.\n`;
				if (params.gaps && params.gaps.length > 0) {
					text += `Include the ${params.gaps.length} remaining gap(s) in the "Uncertainties & Gaps" section of the report.\n`;
				}
				if (hasContradictions) {
					text += `Include the ${params.contradictions!.length} contradiction(s) in the report — present both sides.\n`;
				}
			}

			return { content: [{ type: "text", text }], details: undefined };
		},
	});
}
