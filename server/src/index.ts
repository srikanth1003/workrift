import express from "express";
import cors from "cors";
import { analyzeWorkflow } from "./workflow-analyzer";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/analyze", async (req, res) => {
  try {
    const { activities } = req.body;
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      res.status(400).json({ error: "No activities provided" });
      return;
    }

    const analysis = await analyzeWorkflow(activities);
    res.json(analysis);
  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Work Recognizer API running on port ${PORT}`);
});
