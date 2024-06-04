import { describe, expect, it, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";

export const app = createAdaptorServer(setupServer());

describe("Browser API", () => {
  const app = createAdaptorServer(setupServer());

  const agent = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    model: "gpt-4-turbo",
  };

  it("should launch a browser", async () => {
    await request(app)
      .post("/browser/session/launch")
      .set("Content-Type", "application/json")
      .send({
        headless: true,
        agent,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.sessionId).toBeDefined();
        expect(BROWSERS.get(res.body.sessionId)).toBeDefined();
        expect(BROWSERS.get(res.body.sessionId)?.pages.size).toBe(0);
      });
  });

  afterAll(async () => {
    BROWSERS.forEach(async (browser) => await browser.close());
  });
});
