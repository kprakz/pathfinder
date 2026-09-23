import { z } from "zod";

/** What the browser sends to /api/path. */
export const PathRequestSchema = z.object({
  topic: z.string().trim().min(1, "Enter a skill or topic").max(120),
  level: z.enum(["none", "some", "intermediate"]).optional(),
  hoursPerWeek: z.number().int().min(1).max(80).optional(),
  goal: z.enum(["hobby", "job", "exam"]).optional(),
});

export type PathRequest = z.infer<typeof PathRequestSchema>;

/** The learning path Claude must return. Used both for structured output and validation. */
export const StageSchema = z.object({
  title: z.string().describe("Short stage name"),
  duration: z.string().describe('Estimated duration, e.g. "2–3 weeks"'),
  concepts: z.array(z.string()).min(3).max(6).describe("Short bullets of concepts to learn"),
  practice: z.array(z.string()).min(1).max(2).describe("Hands-on practice tasks"),
  checkpoint: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("\"You're ready to move on when…\" criteria: concrete and testable"),
  resources: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe('Kinds of resources, e.g. "an intro video course". Never URLs or invented titles.'),
});

export const LearningPathSchema = z.object({
  summary: z.string().describe('One line on what "competent" means for this skill'),
  stages: z.array(StageSchema).min(4).max(6),
  finishLine: z.object({
    name: z.string().describe("Name of the final project or test"),
    description: z.string().describe("What to do and how it proves competence"),
  }),
  pitfalls: z.array(z.string()).length(3),
});

export type Stage = z.infer<typeof StageSchema>;
export type LearningPath = z.infer<typeof LearningPathSchema>;

/** Newline-delimited JSON events streamed from /api/path. */
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; path: LearningPath }
  | { type: "error"; message: string };
