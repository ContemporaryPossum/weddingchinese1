/* Wei Jie & Xin Yi: invitation behaviour. Plain JS, no dependencies. */
(() => {
  "use strict";

  /* ---------- Wedding config: edit per couple ---------- */
  const WEDDING = {
    start: "2026-12-12T18:30:00+08:00",
    end: "2026-12-12T23:00:00+08:00",
    lat: 3.153, // PLACEHOLDER pin (Jalan Sultan Ismail, Kuala Lumpur)
    lng: 101.707,
    icsFile: "weijie-xinyi-wedding.ics",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
  const store = {
    get: (k) => safe(() => localStorage.getItem(k)),
    set: (k, v) => safe(() => localStorage.setItem(k, v)),
  };
  const session = {
    get: (k) => safe(() => sessionStorage.getItem(k)),
    set: (k, v) => safe(() => sessionStorage.setItem(k, v)),
  };

  /* ---------- i18n ---------- */
  const DICT = window.I18N || { en: {} };
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || store.get("lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  if (!DICT[lang]) lang = "en";
  const langListeners = [];

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? DICT.en[key] ?? "";
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }

  function applyLang(next) {
    lang = DICT[next] ? next : "en";
    root.lang = lang === "zh" ? "zh-Hans-MY" : "en-MY";
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    document.title = t("docTitle");
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDesc"));
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    store.set("lang", lang);
    langListeners.forEach((fn) => fn());
  }

  $$("[data-lang]").forEach((btn) => btn.addEventListener("click", () => applyLang(btn.dataset.lang)));

  /* ---------- Toast ---------- */
  const toastEl = $(".toast");
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  /* ---------- Image fade-in over LQIP ---------- */
  $$(".fade-img").forEach((img) => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });

  /* ---------- Hero video ---------- */
  const hero = $(".hero");
  const video = $(".hero__video");
  const portraitMq = window.matchMedia("(orientation: portrait)");
  let videoBase = "";

  function loadHeroVideo() {
    if (!video || reduceMotion.matches) return;
    if (navigator.connection && navigator.connection.saveData) return;
    const base = portraitMq.matches ? video.dataset.portrait : video.dataset.landscape;
    if (base === videoBase) return;
    videoBase = base;
    video.classList.remove("is-playing");
    video.replaceChildren();
    for (const [ext, type] of [["webm", "video/webm"], ["mp4", "video/mp4"]]) {
      const s = document.createElement("source");
      s.src = `${base}.${ext}`;
      s.type = type;
      video.append(s);
    }
    video.load();
    video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });
    video.play().catch(() => {});
  }
  portraitMq.addEventListener("change", () => { if (videoBase) loadHeroVideo(); });

  /* ---------- Gold dust (canvas 2D, paused off-screen) ---------- */
  function sparkles(canvas) {
    if (!canvas || reduceMotion.matches) return { start() {}, stop() {} };
    const ctx = canvas.getContext("2d");
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext("2d");
    const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,236,190,1)");
    g.addColorStop(0.25, "rgba(232,200,130,0.7)");
    g.addColorStop(1, "rgba(200,163,95,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 32, 32);

    let w = 0, h = 0, parts = [], raf = 0, running = false;
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 12,
      r: Math.random() * 1.5 + 0.5,
      vy: -(Math.random() * 0.22 + 0.06),
      vx: (Math.random() - 0.5) * 0.06,
      ph: Math.random() * Math.PI * 2,
      tw: Math.random() * 0.018 + 0.006,
      a: Math.random() * 0.45 + 0.25,
    });
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(64, Math.max(22, (w * h) / 18000)));
      parts = Array.from({ length: n }, () => spawn(true));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.ph += p.tw;
        p.x += p.vx + Math.sin(p.ph) * 0.05;
        p.y += p.vy;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(p.ph * 1.7));
        const s = p.r * 7;
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
        if (p.y < -12) Object.assign(p, spawn(false));
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    let rT = 0;
    window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(resize, 150); });
    return {
      start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
      stop() { running = false; cancelAnimationFrame(raf); },
    };
  }
  const dust = sparkles($(".hero__sparkle"));

  // Pause video + dust when the hero is off-screen or the tab is hidden
  let heroVisible = true;
  function syncHeroMotion() {
    const on = heroVisible && !document.hidden;
    if (on) { dust.start(); if (videoBase) video.play().catch(() => {}); }
    else { dust.stop(); if (videoBase) video.pause(); }
  }
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; syncHeroMotion(); }).observe(hero);
  document.addEventListener("visibilitychange", syncHeroMotion);

  /* ---------- Opening gate ---------- */
  const gate = $("#gate");
  const main = $("#main");
  const footer = $(".footer");
  const heroTitle = $("#hero-title");

  function placeWindow() {
    const win = $(".gate__window");
    if (!win) return;
    const r = win.getBoundingClientRect();
    gate.style.setProperty("--cx", `${r.left + r.width / 2}px`);
    gate.style.setProperty("--cy", `${r.top + r.height / 2}px`);
    gate.style.setProperty("--r", `${r.width / 2}px`);
  }

  function setGateLock(on) {
    root.classList.toggle("gate-active", on);
    main.inert = on;
    footer.inert = on;
  }

  function revealHero() { hero.classList.add("is-revealed"); }

  function openGate() {
    if (gate.classList.contains("is-opening")) return;
    placeWindow();
    gate.classList.add("is-opening");
    loadHeroVideo();
    const dur = reduceMotion.matches ? 50 : 1450;
    setTimeout(() => {
      setGateLock(false);
      revealHero();
      gate.classList.add("is-done");
      heroTitle.focus({ preventScroll: true });
      session.set("gateOpened", "1");
      setTimeout(() => { gate.hidden = true; }, reduceMotion.matches ? 0 : 520);
    }, dur);
  }

  const skipGate = session.get("gateOpened") === "1" || (location.hash && location.hash !== "#top") || params.has("open");
  if (skipGate) {
    gate.hidden = true;
    revealHero();
  } else {
    setGateLock(true);
    placeWindow();
    let pT = 0;
    window.addEventListener("resize", () => { cancelAnimationFrame(pT); pT = requestAnimationFrame(placeWindow); });
    if (document.fonts) document.fonts.ready.then(placeWindow);
    $("[data-gate-open]").addEventListener("click", openGate);
    $(".skip-link").addEventListener("click", (e) => { if (!gate.hidden) { e.preventDefault(); openGate(); } });
  }

  window.addEventListener("load", () => {
    // Warm the hero video once the page has settled so it is ready when the gate opens.
    setTimeout(loadHeroVideo, skipGate ? 0 : 700);
  });

  /* ---------- Countdown ---------- */
  const cdNums = Object.fromEntries($$("[data-cd]").map((el) => [el.dataset.cd, el]));
  const cdBox = $(".countdown");
  const cdDone = $(".countdown__done");
  const target = new Date(WEDDING.start).getTime();
  const endTime = new Date(WEDDING.end).getTime();
  let lastLabelMinute = -1;

  function tick() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      cdBox.hidden = true;
      cdDone.hidden = false;
      cdDone.textContent = t(now > endTime ? "cdMarried" : "cdToday");
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    const vals = { d: String(d), h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") };
    for (const k in vals) if (cdNums[k] && cdNums[k].textContent !== vals[k]) cdNums[k].textContent = vals[k];
    const minuteKey = d * 1440 + h * 60 + m;
    if (minuteKey !== lastLabelMinute) {
      lastLabelMinute = minuteKey;
      cdBox.setAttribute("aria-label", t("cdLabel", { d, h, m }));
    }
    setTimeout(tick, 1000 - (now % 1000) + 5);
  }
  langListeners.push(() => { lastLabelMinute = -1; });

  /* ---------- Scroll reveals ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); revealIO.unobserve(e.target); }
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  $$("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ---------- Gallery lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("[data-lb-img]");
  const lbAvif = $("[data-lb-avif]");
  const lbCap = $("[data-lb-caption]");
  const lbCount = $(".lightbox__count");
  const items = $$(".masonry__item");
  const photos = items.map((b) => ({ base: b.dataset.base, w: +b.dataset.w, h: +b.dataset.h, cap: b.dataset.cap, alt: b.dataset.alt }));
  let lbIndex = 0;
  let lbOpener = null;

  // AVIF goes up to 1800px; the WebP fallback stops at 1200px to keep the file count down.
  const srcset = (base, ext) => (ext === "avif" ? [800, 1200, 1800] : [800, 1200]).map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

  function renderLightbox(animate) {
    const p = photos[lbIndex];
    lbAvif.srcset = srcset(p.base, "avif");
    lbImg.srcset = srcset(p.base, "webp");
    lbImg.src = `${p.base}-1200.webp`;
    lbImg.width = p.w;
    lbImg.height = p.h;
    lbImg.alt = t(p.alt);
    lbCap.textContent = t(p.cap);
    lbCount.textContent = `${lbIndex + 1} / ${photos.length}`;
    if (animate && !reduceMotion.matches) {
      lbImg.classList.remove("is-entering");
      void lbImg.offsetWidth;
      lbImg.classList.add("is-entering");
    }
    // Warm neighbours in the format the browser already chose for the hero poster
    const ext = /\.avif/.test($(".hero__poster img").currentSrc) ? "avif" : "webp";
    [lbIndex - 1, lbIndex + 1].forEach((i) => {
      const n = photos[(i + photos.length) % photos.length];
      const pre = new Image();
      pre.src = `${n.base}-1200.${ext}`;
    });
  }

  function openLightbox(i, opener) {
    lbIndex = i;
    lbOpener = opener;
    renderLightbox(true);
    root.classList.add("lb-open");
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
  }
  function closeLightbox() {
    if (lb.open) lb.close();
  }
  function step(dir) {
    lbIndex = (lbIndex + dir + photos.length) % photos.length;
    renderLightbox(true);
  }

  items.forEach((btn, i) => btn.addEventListener("click", () => openLightbox(i, btn)));
  $("[data-lb-close]").addEventListener("click", closeLightbox);
  $("[data-lb-prev]").addEventListener("click", () => step(-1));
  $("[data-lb-next]").addEventListener("click", () => step(1));
  lb.addEventListener("close", () => {
    root.classList.remove("lb-open");
    if (lbOpener) lbOpener.focus({ preventScroll: true });
  });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.hasAttribute("data-lb-stage")) closeLightbox();
  });
  const stage = $("[data-lb-stage]");
  let swipeX = null;
  stage.addEventListener("pointerdown", (e) => { swipeX = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  langListeners.push(() => { if (lb.open) renderLightbox(false); });

  /* ---------- Calendar ---------- */
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const icsEscape = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  function googleCalUrl() {
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: t("icsTitle"),
      dates: `${utc(WEDDING.start)}/${utc(WEDDING.end)}`,
      details: t("icsDesc"),
      location: t("icsLoc"),
      ctz: "Asia/Kuala_Lumpur",
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }

  function downloadIcs() {
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation Sample//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:weijie-xinyi-${utc(WEDDING.start)}@invitation.example`,
      `DTSTAMP:${utc(new Date().toISOString())}`,
      `DTSTART:${utc(WEDDING.start)}`,
      `DTEND:${utc(WEDDING.end)}`,
      `SUMMARY:${icsEscape(t("icsTitle"))}`,
      `DESCRIPTION:${icsEscape(t("icsDesc"))}`,
      `LOCATION:${icsEscape(t("icsLoc"))}`,
      `GEO:${WEDDING.lat};${WEDDING.lng}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(t("icsTitle"))}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = WEDDING.icsFile;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function syncCalLinks() { $$("[data-cal-google]").forEach((a) => { a.href = googleCalUrl(); }); }
  langListeners.push(syncCalLinks);
  $$("[data-cal-ics]").forEach((b) => b.addEventListener("click", () => {
    downloadIcs();
    b.closest("details").open = false;
  }));
  $$("[data-cal-google]").forEach((a) => a.addEventListener("click", () => { a.closest("details").open = false; }));
  document.addEventListener("click", (e) => {
    $$(".cal-menu[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    $$(".cal-menu[open]").forEach((d) => { d.open = false; $("summary", d).focus(); });
  });

  /* ---------- Music (off by default) ---------- */
  const audio = $("#bgm");
  const musicBtns = $$("[data-music-toggle]");
  let musicOn = false;
  let fadeRaf = 0;
  let resumeOnShow = false;

  function fadeVolume(to, done) {
    cancelAnimationFrame(fadeRaf);
    const from = audio.volume;
    const t0 = performance.now();
    const dur = 900;
    const stepFn = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * k));
      if (k < 1) fadeRaf = requestAnimationFrame(stepFn);
      else if (done) done();
    };
    fadeRaf = requestAnimationFrame(stepFn);
  }

  function syncMusicUi() {
    root.classList.toggle("music-on", musicOn);
    musicBtns.forEach((b) => {
      b.setAttribute("aria-pressed", String(musicOn));
      if (!$("[data-music-label]", b)) b.setAttribute("aria-label", t(musicOn ? "musicPause" : "musicPlay"));
    });
    $$("[data-music-label]").forEach((el) => { el.textContent = t(musicOn ? "musicPause" : "musicPlay"); });
  }

  function setMusic(on) {
    musicOn = on;
    if (on) {
      audio.volume = 0;
      audio.play().then(() => fadeVolume(0.6)).catch(() => { musicOn = false; syncMusicUi(); });
    } else {
      fadeVolume(0, () => audio.pause());
    }
    syncMusicUi();
  }
  musicBtns.forEach((b) => b.addEventListener("click", () => setMusic(!musicOn)));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && musicOn) { resumeOnShow = true; audio.pause(); }
    else if (!document.hidden && resumeOnShow) { resumeOnShow = false; audio.play().catch(() => {}); }
  });
  langListeners.push(syncMusicUi);

  /* ---------- Copy buttons ---------- */
  $$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      toast(t("copied"));
    } catch {
      toast(t("copyFail"));
    }
  }));

  /* ---------- RSVP ---------- */
  const form = $("#rsvp-form");
  const thanks = $("#rsvp-thanks");
  const submitBtn = $("[data-rsvp-submit]");
  const submitLabel = $("[data-rsvp-submit-label]");
  const spinner = $(".btn__spinner", submitBtn);
  const sendError = $("#rsvp-send-error");
  const guestsInput = $("#rsvp-guests");
  let lastReply = null;

  // Radio tiles: mirror checked/focus state as classes (works without :has()).
  function syncChoices() {
    $$(".choice", form).forEach((c) => {
      const input = $("input", c);
      c.classList.toggle("is-checked", input.checked);
    });
  }
  $$(".choice input", form).forEach((input) => {
    input.addEventListener("change", syncChoices);
    input.addEventListener("focus", () => { if (input.matches(":focus-visible")) input.closest(".choice").classList.add("is-focus"); });
    input.addEventListener("blur", () => input.closest(".choice").classList.remove("is-focus"));
  });

  function attendingValue() {
    const c = $('input[name="attending"]:checked', form);
    return c ? c.value : "";
  }

  function syncAttending() {
    const declining = attendingValue() === "no";
    $$("[data-when-attending]", form).forEach((el) => {
      el.hidden = declining;
      $$("input, button", el).forEach((i) => { i.disabled = declining; });
    });
    syncStepper();
  }
  $$('input[name="attending"]', form).forEach((r) => r.addEventListener("change", () => { syncAttending(); clearError("attending"); }));
  $$('input[name="diet"]', form).forEach((r) => r.addEventListener("change", () => clearError("diet")));

  function syncStepper() {
    const v = parseInt(guestsInput.value, 10);
    const [minus, plus] = $$("[data-step]", form);
    if (guestsInput.disabled) return;
    minus.disabled = !(v > 1);
    plus.disabled = !(v < 5) && !Number.isNaN(v);
  }
  $$("[data-step]", form).forEach((b) => b.addEventListener("click", () => {
    const v = parseInt(guestsInput.value, 10) || 1;
    guestsInput.value = String(Math.min(5, Math.max(1, v + Number(b.dataset.step))));
    clearError("guests");
    syncStepper();
  }));
  guestsInput.addEventListener("input", () => { clearError("guests"); syncStepper(); });

  const errorTargets = {
    name: { el: () => $("#rsvp-name"), err: () => $("#err-name") },
    attending: { el: () => $("#field-attending"), err: () => $("#err-attending") },
    guests: { el: () => guestsInput, err: () => $("#err-guests") },
    diet: { el: () => $("#field-diet"), err: () => $("#err-diet") },
  };

  function showError(field, key) {
    const { el, err } = errorTargets[field];
    el().setAttribute("aria-invalid", "true");
    const e = err();
    e.hidden = false;
    e.dataset.errKey = key;
    e.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg><span></span>';
    $("span", e).textContent = t(key);
  }
  function clearError(field) {
    const { el, err } = errorTargets[field];
    el().removeAttribute("aria-invalid");
    err().hidden = true;
  }
  $("#rsvp-name").addEventListener("input", () => clearError("name"));
  langListeners.push(() => {
    $$(".field__error", form).forEach((e) => { if (!e.hidden && e.dataset.errKey) $("span", e).textContent = t(e.dataset.errKey); });
  });

  function validate() {
    const data = {
      name: $("#rsvp-name").value.trim(),
      attending: attendingValue(),
      guests: parseInt(guestsInput.value, 10),
      diet: ($('input[name="diet"]:checked', form) || {}).value || "",
      message: $("#rsvp-message").value.trim(),
    };
    const errors = [];
    if (data.name.length < 2) errors.push(["name", "errName"]);
    if (!data.attending) errors.push(["attending", "errAttend"]);
    if (data.attending === "yes") {
      if (!(data.guests >= 1 && data.guests <= 5)) errors.push(["guests", "errGuests"]);
      if (!data.diet) errors.push(["diet", "errDiet"]);
    } else {
      data.guests = 0;
      data.diet = "";
    }
    Object.keys(errorTargets).forEach(clearError);
    errors.forEach(([f, k]) => showError(f, k));
    return { ok: errors.length === 0, data, first: errors[0] && errors[0][0] };
  }

  /* ======================================================================
     RSVP SUBMIT HANDLER (DEMO).
     Nothing leaves the page. To connect a real backend (Google Apps Script,
     Formspree, Supabase, your own API), replace the body of submitRsvp()
     with a POST and return { ok: true } on success. Example:

       const res = await fetch("https://YOUR-ENDPOINT.example/rsvp", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(data),
       });
       return { ok: res.ok };
     ====================================================================== */
  async function submitRsvp(data) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ok: true, data };
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    spinner.hidden = !on;
    submitLabel.dataset.i18n = on ? "fSending" : "fSubmit";
    submitLabel.textContent = t(submitLabel.dataset.i18n);
  }

  function renderThanks() {
    if (!lastReply) return;
    const first = lastReply.name.split(/\s+/).slice(-2).join(" ");
    const yes = lastReply.attending === "yes";
    $(".rsvp-thanks__title", thanks).textContent = t(yes ? "thanksYesTitle" : "thanksNoTitle", { name: first });
    $(".rsvp-thanks__body", thanks).textContent = yes
      ? (lastReply.guests > 1 ? t("thanksYesBodyN", { n: lastReply.guests }) : t("thanksYesBody1"))
      : t("thanksNoBody");
  }
  langListeners.push(renderThanks);

  function addWish(reply) {
    const list = $("#wishes-list");
    const prev = $(".wish--new", list);
    if (prev) prev.remove();
    const li = document.createElement("li");
    li.className = "wish wish--new";
    li.innerHTML = '<blockquote><p></p></blockquote><p class="wish__by"><span class="wish__name"></span><span class="wish__rel" data-i18n="justNow"></span></p>';
    $("blockquote p", li).textContent = reply.message;
    $(".wish__name", li).textContent = reply.name;
    $(".wish__rel", li).textContent = t("justNow");
    list.prepend(li);
    list.scrollLeft = 0;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    sendError.hidden = true;
    const v = validate();
    if (!v.ok) {
      const target = v.first === "attending" || v.first === "diet"
        ? $("input", errorTargets[v.first].el())
        : errorTargets[v.first].el();
      target.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await submitRsvp(v.data);
      if (!res || !res.ok) throw new Error("RSVP failed");
      lastReply = v.data;
      renderThanks();
      form.hidden = true;
      thanks.hidden = false;
      // Restart the seal drawing each time the panel is shown
      $$(".rsvp-thanks__seal .draw, .rsvp-thanks__seal text", thanks).forEach((n) => { n.style.animation = "none"; void n.getBoundingClientRect(); n.style.animation = ""; });
      thanks.focus();
      if (v.data.message) addWish(v.data);
    } catch {
      sendError.textContent = t("errSend");
      sendError.hidden = false;
    } finally {
      setLoading(false);
    }
  });

  $("[data-rsvp-edit]").addEventListener("click", () => {
    thanks.hidden = true;
    form.hidden = false;
    $("#rsvp-name").focus();
  });

  /* ---------- Floating RSVP button (mobile) ---------- */
  const fab = $(".rsvp-fab");
  const fabState = { hero: true, rsvp: false, footer: false };
  const fabIO = new IntersectionObserver((entries) => {
    for (const e of entries) fabState[e.target.dataset.fab] = e.isIntersecting;
    fab.classList.toggle("is-visible", !fabState.hero && !fabState.rsvp && !fabState.footer);
  }, { threshold: 0 });
  hero.dataset.fab = "hero";
  $("#rsvp").dataset.fab = "rsvp";
  footer.dataset.fab = "footer";
  [hero, $("#rsvp"), footer].forEach((el) => fabIO.observe(el));

  /* ---------- Map links (from config) ---------- */
  $$("[data-map-google]").forEach((a) => { a.href = `https://www.google.com/maps/search/?api=1&query=${WEDDING.lat},${WEDDING.lng}`; });
  $$("[data-map-waze]").forEach((a) => { a.href = `https://waze.com/ul?ll=${WEDDING.lat},${WEDDING.lng}&navigate=yes`; });

  /* ---------- Boot ---------- */
  applyLang(lang);
  syncChoices();
  syncAttending();
  tick();
})();
