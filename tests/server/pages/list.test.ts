import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { createAdaptorServer } from "@hono/node-server";
import { setupServer } from "../../../src/server/index";
import { BROWSERS } from "../../../src/server/browser/launch";
import { newPageHelper } from "../../helpers/newPageHelper";
import { generateUUID } from "../../../src/utils";

export const app = createAdaptorServer(setupServer());

describe("pageApi -- list", () => {
  let sessionId: string;
  let pageId: string;

  beforeAll(async () => {
    const res = await newPageHelper(app);
    sessionId = res.sessionId;
    pageId = res.pageId;
  });

  it("should list all pages", async () => {
    await request(app)
      .get(`/${sessionId}/pages`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          { id: pageId, url: "about:blank", title: "", progress: [] },
        ]);
      });
  });

  it("should return an error if the browser is not found", async () => {
    await request(app).get(`/${generateUUID()}/page`).expect(404);
  });

  afterAll(async () => {
    BROWSERS.forEach(async (browser) => await browser.close());
  });
});
