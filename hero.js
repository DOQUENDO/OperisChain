/* ═══════════════════════════════════════════════════════
   OperisChain — Animated Hero (GSAP)
   Premium enterprise SaaS hero animation
   4 scenes, ~22s loop, seamless repeat
   ═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Wait for GSAP + DOM ── */
  function initHero() {
    if (typeof gsap === "undefined") {
      setTimeout(initHero, 100);
      return;
    }

    /* ──────────────────────────────────────
       Element References
       ────────────────────────────────────── */
    const stage = document.getElementById("hero-animation-stage");
    if (!stage) return;

    /* Scenes */
    const scene1 = document.getElementById("scene-email");
    const scene2 = document.getElementById("scene-dashboard");
    const scene3 = document.getElementById("scene-pdf");
    const scene4 = document.getElementById("scene-overview");

    /* Scene 1 — Email */
    const emailCard = document.getElementById("email-card");
    const emailSubject = document.getElementById("email-subject");
    const emailBody = document.getElementById("email-body");
    const emailForward = document.getElementById("email-forward");
    const emailCursor = document.getElementById("email-cursor");
    const emailOverlay = document.getElementById("overlay-scene1");

    /* Scene 2 — Dashboard extraction */
    const dashCard = document.getElementById("dash-card");
    const dashFields = document.querySelectorAll(".dash-field");
    const dashOverlay = document.getElementById("overlay-scene2");

    /* Scene 3 — PDF generation */
    const pdfBtn = document.getElementById("pdf-btn");
    const pdfPreview = document.getElementById("pdf-preview");
    const pdfOverlay = document.getElementById("overlay-scene3");

    /* Scene 4 — Overview */
    const overviewCard = document.getElementById("overview-card");
    const overviewRows = document.querySelectorAll(".overview-row");
    const overviewBadge = document.getElementById("overview-badge");
    const overviewOverlay = document.getElementById("overlay-scene4");

    /* ──────────────────────────────────────
       Initial States (all hidden)
       ────────────────────────────────────── */
    gsap.set([scene1, scene2, scene3, scene4], { opacity: 0 });
    gsap.set(emailCard, { opacity: 0, y: 30 });
    gsap.set(emailSubject, { opacity: 0 });
    gsap.set(emailBody, { opacity: 0 });
    gsap.set(emailForward, { opacity: 0, y: 8 });
    gsap.set(emailCursor, { opacity: 0, x: -20, y: -10 });
    gsap.set([emailOverlay, dashOverlay, pdfOverlay, overviewOverlay], {
      opacity: 0,
    });
    gsap.set(dashCard, { opacity: 0, y: 30 });
    gsap.set(dashFields, { opacity: 0, x: -12 });
    gsap.set(pdfBtn, { opacity: 0, scale: 1 });
    gsap.set(pdfPreview, { opacity: 0, y: 20 });
    gsap.set(overviewCard, { opacity: 0, scale: 0.92 });
    gsap.set(overviewRows, { opacity: 0, x: -10 });
    gsap.set(overviewBadge, { opacity: 0, scale: 0.8 });

    /* ──────────────────────────────────────
       Master Timeline
       ────────────────────────────────────── */
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "power2.inOut" },
    });

    /* ═══════ SCENE 1: Email Inbox (0–5s) ═══════ */
    tl.to(scene1, { opacity: 1, duration: 0.5 }, 0)

      /* Card slides in */
      .to(emailCard, { opacity: 1, y: 0, duration: 0.6 }, 0.2)

      /* Subject line appears */
      .to(emailSubject, { opacity: 1, duration: 0.4 }, 0.6)

      /* Body text fades in */
      .to(emailBody, { opacity: 1, duration: 0.4 }, 0.9)

      /* Cursor appears and moves to forward area */
      .to(emailCursor, { opacity: 1, duration: 0.2 }, 1.3)
      .to(emailCursor, { x: 60, y: 30, duration: 0.8 }, 1.5)

      /* Forward action appears */
      .to(emailForward, { opacity: 1, y: 0, duration: 0.4 }, 2.0)

      /* Overlay text */
      .to(emailOverlay, { opacity: 1, duration: 0.4 }, 2.6)

      /* Hold, then fade out */
      .to(emailOverlay, { opacity: 0, duration: 0.3 }, 4.2)
      .to(scene1, { opacity: 0, duration: 0.4 }, 4.6);

    /* ═══════ SCENE 2: Dashboard Extraction (5.5–11s) ═══════ */
    tl.to(scene2, { opacity: 1, duration: 0.5 }, 5.5)

      /* Dashboard card slides in */
      .to(dashCard, { opacity: 1, y: 0, duration: 0.5 }, 5.7)

      /* Fields stagger in */
      .to(
        dashFields,
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.15,
        },
        6.1,
      )

      /* Overlay text */
      .to(dashOverlay, { opacity: 1, duration: 0.4 }, 8.0)

      /* Hold, then fade out */
      .to(dashOverlay, { opacity: 0, duration: 0.3 }, 9.8)
      .to(scene2, { opacity: 0, duration: 0.4 }, 10.2);

    /* ═══════ SCENE 3: PDF Generation (11–16.5s) ═══════ */
    tl.to(scene3, { opacity: 1, duration: 0.5 }, 11)

      /* Button appears */
      .to(pdfBtn, { opacity: 1, duration: 0.4 }, 11.3)

      /* Simulate click — scale down then up */
      .to(pdfBtn, { scale: 0.94, duration: 0.1 }, 12.0)
      .to(pdfBtn, { scale: 1, duration: 0.15 }, 12.1)

      /* PDF preview slides up */
      .to(pdfPreview, { opacity: 1, y: 0, duration: 0.6 }, 12.4)

      /* Overlay text */
      .to(pdfOverlay, { opacity: 1, duration: 0.4 }, 13.2)

      /* Hold, then fade out */
      .to(pdfOverlay, { opacity: 0, duration: 0.3 }, 15.2)
      .to(scene3, { opacity: 0, duration: 0.4 }, 15.6);

    /* ═══════ SCENE 4: Dashboard Overview (16.5–22s) ═══════ */
    tl.to(scene4, { opacity: 1, duration: 0.5 }, 16.5)

      /* Overview card zooms in gently */
      .to(overviewCard, { opacity: 1, scale: 1, duration: 0.6 }, 16.7)

      /* Rows stagger in */
      .to(
        overviewRows,
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.12,
        },
        17.1,
      )

      /* Expiry badge pulses in */
      .to(overviewBadge, { opacity: 1, scale: 1, duration: 0.4 }, 17.8)
      .to(overviewBadge, { scale: 1.08, duration: 0.3 }, 18.4)
      .to(overviewBadge, { scale: 1, duration: 0.3 }, 18.7)

      /* Overlay text */
      .to(overviewOverlay, { opacity: 1, duration: 0.4 }, 18.2)

      /* Fade out everything smoothly → loops */
      .to(overviewOverlay, { opacity: 0, duration: 0.3 }, 20.4)
      .to(scene4, { opacity: 0, duration: 0.6 }, 20.8);

    /* End at 22s — GSAP loops back seamlessly */
    tl.to({}, { duration: 0.1 }, 22);
  }

  /* ── Kick off ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHero);
  } else {
    initHero();
  }
})();
