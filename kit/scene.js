// The three.js stage every explainer shares: lights, a camera that eases
// between per-step presets, a focus/highlight/flash registry, CSS labels,
// packets that travel along curves, hover tips, drag-to-turn, and parallax.
// A page builds its own objects on top of `world` and hands over its STEPS.
//
// Needs an importmap for "three" and "three/addons/" on the page.
export async function createScene({ stage = document.getElementById("stage"), host = document.getElementById("scene"), tip = document.getElementById("tip"), fog = [22, 42], tint = 0xdfe5ee } = {}) {
  let THREE, RoundedBoxGeometry, CSS2DRenderer, CSS2DObject;
  try {
    THREE = await import("three");
    ({ RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js"));
    ({ CSS2DRenderer, CSS2DObject } = await import("three/addons/renderers/CSS2DRenderer.js"));
  } catch {
    stage.classList.add("is-fallback");
    return null;
  }
  try {
    return build();
  } catch (e) {
    console.error(e);
    stage.classList.add("is-fallback");
    return null;
  }

  function build() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const C = c => new THREE.Color(c);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "labels";
    host.appendChild(labelRenderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeef2f7, fog[0], fog[1]);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    scene.add(new THREE.HemisphereLight(0xffffff, tint, 1.8));
    const keyL = new THREE.DirectionalLight(0xffffff, 1.5); keyL.position.set(3, 9, 9); scene.add(keyL);
    const rimL = new THREE.DirectionalLight(0xdce8f7, 0.7); rimL.position.set(-8, 4, -6); scene.add(rimL);
    const world = new THREE.Group(); scene.add(world);
    const grid = new THREE.GridHelper(50, 50, 0xd6dce6, 0xe3e8ef);
    grid.position.y = -3.2; grid.material.transparent = true; grid.material.opacity = 0.5; world.add(grid);

    // ── Registry ──
    // Anything registered fades when its keys are out of focus, pulses when
    // highlighted, and glows briefly when flashed.
    const focusables = [], pickables = [], labels = [];
    const reg = (obj, mat, keys, extra = {}) => {
      const f = { obj, mat, keys, base: mat.opacity, op: mat.opacity, flash: 0, hover: 0, ...extra };
      focusables.push(f); obj.userData.f = f; return f;
    };
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.04, transparent: true, emissive: color, emissiveIntensity: 0, ...o });
    const pick = (m, info) => { m.userData.info = info; pickables.push(m); };
    const box = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) / 2 - 0.001));
    const mesh = (geo, color, keys, parent = world, o = {}) => { const m = new THREE.Mesh(geo, std(color, o)); parent.add(m); reg(m, m.material, keys); return m; };

    function label(html, cls, groups, parent, pos) {
      const el = document.createElement("div");
      el.className = `lbl ${cls || ""}`;
      el.innerHTML = `<div class="lbl-in">${html}</div>`;
      const o = new CSS2DObject(el); o.position.copy(pos); parent.add(o);
      labels.push({ el, groups, o });
      return o;
    }
    const curve = pts => new THREE.CatmullRomCurve3(pts);
    function tube(c, color, keys, radius = 0.03, opacity = 0.55) {
      const m = new THREE.Mesh(new THREE.TubeGeometry(c, 60, radius, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
      world.add(m); reg(m, m.material, keys, { glow: true }); return m;
    }
    function dashed(c, color, keys, opacity = 0.6) {
      const m = new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.09, transparent: true, opacity });
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), m);
      l.computeLineDistances(); world.add(l); reg(l, m, keys, { glow: true }); return l;
    }

    const pktGeo = new THREE.SphereGeometry(0.1, 16, 12), glowGeo = new THREE.SphereGeometry(0.22, 16, 12);
    const packets = [];
    function packet(c, color, dur = 0.9, onEnd) {
      return new Promise(res => {
        const m = new THREE.Mesh(pktGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
        m.add(new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false })));
        world.add(m);
        packets.push({ m, curve: c, t: 0, dur: reduced ? 0.25 : dur, done: () => { world.remove(m); onEnd?.(); res(); } });
        kick();
      });
    }
    const flash = key => focusables.forEach(f => { if (f.keys.includes(key)) f.flash = 1; });

    // ── Steps ──
    let STEPS = {}, cur = { pos: [0, 2, 18], look: [0, 0, 0], focus: ["*"], hl: [], labels: [] }, curKey = null;
    const camPos = V(...cur.pos), camLook = V(...cur.look), camTarget = camPos.clone(), lookTarget = camLook.clone();
    let focus = new Set(["*"]), hl = new Set(), aspect = 1, snap = true;
    const stepListeners = [], frameListeners = [];

    function applyStep() {
      const k = Math.max(1, 1.5 / aspect);
      lookTarget.set(...cur.look);
      camTarget.set(...cur.pos).sub(lookTarget).multiplyScalar(k).add(lookTarget);
      focus = new Set(cur.focus); hl = new Set(cur.hl || []);
      const ls = new Set(cur.labels || []);
      labels.forEach(l => l.el.classList.toggle("on", l.groups.some(g => ls.has(g))));
      if (reduced || snap) { camPos.copy(camTarget); camLook.copy(lookTarget); snap = false; }
      kick();
    }
    function setStep(key) {
      if (!STEPS[key]) return;
      curKey = key; cur = STEPS[key];
      applyStep();
      stepListeners.forEach(fn => fn(key, cur));
    }
    // Re-apply the current step: use after changing which labels or objects exist.
    const refresh = () => { applyStep(); stepListeners.forEach(fn => fn(curKey, cur)); };

    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      aspect = w / h;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + "px"; renderer.domElement.style.height = h + "px";
      labelRenderer.setSize(w, h);
      camera.aspect = aspect; camera.updateProjectionMatrix();
      applyStep();
    }
    new ResizeObserver(resize).observe(host);

    // ── Pointer ──
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), parallax = new THREE.Vector2(), parallaxTarget = new THREE.Vector2();
    let yaw = 0, yawTarget = 0, dragging = false, dragX = 0, moved = 0, lastInteract = 0, hovered = null, interactive = true;
    host.addEventListener("pointerdown", e => { dragging = true; dragX = e.clientX; moved = 0; host.classList.add("dragging"); host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointerup", () => {
      dragging = false; host.classList.remove("dragging"); lastInteract = performance.now();
      const step = hovered?.userData.info?.step;
      if (moved < 5 && step && interactive) window.goToStep?.(step);
    });
    host.addEventListener("pointerleave", () => { hovered = null; tip.classList.remove("on"); parallaxTarget.set(0, 0); });
    host.addEventListener("pointermove", e => {
      const r = host.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      parallaxTarget.set(ndc.x, ndc.y);
      kick();
      if (dragging) {
        const dx = e.clientX - dragX; dragX = e.clientX; moved += Math.abs(dx);
        yawTarget = THREE.MathUtils.clamp(yawTarget + dx * 0.005, -0.6, 0.6);
        lastInteract = performance.now();
        return;
      }
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false).find(h => h.object.visible && (h.object.userData.f?.op ?? 1) > 0.3);
      hovered = hit ? hit.object : null;
      host.classList.toggle("pointing", Boolean(hovered?.userData.info?.step));
      if (hovered) {
        const i = typeof hovered.userData.info === "function" ? hovered.userData.info() : hovered.userData.info;
        tip.innerHTML = `<small>${i.kind}</small><b>${i.title}</b><span>${i.desc}</span>${i.step && interactive ? "<em>Click to jump to it →</em>" : ""}`;
        tip.style.left = Math.min(e.clientX - r.left + 16, r.width - 285) + "px";
        tip.style.top = Math.min(e.clientY - r.top + 16, r.height - 130) + "px";
        tip.classList.add("on");
      } else tip.classList.remove("on");
    });

    // ── Loop ──
    const clock = new THREE.Clock();
    let visible = true, raf = 0;
    function kick() { if (!raf && visible && !document.hidden) { clock.getDelta(); raf = requestAnimationFrame(loop); } }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(host);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
    const tmp = V(0, 0, 0);

    function loop() {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      const k = reduced ? 1 : 1 - Math.exp(-dt * 2.4);

      camPos.lerp(camTarget, k); camLook.lerp(lookTarget, k);
      parallax.lerp(parallaxTarget, reduced ? 0 : 1 - Math.exp(-dt * 3));
      camera.position.copy(camPos).add(tmp.set(parallax.x * 0.5, parallax.y * 0.3, 0));
      camera.lookAt(camLook);
      if (!dragging && performance.now() - lastInteract > 2500) yawTarget *= 1 - Math.min(1, dt * 0.8);
      yaw += (yawTarget - yaw) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
      world.rotation.y = yaw;

      const all = focus.has("*");
      for (const f of focusables) {
        const on = all || f.keys.some(key => focus.has(key));
        const target = f.base * (on ? 1 : 0.14);
        f.op += (target - f.op) * Math.min(1, k * 1.8);
        f.flash = Math.max(0, f.flash - dt * 1.1);
        const isHl = f.keys.some(key => hl.has(key));
        f.hover += ((hovered && hovered.userData.f === f ? 1 : 0) - f.hover) * Math.min(1, dt * 10);
        if (f.mat.emissive) {
          const pulse = isHl && !reduced ? 0.12 + 0.08 * Math.sin(t * 3) : isHl ? 0.15 : 0;
          f.mat.emissiveIntensity = Math.max(pulse, f.hover * 0.25, f.flash * 0.7);
          f.mat.opacity = Math.min(1, f.op);
        } else {
          const boost = f.glow && isHl ? 0.2 + (reduced ? 0 : 0.12 * Math.sin(t * 3)) : 0;
          f.mat.opacity = Math.min(1, f.op + boost + f.flash * 0.3);
        }
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t = Math.min(1, p.t + dt / p.dur);
        p.curve.getPointAt(p.t, p.m.position);
        if (p.t >= 1) { packets.splice(i, 1); p.done(); }
      }
      frameListeners.forEach(fn => fn(dt, t));

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    }

    const kit = {
      THREE, V, C, reduced, scene, world, camera,
      box, std, reg, pick, mesh, label, curve, tube, dashed, packet, flash,
      sleep: ms => new Promise(r => setTimeout(r, reduced ? 0 : ms)),
      setSteps(s) { STEPS = s; if (!curKey) { curKey = Object.keys(s)[0]; cur = s[curKey]; } resize(); },
      setStep, refresh,
      get step() { return curKey; },
      onStep: fn => stepListeners.push(fn),
      onFrame: fn => frameListeners.push(fn),
      setInteractive(on) { interactive = on; },
      kick,
    };
    return kit;
  }
}
