import { describe, expect, it } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";

const app = createAdaptorServer(setupServer());

describe("Browser close API", () => {
  it("should close a browser", async () => {
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

    const sessionId = res.body.sessionId;

    await request(app)
      .get(`/browser/${sessionId}/close`)
      .set("Content-Type", "application/json")
      .expect(200)
      .expect((res) => {
        expect(BROWSERS.get(res.body.sessionId)).toBeUndefined();
      });

    expect(BROWSERS.get(sessionId)).toBeUndefined();
  });
});
