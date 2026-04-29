import { useEffect, useState } from "react";
import { providers, getProvider } from "@shared/ai-providers";
import type { AIConfig } from "@shared/ai-providers";

export function Settings() {
  const [providerName, setProviderName] = useState("anthropic");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [modelId, setModelId] = useState("");
  const [customModel, setCustomModel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const provider = getProvider(providerName);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AI_CONFIG" }).then((response) => {
      const res = response as { config: AIConfig | null };
      if (res.config) {
        setProviderName(res.config.provider);
        setCredentials(res.config.credentials);
        setModelId(res.config.modelId);
        const prov = getProvider(res.config.provider);
        if (prov && !prov.models.some((m) => m.id === res.config!.modelId)) {
          setCustomModel(true);
        }
      }
    });
  }, []);

  function handleProviderChange(name: string) {
    setProviderName(name);
    setCredentials({});
    setCustomModel(false);
    const prov = getProvider(name);
    setModelId(prov?.models[0]?.id ?? "");
  }

  function handleCredentialChange(key: string, value: string) {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  }

  function handleModelChange(value: string) {
    if (value === "__custom__") {
      setCustomModel(true);
      setModelId("");
    } else {
      setCustomModel(false);
      setModelId(value);
    }
  }

  async function handleSave() {
    const config: AIConfig = { provider: providerName, credentials, modelId };
    await chrome.runtime.sendMessage({ type: "SAVE_AI_CONFIG", payload: config });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const requiredFilled = provider
    ? provider.credentialFields
        .filter((f) => f.required)
        .every((f) => credentials[f.key]?.trim())
    : false;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <span className="text-gray-400 text-sm">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-400 text-sm">
            Configure your AI provider for workflow analysis. Credentials are stored locally in your browser.
          </p>

          <div>
            <label className="block text-sm text-gray-400 mb-1">AI Provider</label>
            <select
              value={providerName}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {provider?.credentialFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={credentials[field.key] ?? ""}
                onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Model</label>
            {provider && provider.models.length > 0 ? (
              <>
                <select
                  value={customModel ? "__custom__" : modelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {provider.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  <option value="__custom__">Custom model ID...</option>
                </select>
                {customModel && (
                  <input
                    type="text"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter custom model ID"
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Enter model or deployment name"
              />
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!requiredFilled || !modelId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
