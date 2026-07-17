/* Editorial Mag — dual subtitle rail + restrained reveal / nav spy */
(() => {
  const subZh = document.getElementById("subZh");
  const subEn = document.getElementById("subEn");
  const subTc = document.getElementById("subTc");

  const defaults = {
    tc: "00 · INTRO",
    zh: "双语成片，双轨呈现 — 滚动浏览作品时，此处跟随中英说明。",
    en: "Two languages, one delivery — this rail tracks ZH/EN as you scroll.",
  };

  function setSub({ tc, zh, en }) {
    if (!subZh || !subEn || !subTc) return;
    subTc.textContent = tc || defaults.tc;
    subZh.style.opacity = "0.35";
    subEn.style.opacity = "0.35";
    window.setTimeout(() => {
      subZh.textContent = zh || defaults.zh;
      subEn.textContent = en || defaults.en;
      subZh.style.opacity = "1";
      subEn.style.opacity = "1";
    }, 120);
  }

  // Sections that drive the subtitle rail
  const tracked = [
    ...document.querySelectorAll(
      "article.work[data-zh], section.notes-panel[data-zh], section.colophon[data-zh], .hero"
    ),
  ];

  function payloadFrom(el) {
    if (el.classList.contains("hero") || el.id === "top") {
      return defaults;
    }
    return {
      tc: el.getAttribute("data-tc") || defaults.tc,
      zh: el.getAttribute("data-zh") || defaults.zh,
      en: el.getAttribute("data-en") || defaults.en,
    };
  }

  let currentId = "";
  if ("IntersectionObserver" in window && tracked.length) {
    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const el = visible[0].target;
        const id = el.id || el.className;
        if (id === currentId) return;
        currentId = id;
        setSub(payloadFrom(el));
      },
      { threshold: [0.25, 0.4, 0.55], rootMargin: "-12% 0px -35% 0px" }
    );
    tracked.forEach((el) => io.observe(el));
  }

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const rio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            rio.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    reveals.forEach((el) => rio.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Nav active state
  const navLinks = [...document.querySelectorAll(".mast-nav a")];
  const spyTargets = ["works", "engineering", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (navLinks.length && spyTargets.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          navLinks.forEach((a) => {
            a.classList.toggle("active", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { threshold: 0.15, rootMargin: "-20% 0px -55% 0px" }
    );
    spyTargets.forEach((s) => spy.observe(s));
    // also spy first work as works
    const w1 = document.getElementById("work-01");
    if (w1) spy.observe(w1);
  }

  // Pause other videos when one plays
  const videos = [...document.querySelectorAll("video.player")];
  videos.forEach((v) => {
    v.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== v && !other.paused) other.pause();
      });
      // update rail from parent work plate
      const plate = v.closest("[data-zh]");
      if (plate) {
        currentId = plate.id || "playing";
        setSub(payloadFrom(plate));
      }
    });
  });

  // First paint
  requestAnimationFrame(() => {
    document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("in"));
    setSub(defaults);
  });
})();
