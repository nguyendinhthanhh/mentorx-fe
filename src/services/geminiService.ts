const OPENROUTER_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "qwen/qwen3-coder:free",
  "openai/gpt-4o-mini",
];

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function maskKey(key: string | undefined): string {
  if (!key) return "<undefined>";
  if (key.length < 8) return "<too-short>";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

function extractErrorMessage(errorText: string): string {
  try {
    const body = JSON.parse(errorText);
    return body?.error?.message || body?.message || errorText;
  } catch {
    return errorText;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusMessage(status: number): string {
  if (status === 401) return "API key OpenRouter không hợp lệ.";
  if (status === 403) return "Key OpenRouter đã hết hạn mức. Vào https://openrouter.ai/keys để kiểm tra.";
  if (status === 429) return "Hết quota OpenRouter API.";
  if (status === 503) return "OpenRouter tạm thời không khả dụng.";
  return `Lỗi OpenRouter (${status}).`;
}

async function tryModel(
  model: string,
  systemInstruction: string,
  history: OpenRouterMessage[],
  abortSignal?: AbortSignal
): Promise<string> {
  console.log(`[OpenRouter] === REQUEST ===`);
  console.log(`[OpenRouter] URL: ${OPENROUTER_URL}`);
  console.log(`[OpenRouter] Model: ${model}`);
  console.log(`[OpenRouter] Auth: Bearer ${maskKey(OPENROUTER_API_KEY)}`);

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemInstruction },
    ...history,
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    signal: abortSignal,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
    }),
  });

  console.log(`[OpenRouter] === RESPONSE ===`);
  console.log(`[OpenRouter] Status: ${response.status} ${response.statusText}`);

  if (response.ok) {
    const data = await response.json();
    console.log(`[OpenRouter] Response (truncated):`, JSON.stringify(data).slice(0, 500));
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log(`[OpenRouter] Success, response length: ${text.length} chars`);
      return text;
    }
    console.error(`[OpenRouter] Empty response - no choices`);
    throw Object.assign(
      new Error("Empty response from OpenRouter"),
      { code: response.status, raw: JSON.stringify(data) }
    );
  }

  const errorText = await response.text();
  console.error(`[OpenRouter] Error body:`, errorText.slice(0, 1000));
  const message = statusMessage(response.status);
  throw Object.assign(
    new Error(`${message} Chi tiết: ${extractErrorMessage(errorText)}`),
    { code: response.status, model, raw: errorText }
  );
}

export async function sendChatMessage(
  systemInstruction: string,
  history: OpenRouterMessage[],
  userMessage: string,
  abortSignal?: AbortSignal
): Promise<string> {
  console.log(`[OpenRouter] === sendChatMessage ===`);
  console.log(`[OpenRouter] API key loaded: ${OPENROUTER_API_KEY ? "yes" : "NO"}`);
  console.log(`[OpenRouter] API key (masked): ${maskKey(OPENROUTER_API_KEY)}`);
  console.log(`[OpenRouter] System instruction length: ${systemInstruction.length}`);
  console.log(`[OpenRouter] History entries: ${history.length}`);
  console.log(`[OpenRouter] User message: "${userMessage.slice(0, 100)}"`);

  if (!OPENROUTER_API_KEY) {
    console.error(`[OpenRouter] FATAL: API key not configured`);
    throw new Error(
      "OpenRouter API key not configured. Please add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  if (!OPENROUTER_API_KEY.startsWith("sk-or-")) {
    console.warn(`[OpenRouter] Key does not start with "sk-or-", may be invalid`);
  }

  const fullHistory: OpenRouterMessage[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  let lastError: Error & { code?: number; raw?: string } | null = null;

  for (const model of MODELS) {
    console.log(`[OpenRouter] Trying model: ${model}`);
    if (abortSignal?.aborted) {
      console.log(`[OpenRouter] Aborted before trying ${model}`);
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      const result = await tryModel(model, systemInstruction, fullHistory, abortSignal);
      console.log(`[OpenRouter] Model ${model} succeeded`);
      return result;
    } catch (err: unknown) {
      const e = err as Error & { code?: number; raw?: string };
      lastError = e;
      console.warn(`[OpenRouter] Model ${model} failed: code=${e.code}, message="${e.message}"`);

      if (e.code === 429 || e.code === 503) {
        console.log(`[OpenRouter] Model ${model} rate limited/unavailable, trying next`);
        continue;
      }
      if (e.code === 404) {
        console.log(`[OpenRouter] Model ${model} not found, trying next`);
        continue;
      }
      if (e.code === 403) {
        console.log(`[OpenRouter] Model ${model} key limit, trying next`);
        continue;
      }

      console.error(`[OpenRouter] Model ${model} unrecoverable error, stopping`);
      throw e;
    }
  }

  if (lastError?.raw) {
    const detail = extractErrorMessage(lastError.raw);
    const msg = `Không thể kết nối OpenRouter. Vui lòng kiểm tra API key hoặc thử lại sau.\nChi tiết: ${detail}`;
    console.error(`[OpenRouter] ${msg}`);
    throw new Error(msg);
  }

  if (lastError) {
    console.error(`[OpenRouter] ${lastError.message}`);
    throw lastError;
  }

  const msg = "Không thể kết nối OpenRouter. Vui lòng thử lại sau.";
  console.error(`[OpenRouter] ${msg}`);
  throw new Error(msg);
}
