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

export type ActivityType =
  | "email_composing"
  | "crm_data_entry"
  | "prospect_research"
  | "document_writing"
  | "spreadsheet_editing"
  | "messaging"
  | "scheduling"
  | "search_research"
  | "content_reading"
  | "form_filling"
  | "general_browsing";

export interface ActivityEvent {
  id?: number;
  type: ActivityType;
  app: string;
  section: string;
  url: string;
  domain: string;
  title: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  formFieldsInteracted: string[];
  copyPasteCount: number;
  typingDurationMs: number;
  context: ActivityContext;
}
