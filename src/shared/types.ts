export type EventType =
  | "tab_switch"
  | "navigation"
  | "copy"
  | "paste"
  | "form_fill"
  | "text_selection"
  | "page_idle"
  | "page_active"
  | "activity";

export interface WorkEvent {
  id?: number;
  type: EventType;
  timestamp: number;
  url: string;
  domain: string;
  title: string;
  metadata: Record<string, string | number | boolean>;
}

export interface DomainStat {
  domain: string;
  totalTime: number;
  visitCount: number;
  date: string;
}

export interface TabSwitchSequence {
  domains: string[];
  timestamps: number[];
  count: number;
}

export interface DetectedPattern {
  id?: number;
  type: "repetitive_sequence" | "frequent_copy_paste" | "context_switching" | "manual_data_transfer";
  description: string;
  domains: string[];
  frequency: number;
  avgTimeWasted: number;
  firstSeen: number;
  lastSeen: number;
  exampleEvents: number[];
}

export interface DailySummary {
  id?: number;
  date: string;
  totalActiveTime: number;
  domainStats: DomainStat[];
  tabSwitchCount: number;
  copyPasteCount: number;
  topPatterns: DetectedPattern[];
}

export interface ActivityContext {
  app: string;
  section: string;
  mode: string;
  detail: string;
  pageMode: string;
  headings: string[];
  formFields: string[];
  buttons: string[];
}

export interface WorkflowSequence {
  steps: {
    app: string;
    section: string;
    detail: string;
    avgDurationMs: number;
    actions: string[];
  }[];
  frequency: number;
  totalTimeMs: number;
  involvesCopyPaste: boolean;
  involvesFormFill: boolean;
}

export interface ActivityEvent {
  id?: number;
  app: string;
  section: string;
  url: string;
  domain: string;
  title: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  formFieldsInteracted: string[];
  clickedButtons: string[];
  clickedLinks: string[];
  copyPasteCount: number;
  typingDurationMs: number;
  context: ActivityContext;
}
