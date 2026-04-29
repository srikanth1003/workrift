# Workrift

**See the workflows you don't know you're repeating.**

Workrift is a Chrome extension that silently observes how you work across web apps, detects repeating multi-app patterns, and uses AI to recommend specific tools that could save you hours per week.

Most productivity tools tell you *where* you spent time. Workrift tells you *what you were actually doing* and *what you should automate*.

## How It Works

```
You work normally
    ↓
Workrift silently tracks activity metadata (not content)
    ↓
Pattern detection finds repeating cross-app workflows
    ↓
AI analyzes your patterns and suggests specific automation tools
```

**What gets tracked:** Tab switches, app sections visited, form field labels, button clicks, copy-paste counts, session duration.

**What does NOT get tracked:** Text content, passwords, screenshots, keystrokes, file contents.

## Features

### Activity Breakdown

See exactly how you spent your time, broken down by app with granular detail — sections visited, forms filled, buttons clicked.

```
┌──────────────────────────────────────────────────────────────────┐
│  What You Actually Did                                           │
│  Today — 4h 23m of tracked activity across 47 sessions           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Salesforce                                    38%          │ │
│  │  1h 40m                                   12 sessions       │ │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░           │ │
│  │  Sections: lead-edit, record-view, lead-list                │ │
│  │  Fields filled: First Name, Last Name, Company, Email,      │ │
│  │                 Phone, Lead Source                           │ │
│  │  Buttons clicked: Save (15x), Edit (12x), Convert (3x)     │ │
│  │  18 copy/paste actions                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  LinkedIn                                      24%          │ │
│  │  1h 3m                                     8 sessions       │ │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │ │
│  │  Sections: people-search, profile, messaging                │ │
│  │  Buttons clicked: Connect (8x), Message (5x), Search (11x) │ │
│  │  14 copy/paste actions                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Gmail                                         21%          │ │
│  │  55m                                       9 sessions       │ │
│  │  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │ │
│  │  Sections: compose, inbox                                   │ │
│  │  22m typing                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Cross-App Workflow Detection

Workrift's n-gram detector finds repeating multi-app sequences you may not realize you're doing.

```
┌──────────────────────────────────────────────────────────────────┐
│  Cross-App Workflows                                             │
│  Repeating multi-app patterns detected in your work              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  8x repeated                    copy-paste    form fill     │ │
│  │                                                    42m total│ │
│  │  ┌──────────┐     ┌──────────────┐     ┌──────────────┐    │ │
│  │  │ LinkedIn │ ──→ │  Salesforce   │ ──→ │    Gmail      │   │ │
│  │  │ profile  │     │  lead-edit    │     │  compose      │   │ │
│  │  │ Connect  │     │  Save, Edit   │     │  Send         │   │ │
│  │  │ ~3m      │     │  ~5m          │     │  ~2m          │   │ │
│  │  └──────────┘     └──────────────┘     └──────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  5x repeated                    copy-paste                  │ │
│  │                                                    18m total│ │
│  │  ┌──────────┐     ┌──────────────┐                         │ │
│  │  │ HubSpot  │ ──→ │ Google Sheets │                        │ │
│  │  │ contacts │     │  spreadsheet  │                        │ │
│  │  │ Export   │     │  Paste, Edit  │                        │ │
│  │  │ ~2m      │     │  ~2m          │                        │ │
│  │  └──────────┘     └──────────────┘                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### AI-Powered Analysis

Claude analyzes your actual workflow data and returns specific, actionable recommendations — not generic productivity tips.

```
┌──────────────────────────────────────────────────────────────────┐
│  AI Workflow Analysis                                            │
│  Last analyzed 2h ago — Today                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  You appear to be an SDR doing outbound prospecting. Your   │ │
│  │  primary loop is LinkedIn research → Salesforce data entry  │ │
│  │  → Gmail outreach. The biggest inefficiency is manually     │ │
│  │  copying contact data from LinkedIn into Salesforce — you   │ │
│  │  did this 8 times today, spending ~5 min each time.         │ │
│  │                                                             │ │
│  │  Tracked: 4h 23m  Top: Salesforce lead editing              │ │
│  │  Potential savings: 6-8 hours/week                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Workflow Pattern                                                │
│  Research → Copy Data → Enter into CRM → Email outreach          │
│  — a classic SDR prospecting loop                                │
│                                                                  │
│  ─── Automatable Workflows ──────────────────────────────────    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Lead prospecting loop                8-10x/day   ~5m each │ │
│  │                                                             │ │
│  │  Search LinkedIn → Copy profile data → Enter into           │ │
│  │  Salesforce → Send email                                    │ │
│  │                                                             │ │
│  │  Use Clay ($149/mo) to auto-enrich LinkedIn profiles into   │ │
│  │  Salesforce. Pair with Apollo.io ($49/mo) for email         │ │
│  │  sequencing to eliminate the Gmail step entirely.            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ─── Suggestions ────────────────────────────────────────────    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Manual lead data entry in Salesforce           high        │ │
│  │  Time spent: 1h 40m                                         │ │
│  │                                                             │ │
│  │  You clicked Save 15 times on lead records and filled the   │ │
│  │  same 6 fields (Name, Company, Email, Phone, Lead Source)   │ │
│  │  each time — all data that was visible on LinkedIn.         │ │
│  │                                                             │ │
│  │  Clay can auto-enrich Salesforce leads directly from        │ │
│  │  LinkedIn URLs. Add a lead in one click instead of          │ │
│  │  copy-pasting 6 fields.                   ┌───────────┐    │ │
│  │                                           │   Clay     │    │ │
│  │                                           │  $149/mo   │    │ │
│  │                                           │ Save 3h/wk │    │ │
│  │                                           └───────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Repetitive email outreach in Gmail             high        │ │
│  │  Time spent: 55m                                            │ │
│  │                                                             │ │
│  │  9 compose sessions with 22 min of typing. You're writing   │ │
│  │  similar outreach emails manually after each lead entry.    │ │
│  │                                                             │ │
│  │  Apollo.io can auto-send personalized email sequences       │ │
│  │  triggered when a new lead is added to Salesforce.          │ │
│  │                                           ┌───────────┐    │ │
│  │                                           │ Apollo.io  │    │ │
│  │                                           │   $49/mo   │    │ │
│  │                                           │ Save 2h/wk │    │ │
│  │                                           └───────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  LinkedIn prospecting research              medium          │ │
│  │  Time spent: 1h 3m                                          │ │
│  │                                                             │ │
│  │  11 searches and 8 profile views with manual Connect/       │ │
│  │  Message clicks. You're hand-picking prospects.             │ │
│  │                                                             │ │
│  │  Use Apollo.io's lead search to build targeted prospect     │ │
│  │  lists in bulk instead of one-by-one LinkedIn searching.    │ │
│  │                                           ┌───────────┐    │ │
│  │                                           │ Apollo.io  │    │ │
│  │                                           │   $49/mo   │    │ │
│  │                                           │ Save 2h/wk │    │ │
│  │                                           └───────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Popup Quick Stats

Click the extension icon for a quick glance at your day.

```
┌───────────────────────────┐
│  W  Work Recognizer Today │
│                           │
│  ┌──────┐  ┌──────┐      │
│  │  47  │  │  32  │      │
│  │ Tab  │  │ Copy │      │
│  │Switch│  │Paste │      │
│  └──────┘  └──────┘      │
│  ┌──────┐  ┌──────┐      │
│  │   6  │  │ 263m │      │
│  │Tools │  │Active│      │
│  │ Used │  │ Time │      │
│  └──────┘  └──────┘      │
│                           │
│  Detected Patterns        │
│  ! Rapid context switch   │
│    between salesforce.com │
│    and linkedin.com       │
│                           │
│  [  Open Full Dashboard ] │
│                           │
└───────────────────────────┘
```

## Detected Apps

Workrift recognizes and provides granular section-level tracking for:

| App | Sections Detected |
|---|---|
| Gmail | inbox, compose, search, thread |
| Outlook | mail, compose, calendar |
| Salesforce | lead-edit, record-view, lead-list, reports, dashboard |
| LinkedIn | profile, people-search, messaging, feed, jobs |
| HubSpot | contacts, deals, email |
| Jira | board, issue, backlog, settings |
| Notion | page, database |
| Slack | channel, thread, dm |
| Google Docs | document editing |
| Google Sheets | spreadsheet editing |
| Google Slides | presentation editing |
| Google Calendar | calendar views |

Other websites are tracked as generic domains with page-mode detection (form, list, article, compose, dashboard, search-results).

## Pattern Detection

Three built-in algorithms run on your local data:

**Context Switching** — Detects rapid back-and-forth between apps. Triggers when 8+ switches happen between 2 domains within 5 minutes.

**Repetitive Sequences** — N-gram analysis finds repeating 2-5 step app sequences. If you go LinkedIn → Salesforce → Gmail → LinkedIn → Salesforce → Gmail 3+ times, it flags the loop.

**Copy-Paste Patterns** — Identifies frequent copy-paste operations between different domains within 30-second windows. 5+ pairs between the same domains triggers detection.

## Privacy

- All data stored locally in your browser (IndexedDB). Nothing leaves your machine.
- No screenshots, no keylogging, no content capture.
- Only metadata is tracked: which app, which section, which buttons/fields (labels only), duration.
- AWS credentials for AI analysis are stored locally and only used to call Bedrock.
- Clear your data anytime — by time period or everything.
- No analytics, no telemetry, no tracking pixels.

## Getting Started

### Prerequisites

- Google Chrome or Chromium-based browser
- Node.js 18+
- (Optional) AWS account with Bedrock access for AI analysis

### Install

```bash
git clone https://github.com/srikanth1003/workrift.git
cd workrift
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/` folder

### Use

1. Browse the web normally. Workrift runs silently in the background.
2. Click the extension icon for quick stats.
3. Open the full dashboard from the popup or via the extension's options page.
4. (Optional) Go to Settings in the dashboard, add your AWS credentials, and click "Analyze My Workflow" for AI-powered insights.

### AWS Credentials (Optional)

The AI analysis feature uses AWS Bedrock with Claude. To enable it:

1. Create an AWS IAM user with `bedrock:InvokeModel` permission
2. In the Workrift dashboard, go to **Settings**
3. Enter your Access Key ID, Secret Access Key, and Region
4. Select a model (defaults to Claude Sonnet)

## Development

```bash
npm run build        # Build to dist/
npm run test         # Run tests
npm run test:watch   # Watch mode
```

### Project Structure

```
src/
├── background/
│   └── service-worker.ts     # Tab tracking, message routing, pattern detection
├── content/
│   ├── content-script.ts     # Injected on every page — wires up event listeners
│   ├── activity-tracker.ts   # Session manager — batches activity every 30s
│   ├── page-analyzer.ts      # DOM analysis — page mode, field labels, buttons
│   └── app-detectors.ts      # URL → app/section mapping for 13+ SaaS apps
├── shared/
│   ├── types.ts              # TypeScript interfaces for all data models
│   ├── db.ts                 # IndexedDB (Dexie.js) data access layer
│   ├── events.ts             # Event creation helpers
│   ├── patterns.ts           # 3 pattern detection algorithms
│   ├── workflow-analyzer.ts  # Claude (Bedrock) AI analysis integration
│   └── workflow-sequences.ts # N-gram cross-app workflow detector
├── dashboard/                # Full dashboard (React)
├── popup/                    # Extension popup (React)
└── onboarding/               # First-run wizard (React)
```

### Tech Stack

- **UI:** React 19, TypeScript, Tailwind CSS
- **Storage:** IndexedDB via Dexie.js
- **AI:** AWS Bedrock (Claude) via LangChain
- **Build:** Vite, Chrome Manifest V3
- **Tests:** Vitest

## License

This project is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to use, share, and adapt this work for non-commercial purposes with attribution.
