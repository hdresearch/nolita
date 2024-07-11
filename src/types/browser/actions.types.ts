import { z } from "zod";

export const Click = z.object({
  kind: z.literal("Click").describe("Click on an element"),
  index: z.number().describe("The index of the aria tree"),
});

export const Type = z.object({
  kind: z.literal("Type").describe("Type text into an input"),
  index: z
    .number()
    .describe(
      "The index of the elements in the aria tree. This should be an element that you can enter text such as textarea, combobox, textbox, or searchbox"
    ),
  text: z.string().describe("The text to enter"), // input text
});

export const Enter = z.object({
  kind: z.literal("Enter"),
  index: z.number(),
});

export const Back = z.object({
  kind: z.literal("Back").describe("Go back to the previous page"),
});

export const Wait = z.object({
  kind: z.literal("Wait").describe("Wait for a certain amount of time"),
});

export const Hover = z.object({
  kind: z.literal("Hover").describe("Hover over an element"),
  index: z.number(),
});

export const Scroll = z.object({
  kind: z.literal("Scroll").describe("Scroll the page up or down"),
  direction: z.enum(["up", "down"]).describe("The direction to scroll"),
});

export const GoTo = z.object({
  kind: z.literal("GoTo").describe("Go to a specific URL"),
  url: z.string().url().describe("The URL to navigate to"),
});

export const Get = z.object({
  kind: z.literal("Get").describe("Get information from the page"),
  request: z.string().describe("The request to get from the page"),
  type: z
    .enum(["html", "aria", "markdown", "text", "image"])
    .default("aria")
    .describe("The format inspect the page"),
});

export const BrowserAction = z.union([
  Type,
  Click,
  Wait,
  Back,
  Enter,
  Hover,
  Scroll,
  GoTo,
  Get,
]);

export type BrowserAction = z.infer<typeof BrowserAction>;

export const BrowserActionArray = z.array(BrowserAction).min(1);
export type BrowserActionArray = z.infer<typeof BrowserActionArray>;
