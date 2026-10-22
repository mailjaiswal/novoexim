/* ==========================================================================
   NOVO EXIM — V2 Interaction Engine
   Zero-dependency • Delegated click router • Prismatic spotlight physics
   Odometers • Toast engine • Cmd+K spotlight • Formspree AJAX
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const EASE_STUDIO = "cubic-bezier(0.16, 1, 0.3, 1)";

  /* ------------------------------------------------------------------
     1. Telemetry Toast Engine (zero window.alert)
  ------------------------------------------------------------------ */
  const toastStack = $("#toast-stack");
  const TOAST_META = {
    success: { badge: "SUCCESS", cls: "ok" },
    warn:    { badge: "WARN",    cls: "warn" },
    error:   { badge: "ERROR",   cls: "err" },
    info:    { badge: "INFO",    cls: "info" }
  };

  function showToast(kind, title, detail) {
    if (!toastStack) return;
    const meta = TOAST_META[kind] || TOAST_META.info;
    const stamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const el = document.createElement("div");
    el.className = "glass-toast";
    el.innerHTML =
      '<span class="toast-badge ' + meta.cls + '">' + meta.badge + "</span>" +
      "<div><p class=\"toast-title\">" + title + "</p>" +
      (detail ? '<p class="toast-detail">' + detail + "</p>" : "") +
      '<p class="toast-time">' + stamp + " IST</p></div>" +
      '<button class="toast-x" aria-label="Dismiss">✕</button>';
    toastStack.appendChild(el);
    const kill = () => {
      if (!el.isConnected || el.classList.contains("is-leaving")) return;
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 420);
    };
    el.querySelector(".toast-x").addEventListener("click", kill);
    setTimeout(kill, 5400);
  }
  window.novoToast = showToast; // exposed for console debugging

  /* ------------------------------------------------------------------
     2. Delegated Click Router (sandbox-safe, no inline onclick)
  ------------------------------------------------------------------ */
  document.addEventListener("click", function (e) {
    // Smooth anchor scrolls + close drawer
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        closeDrawer();
        closeSpotlight();
        fireToastIfAny(link);
        history.replaceState(null, "", "#" + id);
        return;
      }
    }

    const act = e.target.closest("[data-action]");
    if (act) {
      const kind = act.dataset.action;
      if (kind === "toggle-drawer") toggleDrawer(act);
      if (kind === "open-spotlight") openSpotlight();
      if (kind === "close-modal") closeModal();
      if (kind === "faq") toggleFaq(act);
      if (kind === "geo-dot") {
        const dot = act;
        const wasOpen = dot.classList.contains("is-open");
        $$(".geo-dot").forEach((d) => d.classList.remove("is-open"));
        if (!wasOpen) dot.classList.add("is-open");
      }
    }

    // Document modal triggers
    const docBtn = e.target.closest("[data-doc]");
    if (docBtn) {
      openModal(docBtn.dataset.doc);
      fireToastIfAny(docBtn);
    }

    // Slider controls
    if (e.target.closest('[data-slider="prev"]')) { showSlide(slideIndex - 1); restartAutoSlide(); }
    if (e.target.closest('[data-slider="next"]')) { showSlide(slideIndex + 1); restartAutoSlide(); }
    const dot = e.target.closest("[data-slide-dot]");
    if (dot) { showSlide(parseInt(dot.dataset.slideDot, 10)); restartAutoSlide(); }

    // Generic toast triggers (links/buttons with data-toast="kind|Title|Detail")
    if (!docBtn) fireToastIfAny(e.target.closest("[data-toast]"));
  });

  function fireToastIfAny(el) {
    if (!el || !el.dataset || !el.dataset.toast) return;
    const parts = el.dataset.toast.split("|");
    showToast(parts[0] || "info", parts[1] || "Notice", parts[2] || "");
  }

  // External links still get feedback
  $$('a[target="_blank"]').forEach((a) => {
    a.setAttribute("rel", "noopener");
    a.addEventListener("click", () => {
      if (!a.dataset.toast) {
        showToast("info", "External channel", "Opening " + a.hostname + " in a new tab.");
      }
    });
  });

  /* ------------------------------------------------------------------
     3. Hero Showcase Carousel
  ------------------------------------------------------------------ */
  const slides = $$("#hero-slider .slide");
  const slideMeta = [
    { kicker: "Logistics",  label: "Maritime Freight & Port Terminals",   seal: "En-route · Global Ports" },
    { kicker: "Sourcing",   label: "Himalayan Basmati Agricultural Belts", seal: "Geo-tagged · North India" },
    { kicker: "Commodities", label: "Jaggery & Fuller's Earth Cargo",      seal: "FOB / CIF Ready" }
  ];
  let slideIndex = 0, autoSlideTimer = null;

  function showSlide(i) {
    if (!slides.length) return;
    slideIndex = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === slideIndex));
    $$("[data-slide-dot]").forEach((d, idx) => d.classList.toggle("is-active", idx === slideIndex));
    const meta = slideMeta[slideIndex] || slideMeta[0];
    const kicker = $("#slide-kicker"), label = $("#slide-label"), seal = $("#slide-seal");
    if (kicker) kicker.textContent = meta.kicker;
    if (label) label.textContent = meta.label;
    if (seal) seal.textContent = meta.seal;
  }
  function restartAutoSlide() {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(() => showSlide(slideIndex + 1), 5200);
  }
  showSlide(0); restartAutoSlide();

  /* ------------------------------------------------------------------
     4. Dock — scroll state, spy pill, drawer
  ------------------------------------------------------------------ */
  const dock = $("#dock");
  const drawer = $("#mobile-drawer");

  function onScroll() { if (dock) dock.classList.toggle("is-scrolled", window.scrollY > 30); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function toggleDrawer(btn) {
    if (!drawer || !btn) return;
    const open = drawer.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  }
  function closeDrawer() {
    if (drawer) drawer.classList.remove("is-open");
    const burger = $('[data-action="toggle-drawer"]');
    if (burger) burger.setAttribute("aria-expanded", "false");
  }

  // Scroll-spy → active pill in the dock
  const spyLinks = $$(".dock-link[data-spy]");
  const spySections = spyLinks.map((l) => document.getElementById(l.dataset.spy)).filter(Boolean);
  if ("IntersectionObserver" in window && spySections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          spyLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.spy === entry.target.id));
        }
      });
    }, { rootMargin: "-42% 0px -52% 0px" });
    spySections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------------------
     5. Cursor Spotlight Refraction on every prism shell
  ------------------------------------------------------------------ */
  document.addEventListener("pointermove", function (e) {
    const prism = e.target.closest(".spotlight-prism");
    if (!prism) return;
    const r = prism.getBoundingClientRect();
    prism.style.setProperty("--mouse-x", ((e.clientX - r.left) / r.width) * 100 + "%");
    prism.style.setProperty("--mouse-y", ((e.clientY - r.top) / r.height) * 100 + "%");
  }, { passive: true });

  /* ------------------------------------------------------------------
     6. Magnetic Foil Buttons
  ------------------------------------------------------------------ */
  const MAGNET = 5.5;
  $$(".magnetic-btn").forEach(bindMagnetic);
  function bindMagnetic(btn) {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      btn.style.transform = "translate(" + (dx * MAGNET) + "px," + (dy * MAGNET * 0.7 - 1.5) + "px) scale(1.015)";
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  }

  /* ------------------------------------------------------------------
     7. Odometers, Load Bars, Gauges — exponential count-up choreography
  ------------------------------------------------------------------ */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateCount(el) {
    const target = parseFloat(el.dataset.count || el.textContent || "0");
    const suffix = el.dataset.suffix || "";
    const dur = 1500;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min((now - t0) / dur, 1);
      const val = target * easeOutExpo(p);
      el.textContent = Math.round(val) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function animateBar(el) { el.style.width = el.dataset.bar + "%"; }

  function animateGauge(el) {
    const r = parseFloat(el.getAttribute("r"));
    const len = parseFloat(el.dataset.gaugeLen || (2 * Math.PI * r).toFixed(1));
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1600ms " + EASE_STUDIO;
      el.style.strokeDashoffset = len * (1 - parseFloat(el.dataset.gauge || "0.8"));
    });
  }

  const CHOREO = "[data-count],[data-bar],[data-gauge]";
  const choreoDone = new WeakSet();
  function runChoreo(el) {
    if (!el || choreoDone.has(el)) return;
    choreoDone.add(el);
    if (el.matches("[data-count]")) animateCount(el);
    else if (el.matches("[data-bar]")) animateBar(el);
    else if (el.matches("[data-gauge]")) animateGauge(el);
  }
  if ("IntersectionObserver" in window) {
    // Observe HTML hosts (prisms / parents) rather than raw SVG circles
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target.matches && entry.target.matches(CHOREO)) runChoreo(entry.target);
        $$(CHOREO, entry.target).forEach(runChoreo);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    const hosts = new Set();
    $$(CHOREO).forEach((el) => hosts.add(el.closest(".spotlight-prism") || el.parentElement || el));
    hosts.forEach((h) => io.observe(h));
  } else {
    $$(CHOREO).forEach(runChoreo);
  }

  /* ------------------------------------------------------------------
     8. Scroll Reveal
  ------------------------------------------------------------------ */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => ro.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     9. FAQ accordion (prismatic, height-animated)
  ------------------------------------------------------------------ */
  function toggleFaq(btn) {
    const item = btn.closest(".faq-item");
    const answer = $(".faq-a", item);
    if (!answer) return;
    const open = item.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    answer.style.maxHeight = open ? answer.scrollHeight + "px" : "0px";
    if (open) {
      $$(".faq-item.is-open").forEach((other) => {
        if (other === item) return;
        other.classList.remove("is-open");
        const ob = $(".faq-q", other), oa = $(".faq-a", other);
        if (ob) ob.setAttribute("aria-expanded", "false");
        if (oa) oa.style.maxHeight = "0px";
      });
    }
  }

  /* ------------------------------------------------------------------
     10. Document modal (sanitized certificate viewer)
  ------------------------------------------------------------------ */
  const DOCS = {
    udyam: {
      title: "Udyam Certificate",
      subtitle: "MSME Registration",
      desc: "Registration under the Ministry of Micro, Small and Medium Enterprises, Government of India.",
      details: "<strong>Registration No:</strong> UDYAM-KR-03-XXXXXXX<br><strong>Category:</strong> Micro Enterprise<br><strong>Location:</strong> Kammanahalli, Bangalore, Karnataka"
    },
    gst: {
      title: "GST Certificate",
      subtitle: "Government of India · GSTIN",
      desc: "Tax identification under the Commercial Tax Department, Karnataka.",
      details: "<strong>GSTIN:</strong> 29XXXXXXXXX1Z5<br><strong>Trade Name:</strong> NOVO EXIM<br><strong>Jurisdiction:</strong> Kammanahalli Ward, Bangalore"
    },
    iec: {
      title: "IEC License",
      subtitle: "DGFT · Import Export Code",
      desc: "Directorate General of Foreign Trade, Ministry of Commerce & Industry.",
      details: "<strong>IEC Code:</strong> 071XXXXXXX<br><strong>Proprietor:</strong> Ankur Jaiswal<br><strong>Registered Operations:</strong> Exporter of Agricultural & Mineral Commodities"
    }
  };
  const modal = $("#doc-modal");

  function openModal(key) {
    const doc = DOCS[key];
    if (!doc || !modal) return;
    $("#modal-title").textContent = doc.title;
    $("#modal-subtitle").textContent = doc.subtitle;
    $("#modal-desc").textContent = doc.desc;
    $("#modal-details").innerHTML = doc.details;
    modal.classList.add("is-open");
    showToast("info", "Preview opened", doc.title + " — sanitized for public view.");
  }
  function closeModal() { if (modal) modal.classList.remove("is-open"); }
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  /* ------------------------------------------------------------------
     11. Cmd+K / Ctrl+K Spotlight Launcher
  ------------------------------------------------------------------ */
  const spotlight = $("#spotlight");
  const spotInput = $("#spotlight-input");
  const spotResults = $("#spotlight-results");
  const SECTIONS = [
    { id: "home", label: "Home — Hero & Export Overview", num: "01" },
    { id: "expertise", label: "Our Expertise & Sourcing Capabilities", num: "02" },
    { id: "products", label: "Export Products — Rice · Jaggery · Clay", num: "03" },
    { id: "sourcing", label: "Pan-India Geo-Tagged Sourcing Map", num: "04" },
    { id: "process", label: "From Farm to Freighter — Export Workflow", num: "05" },
    { id: "why-us", label: "Why Global Buyers Choose Novo Exim", num: "06" },
    { id: "documents", label: "Official Company Licenses", num: "07" },
    { id: "query", label: "Submit RFQ / Query", num: "08" },
    { id: "cta", label: "Ship Your First Container — CTA", num: "09" },
    { id: "contact", label: "Contact & Location", num: "10" },
    { id: "faqs", label: "Frequently Asked Questions", num: "11" }
  ];
  let spotCursor = 0;

  function renderSpot(filter) {
    const q = (filter || "").toLowerCase();
    const matches = SECTIONS.filter((s) => s.label.toLowerCase().includes(q) || s.id.includes(q));
    spotCursor = 0;
    spotResults.innerHTML = matches.map((s, i) =>
      '<button data-spot="' + s.id + '"' + (i === 0 ? ' class="is-cursor"' : "") + ">" +
      "<span>" + s.label + "</span><span class=\"num\">SEC " + s.num + "</span></button>"
    ).join("") || '<p class="tiny-mono" style="padding:14px 16px;">No matching section.</p>';
  }
  function openSpotlight() {
    if (!spotlight) return;
    spotlight.classList.add("is-open");
    renderSpot("");
    setTimeout(() => spotInput && spotInput.focus(), 60);
  }
  function closeSpotlight() { if (spotlight) spotlight.classList.remove("is-open"); }

  if (spotlight) {
    spotlight.addEventListener("click", (e) => {
      if (e.target === spotlight) closeSpotlight();
      const hit = e.target.closest("[data-spot]");
      if (hit) {
        closeSpotlight();
        const t = document.getElementById(hit.dataset.spot);
        if (t) t.scrollIntoView({ behavior: "smooth" });
      }
    });
    spotInput.addEventListener("input", () => renderSpot(spotInput.value));
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      spotlight.classList.contains("is-open") ? closeSpotlight() : openSpotlight();
    }
    if (e.key === "Escape") { closeSpotlight(); closeModal(); closeDrawer(); }
    if (spotlight && spotlight.classList.contains("is-open") && spotResults) {
      const btns = $$("button[data-spot]", spotResults);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!btns.length) return;
        btns[spotCursor] && btns[spotCursor].classList.remove("is-cursor");
        spotCursor = (spotCursor + (e.key === "ArrowDown" ? 1 : -1) + btns.length) % btns.length;
        btns[spotCursor].classList.add("is-cursor");
        btns[spotCursor].scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter" && btns[spotCursor]) btns[spotCursor].click();
    }
  });

  /* ------------------------------------------------------------------
     12. RFQ Form → Formspree AJAX + toast telemetry
  ------------------------------------------------------------------ */
  const form = $("#inquiry-form");
  const submitBtn = $("#submit-btn");
  const defaultBtnHTML = submitBtn ? submitBtn.innerHTML : "";

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        showToast("warn", "Missing fields", "Complete the required (*) fields before dispatching the RFQ.");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="num">DISPATCHING…</span>';

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          showToast("success", "RFQ dispatched", "Delivered to NovoExim2025@gmail.com — formal quotation within 12 business hours.");
          form.reset();
        } else {
          throw new Error("Formspree responded " + res.status);
        }
      } catch (err) {
        showToast("error", "Transmission fallback", "Form relay busy — email NovoExim2025@gmail.com directly and we'll prioritise your RFQ.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultBtnHTML;
      }
    });
  }

  /* ------------------------------------------------------------------
     13. Scroll Progress Line
  ------------------------------------------------------------------ */
  const progress = $("#scroll-progress");
  function onProgress() {
    if (!progress) return;
    const h = document.documentElement;
    const p = window.scrollY / ((h.scrollHeight - window.innerHeight) || 1);
    progress.style.width = (Math.min(p, 1) * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", onProgress, { passive: true });
  onProgress();

  /* ------------------------------------------------------------------
     14. Trade-Lane Ticker — seamless loop via content duplication
  ------------------------------------------------------------------ */
  const tickerTrack = $("#ticker-track");
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  /* ------------------------------------------------------------------
     15. Hero Word-Mask Split Reveal
  ------------------------------------------------------------------ */
  $$("[data-split]").forEach(function (el) {
    const source = Array.from(el.childNodes);
    el.textContent = "";
    let wi = 0;
    function wrapWord(node) {
      const outer = document.createElement("span");
      outer.className = "split-w";
      const inner = document.createElement("i");
      inner.className = "split-i";
      inner.style.transitionDelay = (140 + wi++ * 70) + "ms";
      inner.appendChild(node);
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(" "));
    }
    source.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).filter(Boolean).forEach(function (word) {
          wrapWord(document.createTextNode(word));
        });
      } else {
        wrapWord(n.cloneNode(true));
      }
    });
  });
  requestAnimationFrame(function () {
    setTimeout(function () {
      $$("[data-split]").forEach(function (el) { el.classList.add("is-split-in"); });
    }, 120);
  });

  /* ------------------------------------------------------------------
     16. Prismatic 3D Tilt Physics (fine pointers only)
  ------------------------------------------------------------------ */
  const canTilt = window.matchMedia("(pointer:fine)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    && window.innerWidth > 1080;
  if (canTilt) {
    $$(".spotlight-prism").forEach(function (prism) {
      if (prism.hasAttribute("data-no-tilt")) return;
      if (prism.classList.contains("faq-item")) return;
      if (prism.closest(".modal, .spotlight, .footer")) return;
      prism.addEventListener("pointermove", function (e) {
        const r = prism.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        prism.style.transform =
          "perspective(1100px) translateY(-4px)" +
          " rotateX(" + (-py * 3.1).toFixed(2) + "deg)" +
          " rotateY(" + (px * 3.6).toFixed(2) + "deg)";
      });
      prism.addEventListener("pointerleave", function () {
        prism.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     17. Housekeeping
  ------------------------------------------------------------------ */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Deep-link arrival (e.g. #products on load) — reveal instantly
  if (location.hash) {
    const t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(() => t.scrollIntoView({ behavior: "smooth" }), 120);
  }
})();
