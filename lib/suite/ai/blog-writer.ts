import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const blogWriterModel = "claude-sonnet-5-5";

export const blogDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  body: z.string().min(1),
});

export type BlogDraftOutput = z.infer<typeof blogDraftSchema>;

export type BlogDraftInput = {
  orgName: string;
  topic: string;
  keyPoints: string;
  length: "short" | "medium";
};

// Errors with messages that are safe to show to the signed-in user.
export class BlogWriterError extends Error {}

const lengthGuide: Record<BlogDraftInput["length"], string> = {
  short: "about 500 words",
  medium: "about 900 words",
};

// Kept static so the prompt prefix stays cacheable across requests.
const systemPrompt = `You write blog posts for a business that publishes its own blog. Each draft is reviewed by a person before it goes live, so write it to be checked, not trusted.

Rules:
- Write plain paragraphs separated by one blank line. No markdown, headings, bullet lists, or links.
- Do not invent statistics, prices, customer names, certifications, dates, or quotes. If a claim needs support that was not provided, write it as [VERIFY: what needs checking] so the reviewer can find it.
- Match the company name and any key points the user gives. Do not add products or services they did not mention.
- Keep the tone clear, direct, and useful to the reader. Avoid filler and clichés.
- The slug is lowercase words joined by hyphens, with no more than 8 words.

Return the title, slug, and body.`;

function buildUserPrompt(input: BlogDraftInput) {
  const keyPoints = input.keyPoints.trim() || "None given. Write from the topic alone and keep claims general.";

  return [
    `Company: ${input.orgName}`,
    `Topic: ${input.topic}`,
    `Key points to cover:\n${keyPoints}`,
    `Target length: ${lengthGuide[input.length]}`,
  ].join("\n\n");
}

// Drafts one blog post. The server-side fallback reruns a refused request on a
// backup model, so a single decline does not end the job. The SDK reads
// ANTHROPIC_API_KEY from the environment, and the key never reaches the browser.
export async function writeBlogDraft(input: BlogDraftInput): Promise<BlogDraftOutput & { model: string }> {
  const client = new Anthropic();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: blogWriterModel,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(blogDraftSchema),
      },
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new BlogWriterError("The AI writer is not configured. Check ANTHROPIC_API_KEY on the server.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new BlogWriterError("The AI writer is busy right now. Wait a minute and try again.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new BlogWriterError(`The AI writer returned an error (${error.status}). Try again.`);
    }
    // The SDK throws, rather than returning null, when the output does not match the schema.
    throw new BlogWriterError("The draft came back in an unexpected format. Try again.");
  }

  if (response.stop_reason === "refusal") {
    throw new BlogWriterError("The writer declined this topic. Try a different angle or rephrase the key points.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new BlogWriterError("The draft ran out of room. Try a shorter target length.");
  }
  if (!response.parsed_output) {
    throw new BlogWriterError("The draft could not be read back. Try again.");
  }

  return { ...response.parsed_output, model: response.model };
}
