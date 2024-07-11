import { setupServer } from "../src/server";
import { createAdaptorServer } from "@hono/node-server";

import request from "supertest";
import fs from "fs";

async function main() {
  const app = createAdaptorServer(setupServer());
  const res = await request(app).get("/doc");
  fs.writeFileSync("openapi.json", JSON.stringify(res.body, null, 2));
}

main();
