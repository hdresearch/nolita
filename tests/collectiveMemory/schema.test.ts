import { describe, expect, it } from "@jest/globals";
import { CollectiveMemoryConfig } from "../../src/types/collectiveMemory";

describe("CollectiveMemoryConfig", () => {
  it("should parse when filled", () => {
    const cmConfig = CollectiveMemoryConfig.safeParse({
      endpoint: "https://api.hdr.is",
    });

    expect(cmConfig.success).toBe(true);
  });

  it("should parse when empty", () => {
    const cmConfigSafe = CollectiveMemoryConfig.safeParse({});
    const cmConfig = CollectiveMemoryConfig.parse({});

    expect(cmConfigSafe.success).toBe(true);
    expect(cmConfig.endpoint).toBe("https://api.hdr.is/");
    expect(cmConfig.apiKey).toBe(null);
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
    expect(cmConfig.apiKey).toBe(null);
  });

  it("should load from env", () => {
    process.env.HDR_ENDPOINT = "https://example.com";
    process.env.HDR_API_KEY = "abc123";

    const cmConfig = CollectiveMemoryConfig.parse({});

    expect(cmConfig.endpoint).toBe("https://example.com");
    expect(cmConfig.apiKey).toBe("abc123");
  });
});
