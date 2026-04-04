import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DIGITAL_TWIN_SYSTEM_PROMPT,
  type ChatMessage,
} from "@/lib/digitalTwinContext";
import { getDigitalTwinKnowledge } from "@/lib/digitalTwinKnowledge.server";
import {
  buildFocusedProfileContext,
  buildProjectSpecificContext,
  detectProjectSpecificQuery,
  extractSection,
  formatSectionList,
} from "@/lib/digitalTwinRetrieval";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-oss-120b";
const MAX_MESSAGES = 12;
const encoder = new TextEncoder();
const OPENROUTER_TIMEOUT_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitBuckets = new Map<string, number[]>();

function tryReadApiKeyFromParentEnv(): string | undefined {
  try {
    const parentEnvPath = path.resolve(process.cwd(), "../.env");
    const contents = readFileSync(parentEnvPath, "utf8");
    const line = contents
      .split("\n")
      .find((entry) => entry.startsWith("OPENROUTER_API_KEY="));

    if (!line) {
      return undefined;
    }

    return line.replace("OPENROUTER_API_KEY=", "").trim();
  } catch {
    return undefined;
  }
}

function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY ?? tryReadApiKeyFromParentEnv();
}

function isValidMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { role?: unknown; content?: unknown };
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

type OpenRouterDelta =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>
  | undefined;

function extractDeltaText(content: OpenRouterDelta): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => (item.type === "text" ? item.text ?? "" : ""))
    .join("");
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

function isRateLimited(clientIp: string, now = Date.now()): boolean {
  const bucket = rateLimitBuckets.get(clientIp) ?? [];
  const recent = bucket.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitBuckets.set(clientIp, recent);
    return true;
  }

  recent.push(now);
  rateLimitBuckets.set(clientIp, recent);
  return false;
}

function streamTextResponse(text: string) {
  const parts = text.split(/(\s+)/).filter(Boolean);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part));
        // Simulated token streaming for smooth UX.
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return Response.json(
      {
        error:
          "Rate limit exceeded. Please wait a minute before sending more messages.",
      },
      { status: 429 },
    );
  }

  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Missing OPENROUTER_API_KEY. Add it to web/.env.local or parent .env.",
      },
      { status: 500 },
    );
  }

  let input: { messages?: unknown };
  try {
    input = (await request.json()) as { messages?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const rawMessages = Array.isArray(input.messages) ? input.messages : [];
  const sanitizedMessages = rawMessages
    .filter(isValidMessage)
    .slice(-MAX_MESSAGES);

  if (sanitizedMessages.length === 0) {
    return Response.json(
      { error: "Please provide at least one user message." },
      { status: 400 },
    );
  }

  const profileKnowledge = await getDigitalTwinKnowledge();
  const latestUserMessage =
    [...sanitizedMessages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content ?? "";
  const latestUserMessageLower = latestUserMessage.toLowerCase();
  const focusedProfileKnowledge = buildFocusedProfileContext(
    profileKnowledge,
    latestUserMessage,
  );
  const projectSpecificContext = detectProjectSpecificQuery(latestUserMessage)
    ? buildProjectSpecificContext(profileKnowledge, latestUserMessage)
    : "";
  const certificationsSection = extractSection(profileKnowledge, "Certifications", [
    "Education",
  ]);

  if (
    (latestUserMessageLower.includes("certification") ||
      latestUserMessageLower.includes("certificate")) &&
    certificationsSection
  ) {
    const certifications = formatSectionList(certificationsSection);
    const responseText =
      certifications.length > 0
        ? `From Sonya's profile, certifications include:\n- ${certifications.join("\n- ")}`
        : "The profile includes a Certifications section, but no individual certification lines were parsed.";

    return streamTextResponse(responseText);
  }

  try {
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Sonya Ling Digital Twin",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: DIGITAL_TWIN_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Use the following profile context as the source of truth for all answers in this chat.\n\n${
              projectSpecificContext || `Profile Context (from full profile text):\n${focusedProfileKnowledge}`
            }`,
          },
          ...sanitizedMessages,
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      return Response.json(
        {
          error: `OpenRouter request failed (${openRouterResponse.status}).`,
          details: errorText,
        },
        { status: 502 },
      );
    }

    const payload = (await openRouterResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: OpenRouterDelta;
        };
      }>;
    };

    const firstContent = payload.choices?.[0]?.message?.content;
    const assistantMessage = extractDeltaText(firstContent).trim();

    if (!assistantMessage) {
      return Response.json(
        { error: "Model returned an empty response." },
        { status: 502 },
      );
    }

    return streamTextResponse(assistantMessage);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return Response.json(
        { error: "OpenRouter request timed out after 30 seconds." },
        { status: 504 },
      );
    }

    return Response.json(
      {
        error: "Unexpected server error while contacting OpenRouter.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
