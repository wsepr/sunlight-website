(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  const header = $("#siteHeader");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
    if (topBtn) topBtn.classList.toggle("hidden", window.scrollY < 500);
  };

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  const menuIconOpen = $("#menuIconOpen");
  const menuIconClose = $("#menuIconClose");
  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
    menuIconOpen?.classList.remove("hidden");
    menuIconClose?.classList.add("hidden");
    document.body.style.overflow = "";
  };
  menuBtn?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuIconOpen.classList.toggle("hidden", open);
    menuIconClose.classList.toggle("hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- Back to top ---------- */
  const topBtn = $("#backToTop");
  topBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if (reducedMotion) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => {
      if (el.dataset.delay) el.style.transitionDelay = `${el.dataset.delay}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      if (reducedMotion) {
        el.childNodes[0].nodeValue = target.toLocaleString("en-US");
        return;
      }
      const dur = 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.childNodes[0].nodeValue = Math.round(target * eased).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
        else el.childNodes[0].nodeValue = target.toLocaleString("en-US");
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animate(e.target);
              cio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => {
        el.childNodes[0].nodeValue = "0";
        cio.observe(el);
      });
    }
  }

  /* ---------- Forms ---------- */
  const endpoint = document.body.dataset.endpoint || "";
  const email = document.body.dataset.email || "";

  const buildBody = (form) => {
    const data = new FormData(form);
    const lines = [];
    for (const [k, v] of data.entries()) {
      if (k === "company_website" || !v) continue;
      const label = form.querySelector(`[name="${k}"]`)?.dataset.label || k;
      lines.push(`${label}: ${v}`);
    }
    return lines.join("\n");
  };

  const handleForm = async (form) => {
    const ok = form.checkValidity();
    form.classList.add("was-validated");
    if (!ok) {
      form.querySelector(":invalid")?.focus();
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const subject = `${document.body.dataset.site} — Inquiry from ${form.querySelector('[name="name"]')?.value || "website"}`;
    if (endpoint) {
      submitBtn.disabled = true;
      submitBtn.textContent = form.dataset.sending;
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            subject,
            body: buildBody(form),
          }),
        });
      } catch {}
      showSuccess(form);
      return;
    }
    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildBody(form))}`;
    window.location.href = href;
    showSuccess(form);
  };

  const showSuccess = (form) => {
    const success = form.parentElement.querySelector(".form-success");
    if (success) {
      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    }
  };

  $$("form.inquiry-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleForm(form);
    });
    form.querySelectorAll("input, select, textarea").forEach((f) =>
      f.addEventListener("input", () => {
        if (form.classList.contains("was-validated")) f.checkValidity();
      })
    );
  });

  /* ---------- Product list: search / filter / sort / load more ---------- */
  const grid = $("#productGrid");
  if (grid) {
    const cards = $$(".pcard", grid);
    const search = $("#productSearch");
    const chips = $$(".chip[data-cat]");
    const sortSel = $("#productSort");
    const countEl = $("#resultCount");
    const moreWrap = $("#loadMoreWrap");
    const moreBtn = $("#loadMoreBtn");
    const moreCount = $("#loadMoreCount");
    const PAGE_SIZE = 9;
    let activeCat = "all";
    let shown = PAGE_SIZE; // cards revealed when browsing unfiltered
    let filtering = false;

    const updateLoadMore = (visibleLen) => {
      if (!moreWrap || filtering || visibleLen <= shown) {
        moreWrap?.classList.add("hidden");
        return;
      }
      moreWrap.classList.remove("hidden");
      if (moreCount) moreCount.textContent = String(visibleLen - shown);
    };

    const apply = () => {
      const q = (search?.value || "").trim().toLowerCase();
      filtering = !!q || activeCat !== "all";
      if (!filtering) shown = Math.min(shown, PAGE_SIZE);
      let visible = cards.filter((c) => {
        const catOk = activeCat === "all" || c.dataset.cat === activeCat;
        const qOk =
          !q ||
          c.dataset.name.toLowerCase().includes(q) ||
          (c.dataset.model || "").toLowerCase().includes(q);
        return catOk && qOk;
      });
      if (sortSel?.value === "name") visible.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
      else visible.sort((a, b) => (b.dataset.date || "").localeCompare(a.dataset.date || ""));
      cards.forEach((c) => c.classList.add("hidden"));
      const limit = filtering ? visible.length : Math.min(shown, visible.length);
      visible.slice(0, limit).forEach((c) => {
        c.classList.remove("hidden");
        grid.appendChild(c);
      });
      if (countEl) countEl.textContent = String(visible.length);
      $("#noResults")?.classList.toggle("hidden", visible.length > 0);
      updateLoadMore(visible.length);
    };

    moreBtn?.addEventListener("click", () => {
      shown += PAGE_SIZE;
      apply();
    });
    search?.addEventListener("input", apply);
    sortSel?.addEventListener("change", apply);
    chips.forEach((ch) =>
      ch.addEventListener("click", () => {
        chips.forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        ch.classList.add("active");
        ch.setAttribute("aria-pressed", "true");
        activeCat = ch.dataset.cat;
        apply();
      })
    );
    // deep link: /products/?cat=kitchen-appliances
    const urlCat = new URLSearchParams(location.search).get("cat");
    if (urlCat) {
      const chip = chips.find((c) => c.dataset.cat === urlCat);
      if (chip) chip.click();
    }
  }

  /* ---------- Product gallery + lightbox ---------- */
  const galMain = $("#galMain");
  const galThumbs = $$(".gal-thumb");
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  galThumbs.forEach((t) =>
    t.addEventListener("click", () => {
      galThumbs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      if (galMain) {
        galMain.src = t.dataset.full || t.dataset.src;
        galMain.alt = t.dataset.alt || "";
      }
    })
  );
  const openLightbox = (src, alt) => {
    if (!lightbox || !src) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  galMain?.addEventListener("click", () => openLightbox(galMain.src, galMain.alt));
  const closeLightbox = () => {
    lightbox?.classList.remove("open");
    lightbox?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $("#lightboxClose")?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- Certificate lightbox ---------- */
  $$(".cert-lightbox").forEach((c) =>
    c.addEventListener("click", () => {
      const img = c.querySelector("img[data-full]");
      if (img) openLightbox(img.dataset.full, img.alt);
    })
  );

  /* ---------- Keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeMenu();
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
