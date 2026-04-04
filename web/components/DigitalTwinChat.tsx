"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  DIGITAL_TWIN_SUGGESTED_QUESTIONS,
  type ChatMessage,
} from "@/lib/digitalTwinContext";

const MAX_HISTORY_FOR_API = 12;

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I am Sonya's AI digital twin. Ask me about her career journey, engineering strengths, and technical leadership.",
};

function normalizeAssistantMarkdown(content: string): string {
  // Convert inline HTML line breaks and collapse spacing artifacts.
  const withLineBreaks = content.replace(/<br\s*\/?>/gi, "\n");

  return withLineBreaks
    .replace(/\t+/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ ]{2,}/g, " ").trimEnd())
    .join("\n");
}

export function DigitalTwinChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSend = useMemo(
    () => !isSending && input.trim().length > 0,
    [input, isSending],
  );

  async function sendMessage(messageText: string) {
    const userMessage: ChatMessage = {
      role: "user",
      content: messageText.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/digital-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-MAX_HISTORY_FOR_API),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Unable to get a response.");
      }

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const textChunk = decoder.decode(value, { stream: true });
        streamedContent += textChunk;

        setMessages((current) => {
          const next = [...current];
          const lastIndex = next.length - 1;
          const lastMessage = next[lastIndex];

          if (!lastMessage || lastMessage.role !== "assistant") {
            return current;
          }

          next[lastIndex] = {
            ...lastMessage,
            content: streamedContent,
          };

          return next;
        });
      }

      if (!streamedContent.trim()) {
        throw new Error("Model returned an empty response.");
      }
    } catch (error) {
      setMessages((current) => {
        const next = [...current];
        const lastIndex = next.length - 1;
        const lastMessage = next[lastIndex];
        if (lastMessage?.role === "assistant" && !lastMessage.content.trim()) {
          next.pop();
        }
        return next;
      });

      const nextError =
        error instanceof Error
          ? error.message
          : "Unexpected error while sending message.";
      setErrorMessage(nextError);
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    await sendMessage(input);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/55 p-6 shadow-2xl shadow-indigo-950/25 backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            AI Digital Twin
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Ask about Sonya&apos;s career
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Powered by OpenRouter using `openai/gpt-oss-120b`, grounded in
            Sonya&apos;s professional profile.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {DIGITAL_TWIN_SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isSending}
            onClick={() => sendMessage(question)}
            className="rounded-full border border-cyan-300/30 bg-cyan-300/5 px-3 py-1.5 text-xs text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="mt-6 max-h-[24rem] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        {messages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          return (
            <article
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isAssistant
                  ? "border border-indigo-300/20 bg-indigo-400/10 text-slate-100"
                  : "ml-auto border border-cyan-300/20 bg-cyan-400/10 text-cyan-50"
              }`}
            >
              <p className="mb-1 text-[11px] uppercase tracking-[0.15em] text-slate-400">
                {isAssistant ? "Digital Twin" : "You"}
              </p>
              {isAssistant ? (
                <div className="[&_a]:text-cyan-200 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-900/70 [&_code]:px-1 [&_code]:py-0.5 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900/80 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizeAssistantMarkdown(message.content)}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </article>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
          placeholder="Ask about experience, skills, projects, or leadership..."
          className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {errorMessage ? (
        <p className="mt-3 text-sm text-rose-300">{errorMessage}</p>
      ) : null}
    </section>
  );
}
