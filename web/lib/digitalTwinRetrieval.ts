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

export function extractSection(
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

export function buildFocusedProfileContext(
  profileText: string,
  query: string,
): string {
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

function getHandsOnProjectsSection(profileText: string): string {
  return extractSection(profileText, "Hand-on Projects", ["Certifications"]);
}

export function extractProjectEntries(projectSection: string): string[] {
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

export function pickBestProjectEntry(
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

export function detectProjectSpecificQuery(query: string): boolean {
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

export function buildProjectSpecificContext(
  profileText: string,
  query: string,
): string {
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

export function formatSectionList(sectionText: string): string[] {
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
