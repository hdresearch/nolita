import request from "supertest";

export async function newPageHelper(app: any) {
  const agent = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    model: "gpt-4",
  };

  const launchRes = await request(app)
    .post("/browser/session/launch")
    .set("Content-Type", "application/json")
    .send({
      headless: true,
      agent,
    });

  const sessionId = launchRes.body.sessionId;

  const pageRes = await request(app).get(`/${sessionId}/page/newPage`);

  return { sessionId, pageId: pageRes.body.pageId };
}
