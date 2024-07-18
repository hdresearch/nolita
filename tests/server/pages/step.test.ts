import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { newPageHelper } from "../../helpers/newPageHelper";
import { generateUUID } from "../../../src/utils";

export const app = createAdaptorServer(setupServer());

describe("pageApi -- step", () => {
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
      .expect(200);

    await request(app)
      .post(`/${sessionId}/page/${pageId}/goto`)
      .set("Content-Type", "application/json")
      .send({ url: "https://example.com" })
      .expect(200);
  });

  it("should perform a step", async () => {
    await request(app)
      .post(`/${sessionId}/page/${pageId}/step`)
      .set("Content-Type", "application/json")
      .send({ command: "click the more information link" })
      .expect(200)
      .expect((res) => {
        expect(res.body.state.url).toBe(
          "https://www.iana.org/help/example-domains",
        );
      });
  }, 20000);

  // TODO: fix this test
  // it("should retrieve the page info", async () => {
  //   await request(app)
  //     .post(`/${sessionId}/page/${pageId}/step`)
  //     .set("Content-Type", "application/json")
  //     .send({
  //       command: "describe the purpose of the page",
  //       schema: {
  //         type: "object",
  //         title: "pagePurpose",
  //         properties: {
  //           purpose: {
  //             type: "string",
  //             description: "The purpose of the page",
  //           },
  //         },
  //       },
  //     })
  //     .expect(200)
  //     .expect((res) => {
  //       expect(res.body.result).toBeDefined();
  //     });
  // }, 20000);

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
