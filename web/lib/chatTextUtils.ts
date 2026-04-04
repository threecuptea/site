export function normalizeAssistantMarkdown(content: string): string {
  // Convert inline HTML line breaks and collapse spacing artifacts.
  const withLineBreaks = content.replace(/<br\s*\/?>/gi, "\n");

  return withLineBreaks
    .replace(/\t+/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ ]{2,}/g, " ").trimEnd())
    .join("\n");
}
