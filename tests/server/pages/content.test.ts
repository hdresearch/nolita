import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { newPageHelper } from "../../helpers/newPageHelper";
import { generateUUID } from "../../../src/utils";

export const app = createAdaptorServer(setupServer());

describe("pageApi -- content", () => {
  let sessionId: string;
  let pageId: string;

  beforeAll(async () => {
    const res = await newPageHelper(app);
    sessionId = res.sessionId;
    pageId = res.pageId;

    await request(app)
      .post(`/${sessionId}/page/${pageId}/goto`)
      .set("Content-Type", "application/json")
      .send({ url: "https://example.com/" })
      .expect(200)
      .expect((res) => {
        expect(res.body.url).toBe("https://example.com/");
      });
  });

  it("should get content of the page -- html", async () => {
    await request(app)
      .get(`/${sessionId}/page/${pageId}/content/html`)
      .expect(200)
      .expect(async (res) => {
        expect(res.body.type).toBe("html");
        expect(res.body.pageContent).toContain(
          '<a href="https://www.iana.org/domains/example">More information...</a>',
        );
      });
  });

  it("should get content of the page -- markdown", async () => {
    await request(app)
      .get(`/${sessionId}/page/${pageId}/content/markdown`)
      .expect(200)
      .expect(async (res) => {
        expect(res.body.type).toBe("markdown");
        expect(res.body.pageContent).toContain(
          "[More information...](https://www.iana.org/domains/example)",
        );
      });
  });

  it("should get content of the page -- text", async () => {
    await request(app)
      .get(`/${sessionId}/page/${pageId}/content/text`)
      .expect(200)
      .expect(async (res) => {
        expect(res.body.type).toBe("text");
        expect(res.body.pageContent).toContain(
          "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
        );
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
