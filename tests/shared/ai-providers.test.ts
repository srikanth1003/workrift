import { describe, it, expect } from "vitest";
import {
  providers,
  getProvider,
  type AIConfig,
  type ProviderDefinition,
} from "@shared/ai-providers";

describe("ai-providers", () => {
  it("exports all 5 providers", () => {
    expect(providers).toHaveLength(5);
    const names = providers.map((p) => p.name);
    expect(names).toContain("anthropic");
    expect(names).toContain("openai");
    expect(names).toContain("google");
    expect(names).toContain("aws");
    expect(names).toContain("azure");
  });

  it("getProvider returns the correct provider by name", () => {
    const anthropic = getProvider("anthropic");
    expect(anthropic).toBeDefined();
    expect(anthropic!.label).toBe("Anthropic");
  });

  it("getProvider returns undefined for unknown provider", () => {
    expect(getProvider("nonexistent")).toBeUndefined();
  });

  it("each provider has at least one credential field", () => {
    for (const provider of providers) {
      expect(provider.credentialFields.length).toBeGreaterThan(0);
    }
  });

  it("each provider except azure has at least one default model", () => {
    for (const provider of providers) {
      if (provider.name === "azure") continue;
      expect(provider.models.length).toBeGreaterThan(0);
    }
  });

  it("anthropic provider requires only apiKey", () => {
    const anthropic = getProvider("anthropic")!;
    const required = anthropic.credentialFields.filter((f) => f.required);
    expect(required).toHaveLength(1);
    expect(required[0].key).toBe("apiKey");
  });

  it("aws provider requires accessKeyId, secretAccessKey, region", () => {
    const aws = getProvider("aws")!;
    const required = aws.credentialFields.filter((f) => f.required);
    const keys = required.map((f) => f.key);
    expect(keys).toContain("accessKeyId");
    expect(keys).toContain("secretAccessKey");
    expect(keys).toContain("region");
  });

  it("createModel returns a model instance for anthropic", () => {
    const anthropic = getProvider("anthropic")!;
    const model = anthropic.createModel(
      { apiKey: "test-key" },
      "claude-sonnet-4-6-20250514"
    );
    expect(model).toBeDefined();
  });

  it("createModel returns a model instance for openai", () => {
    const openai = getProvider("openai")!;
    const model = openai.createModel({ apiKey: "test-key" }, "gpt-4o");
    expect(model).toBeDefined();
  });

  it("createModel returns a model instance for google", () => {
    const google = getProvider("google")!;
    const model = google.createModel(
      { apiKey: "test-key" },
      "gemini-2.5-flash"
    );
    expect(model).toBeDefined();
  });

  it("createModel returns a model instance for aws", () => {
    const aws = getProvider("aws")!;
    const model = aws.createModel(
      {
        accessKeyId: "AKIA_TEST",
        secretAccessKey: "secret",
        region: "us-east-1",
      },
      "us.anthropic.claude-sonnet-4-6-v1"
    );
    expect(model).toBeDefined();
  });

  it("createModel returns a model instance for azure", () => {
    const azure = getProvider("azure")!;
    const model = azure.createModel(
      {
        azureEndpoint: "https://myresource.openai.azure.com",
        apiKey: "test-key",
        deploymentName: "gpt-4o",
      },
      "gpt-4o"
    );
    expect(model).toBeDefined();
  });
});
