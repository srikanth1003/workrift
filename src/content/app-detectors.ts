export interface AppContext {
  app: string;
  section: string;
  mode: string;
  detail: string;
}

export function detectApp(url: string, pathname: string): AppContext {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const hash = urlObj.hash;

  // Gmail / Google Workspace
  if (hostname === "mail.google.com") {
    if (hash.includes("compose")) {
      return {
        app: "gmail",
        section: "compose",
        mode: "composing",
        detail: "Gmail — Composing email",
      };
    }
    if (hash.includes("#search")) {
      return {
        app: "gmail",
        section: "search",
        mode: "searching",
        detail: "Gmail — Searching email",
      };
    }
    if (hash.includes("#inbox") || hash === "") {
      return {
        app: "gmail",
        section: "inbox",
        mode: "browsing",
        detail: "Gmail — Browsing inbox",
      };
    }
  }

  if (hostname === "docs.google.com") {
    if (pathname.includes("/document")) {
      return {
        app: "google-docs",
        section: "document",
        mode: "editing",
        detail: "Google Docs — Editing document",
      };
    }
    if (pathname.includes("/spreadsheets")) {
      return {
        app: "google-sheets",
        section: "spreadsheet",
        mode: "editing",
        detail: "Google Sheets — Editing spreadsheet",
      };
    }
    if (pathname.includes("/presentation")) {
      return {
        app: "google-slides",
        section: "presentation",
        mode: "editing",
        detail: "Google Slides — Editing presentation",
      };
    }
  }

  if (hostname === "calendar.google.com") {
    return {
      app: "google-calendar",
      section: "calendar",
      mode: "browsing",
      detail: "Google Calendar — Browsing calendar",
    };
  }

  // Salesforce
  if (hostname.includes("salesforce.com") || hostname.includes("force.com")) {
    if (pathname.includes("/lightning/r/Lead/") && pathname.includes("/edit")) {
      return {
        app: "salesforce",
        section: "lead-edit",
        mode: "editing",
        detail: "Salesforce — Editing lead record",
      };
    }
    if (pathname.includes("/lightning/r/Contact/") && pathname.includes("/edit")) {
      return {
        app: "salesforce",
        section: "contact-edit",
        mode: "editing",
        detail: "Salesforce — Editing contact record",
      };
    }
    if (pathname.includes("/lightning/r/Opportunity/") && pathname.includes("/edit")) {
      return {
        app: "salesforce",
        section: "opportunity-edit",
        mode: "editing",
        detail: "Salesforce — Editing opportunity record",
      };
    }
    if (pathname.includes("/lightning/r/") && pathname.includes("/view")) {
      return {
        app: "salesforce",
        section: "record-view",
        mode: "reading",
        detail: "Salesforce — Viewing record",
      };
    }
    if (pathname.includes("/lightning/o/Lead/list")) {
      return {
        app: "salesforce",
        section: "lead-list",
        mode: "browsing",
        detail: "Salesforce — Browsing lead list",
      };
    }
  }

  // LinkedIn
  if (hostname.includes("linkedin.com")) {
    if (pathname.includes("/search/results/people")) {
      return {
        app: "linkedin",
        section: "people-search",
        mode: "searching",
        detail: "LinkedIn — Searching people",
      };
    }
    if (pathname.includes("/in/")) {
      return {
        app: "linkedin",
        section: "profile",
        mode: "reading",
        detail: "LinkedIn — Viewing profile",
      };
    }
    if (pathname.includes("/messaging")) {
      return {
        app: "linkedin",
        section: "messaging",
        mode: "composing",
        detail: "LinkedIn — Messaging",
      };
    }
    if (pathname.includes("/feed")) {
      return {
        app: "linkedin",
        section: "feed",
        mode: "browsing",
        detail: "LinkedIn — Browsing feed",
      };
    }
    if (pathname.includes("/jobs")) {
      return {
        app: "linkedin",
        section: "jobs",
        mode: "browsing",
        detail: "LinkedIn — Browsing jobs",
      };
    }
  }

  // HubSpot
  if (hostname.includes("app.hubspot.com")) {
    if (pathname.includes("/contacts/") && pathname.includes("/contact/")) {
      return {
        app: "hubspot",
        section: "contact-edit",
        mode: "editing",
        detail: "HubSpot — Editing contact",
      };
    }
    if (pathname.includes("/contacts/") && pathname.includes("/deals/")) {
      return {
        app: "hubspot",
        section: "deal-edit",
        mode: "editing",
        detail: "HubSpot — Editing deal",
      };
    }
    if (pathname.includes("/contacts/") && pathname.includes("/contacts/list")) {
      return {
        app: "hubspot",
        section: "contact-list",
        mode: "browsing",
        detail: "HubSpot — Browsing contact list",
      };
    }
  }

  // Jira
  if (hostname.includes("atlassian.net")) {
    if (pathname.includes("/browse/")) {
      return {
        app: "jira",
        section: "issue-view",
        mode: "reading",
        detail: "Jira — Viewing issue",
      };
    }
    if (pathname.includes("/jira/software/projects/") && pathname.includes("/board")) {
      return {
        app: "jira",
        section: "board",
        mode: "browsing",
        detail: "Jira — Browsing board",
      };
    }
  }

  // Notion
  if (hostname.includes("notion.so")) {
    return {
      app: "notion",
      section: "page",
      mode: "editing",
      detail: "Notion — Editing page",
    };
  }

  // Slack
  if (hostname.includes("app.slack.com")) {
    return {
      app: "slack",
      section: "channel",
      mode: "composing",
      detail: "Slack — Channel conversation",
    };
  }

  // Outlook
  if (hostname.includes("outlook.office.com") || hostname.includes("outlook.live.com")) {
    if (pathname.includes("/mail/compose") || pathname.includes("/mail/0/compose")) {
      return {
        app: "outlook",
        section: "compose",
        mode: "composing",
        detail: "Outlook — Composing email",
      };
    }
    if (pathname.includes("/mail")) {
      return {
        app: "outlook",
        section: "inbox",
        mode: "browsing",
        detail: "Outlook — Browsing inbox",
      };
    }
  }

  // Generic fallback
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "page";
  return {
    app: "unknown",
    section: firstSegment,
    mode: "browsing",
    detail: `Unknown app — ${firstSegment}`,
  };
}
