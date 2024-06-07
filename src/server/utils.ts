import { jsonSchemaToZod } from "json-schema-to-zod";
import { z } from "zod";
import * as fs from "fs";

import { ErrorSchema } from "./schema";

import { BROWSERS } from "./browser/launch";
import { Browser } from "../browser";

export async function jsonToZod(jsonObject: any): Promise<any> {
  const _module = jsonSchemaToZod(jsonObject, { module: "cjs" });

  // this is very dangerous and we need to be careful
  const a = eval(_module);

  return a;
}

export async function getBrowserSession(browserSession: string) {
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    throw ErrorSchema.parse({
      message: "Browser session not found",
      code: 400,
    });
  }

  return browser;
}

export async function getPage(browserSession: string, pageId: string) {
  const browser = await getBrowserSession(browserSession);

  const page = browser.pages.get(pageId);

  if (!page) {
    throw ErrorSchema.parse({
      message: "Page not found",
      code: 400,
    });
  }

  return page;
}

export class BrowserStore {
  browsers: Map<string, Browser>;

  constructor() {
    this.browsers = new Map<string, Browser>();
  }

  async get(browserSession: string) {
    const browser = this.browsers.get(browserSession);

    if (!browser) {
      throw ErrorSchema.parse({
        message: "Browser session not found",
        code: 400,
      });
    }

    return browser;
  }

  async set(browserSession: string, browser: any) {
    this.browsers.set(browserSession, browser);
  }

  async close() {
    this.browsers.forEach(async (browser) => await browser.close());
  }
}
