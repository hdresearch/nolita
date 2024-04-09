import { describe, expect, it, beforeEach } from "@jest/globals";
import { CollectiveMemoryConfig } from "../../src/types/collectiveMemory";

describe("CollectiveMemoryConfig", () => {
  beforeEach(() => {
    // Set the environment variable before each test
    process.env.HDR_ENDPOINT = "https://api.hdr.is";
    process.env;
  });

  it("should parse when filled", () => {
    const cmConfig = CollectiveMemoryConfig.safeParse({
      endpoint: "https://api.hdr.is",
    });

    expect(cmConfig.success).toBe(true);
  });

  it("should parse when empty", () => {
    delete process.env.HDR_API_KEY;
    delete process.env.HDR_ENDPOINT;
    const cmConfigSafe = CollectiveMemoryConfig.safeParse({});
    const cmConfig = CollectiveMemoryConfig.parse({});

    expect(cmConfigSafe.success).toBe(true);
    expect(cmConfig.endpoint).toBe("https://api.hdr.is");
    expect(cmConfig.apiKey).toBe(undefined);
  });

  it("should parse when missing apiKey", () => {
    const cmConfigSafe = CollectiveMemoryConfig.safeParse({
      endpoint: "https://api.hdr.is",
    });

    const cmConfig = CollectiveMemoryConfig.parse({
      endpoint: "https://api.hdr.is",
    });

    expect(cmConfigSafe.success).toBe(true);
    expect(cmConfig.endpoint).toBe("https://api.hdr.is");
    expect(cmConfig.apiKey).toBe(undefined);
  });

  it("should load from env", () => {
    const cmConfig = CollectiveMemoryConfig.parse({});

    expect(cmConfig.endpoint).toBe(process.env.HDR_ENDPOINT);
    expect(cmConfig.apiKey).toBe(process.env.HDR_API_KEY);
  });
});
