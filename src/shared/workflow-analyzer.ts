import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import type { ActivityEvent } from "./types";
import { detectWorkflowSequences, formatSequencesForPrompt } from "./workflow-sequences";

const WorkflowSuggestionSchema = z.object({
  activity: z.string().describe("The specific activity observed, e.g. 'Manual lead data entry in Salesforce'"),
  timeSpent: z.string().describe("How much time was spent on this activity"),
  pain: z.string().describe("What makes this painful or inefficient — be specific about the repetitive steps"),
  suggestion: z.string().describe("Specific AI tool or workflow to fix this, with a concrete explanation of how"),
  tool: z.string().describe("The specific tool name, e.g. 'Clay', 'Apollo.io', 'ChatGPT'"),
  toolCostPerMonth: z.string().describe("Approximate monthly cost of the tool, e.g. '$49/mo', 'Free', '$99/mo'"),
  estimatedTimeSaved: z.string().describe("How much time this could save per week, e.g. '2h/week'"),
  confidence: z.enum(["high", "medium", "low"]).describe("How confident you are this suggestion applies based on the data"),
});

const AutomatableWorkflowSchema = z.object({
  name: z.string().describe("Short name for this workflow, e.g. 'Lead prospecting loop'"),
  steps: z.array(z.string()).describe("The sequence of steps observed, e.g. ['Search LinkedIn', 'Copy profile data', 'Enter into Salesforce', 'Send email']"),
  frequencyPerDay: z.string().describe("How often this workflow repeats, e.g. '8-10 times/day'"),
  timePerOccurrence: z.string().describe("How long each occurrence takes"),
  automationApproach: z.string().describe("How to automate this end-to-end, naming specific tools for each step"),
});

const WorkflowAnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence summary: what this person's role likely is, how they work, and the single biggest inefficiency"),
  totalTrackedTime: z.string().describe("Total time tracked in human-readable format"),
  topActivity: z.string().describe("The single activity that consumed the most time"),
  suggestions: z.array(WorkflowSuggestionSchema).describe("0-5 specific, actionable suggestions ordered by time-savings impact. Only include workflows that are clearly repetitive (3+ times), time-consuming, and automatable. Empty array is valid if no strong patterns exist."),
  automatableWorkflows: z.array(AutomatableWorkflowSchema).describe("0-3 multi-step cross-app workflows that repeat 3+ times and could be automated. Empty array is valid if none detected."),
  workflowPattern: z.string().describe("The overall workflow loop, e.g. 'Research → Copy Data → Enter into CRM → Email outreach — a classic SDR prospecting loop'"),
  estimatedWeeklyTimeSaved: z.string().describe("Total estimated time savings if all suggestions were adopted, e.g. '6-8 hours/week'"),
});

export type WorkflowAnalysis = z.infer<typeof WorkflowAnalysisSchema>;
export type WorkflowSuggestion = z.infer<typeof WorkflowSuggestionSchema>;
export type AutomatableWorkflow = z.infer<typeof AutomatableWorkflowSchema>;

export function formatActivitiesForPrompt(activities: ActivityEvent[]): string {
  const grouped = new Map<string, {
    totalDuration: number;
    sessions: number;
    sections: Set<string>;
    modes: Set<string>;
    formFields: Set<string>;
    clickedButtons: string[];
    clickedLinks: string[];
    copyPasteCount: number;
    typingMs: number;
    headings: Set<string>;
    buttons: Set<string>;
    domains: Set<string>;
    pageModes: Set<string>;
    titles: Set<string>;
  }>();

  for (const a of activities) {
    const key = a.app || a.domain || "unknown";
    let group = grouped.get(key);
    if (!group) {
      group = {
        totalDuration: 0,
        sessions: 0,
        sections: new Set(),
        modes: new Set(),
        formFields: new Set(),
        clickedButtons: [],
        clickedLinks: [],
        copyPasteCount: 0,
        typingMs: 0,
        headings: new Set(),
        buttons: new Set(),
        domains: new Set(),
        pageModes: new Set(),
        titles: new Set(),
      };
      grouped.set(key, group);
    }

    group.totalDuration += a.durationMs;
    group.sessions++;
    group.copyPasteCount += a.copyPasteCount;
    group.typingMs += a.typingDurationMs;
    group.sections.add(a.section);
    group.domains.add(a.domain);
    if (a.context.mode) group.modes.add(a.context.mode);
    if (a.context.pageMode) group.pageModes.add(a.context.pageMode);
    if (a.title) group.titles.add(a.title.slice(0, 60));

    for (const f of a.formFieldsInteracted) group.formFields.add(f);
    for (const h of (a.context.headings ?? [])) group.headings.add(h);
    for (const b of (a.context.buttons ?? [])) group.buttons.add(b);
    for (const cb of (a.clickedButtons ?? [])) group.clickedButtons.push(cb);
    for (const cl of (a.clickedLinks ?? [])) group.clickedLinks.push(cl);
  }

  const lines: string[] = ["# Per-App Activity Summary"];
  const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].totalDuration - a[1].totalDuration);
  const totalMs = sorted.reduce((s, [, d]) => s + d.totalDuration, 0);
  const totalMins = Math.round(totalMs / 60_000);
  lines.push(`Total tracked: ${totalMins} min across ${activities.length} sessions\n`);

  for (const [app, data] of sorted) {
    const mins = Math.round(data.totalDuration / 60_000);
    const pct = totalMs > 0 ? Math.round((data.totalDuration / totalMs) * 100) : 0;
    lines.push(`## ${app} (${mins} min, ${pct}%, ${data.sessions} sessions)`);
    lines.push(`  Domains: ${Array.from(data.domains).join(", ")}`);
    lines.push(`  Sections: ${Array.from(data.sections).join(", ")}`);

    if (data.titles.size > 0) {
      lines.push(`  Pages visited: ${Array.from(data.titles).slice(0, 8).join("; ")}`);
    }
    if (data.modes.size > 0) {
      lines.push(`  User modes: ${Array.from(data.modes).join(", ")}`);
    }
    if (data.pageModes.size > 0) {
      lines.push(`  Page types: ${Array.from(data.pageModes).join(", ")}`);
    }
    if (data.formFields.size > 0) {
      lines.push(`  Form fields filled: ${Array.from(data.formFields).join(", ")}`);
    }
    if (data.clickedButtons.length > 0) {
      const counts = new Map<string, number>();
      for (const b of data.clickedButtons) counts.set(b, (counts.get(b) ?? 0) + 1);
      const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
      lines.push(`  Buttons clicked: ${top.map(([b, c]) => `${b} (${c}x)`).join(", ")}`);
    }
    if (data.clickedLinks.length > 0) {
      const counts = new Map<string, number>();
      for (const l of data.clickedLinks) counts.set(l, (counts.get(l) ?? 0) + 1);
      const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
      lines.push(`  Links clicked: ${top.map(([l, c]) => `${l} (${c}x)`).join(", ")}`);
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
      lines.push(`  Buttons on page: ${Array.from(data.buttons).slice(0, 10).join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a workflow efficiency analyst who helps knowledge workers find high-value automation opportunities. You analyze EXACT browser activity data — what apps they used, what buttons they clicked, what forms they filled, what they copy-pasted between apps, and how long they spent.

## What qualifies as worth suggesting

ONLY flag workflows that meet ALL of these criteria:
1. **Repetitive** — the user does it multiple times per day or week (3+ occurrences visible in the data)
2. **Time-consuming** — each occurrence takes meaningful time (5+ minutes) OR the total time across repetitions is significant (30+ minutes)
3. **Automatable** — a specific tool can eliminate or drastically reduce the manual steps. Not "use a tool to help" but "this tool replaces steps X, Y, Z entirely"
4. **Cross-app or data-transfer** — involves moving data between apps (copy-paste between domains), filling the same form fields repeatedly, or multi-step sequences across 2+ tools

## What does NOT qualify — DO NOT suggest these

- **One-off tasks**: Creating a single repo, writing one document, setting up something once. These are not workflows, they're tasks.
- **Reading/browsing**: Reading news, scrolling social media, reading documentation. These are consumption, not work to automate.
- **Normal tool usage**: Navigating tabs in a code review tool, clicking through a dashboard, using search. This is just using software.
- **Context switching advice**: Don't suggest "batch your work" or "use a focus timer." Workrift shows what to automate, not how to manage attention.
- **Low-confidence suggestions**: If you're not confident the user does this regularly based on the data, don't include it. 1-2 occurrences in a session is not a pattern.

If the data shows a short or mixed session without clear repetitive workflows, say so honestly. "Based on this session, no high-impact automatable workflows were detected. Workrift works best with a full day of tracked activity." is a perfectly valid response. Do NOT stretch to fill the suggestions list.

## Your job

1. IDENTIFY their role and workflow pattern from the data — be specific ("SDR doing outbound prospecting" not "knowledge worker")
2. FIND repeating cross-app sequences — especially ones involving copy-paste between apps or manual form filling with 3+ repetitions
3. RECOMMEND specific tools by name with approximate monthly cost — only when you're confident the workflow is repeated and automatable
4. QUANTIFY the ROI — time saved per week, tool cost vs. time value

Be brutally specific. Reference the exact apps, sections, buttons, and form fields you see in the data. If someone clicked "Save" 15 times on lead records, say that. If they copy-pasted 20 times between LinkedIn and Salesforce, say that.

Return fewer suggestions that are genuinely high-impact rather than many suggestions that are a stretch. 1-2 strong suggestions beats 5 weak ones.

## Tool recommendations (use ONLY when the workflow clearly warrants it)

- CRM auto-fill/enrichment: Clay ($149/mo), Apollo.io ($49/mo), Lusha ($36/mo), Clearbit ($99/mo)
- Email drafting: ChatGPT ($20/mo), Claude ($20/mo), Lavender ($29/mo), Regie.ai ($59/mo)
- Email sequences: Apollo.io ($49/mo), Outreach ($100/mo), Salesloft ($75/mo), Instantly ($30/mo)
- Meeting scheduling: Calendly (Free-$12/mo), Cal.com (Free-$12/mo)
- Document writing: Claude ($20/mo), Notion AI ($10/mo add-on)
- Spreadsheet automation: SheetAI ($9/mo), Google Sheets AI (included)
- Recruiting sourcing: Gem ($150/mo), hireEZ ($169/mo), SeekOut ($99/mo)
- Support: Intercom Fin ($0.99/resolution), Zendesk AI ($50/mo)
- General automation: Zapier ($20/mo), Make ($9/mo), n8n (Free self-host)
- Browser automation: Bardeen (Free-$10/mo), Magical (Free)
- Data entry: Magical (Free), Bardeen ($10/mo), Zapier ($20/mo)`;

const HUMAN_PROMPT = `Here is the browser activity data for a user's work session:

{activity_data}

{sequences_data}

Analyze this workflow data. Only surface suggestions for workflows that are clearly repetitive (3+ occurrences), time-consuming, and concretely automatable with a specific tool. If the session is too short or too varied to show clear patterns, say so — don't stretch to fill suggestions. Fewer high-confidence recommendations are better than many low-confidence ones.`;

export async function analyzeWorkflow(
  activities: ActivityEvent[],
  model: BaseChatModel,
): Promise<WorkflowAnalysis> {
  const structuredModel = model.withStructuredOutput(WorkflowAnalysisSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", HUMAN_PROMPT],
  ]);

  const chain = prompt.pipe(structuredModel);

  const activityText = formatActivitiesForPrompt(activities);
  const sequences = detectWorkflowSequences(activities);
  const sequencesText = formatSequencesForPrompt(sequences);

  return await chain.invoke({
    activity_data: activityText,
    sequences_data: sequencesText || "No repeating cross-app sequences detected yet (need more activity data).",
  });
}
