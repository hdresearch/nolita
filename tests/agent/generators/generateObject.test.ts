import { describe, expect, it } from "@jest/globals";
import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt, generateObject, getPrompt } from "../../../src/agent";
import { ProviderConfig } from "../../../src/agent/config";
import { z } from "zod";

describe("generateObjectLocal", () => {
  it("Should generate an object using the top level function", async () => {
    const messages = commandPrompt(objectiveStateExample1);
    const providerConfig: ProviderConfig = {
      provider: "openai",
      model: "gpt-4-turbo",
      apiKey: process.env.OPENAI_API_KEY!,
    };
    const res = await generateObject(providerConfig, messages, {
      schema: ModelResponseSchema(),
      name: "ModelResponseSchema",
      model: providerConfig.model,
      objectMode: "TOOLS",
    });

    const parsedRes = ModelResponseSchema().parse(res);

    expect(parsedRes.command[0].kind).toBeDefined();
  });

  it.skip("Should generate an object using the top level function with local provider", async () => {
    const ariaTreeExample =
      '"[0,"RootWebArea","About - High Dimensional Research",[[1,"link","HIGH DIMENSIONAL RESEARCH"],"⚲",[2,"link","NOLITA↗"],[3,"link","MEMORY INDEX"],[4,"link","BLOG"],[5,"link","DOCUMENTATION"],[6,"link","COMPANY"],[7,"heading","We *connect and empower++ new intelligence. "],"WE WANT THE WORLD...","+===+==========================================+\n| 1 | to have a diversity of models,           |\n+---+------------------------------------------+\n| 2 | working as closely together as possible, |\n+---+------------------------------------------+\n| 3 | as productively as possible,             |\n+---+------------------------------------------+\n| 4 | for the betterment of mankind.           |\n+---+------------------------------------------+","We build software for and between models, with a goal of leveraging and coordinating models for autonomous tasks.","",[8,"heading","### TEAM"],[9,"heading","Gates Torrey"],"finance, operations",[10,"link","gates.torrey@hdr.is"],[11,"heading","Tynan Daly"],"product, back-end",[12,"link","tynan.daly@hdr.is"],[13,"heading","Matilde Park"],"product, front-end",[14,"link","matilde.park@hdr.is"],[15,"link","CAREERS →"],[16,"link","JOIN THE MAILING LIST"],[17,"link","DASHBOARD "],"HIGH DIMENSIONAL RESEARCH",[18,"heading","CORE"],[19,"link","NOLITA"],[20,"link","MEMORY INDEX"],[21,"link","BLOG"],[22,"heading","TECHNICAL"],[23,"link","MEMORY API"],[24,"link","GITHUB"],[25,"heading","COMPANY"],[26,"link","PEOPLE"],[27,"link","CAREERS"],[28,"link","TWITTER"],[29,"heading","SUPPORT"],[30,"link","DISCORD"],"SUPPORT@HDR.IS",[31,"link","PRIVACY POLICY"],[32,"link","TERMS OF SERVICE"]]]"';
    const messages = getPrompt(ariaTreeExample);
    const providerConfig: ProviderConfig = {
      provider: "local",
      model: "/Users/tynandaly/basin/hdr/browser/capybarahermes-2.5-mistral-7b.Q2_K.gguf",
      apiKey: "null",
    };

    const res = await generateObject(providerConfig, messages, {
      schema: z.object({ emails: z.array(z.string()) }),
      name: "ModelResponseSchema",
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
    });

    expect(res.emails).toContain("matilde.park@hdr.is");
  });
});
