import { ChatBedrockConverse } from "@langchain/aws";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const WorkflowSuggestionSchema = z.object({
  activity: z.string().describe("The specific activity observed, e.g. 'Manual lead data entry in Salesforce'"),
  timeSpent: z.string().describe("How much time was spent on this activity"),
  pain: z.string().describe("What makes this painful or inefficient"),
  suggestion: z.string().describe("Specific AI tool or workflow to fix this"),
  tool: z.string().describe("The specific tool name, e.g. 'Clay', 'Apollo.io', 'ChatGPT'"),
  estimatedTimeSaved: z.string().describe("How much time this could save per week"),
});

const WorkflowAnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence summary of how this person works and where the biggest inefficiencies are"),
  totalTrackedTime: z.string().describe("Total time tracked in human-readable format"),
  topActivity: z.string().describe("The single activity that consumed the most time"),
  suggestions: z.array(WorkflowSuggestionSchema).describe("Specific, actionable suggestions ordered by impact"),
  workflowPattern: z.string().describe("Description of the overall workflow pattern observed, e.g. 'Research → Copy Data → Enter into CRM → Email outreach — a classic SDR prospecting loop'"),
});

interface ActivityInput {
  type: string;
  app: string;
  section: string;
  domain: string;
  title: string;
  durationMs: number;
  formFieldsInteracted: string[];
  copyPasteCount: number;
  typingDurationMs: number;
  context: {
    app: string;
    section: string;
    mode: string;
    detail: string;
    pageMode: string;
    headings: string[];
    formFields: string[];
    buttons: string[];
  };
}

export function formatActivitiesForPrompt(activities: ActivityInput[]): string {
  const grouped = new Map<string, {
    totalDuration: number;
    sessions: number;
    apps: Map<string, { duration: number; sections: Set<string> }>;
    formFields: Set<string>;
    copyPasteCount: number;
    typingMs: number;
    headings: Set<string>;
    buttons: Set<string>;
  }>();

  for (const a of activities) {
    let group = grouped.get(a.type);
    if (!group) {
      group = {
        totalDuration: 0,
        sessions: 0,
        apps: new Map(),
        formFields: new Set(),
        copyPasteCount: 0,
        typingMs: 0,
        headings: new Set(),
        buttons: new Set(),
      };
      grouped.set(a.type, group);
    }

    group.totalDuration += a.durationMs;
    group.sessions++;
    group.copyPasteCount += a.copyPasteCount;
    group.typingMs += a.typingDurationMs;

    for (const f of a.formFieldsInteracted) group.formFields.add(f);
    for (const h of (a.context.headings ?? [])) group.headings.add(h);
    for (const b of (a.context.buttons ?? [])) group.buttons.add(b);

    let appEntry = group.apps.get(a.app);
    if (!appEntry) {
      appEntry = { duration: 0, sections: new Set() };
      group.apps.set(a.app, appEntry);
    }
    appEntry.duration += a.durationMs;
    appEntry.sections.add(a.section);
  }

  const lines: string[] = [];
  const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].totalDuration - a[1].totalDuration);

  for (const [type, data] of sorted) {
    const mins = Math.round(data.totalDuration / 60_000);
    lines.push(`\n## ${type} (${mins} min, ${data.sessions} sessions)`);

    for (const [app, appData] of data.apps) {
      const appMins = Math.round(appData.duration / 60_000);
      lines.push(`  App: ${app} (${appMins} min) — sections: ${Array.from(appData.sections).join(", ")}`);
    }

    if (data.formFields.size > 0) {
      lines.push(`  Form fields filled: ${Array.from(data.formFields).join(", ")}`);
    }
    if (data.copyPasteCount > 0) {
      lines.push(`  Copy/paste actions: ${data.copyPasteCount}`);
    }
    if (data.typingMs > 30000) {
      lines.push(`  Typing time: ${Math.round(data.typingMs / 60_000)} min`);
    }
    if (data.headings.size > 0) {
      lines.push(`  Page headings seen: ${Array.from(data.headings).slice(0, 10).join(", ")}`);
    }
    if (data.buttons.size > 0) {
      lines.push(`  Buttons seen: ${Array.from(data.buttons).slice(0, 10).join(", ")}`);
    }
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a workflow efficiency analyst. You analyze how knowledge workers spend their time in the browser and recommend specific AI tools and automations to eliminate inefficiencies.

You will receive structured browser activity data showing exactly what a user did: which apps they used, what sections they were in, what form fields they filled, how much they copy-pasted, and how long they spent.

Your job:
1. Identify the user's role/workflow pattern from the data (e.g., SDR doing outbound prospecting, recruiter sourcing candidates, support agent handling tickets)
2. Pinpoint specific inefficiencies (manual data entry, repetitive copy-paste between tools, time spent on tasks AI can do faster)
3. Recommend SPECIFIC tools by name — not generic advice. Name the exact product, Chrome extension, or AI tool that solves each problem.
4. Estimate time savings realistically

Be direct and specific. "You spent 35 min manually entering leads into Salesforce. Use Clay or Apollo.io to auto-enrich leads from LinkedIn — this saves ~25 min/day" is good. "Consider using AI tools to improve productivity" is useless.

Only recommend well-known, established tools. Examples:
- CRM auto-fill: Clay, Apollo.io, Lusha, Clearbit
- Email drafting: ChatGPT, Claude, Lavender, Regie.ai
- Email sequences: Apollo.io, Outreach, Salesloft, Instantly
- Meeting scheduling: Calendly, Cal.com, Reclaim.ai
- Research: Perplexity, ChatGPT with browsing
- Document writing: Claude, Notion AI, Jasper
- Spreadsheet automation: SheetAI, Google Sheets AI, Claude
- Recruiting sourcing: Gem, hireEZ, SeekOut
- Support: Intercom Fin, Zendesk AI, Guru
- General automation: Zapier, Make, n8n
- Browser automation: Bardeen, Magical`;

const HUMAN_PROMPT = `Here is the browser activity data for a user's work session:

{activity_data}

Analyze this data and provide your workflow analysis. Be specific about what the user was doing and what tools would help.`;

export async function analyzeWorkflow(activities: ActivityInput[]) {
  const model = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-6-v1",
    region: process.env.AWS_REGION ?? "us-east-1",
    temperature: 0.3,
  });

  const structuredModel = model.withStructuredOutput(WorkflowAnalysisSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", HUMAN_PROMPT],
  ]);

  const chain = prompt.pipe(structuredModel);

  const activityText = formatActivitiesForPrompt(activities);

  const result = await chain.invoke({
    activity_data: activityText,
  });

  return result;
}
