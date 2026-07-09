import { z } from "zod";
import { clauseTypeSchema, riskLevelSchema } from "@/types/schemas";

const extractionResultSchema = z.object({
  flags: z.array(
    z.object({
      clauseType: clauseTypeSchema,
      extractedText: z.string().max(2000),
      riskLevel: riskLevelSchema,
      confidence: z.number().min(0).max(1),
    })
  ),
});
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

const SYSTEM_PROMPT = `You are a contract analyst for freelance creatives (video editors, photographers, designers) reviewing a client services contract.

Extract clauses in these categories only:
- payment_terms: payment schedule, amounts, late fees
- termination: termination rights, notice periods, kill fees
- usage_rights: what the client is licensed to do with the deliverables (scope, medium, duration, territory)
- exclusivity: any clause restricting the freelancer from working with competitors or other clients
- licensing_renewal: auto-renewal of licensing terms, renewal notice deadlines
- liability_cap: limitation of liability, indemnification caps

For each clause found, assign a risk level to the FREELANCER (not the client):
- high: clause is unusually unfavorable to the freelancer (e.g. unlimited exclusivity, perpetual usage rights for a one-time fee, no termination notice)
- medium: standard but worth a second look
- low: standard, freelancer-favorable or neutral boilerplate

Respond with ONLY a JSON object matching this exact shape, no markdown fences, no preamble:
{"flags": [{"clauseType": "...", "extractedText": "...", "riskLevel": "...", "confidence": 0.0}]}

extractedText must be a short paraphrase (under 40 words) of what the clause says, in your own words — not a verbatim quote from the document. If a category isn't present in the contract, omit it. If nothing relevant is found at all, return {"flags": []}.`;

export async function extractClauseFlags(contractText: string): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the contract text:\n\n${contractText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Claude API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((block: { type: string }) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude API returned no text content.");
  }

  let parsedJson: unknown;
  try {
    // Defensive: strip markdown fences even though the prompt asks not to
    // include them — models occasionally add them anyway.
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    parsedJson = JSON.parse(cleaned);
  } catch {
    throw new Error("Claude API returned malformed JSON.");
  }

  const parsed = extractionResultSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`Claude API response failed schema validation: ${parsed.error.message}`);
  }

  return parsed.data;
}
