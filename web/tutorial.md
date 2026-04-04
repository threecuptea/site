# Beginner Tutorial: Building a Polished Next.js Portfolio with an AI Digital Twin

This tutorial explains how this project works from a beginner-friendly frontend perspective.  
You will learn what technologies are used, how the app flows end-to-end, and how key code pieces fit together.

---

## 1) Technology Summary

This project is a modern web app built with **Next.js App Router** and **TypeScript**.

### Core stack

- **Next.js (App Router)**: Full-stack React framework (UI + API routes in one project).
- **React**: Component-based UI rendering.
- **TypeScript**: Safer code with types.
- **Tailwind CSS**: Utility-first styling system for fast UI design.
- **OpenRouter API**: LLM gateway used for the digital twin chat model.
- **Model used**: `openai/gpt-oss-120b`.
- **React Markdown + remark-gfm**: Renders markdown answers cleanly in chat.

### Why this stack is useful for beginners

- You can build frontend and backend in one repo.
- You can style quickly without writing large CSS files.
- You can add AI features with a simple API route pattern.
- You get type checking and linting for fewer mistakes.

---

## 2) High-Level Walkthrough

At a high level, the app has two major parts:

1. **Portfolio page UI** (`app/page.tsx`)
2. **AI Digital Twin chat system** (`components/DigitalTwinChat.tsx` + `app/api/digital-twin/route.ts`)

### Request/response flow (chat)

1. User types a question in the chat widget.
2. `DigitalTwinChat` sends messages to `/api/digital-twin`.
3. The API route:
   - validates request messages,
   - loads profile knowledge from `profile.pdf`,
   - creates focused context,
   - calls OpenRouter with `openai/gpt-oss-120b`.
4. API streams text chunks back to frontend.
5. Frontend updates assistant message progressively and renders markdown.

---

## 3) Project Structure (Important Files)

- `app/page.tsx` - main portfolio page sections and composition.
- `components/DigitalTwinChat.tsx` - chat UI, client state, streaming handling, markdown display.
- `app/api/digital-twin/route.ts` - server route that talks to OpenRouter.
- `lib/digitalTwinKnowledge.server.ts` - reads full PDF profile text (server-only).
- `lib/digitalTwinContext.ts` - system prompt and suggested starter questions.
- `app/globals.css` - global app styling and base theme.

---

## 4) Detailed Code Review with Samples

## A) Landing page and section composition (`app/page.tsx`)

This file builds the full one-page website layout and includes the chat component.

```tsx
import { DigitalTwinChat } from "@/components/DigitalTwinChat";

export default function Home() {
  const linkedInUrl = "https://www.linkedin.com/in/sonya-ling";
  const githubUrl = "https://github.com/threecuptea";
  const futurePortfolioUrl = "https://example.com/portfolio";

  const careerMilestones = [
    { period: "2023 - 2025", role: "Staff Software Engineer, OpenX", impact: "..." },
    // ...
  ];
```

### Why this matters

- Static profile content is easy to maintain.
- `careerMilestones` uses an array, then maps to cards (clean and scalable).
- `DigitalTwinChat` is a reusable component inserted near the end of the page.

---

## B) Chat UI state + streaming (`components/DigitalTwinChat.tsx`)

This is a **client component** (`"use client"`) because it needs browser interactivity.

```tsx
"use client";
import { FormEvent, useMemo, useState } from "react";

const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
const [input, setInput] = useState("");
const [isSending, setIsSending] = useState(false);
```

### Sending a message

```tsx
const response = await fetch("/api/digital-twin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: nextMessages.slice(-MAX_HISTORY_FOR_API) }),
});
```

### Handling stream chunks

```tsx
const reader = response.body.getReader();
const decoder = new TextDecoder();
let streamedContent = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  streamedContent += decoder.decode(value, { stream: true });
  // update last assistant message incrementally
}
```

### Markdown rendering

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {normalizeAssistantMarkdown(message.content)}
</ReactMarkdown>
```

### Why this matters

- Creates a modern “typing” experience.
- Supports rich markdown answers (lists, code, links).
- Normalization fixes issues like raw `<br>` showing in response.

---

## C) API route and OpenRouter call (`app/api/digital-twin/route.ts`)

This is server code that handles chat requests securely.

### Basic route structure

```ts
export async function POST(request: Request) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return Response.json({ error: "Missing OPENROUTER_API_KEY..." }, { status: 500 });
  }
  // parse and validate request
  // build context
  // call OpenRouter
}
```

### OpenRouter request

```ts
const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Sonya Ling Digital Twin",
  },
  body: JSON.stringify({
    model: "openai/gpt-oss-120b",
    temperature: 0.35,
    messages: [/* system + context + chat history */],
  }),
});
```

### Context filtering logic

The route includes helper functions to:

- extract relevant lines from profile text based on user query,
- detect project-specific questions,
- isolate one project when asked (to avoid mixing unrelated projects),
- special-case certification queries for direct profile-based answers.

This is a practical pattern: **small retrieval layer before LLM call**.

---

## D) Reading full profile PDF (`lib/digitalTwinKnowledge.server.ts`)

The digital twin knowledge is derived from the complete `profile.pdf`.

```ts
export async function getDigitalTwinKnowledge(): Promise<string> {
  if (!profileKnowledgePromise) {
    profileKnowledgePromise = loadProfilePdfText().catch((error) => {
      profileKnowledgePromise = null;
      throw new Error(`Unable to parse profile.pdf ...`);
    });
  }
  const pdfText = await profileKnowledgePromise;
  if (!pdfText.length) throw new Error("profile.pdf was parsed but returned no text content.");
  return pdfText;
}
```

### Why this matters

- Uses caching (`profileKnowledgePromise`) to avoid re-parsing on every request.
- Keeps parsing on server side only.
- Gives the model full source material instead of a short hardcoded summary.

---

## E) Global styling basics (`app/globals.css`)

```css
:root {
  --background: #020617;
  --foreground: #e2e8f0;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}
```

The project uses mostly Tailwind classes for component-level styling, plus this file for app-wide theme variables and defaults.

---

## 5) How to Run Locally

From `web/`:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`

Requirements:

- `OPENROUTER_API_KEY` must be set (`.env` or `web/.env.local`).
- Profile data file should exist at `../profile.pdf` (relative to `web/`).

---

## 6) Beginner Tips for Understanding This Codebase

- Start from `app/page.tsx` to understand the visual page structure.
- Then read `DigitalTwinChat.tsx` to see frontend interaction patterns.
- Next read API route `app/api/digital-twin/route.ts` to understand backend flow.
- Finally inspect `lib` files to learn where prompts and profile data come from.

---

## 7) Self-Review: 5 Improvements to Make Next

1. **Replace heuristic retrieval with embeddings/RAG**
   - Current context matching uses keyword scoring. A vector-based retriever would improve precision.

2. **Add conversation memory controls**
   - Persist chat history per session and allow clear/export controls for better UX.

3. **Improve reliability with tests**
   - Add unit tests for parser helpers and integration tests for `/api/digital-twin`.

4. **Harden error handling and observability**
   - Add structured logs, retry strategy, timeout handling, and better user-facing fallback messages.

5. **Refactor route complexity**
   - `route.ts` has grown large; split helper functions into focused modules (`retrieval`, `formatting`, `policy`).

---

If you want, a next step can be a **Part 2 tutorial** that teaches how to add authentication and protect the chat API with simple rate limiting.
