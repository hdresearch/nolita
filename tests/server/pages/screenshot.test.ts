import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { newPageHelper } from "../../helpers/newPageHelper";
import { generateUUID } from "../../../src/utils";

export const app = createAdaptorServer(setupServer());

describe("pageApi -- screenshot", () => {
  let sessionId: string;
  let pageId: string;

  beforeAll(async () => {
    const res = await newPageHelper(app);
    sessionId = res.sessionId;
    pageId = res.pageId;
    await request(app)
      .post(`/${sessionId}/page/${pageId}/goto`)
      .set("Content-Type", "application/json")
      .send({ url: "https://hdr.is" })
      .expect(200)
      .expect((res) => {
        expect(res.body.url).toBe("https://hdr.is/");
      });
  });

  it("should take a screenshot of a page -- base64", async () => {
    await request(app)
      .get(`/${sessionId}/page/${pageId}/screenshot/base64`)
      .expect(200)
      .expect((res) => {
        expect(res.body.image).toBeDefined();
      });
  });

  it("should take a screenshot of a page -- dataUrl", async () => {
    await request(app)
      .get(`/${sessionId}/page/${pageId}/screenshot/dataUrl`)
      .expect(200)
      .expect((res) => {
        expect(res.body.image).toMatch(/^data:image\/png;base64,/);
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
