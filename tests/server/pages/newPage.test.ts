import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { generateUUID } from "../../../src/utils";

const app = createAdaptorServer(setupServer());

describe("pageApi -- newPage", () => {
  let sessionId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/browser/session/launch")
      .set("Content-Type", "application/json")
      .send({
        headless: true,
        agent: {
          apiKey: process.env.OPENAI_API_KEY!,
          provider: "openai",
          model: "gpt-4-turbo",
        },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.sessionId).toBeDefined();
        expect(BROWSERS.get(res.body.sessionId)).toBeDefined();
        expect(BROWSERS.get(res.body.sessionId)?.pages.size).toBe(0);
      });
    sessionId = res.body.sessionId;
  });

  it("should create a new page", async () => {
    console.log("sessionId", sessionId);

    await request(app)
      .get(`/${sessionId}/page/newPage`)
      .expect(200)
      .expect((res) => {
        expect(res.body.pageId).toBeDefined();
        expect(
          BROWSERS.get(sessionId)?.pages.get(res.body.pageId),
        ).toBeDefined();
      });
  });

  it("should return an error if the browser is not found", async () => {
    await request(app)
      .get(`/${generateUUID()}/page/newPage`)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe("Browser session not found");
      });
  });

  afterAll(async () => {
    BROWSERS.forEach(async (browser) => await browser.close());
  });
});
