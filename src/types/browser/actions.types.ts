import { z } from "zod";

const Click = z.object({
  kind: z.literal("Click").describe("Click on an element"),
  index: z.number().describe("The index of the aria tree"),
});

const Type = z.object({
  kind: z.literal("Type").describe("Type text into an input"),
  index: z
    .number()
    .describe(
      "The index of the elements in the aria tree. This should be an element that you can enter text such as textarea, combobox, textbox, or searchbox"
    ),
  text: z.string().describe("The text to enter"), // input text
});

const Enter = z.object({
  kind: z.literal("Enter"),
  index: z.number(),
});

const Back = z.object({
  kind: z.literal("Back").describe("Go back to the previous page"),
});

const Wait = z.object({
  kind: z.literal("Wait").describe("Wait for a certain amount of time"),
});

const Hover = z.object({
  kind: z.literal("Hover").describe("Hover over an element"),
  index: z.number(),
});

const Scroll = z.object({
  kind: z.literal("Scroll").describe("Scroll the page up or down"),
  direction: z.enum(["up", "down"]).describe("The direction to scroll"),
});

export const BrowserAction = z.union([
  Type,
  Click,
  Wait,
  Back,
  Enter,
  Hover,
  Scroll,
]);

export type BrowserAction = z.infer<typeof BrowserAction>;

export const BrowserActionArray = z.array(BrowserAction).min(1);
export type BrowserActionArray = z.infer<typeof BrowserActionArray>;
