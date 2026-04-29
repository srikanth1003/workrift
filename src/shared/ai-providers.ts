import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatBedrockConverse } from "@langchain/aws";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder: string;
  required: boolean;
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface ProviderDefinition {
  name: string;
  label: string;
  models: ModelOption[];
  credentialFields: CredentialField[];
  createModel: (
    credentials: Record<string, string>,
    modelId: string
  ) => BaseChatModel;
}

export interface AIConfig {
  provider: string;
  credentials: Record<string, string>;
  modelId: string;
}

export const providers: ProviderDefinition[] = [
  {
    name: "anthropic",
    label: "Anthropic",
    models: [
      { id: "claude-sonnet-4-6-20250514", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-ant-...",
        required: true,
      },
    ],
    createModel: (credentials, modelId) =>
      new ChatAnthropic({
        model: modelId,
        apiKey: credentials.apiKey,
        temperature: 0.3,
      }),
  },
  {
    name: "openai",
    label: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
      },
    ],
    createModel: (credentials, modelId) =>
      new ChatOpenAI({
        model: modelId,
        apiKey: credentials.apiKey,
        temperature: 0.3,
      }),
  },
  {
    name: "google",
    label: "Google Gemini",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "AI...",
        required: true,
      },
    ],
    createModel: (credentials, modelId) =>
      new ChatGoogleGenerativeAI({
        model: modelId,
        apiKey: credentials.apiKey,
        temperature: 0.3,
      }),
  },
  {
    name: "aws",
    label: "AWS Bedrock",
    models: [
      {
        id: "us.anthropic.claude-sonnet-4-6-v1",
        label: "Claude Sonnet 4.6 (Bedrock)",
      },
      {
        id: "us.anthropic.claude-haiku-4-5-v1",
        label: "Claude Haiku 4.5 (Bedrock)",
      },
    ],
    credentialFields: [
      {
        key: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        placeholder: "AKIA...",
        required: true,
      },
      {
        key: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        placeholder: "Your secret key",
        required: true,
      },
      {
        key: "region",
        label: "Region",
        type: "text",
        placeholder: "us-east-1",
        required: true,
      },
      {
        key: "sessionToken",
        label: "Session Token (optional)",
        type: "password",
        placeholder: "For temporary credentials",
        required: false,
      },
    ],
    createModel: (credentials, modelId) =>
      new ChatBedrockConverse({
        model: modelId,
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          ...(credentials.sessionToken
            ? { sessionToken: credentials.sessionToken }
            : {}),
        },
        temperature: 0.3,
      }),
  },
  {
    name: "azure",
    label: "Azure OpenAI",
    models: [],
    credentialFields: [
      {
        key: "azureEndpoint",
        label: "Azure Endpoint",
        type: "text",
        placeholder: "https://myresource.openai.azure.com",
        required: true,
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "Your Azure API key",
        required: true,
      },
      {
        key: "deploymentName",
        label: "Deployment Name",
        type: "text",
        placeholder: "gpt-4o",
        required: true,
      },
    ],
    createModel: (credentials, modelId) =>
      new AzureChatOpenAI({
        model: modelId,
        azureOpenAIApiKey: credentials.apiKey,
        azureOpenAIBasePath: `${credentials.azureEndpoint}/openai/deployments`,
        azureOpenAIApiDeploymentName: credentials.deploymentName,
        azureOpenAIApiVersion: "2024-08-01-preview",
        temperature: 0.3,
      }),
  },
];

export function getProvider(name: string): ProviderDefinition | undefined {
  return providers.find((p) => p.name === name);
}
