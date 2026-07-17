/* Hardcore portfolio: particles + immersive interaction */
(() => {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");

  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let mx = -9999;
  let my = -9999;
  let ringX = 0;
  let ringY = 0;
  let particlesOn = true;
  let reduced = false;
  let burstBoost = 0;
  let raf = 0;

  const isTouch =
    matchMedia("(hover: none), (pointer: coarse)").matches ||
    "ontouchstart" in window;

  if (isTouch) document.body.classList.add("touch");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reduced = true;
    document.body.classList.add("reduce-motion");
  }

  function particleCount() {
    if (reduced) return 36;
    const base = Math.floor((w * h) / 15000);
    return Math.max(48, Math.min(130, base));
  }

  function spawn(atMouse = false) {
    const x = atMouse ? mx + (Math.random() - 0.5) * 48 : Math.random() * w;
    const y = atMouse ? my + (Math.random() - 0.5) * 48 : Math.random() * h;
    const hue = Math.random() < 0.55 ? 188 : Math.random() < 0.5 ? 265 : 210;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.42,
      r: Math.random() * 1.7 + 0.55,
      hue,
      a: Math.random() * 0.45 + 0.22,
    };
  }

  function initParticles() {
    particles = Array.from({ length: particleCount() }, () => spawn());
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function burst(n = 28) {
    for (let i = 0; i < n; i++) particles.push(spawn(true));
    if (particles.length > 220) particles.splice(0, particles.length - 220);
    burstBoost = 1;
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    if (particlesOn && !document.hidden) {
      const connectDist = reduced ? 88 : 118;

      for (const p of particles) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 190) {
          const f = ((190 - dist) / 190) * 0.026;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx + burstBoost * (Math.random() - 0.5) * 1.8;
        p.y += p.vy + burstBoost * (Math.random() - 0.5) * 1.8;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }
      burstBoost *= 0.9;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < connectDist) {
            const alpha = (1 - d / connectDist) * 0.26;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (mx > 0 && my > 0) {
        for (const p of particles) {
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < 155) {
            ctx.strokeStyle = `rgba(167, 139, 250, ${(1 - d / 155) * 0.42})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.a})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.55)`;
        ctx.shadowBlur = 7;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    if (!isTouch && cursor && ring) {
      ringX += (mx - ringX) * 0.16;
      ringY += (my - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    }

    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!isTouch && cursor) {
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }
  });

  // Hover cursor grow — skip video controls native area issues by using mag class
  document.querySelectorAll("a, button, .mag, .chip-row span, .work-card, .stat, .eng-item").forEach((el) => {
    el.addEventListener("pointerenter", () => document.body.classList.add("hovering"));
    el.addEventListener("pointerleave", () => document.body.classList.remove("hovering"));
  });

  // Glass spotlight
  document.querySelectorAll(".glass").forEach((panel) => {
    let spot = panel.querySelector(".spot");
    if (!spot) {
      spot = document.createElement("div");
      spot.className = "spot";
      panel.prepend(spot);
    }
    panel.addEventListener("pointermove", (e) => {
      const r = panel.getBoundingClientRect();
      spot.style.left = e.clientX - r.left + "px";
      spot.style.top = e.clientY - r.top + "px";
    });
  });

  // 3D tilt (not on video shells to avoid fighting controls)
  document.querySelectorAll(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (reduced || e.target.closest("video, .player-shell")) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-3px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Active nav
  const sections = [...document.querySelectorAll("section[id], article[id], header[id]")];
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          // map work-* to works
          const key = id.startsWith("work-") ? "works" : id;
          navLinks.forEach((a) => {
            const href = (a.getAttribute("href") || "").replace("#", "");
            a.classList.toggle("active", href === key || href === id);
          });
        });
      },
      { threshold: 0.28 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // Controls
  const btnP = document.getElementById("btnParticles");
  const btnB = document.getElementById("btnBurst");
  const btnR = document.getElementById("btnReduce");

  if (btnP) {
    btnP.classList.toggle("on", particlesOn);
    btnP.addEventListener("click", () => {
      particlesOn = !particlesOn;
      btnP.classList.toggle("on", particlesOn);
      btnP.textContent = particlesOn ? "粒子 ON" : "粒子 OFF";
      if (!particlesOn) ctx.clearRect(0, 0, w, h);
    });
  }
  if (btnB) {
    btnB.addEventListener("click", () => {
      if (!particlesOn) return;
      burst(40);
    });
  }
  if (btnR) {
    btnR.classList.toggle("on", reduced);
    btnR.textContent = reduced ? "动效低" : "省动效";
    btnR.addEventListener("click", () => {
      reduced = !reduced;
      document.body.classList.toggle("reduce-motion", reduced);
      btnR.classList.toggle("on", reduced);
      btnR.textContent = reduced ? "动效低" : "省动效";
      initParticles();
    });
  }

  // Subtle click burst (not on controls / video)
  window.addEventListener("click", (e) => {
    if (!particlesOn || reduced) return;
    if (e.target.closest("a, button, video, .player-shell, .fx-bar")) return;
    mx = e.clientX;
    my = e.clientY;
    burst(10);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(tick);
  });

  window.addEventListener("resize", resize);
  resize();
  raf = requestAnimationFrame(tick);

  // First paint: hero already visible
  requestAnimationFrame(() => {
    document.querySelectorAll(".hero .reveal, .nav").forEach((el) => el.classList.add("in"));
  });
})();
