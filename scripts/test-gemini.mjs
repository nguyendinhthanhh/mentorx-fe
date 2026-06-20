#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

function loadEnv(path) {
  if (!existsSync(path)) {
    console.error(`[test-openrouter] .env not found at: ${path}`);
    return {};
  }
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
  return env;
}

function maskKey(key) {
  if (!key) return "<undefined>";
  if (key.length < 8) return "<too-short>";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

async function main() {
  console.log("=".repeat(60));
  console.log("  OpenRouter API Connection Test");
  console.log("=".repeat(60));

  const env = loadEnv(envPath);
  const apiKey = env.VITE_GEMINI_API_KEY;

  console.log(`\n[test-openrouter] .env path: ${envPath}`);
  console.log(`[test-openrouter] VITE_GEMINI_API_KEY loaded: ${apiKey ? "yes" : "NO"}`);
  console.log(`[test-openrouter] API key (masked): ${maskKey(apiKey)}`);
  console.log(`[test-openrouter] Key length: ${apiKey ? apiKey.length : 0}`);
  console.log(`[test-openrouter] Key prefix: ${apiKey ? apiKey.slice(0, 6) : "N/A"}`);

  if (!apiKey) {
    console.error("\n[test-openrouter] FAILED: No API key found.");
    process.exit(1);
  }

  if (!apiKey.startsWith("sk-or-")) {
    console.warn(`[test-openrouter] ⚠️ Key does not start with "sk-or-" — may not be a valid OpenRouter key`);
  }

  const MODELS = [
    "qwen/qwen3-coder:free",
  ];

  const URL = "https://openrouter.ai/api/v1/chat/completions";
  let anySuccess = false;

  for (const model of MODELS) {
    console.log(`\n${"-".repeat(50)}`);
    console.log(`[test-openrouter] Testing model: ${model}`);
    console.log(`[test-openrouter] URL: ${URL}`);
    console.log(`[test-openrouter] Auth: Bearer ${maskKey(apiKey)}`);

    const body = {
      model,
      messages: [
        { role: "user", content: "Say hello in 3 words" },
      ],
      temperature: 0.7,
      max_tokens: 100,
    };

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      console.log(`[test-openrouter] Status: ${response.status} ${response.statusText}`);

      const text = await response.text();
      console.log(`[test-openrouter] Response body:`);
      console.log(text.slice(0, 2000));

      if (response.ok) {
        try {
          const data = JSON.parse(text);
          if (data.choices?.[0]?.message?.content) {
            console.log(`\n[test-openrouter] ✅ SUCCESS: "${data.choices[0].message.content}"`);
            anySuccess = true;
          } else {
            console.log(`\n[test-openrouter] ⚠️ Response OK but no choices`);
          }
        } catch {
          console.log(`\n[test-openrouter] ⚠️ Response OK but not valid JSON`);
        }
      } else {
        const data = JSON.parse(text);
        const msg = data?.error?.message || data?.message || text.slice(0, 200);
        console.error(`[test-openrouter] ❌ ${msg}`);
      }
    } catch (err) {
      console.error(`[test-openrouter] ❌ Network/Fetch error:`, err.message);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  if (anySuccess) {
    console.log("  RESULT: ✅ OpenRouter API hoạt động bình thường.");
  } else {
    console.log("  RESULT: ❌ Không thể kết nối OpenRouter API.");
    console.log("\n  Nguyên nhân có thể:");
    console.log("  1. API key không đúng (cần key dạng sk-or-v1-...)");
    console.log("  2. Tài khoản OpenRouter hết credit/quota");
    console.log("  3. Model tạm thời không khả dụng");
  }
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("[test-openrouter] Unhandled error:", err);
  process.exit(1);
});
