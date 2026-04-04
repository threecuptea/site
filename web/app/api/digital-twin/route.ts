import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DIGITAL_TWIN_SYSTEM_PROMPT,
  type ChatMessage,
} from "@/lib/digitalTwinContext";
import { getDigitalTwinKnowledge } from "@/lib/digitalTwinKnowledge.server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-oss-120b";
const MAX_MESSAGES = 12;
const encoder = new TextEncoder();
const MAX_RELEVANT_LINES = 24;
const MAX_RELEVANT_PROJECT_LINES = 18;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "have",
  "about",
  "into",
  "what",
  "which",
  "list",
  "five",
  "does",
  "sonya",
  "ling",
]);

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

function buildFocusedProfileContext(profileText: string, query: string): string {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));

  if (terms.length === 0) {
    return profileText;
  }

  const lines = profileText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const scoredLines = lines
    .map((line) => {
      const lowercaseLine = line.toLowerCase();
      const score = terms.reduce((count, term) => {
        return count + (lowercaseLine.includes(term) ? 1 : 0);
      }, 0);

      return { line, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELEVANT_LINES)
    .map((entry) => entry.line);

  const certificationsSection = extractSection(profileText, "Certifications", [
    "Education",
  ]);

  if (scoredLines.length === 0 && !certificationsSection) {
    return profileText;
  }

  return `${certificationsSection ? `Certifications section:\n${certificationsSection}\n\n` : ""}Relevant excerpts:
${scoredLines.join("\n")}
`;
}

function extractSection(
  profileText: string,
  sectionName: string,
  nextSectionCandidates: string[],
): string {
  const lines = profileText.split("\n");
  const normalizedSectionName = sectionName.toLowerCase();

  const startIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === normalizedSectionName,
  );
  if (startIndex === -1) {
    return "";
  }

  const normalizedNext = new Set(
    nextSectionCandidates.map((candidate) => candidate.toLowerCase()),
  );

  const collected: string[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    const normalizedLine = trimmed.toLowerCase();

    if (
      i > startIndex &&
      normalizedNext.has(normalizedLine) &&
      collected.length > 0
    ) {
      break;
    }

    if (trimmed) {
      collected.push(trimmed);
    }
  }

  return collected.join("\n");
}

function formatSectionList(sectionText: string): string[] {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        line !== "•" &&
        !/^certifications$/i.test(line) &&
        !/^education$/i.test(line),
    )
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean);
}

function getHandsOnProjectsSection(profileText: string): string {
  return extractSection(profileText, "Hand-on Projects", ["Certifications"]);
}

function extractProjectEntries(projectSection: string): string[] {
  const lines = projectSection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^hand-on projects$/i.test(line));

  const entries: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith("•")) {
      if (current.length > 0) {
        entries.push(current.join("\n"));
      }
      current = [line.replace(/^•\s*/, "").trim()];
    } else if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    entries.push(current.join("\n"));
  }

  return entries;
}

function detectProjectSpecificQuery(query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("project") ||
    normalized.includes("agentic rag") ||
    normalized.includes("sidekick app") ||
    normalized.includes("alex") ||
    normalized.includes("cyber-analyzer") ||
    normalized.includes("trade simulation")
  );
}

function pickBestProjectEntry(
  projectEntries: string[],
  query: string,
): string | null {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));

  let bestEntry = "";
  let bestScore = 0;

  for (const entry of projectEntries) {
    const lowerEntry = entry.toLowerCase();
    const score = terms.reduce(
      (count, term) => count + (lowerEntry.includes(term) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestEntry = entry;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestEntry : null;
}

function buildProjectSpecificContext(profileText: string, query: string): string {
  const projectsSection = getHandsOnProjectsSection(profileText);
  if (!projectsSection) {
    return "";
  }

  const entries = extractProjectEntries(projectsSection);
  if (entries.length === 0) {
    return "";
  }

  const matched = pickBestProjectEntry(entries, query);
  if (!matched) {
    return "";
  }

  const lines = matched.split("\n").slice(0, MAX_RELEVANT_PROJECT_LINES);
  return `Project-specific context:
${lines.join("\n")}

Instruction:
Answer only from this project context. Do not include details from other projects or general skills.`;
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
    return Response.json(
      {
        error: "Unexpected server error while contacting OpenRouter.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
