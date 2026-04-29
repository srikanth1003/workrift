import { useEffect, useState } from "react";

export function Settings() {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [modelId, setModelId] = useState("");
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AWS_CREDENTIALS" }).then((response) => {
      const res = response as { credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string; region: string; modelId?: string } | null };
      if (res.credentials) {
        setAccessKeyId(res.credentials.accessKeyId);
        setSecretAccessKey(res.credentials.secretAccessKey);
        setSessionToken(res.credentials.sessionToken ?? "");
        setRegion(res.credentials.region);
        setModelId(res.credentials.modelId ?? "");
      }
    });
  }, []);

  async function handleSave() {
    await chrome.runtime.sendMessage({
      type: "SAVE_AWS_CREDENTIALS",
      payload: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}), region, ...(modelId ? { modelId } : {}) },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <span className="text-gray-400 text-sm">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-400 text-sm">
            AWS credentials for Bedrock AI analysis. These are stored locally in your browser.
          </p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Access Key ID</label>
            <input
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="AKIA..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Secret Access Key</label>
            <input
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Your secret key"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Session Token (optional, for temporary credentials)</label>
            <input
              type="password"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Your session token"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="us-east-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model ID (optional)</label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="us.anthropic.claude-sonnet-4-6-v1"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!accessKeyId || !secretAccessKey}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? "Saved!" : "Save Credentials"}
          </button>
        </div>
      )}
    </div>
  );
}
