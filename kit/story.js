// Scroll-driven stepping shared by every explainer: step cards on the left,
// a sticky stage on the right, dots, a gentle "next" arrow for presenting,
// and a run button that only appears on the last step.
//
// Page contract:
//   <section class="story" id="story"><div class="steps"> <article class="step" data-step="…"> … </div>
//   <div class="stage" id="stage"><div class="stage-frame"><div class="scene" id="scene"></div><div class="fallback">…</div></div></div>
const ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>';
const ICON_HAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';

export function initStory({ runLabel = "Run it", onRun, hint = "Drag to turn · hover anything · click a piece to jump to it" } = {}) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storyEl = document.getElementById("story");
  const frame = document.querySelector("#stage .stage-frame");
  const stepEls = [...storyEl.querySelectorAll(".step")];
  const listeners = [];
  let scene = null, active = null, running = false, ran = false;

  frame.insertAdjacentHTML("beforeend", `
    <div class="tip" id="tip"></div>
    <div class="step-dots" id="stepDots"></div>
    <div class="stage-hint">${ICON_HAND}${hint}</div>
    <div class="stage-nav">
      <button class="next-btn" id="nextBtn" type="button"><span class="next-btn__label" id="nextLabel"></span><span class="next-btn__ring">${ICON_NEXT}</span></button>
      <button class="run-btn is-off" id="sendBtn" type="button">${ICON_PLAY}${runLabel}</button>
    </div>`);
  const dots = document.getElementById("stepDots"), nextBtn = document.getElementById("nextBtn"), sendBtn = document.getElementById("sendBtn");
  dots.innerHTML = stepEls.map(s => `<button type="button" data-go="${s.dataset.step}" aria-label="Go to ${s.querySelector("h2").textContent.replace(/"/g, "")}"></button>`).join("");

  const index = () => stepEls.findIndex(s => s.dataset.step === active);
  const goTo = i => stepEls[Math.max(0, Math.min(stepEls.length - 1, i))].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  const goToStep = key => goTo(stepEls.findIndex(s => s.dataset.step === key));
  window.goToStep = goToStep;
  dots.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => goTo(i)));
  nextBtn.addEventListener("click", () => goTo(index() + 1));

  function setActive(key) {
    if (key === active) return;
    active = key;
    stepEls.forEach(s => s.classList.toggle("is-active", s.dataset.step === key));
    dots.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.go === key));
    const i = index(), last = i === stepEls.length - 1;
    nextBtn.classList.toggle("is-off", last);
    sendBtn.classList.toggle("is-off", !last);
    if (!last) document.getElementById("nextLabel").innerHTML = `<span>Next · </span>${stepEls[i + 1].querySelector(".step-k").textContent.trim()}`;
    scene?.setStep(key);
    listeners.forEach(fn => fn(key));
  }

  const narrow = matchMedia("(max-width: 980px)");
  let observer;
  function observe() {
    observer?.disconnect();
    observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.step); }),
      { rootMargin: narrow.matches ? "-66% 0px -26% 0px" : "-46% 0px -46% 0px" });
    stepEls.forEach(s => observer.observe(s));
  }
  observe();
  narrow.addEventListener("change", observe);
  setActive(stepEls[0].dataset.step);

  async function run() {
    if (running || !onRun) return;
    running = ran = true;
    document.querySelectorAll("[data-run]").forEach(b => { b.disabled = true; });
    sendBtn.disabled = true;
    scene?.setInteractive(false);
    try { await onRun(); } finally {
      running = false;
      document.querySelectorAll("[data-run]").forEach(b => { b.disabled = false; });
      sendBtn.disabled = false;
      scene?.setInteractive(true);
    }
  }
  sendBtn.addEventListener("click", run);
  document.querySelectorAll("[data-run]").forEach(b => b.addEventListener("click", run));

  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest("input, textarea, select, [contenteditable]")) return;
    const r = storyEl.getBoundingClientRect(), mid = innerHeight / 2;
    if (r.top > mid || r.bottom < mid) return;
    const i = index(), last = i === stepEls.length - 1;
    if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key)) {
      if (last) { if (ran) return; e.preventDefault(); run(); return; }
      e.preventDefault(); goTo(i + 1);
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      if (i === 0) return;
      e.preventDefault(); goTo(i - 1);
    }
  });

  if (location.hash) {
    const key = location.hash.slice(1);
    if (stepEls.some(s => s.dataset.step === key)) requestAnimationFrame(() => goToStep(key));
  }

  return {
    goToStep,
    get active() { return active; },
    get running() { return running; },
    onStep: fn => listeners.push(fn),
    bindScene(s) { scene = s; s.setStep(active); },
  };
}

// A small trace log for "Try it" runs: user bubbles and steps that resolve with a tick.
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="M8 12.5l2.6 2.6L16 9.6"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".14"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
export function traceLog(ul) {
  return {
    clear() { ul.innerHTML = ""; },
    user(text) {
      const li = document.createElement("li"); li.className = "user"; li.innerHTML = `<span>${text}</span>`;
      ul.appendChild(li); requestAnimationFrame(() => li.classList.add("in"));
    },
    step(html) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="dot"><span class="spin"></span><span class="tick">${TICK}</span></span><div>${html}</div>`;
      ul.appendChild(li); requestAnimationFrame(() => li.classList.add("in"));
      return {
        done(res, bad) {
          if (res) li.querySelector("div").insertAdjacentHTML("beforeend", `<span class="res">${res}</span>`);
          if (bad) { li.classList.add("bad"); li.querySelector(".tick").innerHTML = CROSS; }
          li.classList.add("done");
        },
        el: li,
      };
    },
  };
}
export const sleep = ms => new Promise(r => setTimeout(r, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms));
