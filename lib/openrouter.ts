import { getCloudflareBindings } from "./cloudflare";

const OPENROUTER_API_KEY =
  getCloudflareBindings()?.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  getCloudflareBindings()?.OPENROUTER_MODEL ??
  process.env.OPENROUTER_MODEL ??
  "openai/gpt-4o-mini";

const EXTRACTION_PROMPT = `
You are a document extraction AI. Analyze this receipt/invoice image.
Return ONLY valid JSON, no explanation, no markdown, no backticks.

Extract these fields:
{
  "vendor_name": { "value": string | null, "confidence": 0.0-1.0 },
  "date": { "value": "YYYY-MM-DD" | null, "confidence": 0.0-1.0 },
  "total": { "value": number | null, "confidence": 0.0-1.0 },
  "currency": { "value": string | null, "confidence": 0.0-1.0 },
  "line_items": [
    {
      "name": string,
      "quantity": number | null,
      "unit_price": number | null,
      "subtotal": number | null,
      "confidence": 0.0-1.0
    }
  ],
  "document_quality": "good" | "poor" | "not_a_receipt",
  "notes": string
}

Rules:
- confidence < 0.7 means you are NOT sure about that field
- If document is not a receipt/invoice, set document_quality to "not_a_receipt"
- Always return valid JSON even if extraction fails (use null values)
- The document may be in Indonesian.
- Read visible labels like "Tanggal", "Jatuh tempo", "Subtotal", "PPN", "Total", and line-item tables carefully.
- If a field is missing, return null instead of guessing.
- If line items are present, extract each row from the table.
`;

export async function extractDocument(imageBase64: string, mimeType: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Set it in the active runtime environment.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
    );
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices[0].message.content;

  try {
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
