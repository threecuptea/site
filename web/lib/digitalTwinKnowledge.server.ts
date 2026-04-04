import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let profileKnowledgePromise: Promise<string> | null = null;

async function loadProfilePdfText(): Promise<string> {
  const profilePdfPath = path.resolve(process.cwd(), "../profile.pdf");
  await readFile(profilePdfPath);

  const extractorScript = `
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

const targetPath = process.argv[1];
const buffer = await readFile(targetPath);
const parser = new PDFParse({ data: buffer });

try {
  const result = await parser.getText();
  process.stdout.write(result.text ?? "");
} finally {
  await parser.destroy();
}
  `;

  const { stdout } = await execFileAsync(
    process.execPath,
    ["--input-type=module", "-e", extractorScript, profilePdfPath],
    {
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  return stdout.trim();
}

export async function getDigitalTwinKnowledge(): Promise<string> {
  if (!profileKnowledgePromise) {
    profileKnowledgePromise = loadProfilePdfText().catch((error) => {
      profileKnowledgePromise = null;
      throw new Error(
        `Unable to parse profile.pdf for digital twin knowledge: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    });
  }

  const pdfText = await profileKnowledgePromise;
  if (!pdfText.length) {
    profileKnowledgePromise = null;
    throw new Error("profile.pdf was parsed but returned no text content.");
  }

  return pdfText;
}
