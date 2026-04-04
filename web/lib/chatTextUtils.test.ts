import { describe, expect, it } from "vitest";

import { normalizeAssistantMarkdown } from "./chatTextUtils";

describe("normalizeAssistantMarkdown", () => {
  it("converts <br> variants into newline breaks", () => {
    const input = "Line 1<br>Line 2<br/>Line 3<br />Line 4";
    const output = normalizeAssistantMarkdown(input);
    expect(output).toBe("Line 1\nLine 2\nLine 3\nLine 4");
  });

  it("replaces tabs and collapses spacing artifacts", () => {
    const input = "A\t\tB\nC    D";
    const output = normalizeAssistantMarkdown(input);
    expect(output).toBe("A B\nC D");
  });
});
