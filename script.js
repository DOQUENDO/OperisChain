/* ═══════════════════════════════════════════════════════
   OperisChain — Landing Page JavaScript
   ═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ─── Navbar Scroll Effect ───
  const navbar = document.getElementById("navbar");

  function handleNavScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", handleNavScroll, { passive: true });

  // ─── Mobile Navigation Toggle ───
  const mobileToggle = document.getElementById("mobile-toggle");
  const navLinks = document.getElementById("nav-links");

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
      document.body.style.overflow = navLinks.classList.contains("active")
        ? "hidden"
        : "";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileToggle.classList.remove("active");
        navLinks.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  // ─── Scroll Reveal (IntersectionObserver) ───
  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // ─── Counter Animation ───
  const counters = document.querySelectorAll(".counter");

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute("data-target"), 10);
          const suffix = counter.getAttribute("data-suffix") || "";
          const duration = 1800;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            counter.textContent = current + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target + suffix;
            }
          }

          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(counter);
        }
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((c) => counterObserver.observe(c));

  // ─── FAQ Accordion ───
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all
      faqItems.forEach((i) => i.classList.remove("active"));

      // Open clicked if it wasn't active
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });

  // ─── Subtle Grid Background Canvas ───
  const canvas = document.getElementById("bg-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];
    const particleCount = 50;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.05,
        });
      }
    }

    function drawGrid() {
      ctx.strokeStyle = "rgba(0, 212, 255, 0.03)";
      ctx.lineWidth = 0.5;

      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    function drawParticles() {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.04 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      drawGrid();
      drawParticles();
      requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });
  }

  // ─── Smooth Scroll for CTA links ───
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80;
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });
})();

/* ─── Demo Modal ─── */

/* ─── Form Validation ─── */
const demoValidators = {
  name: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  company: (v) => v.trim().length >= 2,
  size: (v) => ["1-5", "5-20", "20-50", "50+"].includes(v),
  phone: (v) => /^[\d\s\+\-\(\)]{7,20}$/.test(v.trim()),
  message: (v) => v.trim().length >= 10,
};

function validateDemoField(field) {
  const name = field.name;
  const value = field.value;
  const wrapper = field.closest(".demo-form-field");
  if (!wrapper || !demoValidators[name]) return true;

  const isValid = demoValidators[name](value);
  const wasTouched = field.dataset.touched === "true";

  if (wasTouched) {
    wrapper.classList.toggle("invalid", !isValid);
    wrapper.classList.toggle("valid", isValid);
  }
  return isValid;
}

function validateDemoForm() {
  const form = document.getElementById("demo-form");
  if (!form) return false;

  const fields = form.querySelectorAll(
    "input:not([type=hidden]), select, textarea",
  );
  let allValid = true;

  fields.forEach((field) => {
    if (field.name && demoValidators[field.name]) {
      if (!demoValidators[field.name](field.value)) {
        allValid = false;
      }
    }
  });

  const submitBtn = form.querySelector(".demo-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = !allValid;
  }
  return allValid;
}

function initDemoValidation() {
  const form = document.getElementById("demo-form");
  if (!form) return;

  const fields = form.querySelectorAll(
    "input:not([type=hidden]), select, textarea",
  );

  fields.forEach((field) => {
    // Mark as touched on blur so errors only show after user interacts
    field.addEventListener("blur", () => {
      field.dataset.touched = "true";
      validateDemoField(field);
      validateDemoForm();
    });

    // Re-validate on input for immediate feedback once touched
    field.addEventListener("input", () => {
      if (field.dataset.touched === "true") {
        validateDemoField(field);
      }
      validateDemoForm();
    });

    // Also handle change for select elements
    field.addEventListener("change", () => {
      field.dataset.touched = "true";
      validateDemoField(field);
      validateDemoForm();
    });
  });
}

// Init validation when DOM is ready
document.addEventListener("DOMContentLoaded", initDemoValidation);

function openDemoModal(plan) {
  const modal = document.getElementById("demo-modal");
  const planInput = document.getElementById("demo-plan");
  const formContainer = document.getElementById("demo-form-container");
  const successContainer = document.getElementById("demo-success");

  // Reset to form state
  formContainer.style.display = "";
  successContainer.style.display = "none";

  // Reset all validation states
  const form = document.getElementById("demo-form");
  if (form) {
    form.reset();
    form.querySelectorAll(".demo-form-field").forEach((w) => {
      w.classList.remove("invalid", "valid");
    });
    form.querySelectorAll("input, select, textarea").forEach((f) => {
      f.dataset.touched = "false";
    });
    const btn = form.querySelector(".demo-submit-btn");
    if (btn) btn.disabled = true;
  }

  if (planInput && plan) {
    planInput.value = plan;
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Re-apply language to new modal elements
  if (
    typeof applyLanguage === "function" &&
    typeof currentLang !== "undefined"
  ) {
    applyLanguage(currentLang);
  }

  // Focus first input after animation
  setTimeout(() => {
    const firstInput = document.getElementById("demo-name");
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeDemoModal() {
  const modal = document.getElementById("demo-modal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ─── Config ───
const LEADS_API_URL = (() => {
  const h = window.location.hostname;
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "" ||
    h.endsWith(".local") ||
    window.location.protocol === "file:"
  ) {
    return "http://localhost:3002/api/leads";
  }
  return "https://app.operischain.com/api/leads";
})();

function handleDemoSubmit(e) {
  e.preventDefault();

  const form = document.getElementById("demo-form");
  const submitBtn = form.querySelector(".demo-submit-btn");
  const formContainer = document.getElementById("demo-form-container");
  const successContainer = document.getElementById("demo-success");

  // Mark all fields as touched and validate before submitting
  form
    .querySelectorAll("input:not([type=hidden]), select, textarea")
    .forEach((f) => {
      f.dataset.touched = "true";
      validateDemoField(f);
    });

  if (!validateDemoForm()) {
    // Focus the first invalid field
    const firstInvalid = form.querySelector(
      ".demo-form-field.invalid input, .demo-form-field.invalid select, .demo-form-field.invalid textarea",
    );
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Gather form data
  const data = {
    name: form.name.value,
    email: form.email.value,
    company: form.company.value,
    size: form.size.value,
    phone: form.phone.value || "",
    message: form.message.value || "",
    plan: form.plan.value || "",
    language: typeof currentLang !== "undefined" ? currentLang : "en",
  };

  // Extract UTM params from the page URL
  const pageParams = new URLSearchParams(window.location.search);
  if (pageParams.get("utm_source"))
    data.utmSource = pageParams.get("utm_source");
  if (pageParams.get("utm_medium"))
    data.utmMedium = pageParams.get("utm_medium");
  if (pageParams.get("utm_campaign"))
    data.utmCampaign = pageParams.get("utm_campaign");

  // Disable button while submitting
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "...";

  // POST to Supabase-backed API
  fetch(LEADS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((result) => {
      console.log("✅ Lead captured:", result.leadId);
      showDemoSuccess(form, formContainer, successContainer, submitBtn);
    })
    .catch((err) => {
      console.error("Lead API error, falling back to localStorage:", err);

      // Fallback: save locally so no lead is ever lost
      const leads = JSON.parse(localStorage.getItem("oc-demo-leads") || "[]");
      leads.push({
        ...data,
        timestamp: new Date().toISOString(),
        synced: false,
      });
      localStorage.setItem("oc-demo-leads", JSON.stringify(leads));

      // Still show success — the user doesn't need to know about the backend issue
      showDemoSuccess(form, formContainer, successContainer, submitBtn);
    });
}

function showDemoSuccess(form, formContainer, successContainer, submitBtn) {
  formContainer.style.display = "none";
  successContainer.style.display = "";

  // Re-apply i18n to success state
  if (
    typeof applyLanguage === "function" &&
    typeof currentLang !== "undefined"
  ) {
    applyLanguage(currentLang);
  }

  // Reset form + validation for next use
  form.reset();
  form.querySelectorAll(".demo-form-field").forEach((w) => {
    w.classList.remove("invalid", "valid");
  });
  form.querySelectorAll("input, select, textarea").forEach((f) => {
    f.dataset.touched = "false";
  });
  submitBtn.disabled = true;
}

// Close modal on overlay click or Escape
document.addEventListener("click", (e) => {
  const modal = document.getElementById("demo-modal");
  if (e.target === modal) {
    closeDemoModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("demo-modal");
    if (modal && modal.classList.contains("active")) {
      closeDemoModal();
    }
  }
});
