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

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
  };

  /* ---------- Inquiry cart ---------- */
  const CART_KEY = "sw_inquiry_cart";
  const loadCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  };
  const saveCart = (items) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  };

  let cart = loadCart();
  const badges = $$(".cart-count");
  const fabCart = $("#fabCart");
  const fabCartBadge = $("#fabCartBadge");

  const renderBadge = () => {
    const n = cart.reduce((a, i) => a + i.qty, 0);
    badges.forEach((b) => (b.textContent = String(n)));
    $$(".cart-count-wrap").forEach((w) => w.classList.toggle("hidden", n === 0));
    if (fabCart) {
      fabCart.classList.toggle("hidden", n === 0);
      if (fabCartBadge) fabCartBadge.textContent = String(n);
    }
  };

  const drawer = $("#inquiryDrawer");
  const drawerBackdrop = $("#drawerBackdrop");
  const drawerBody = $("#drawerItems");
  $("#cartClear")?.addEventListener("click", () => {
    cart = [];
    saveCart(cart);
    renderBadge();
    renderDrawer();
  });
  const setDrawerOpen = (open) => {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    drawerBackdrop?.classList.toggle("hidden", !open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) renderDrawer();
  };
  $$(".open-cart").forEach((b) => b.addEventListener("click", () => setDrawerOpen(true)));
  $("#drawerClose")?.addEventListener("click", () => setDrawerOpen(false));
  drawerBackdrop?.addEventListener("click", () => setDrawerOpen(false));

  const renderDrawer = () => {
    if (!drawerBody) return;
    if (!cart.length) {
      drawerBody.innerHTML = `
        <div class="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-navy-600">${$("#iconBag")?.innerHTML || ""}</span>
          <p class="font-display text-lg font-bold text-navy-900">${drawerBody.dataset.empty}</p>
          <p class="text-sm text-ink-soft">${drawerBody.dataset.emptyHint}</p>
          <a href="${drawerBody.dataset.productsUrl}" class="btn btn-navy btn-sm mt-2">${drawerBody.dataset.browse}</a>
        </div>`;
      return;
    }
    drawerBody.innerHTML = cart
      .map(
        (i) => `
      <li class="flex gap-3 border-b border-line py-4">
        <a href="${i.url}" class="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mist-2">
          ${i.img ? `<img src="${i.img}" alt="" class="h-full w-full object-cover" loading="lazy">` : ""}
        </a>
        <div class="min-w-0 flex-1">
          <a href="${i.url}" class="font-display text-sm font-bold text-navy-900 hover:underline">${i.name}</a>
          ${i.model ? `<p class="font-mono text-xs text-gold-600">${i.model}</p>` : ""}
          <div class="mt-2 flex items-center justify-between">
            <div class="inline-flex items-center rounded-lg border border-line" role="group" aria-label="Quantity">
              <button type="button" class="qty-btn flex h-7 w-7 items-center justify-center text-ink-soft hover:text-navy-900" data-id="${i.id}" data-d="-1" aria-label="Decrease">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums">${i.qty}</span>
              <button type="button" class="qty-btn flex h-7 w-7 items-center justify-center text-ink-soft hover:text-navy-900" data-id="${i.id}" data-d="1" aria-label="Increase">+</button>
            </div>
            <button type="button" class="rm-btn text-xs font-semibold text-ink-soft underline-offset-2 hover:text-red-600 hover:underline" data-id="${i.id}">${drawerBody.dataset.remove}</button>
          </div>
        </div>
      </li>`
      )
      .join("");
    $$(".qty-btn", drawerBody).forEach((b) =>
      b.addEventListener("click", () => {
        const item = cart.find((x) => x.id === b.dataset.id);
        if (!item) return;
        item.qty = Math.max(1, item.qty + parseInt(b.dataset.d, 10));
        saveCart(cart);
        renderBadge();
        renderDrawer();
      })
    );
    $$(".rm-btn", drawerBody).forEach((b) =>
      b.addEventListener("click", () => {
        cart = cart.filter((x) => x.id !== b.dataset.id);
        saveCart(cart);
        renderBadge();
        renderDrawer();
      })
    );
  };

  const addToCart = (btn) => {
    const item = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      model: btn.dataset.model || "",
      url: btn.dataset.url,
      img: btn.dataset.img || "",
      qty: 1,
    };
    const existing = cart.find((x) => x.id === item.id);
    if (existing) existing.qty += 1;
    else cart.push(item);
    saveCart(cart);
    renderBadge();
    showToast(btn.dataset.added || "Added to inquiry");
  };
  $$(".add-inquiry").forEach((b) => b.addEventListener("click", () => addToCart(b)));

  renderBadge();

  /* ---------- Forms ---------- */
  const endpoint = document.body.dataset.endpoint || "";
  const email = document.body.dataset.email || "";

  const buildBody = (form, extraLines) => {
    const data = new FormData(form);
    const lines = [];
    for (const [k, v] of data.entries()) {
      if (k === "company_website" || !v) continue;
      const label = form.querySelector(`[name="${k}"]`)?.dataset.label || k;
      lines.push(`${label}: ${v}`);
    }
    if (extraLines?.length) lines.push(...extraLines);
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
    const cartLines = cart.map((i) => `• ${i.name}${i.model ? ` (${i.model})` : ""} × ${i.qty} — ${i.url}`);
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
            body: buildBody(form, cartLines),
            cart: cart.map((i) => ({ name: i.name, model: i.model, qty: i.qty, url: i.url })),
          }),
        });
      } catch {}
      showSuccess(form);
      cart = [];
      saveCart(cart);
      renderBadge();
      return;
    }
    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildBody(form, cartLines))}`;
    window.location.href = href;
    showSuccess(form);
    cart = [];
    saveCart(cart);
    renderBadge();
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
      setDrawerOpen(false);
      closeMenu();
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
