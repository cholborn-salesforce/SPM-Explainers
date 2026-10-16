// The one list of explainers. The landing page, the top bar menu, and the
// "Up next" card on every page are all built from it. Within a level, this order is the reading order.
export const BRAND = {
  name: "My Explainers",
  // Optional inline SVG or <img> markup shown in the top bar and on the landing page.
  logo: "",
  credit: "Created by Your Name",
};

export const SITE = [
  { slug: "example", group: "Basics", level: "101", color: "#0B5CAB", title: "How a request travels",
    blurb: "One request from an app to a server and back, and who it runs as. A starter page to copy." },
  { slug: "sales-programs", group: "Sales Cloud", level: "101", color: "#0176D3", title: "Salesforce Sales Programs",
    blurb: "How Salesforce Sales Programs ties enablement content to the revenue outcomes it's meant to move." },
];

export const GROUPS = ["Basics", "Sales Cloud"];
export const GROUP_BLURBS = {
  Basics: "Start here.",
  "Sales Cloud": "How Sales Cloud features connect to pipeline and revenue.",
};
export const LEVELS = [
  { id: "101", name: "Essentials", color: "#2E844A", blurb: "Start here. What each piece is and why it matters, in plain terms." },
  { id: "201", name: "Applied", color: "#0176D3", blurb: "How the pieces connect." },
  { id: "301", name: "Advanced", color: "#5A1BA9", blurb: "Build and scale." },
];
export const levelOf = id => LEVELS.find(l => l.id === id);
// The reading path: every 101, then every 201, then every 301.
export const PATH = LEVELS.flatMap(l => SITE.filter(s => s.level === l.id));

import { mountUseCasePickers } from "/SPM-Explainers/kit/usecase.js";

const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const levelTag = s => { const l = levelOf(s.level); return `<span class="kit-level" style="--lc:${l.color}" title="${l.id} · ${l.name}">${l.id}</span>`; };

// Top bar with an "All explainers" menu, plus an "Up next" card before the footer.
// Pass { usecase: false } to hide the Service / Sales / Marketing picker.
export function mountSiteChrome(current, { usecase = true } = {}) {
  const page = SITE.find(s => s.slug === current);
  const bar = document.querySelector("[data-kit-topbar]");
  if (bar) {
    const menu = GROUPS.map(g => `<div class="kit-menu__group"><div class="kit-menu__label">${g}</div>${
      SITE.filter(s => s.group === g).map(s => `<a href="/SPM-Explainers/${s.slug}" class="${s.slug === current ? "on" : ""}"><i style="background:${s.color}"></i>${esc(s.title)}${levelTag(s)}</a>`).join("")
    }</div>`).join("");
    bar.className = "topbar";
    bar.innerHTML = `<div class="topbar-inner">
      <a class="bc" href="/SPM-Explainers/"><span class="kit-logo">${BRAND.logo}</span><strong>${esc(BRAND.name)}</strong>${page ? `<span class="bc-title">/ ${esc(page.title)}</span>${levelTag(page)}` : ""}</a>
      <div class="top-links">
        ${usecase ? `<div data-usecase-picker></div>` : ""}
        <div class="kit-menu">
          <button type="button" class="back-btn" aria-expanded="false" aria-haspopup="true">All explainers
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
          <div class="kit-menu__panel" role="menu">${menu}</div>
        </div>
      </div>
    </div>`;
    const btn = bar.querySelector(".kit-menu > button"), panel = bar.querySelector(".kit-menu__panel");
    const set = open => { panel.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", e => { e.stopPropagation(); set(!panel.classList.contains("open")); });
    document.addEventListener("click", e => { if (!e.target.closest(".kit-menu")) set(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
    mountUseCasePickers();
  }
  const footer = document.querySelector("footer");
  if (footer && page) {
    const i = PATH.indexOf(page), next = PATH[(i + 1) % PATH.length];
    const nl = levelOf(next.level), step = next.level === page.level ? "Up next" : `Next level · ${nl.id} ${nl.name}`;
    const up = document.createElement("section");
    up.className = "kit-next";
    up.innerHTML = `<a href="/SPM-Explainers/${next.slug}" class="kit-next__card" style="--c:${next.color}">
      <span class="kit-next__k">${step} · ${esc(next.group)}</span>
      <b>${esc(next.title)} →</b><span>${esc(next.blurb)}</span></a>
      <a href="/SPM-Explainers/?level=${page.level}" class="kit-next__all">All ${page.level} explainers</a>
      <a href="/SPM-Explainers/" class="kit-next__all">See all ${SITE.length} explainers</a>`;
    footer.before(up);
    if (BRAND.credit && !footer.textContent.includes(BRAND.credit)) (footer.querySelector(".foot-note") || footer).insertAdjacentHTML("beforeend", ` ${esc(BRAND.credit)}.`);
  }
}
