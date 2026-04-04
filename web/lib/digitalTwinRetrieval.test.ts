import { describe, expect, it } from "vitest";

import {
  buildFocusedProfileContext,
  extractProjectEntries,
  extractSection,
  pickBestProjectEntry,
} from "./digitalTwinRetrieval";

const PROFILE_TEXT = `
Summary
Experienced engineer.

Hand-on Projects
• Agentic RAG (Feb 2026)
Built healthcare Q&A with hybrid retrieval and reranking.
• Sidekick App (Dec 2025)
Developed a LangGraph multi-agent app with memory.

Certifications
• AI Engineer Production Track: Deploy LLMs & Agents at Scale (Udemy, Mar 2026)
Education
• MBA
`.trim();

describe("extractSection", () => {
  it("returns the section body until next section", () => {
    const section = extractSection(PROFILE_TEXT, "Certifications", ["Education"]);
    expect(section).toContain("Certifications");
    expect(section).toContain("AI Engineer Production Track");
    expect(section).not.toContain("• MBA");
  });
});

describe("buildFocusedProfileContext", () => {
  it("returns focused excerpts and certifications when query has terms", () => {
    const focused = buildFocusedProfileContext(PROFILE_TEXT, "agentic rag details");
    expect(focused).toContain("Relevant excerpts:");
    expect(focused).toContain("Agentic RAG");
    expect(focused).toContain("Certifications section:");
  });
});

describe("extractProjectEntries", () => {
  it("splits bullet projects into individual entries", () => {
    const projects = extractSection(PROFILE_TEXT, "Hand-on Projects", [
      "Certifications",
    ]);
    const entries = extractProjectEntries(projects);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain("Agentic RAG");
    expect(entries[1]).toContain("Sidekick App");
  });
});

describe("pickBestProjectEntry", () => {
  it("picks the best matching project for a query", () => {
    const entries = [
      "Agentic RAG (Feb 2026)\nBuilt healthcare Q&A with hybrid retrieval",
      "Sidekick App (Dec 2025)\nDeveloped a LangGraph multi-agent app",
    ];
    const best = pickBestProjectEntry(entries, "Tell me about agentic rag");
    expect(best).toContain("Agentic RAG");
  });
});
