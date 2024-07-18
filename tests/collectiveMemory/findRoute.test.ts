import { describe, expect, it } from "@jest/globals";
import { findRoute, fetchRoute } from "../../src/collectiveMemory/remember";

describe("Fetch Route", () => {
  it("should fetch route", async () => {
    const res = await fetchRoute(
      {
        url: "http://shop.junglegym.ai/customer/account/login",
        objective:
          "please login into the website then tell me the order total for the five most recent orders",
      },
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: process.env.HDR_ENDPOINT!,
      },
    );
    expect(res.length).toBeGreaterThan(0);
  });
});

describe("Find Route", () => {
  it("should find route", async () => {
    const res = await findRoute(
      {
        url: "http://shop.junglegym.ai/customer/account/login",
        objective:
          "please login into the website then tell me the order total for the five most recent orders",
      },
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: process.env.HDR_ENDPOINT!,
      },
    );
    expect(res!.length).toBeGreaterThan(0);
  });
});
