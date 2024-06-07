import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { newPageHelper } from "../../helpers/newPageHelper";
import { generateUUID } from "../../../src/utils";

export const app = createAdaptorServer(setupServer());

describe("pageApi -- goto", () => {
  let sessionId: string;
  let pageId: string;

  beforeAll(async () => {
    const res = await newPageHelper(app);
    sessionId = res.sessionId;
    pageId = res.pageId;
  });

  it("should goto a page", async () => {
    await request(app)
      .post(`/${sessionId}/page/${pageId}/goto`)
      .set("Content-Type", "application/json")
      .send({ url: "https://hdr.is" })
      .expect(200)
      .expect((res) => {
        expect(res.body.url).toBe("https://hdr.is/");
      });
  });

  it("should return an error if the page is not found", async () => {
    await request(app)
      .get(`/${sessionId}/page/${generateUUID()}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe("Page not found");
      });
  });

  it("should return an error if the browser is not found", async () => {
    await request(app)
      .get(`/${generateUUID()}/page/${pageId}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe("Browser session not found");
      });
  });

  afterAll(async () => {
    BROWSERS.forEach(async (browser) => await browser.close());
  });
});
