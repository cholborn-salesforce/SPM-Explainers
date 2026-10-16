// The stories every animated example can tell. Pick one anywhere on the
// site and it sticks as you move between explainers. All of it is
// illustrative demo data set at the same fictional customer.
export const USECASES = {
  service: {
    key: "service", label: "Service", color: "#0176D3",
    org: "Northwind Traders",
    record: { type: "Case", id: "00081402", name: "Case 00081402", headline: "00081402 · SSO tokens expiring early", title: "SSO tokens expiring early", sub: "Northwind Traders · High priority", path: "sobjects/Case/500…" },
    people: {
      rep:  { name: "Dana Chen",    first: "Dana",  role: "Service rep" },
      lead: { name: "Elena Vargas", first: "Elena", role: "Service supervisor" },
    },
    ask: { read: "Catch me up on case 00081402", write: "Make 00081402 critical" },
    kpis: [["1h 12m", "to breach"], ["2", "reopens"], ["3", "open cases"]],
    flag: { attr: "isEscalated", text: "Escalated to Tier 2 Identity · no reply since Mar 11" },
    actions: { primary: "Draft a reply", secondary: "Open in Salesforce", message: "Draft a reply to case 00081402" },
    fields: [
      { api: "CaseNumber", label: "Case", val: "00081402" },
      { api: "Subject", label: "Subject", val: "SSO tokens expiring early" },
      { api: "Priority", label: "Priority", val: "High" },
      { api: "Account.Name", label: "Account", val: "Northwind Traders" },
      { api: "Account.AnnualRevenue", label: "Annual revenue", val: "$48M" },
      { api: "Escalation_Notes__c", label: "Escalation notes", val: "Tier 2 Identity owns the fix. No reply since Mar 11." },
    ],
    hiddenForRep: [4, 5],
    rows: { rep: [1, 3], lead: [3, 3], noun: "open Northwind cases" },
    change: { field: "Priority", api: "Priority", body: '"Critical"', from: "High", to: "Critical", confirm: "Yes, set 00081402 to Critical",
      rule: "Only supervisors can set Priority to Critical.", after: "Priority is still High. Ask a supervisor, or escalate instead." },
    skill: "case-context", widget: "caseBriefing",
    objects: ["Case", "CaseMilestone", "Account", "Contact", "CaseComment", "Entitlement", "EmailMessage"],
    answer: "Northwind's SSO case breaches in 1h 12m. Tier 2 Identity hasn't replied since Mar 11, and the customer was promised an answer Monday.",
  },
  sales: {
    key: "sales", label: "Sales", color: "#2E844A",
    org: "Northwind Traders",
    record: { type: "Opportunity", id: "Northwind renewal", name: "Northwind renewal", headline: "Northwind · Platform renewal", title: "Platform renewal · $480K", sub: "Northwind Traders · Negotiation", path: "sobjects/Opportunity/006…" },
    people: {
      rep:  { name: "Jordan Blake", first: "Jordan", role: "Account executive" },
      lead: { name: "Priya Nair",   first: "Priya",  role: "Sales director" },
    },
    ask: { read: "Catch me up on the Northwind renewal", write: "Give Northwind a 22% discount" },
    kpis: [["9 days", "to close"], ["$480K", "amount"], ["22%", "discount asked"]],
    flag: { attr: "isAtRisk", text: "At risk · champion quiet for 12 days, discount approval pending" },
    actions: { primary: "Draft a follow-up", secondary: "Open in Salesforce", message: "Draft a follow-up to the Northwind champion" },
    fields: [
      { api: "Name", label: "Opportunity", val: "Northwind · Platform renewal" },
      { api: "StageName", label: "Stage", val: "Negotiation" },
      { api: "Amount", label: "Amount", val: "$480,000" },
      { api: "Account.Name", label: "Account", val: "Northwind Traders" },
      { api: "Deal_Margin__c", label: "Deal margin", val: "18%" },
      { api: "Discount_Floor__c", label: "Discount floor", val: "15% without director approval" },
    ],
    hiddenForRep: [4, 5],
    rows: { rep: [2, 4], lead: [4, 4], noun: "open Northwind opportunities" },
    change: { field: "Discount", api: "Discount__c", body: "22", from: "0%", to: "22%", confirm: "Yes, apply a 22% discount to the Northwind renewal",
      rule: "Discounts over 20% need Sales Director approval.", after: "No discount was applied. Ask your sales director, or offer 20%." },
    skill: "deal-context", widget: "dealBriefing",
    objects: ["Opportunity", "OpportunityContactRole", "Account", "Contact", "OpportunityLineItem", "Quote", "Task"],
    answer: "The Northwind renewal closes in 9 days. The champion has been quiet for 12 days, and a 22% discount is waiting on director approval.",
  },
  marketing: {
    key: "marketing", label: "Marketing", color: "#B04E0F",
    org: "Northwind Traders",
    record: { type: "Campaign", id: "Northwind ABM", name: "Northwind ABM campaign", headline: "Northwind ABM · Q3 expansion", title: "Q3 expansion · $80K budget", sub: "Northwind Traders · In progress", path: "sobjects/Campaign/701…" },
    people: {
      rep:  { name: "Maya Ortiz",  first: "Maya", role: "Campaign manager" },
      lead: { name: "Sam Okafor",  first: "Sam",  role: "Marketing director" },
    },
    ask: { read: "Catch me up on the Northwind ABM campaign", write: "Raise the Northwind ABM budget to $120K" },
    kpis: [["$62K", "of $80K spent"], ["38%", "open rate"], ["2 of 5", "buying roles engaged"]],
    flag: { attr: "isOffPace", text: "Off pace · CFO and IT lead haven't engaged, 3 weeks left" },
    actions: { primary: "Draft a nurture email", secondary: "Open in Salesforce", message: "Draft a nurture email for the Northwind CFO" },
    fields: [
      { api: "Name", label: "Campaign", val: "Northwind ABM · Q3 expansion" },
      { api: "Status", label: "Status", val: "In progress" },
      { api: "BudgetedCost", label: "Budget", val: "$80,000" },
      { api: "Account__r.Name", label: "Account", val: "Northwind Traders" },
      { api: "ExpectedRevenue", label: "Expected revenue", val: "$1.2M" },
      { api: "Agency_Fees__c", label: "Agency fees", val: "$18K retainer" },
    ],
    hiddenForRep: [4, 5],
    rows: { rep: [2, 5], lead: [5, 5], noun: "active Northwind campaigns" },
    change: { field: "Budget", api: "BudgetedCost", body: "120000", from: "$80K", to: "$120K", confirm: "Yes, raise the Northwind ABM budget to $120K",
      rule: "Budget increases over $100K need Marketing Director approval.", after: "The budget is still $80K. Ask your marketing director, or shift spend from another campaign." },
    skill: "campaign-context", widget: "campaignBriefing",
    objects: ["Campaign", "CampaignMember", "Account", "Contact", "Lead", "EmailMessage", "Task"],
    answer: "The Northwind ABM campaign has spent $62K of its $80K budget. Opens are strong at 38%, but the CFO and IT lead haven't engaged, with 3 weeks left.",
  },
};

const KEY = "h360.usecase";
let current = (() => { try { return USECASES[localStorage.getItem(KEY)] ? localStorage.getItem(KEY) : "service"; } catch { return "service"; } })();
document.documentElement.dataset.usecase = current;

export const useCase = () => USECASES[current];

export function setUseCase(key) {
  if (!USECASES[key] || key === current) return;
  current = key;
  try { localStorage.setItem(KEY, key); } catch { /* private mode */ }
  document.documentElement.dataset.usecase = key;
  syncPickers();
  window.dispatchEvent(new CustomEvent("usecase:change", { detail: USECASES[key] }));
}

export function onUseCase(fn) {
  window.addEventListener("usecase:change", e => fn(e.detail));
  fn(USECASES[current]);
}

function syncPickers() {
  document.querySelectorAll("[data-usecase-picker] button").forEach(b => {
    b.classList.toggle("on", b.dataset.uc === current);
    b.setAttribute("aria-pressed", String(b.dataset.uc === current));
  });
}

// Any element with data-usecase-picker becomes a Service / Sales / Marketing switch.
export function mountUseCasePickers(root = document) {
  root.querySelectorAll("[data-usecase-picker]").forEach(el => {
    if (el.dataset.mounted) return;
    el.dataset.mounted = "1";
    el.classList.add("uc-picker");
    el.innerHTML = `<span class="uc-picker__lab">Use case</span>${Object.values(USECASES).map(u =>
      `<button type="button" data-uc="${u.key}" style="--uc:${u.color}">${u.label}</button>`).join("")}`;
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setUseCase(b.dataset.uc)));
  });
  syncPickers();
}
