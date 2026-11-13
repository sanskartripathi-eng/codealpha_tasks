(() => {
  "use strict";

  /* ---------- Data ---------- */
  const CATEGORIES = ["Nature", "Architecture", "Technology", "Travel", "Photography"];

 
  const PHOTOS = [
    { id: "1441974231531-c6227db76b6e", title: "Green forest",        category: "Nature",       ratio: 0.8,  alt: "Sunlight falling through a green forest" },
    { id: "1500530855697-b586d89ba3ee", title: "Open horizon",        category: "Travel",       ratio: 1.33, alt: "Mountain landscape under a wide sky" },
    { id: "1511818966892-d7d671e672a2", title: "Glass and steel",     category: "Architecture", ratio: 0.75, alt: "Modern architecture seen from below" },
    { id: "1470252649378-9c29740c9fa8", title: "First light",         category: "Nature",       ratio: 1,    alt: "Sunrise over a field" },
    { id: "1501785888041-af3ef285b470", title: "Mountain lake",       category: "Travel",       ratio: 1.5,  alt: "A calm lake surrounded by mountains" },
    { id: "1519501025264-65ba15a82390", title: "City after dark",     category: "Architecture", ratio: 0.8,  alt: "City skyline at dusk" },
    { id: "1518770660439-4636190af475", title: "Circuit study",       category: "Technology",   ratio: 1.33, alt: "Close view of a green circuit board" },
    { id: "1517694712202-14dd9538aa97", title: "Late-night code",     category: "Technology",   ratio: 0.9,  alt: "Laptop showing lines of code" },
    { id: "1502920917128-1aa500764cbd", title: "Film body",           category: "Photography",  ratio: 1,    alt: "A vintage camera on a table" },
    { id: "1452587925148-ce544e77e70d", title: "Through the lens",    category: "Photography",  ratio: 0.75, alt: "Camera lens held up to the light" },
    { id: "1469854523086-cc02fe5d8800", title: "Long road",           category: "Travel",       ratio: 1.33, alt: "A road trip through open country" },
    { id: "1472214103451-9374bd1c798e", title: "Green fields",        category: "Nature",       ratio: 1.5,  alt: "Rolling green fields under blue sky" },
    { id: "1486406146926-c627a92ad1ab", title: "Tower study",         category: "Architecture", ratio: 0.8,  alt: "Tall office building against the sky" },
    { id: "1488590528505-98d2b5aba04b", title: "Workbench",           category: "Technology",   ratio: 1.2,  alt: "Laptop on a desk with a coffee" },
    { id: "1449824913935-59a10b8d2000", title: "Street level",        category: "Photography",  ratio: 0.9,  alt: "City street with buildings and traffic" },
    { id: "1506905925346-21bda4d32df4", title: "Above the clouds",    category: "Travel",       ratio: 0.8,  alt: "Snowy mountain peaks above the clouds" }
  ].map((p, i) => ({ ...p, index: i }));

  const thumbUrl = (p) => `https://images.unsplash.com/photo-${p.id}?auto=format&fit=crop&w=640&q=75`;
  const largeUrl = (p) => `https://images.unsplash.com/photo-${p.id}?auto=format&fit=crop&w=1800&q=85`;

  /* ---------- State ---------- */
  const state = {
    filter: "All",          
    query: "",
    favourites: new Set(),
    visible: [],            // photos matching the current filter
    current: 0              // index inside state.visible
  };

  /* ---------- DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const el = {
    grid: $("#grid"), filters: $("#filters"), results: $("#resultsText"),
    empty: $("#emptyState"), emptyTitle: $("#emptyTitle"), emptyText: $("#emptyText"), reset: $("#resetBtn"),
    search: $("#searchInput"), searchForm: $("#searchForm"),
    favBadge: $("#favBadge"), navFav: $("#navFavourites"),
    nav: $("#siteNav"), menuBtn: $("#menuToggle"), themeBtn: $("#themeToggle"), toTop: $("#toTop"),
    lb: $("#lightbox"), lbImg: $("#lbImg"), lbTitle: $("#lbTitle"), lbCat: $("#lbCat"), lbCount: $("#lbCount"),
    lbLike: $("#lbLike"), lbDownload: $("#lbDownload"), lbClose: $("#lbClose"), lbPrev: $("#lbPrev"), lbNext: $("#lbNext")
  };

  let cards = [];           // [{ photo, node }]
  let lastFocus = null;

  /* ---------- Helpers ---------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
  };

  const heartIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.7 3.7 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.3 0 5.3 3.2 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z"/></svg>';

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  /* ---------- Rendering ---------- */
  function renderFilters() {
    const counts = { All: PHOTOS.length };
    CATEGORIES.forEach((c) => (counts[c] = PHOTOS.filter((p) => p.category === c).length));

    el.filters.innerHTML = "";
    ["All", ...CATEGORIES].forEach((name) => el.filters.append(makeChip(name, counts[name])));
    el.filters.append(makeChip("Favourites", state.favourites.size));
  }

  function makeChip(name, count) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.filter = name;
    b.setAttribute("aria-pressed", String(state.filter === name));
    b.innerHTML = `${name} <span class="chip__count">${count}</span>`;
    return b;
  }

  function showSkeletons(n = 8) {
    const ratios = [0.8, 1.33, 1, 0.75, 1.2, 0.9, 1.5, 0.8];
    el.grid.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const li = document.createElement("li");
      li.className = "card skeleton";
      li.style.aspectRatio = ratios[i % ratios.length];
      li.setAttribute("aria-hidden", "true");
      el.grid.append(li);
    }
    el.results.textContent = "Loading photos…";
  }

  function buildCards() {
    el.grid.innerHTML = "";
    cards = PHOTOS.map((photo) => {
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `
        <button class="card__open" type="button" aria-label="Open ${photo.title}">
          <span class="card__frame" style="aspect-ratio:${photo.ratio}">
            <img class="card__img" src="${thumbUrl(photo)}" alt="${photo.alt}" loading="lazy" decoding="async">
          </span>
          <span class="card__caption">
            <span class="card__title">${photo.title}</span>
            <span class="card__cat">${photo.category}</span>
          </span>
        </button>
        <button class="like" type="button" aria-pressed="false" aria-label="Add ${photo.title} to favourites">${heartIcon}</button>`;

      const img = li.querySelector("img");
      const reveal = () => img.classList.add("is-loaded");
      img.addEventListener("load", reveal);
      // If a photo can't load, drop it so there are no broken tiles
      img.addEventListener("error", () => { li.dataset.broken = "true"; applyFilters(); });
      if (img.complete && img.naturalWidth) reveal();

      li.querySelector(".card__open").addEventListener("click", () => openLightbox(photo));
      li.querySelector(".like").addEventListener("click", () => toggleFavourite(photo.id));
      el.grid.append(li);
      return { photo, node: li };
    });
    syncFavouriteUI();
  }

  /* ---------- Filtering & search ---------- */
  function matches(photo) {
    const inFilter =
      state.filter === "All" ||
      (state.filter === "Favourites" ? state.favourites.has(photo.id) : photo.category === state.filter);
    const q = state.query.trim().toLowerCase();
    const inSearch = !q || `${photo.title} ${photo.category} ${photo.alt}`.toLowerCase().includes(q);
    return inFilter && inSearch;
  }

  function applyFilters() {
    if (!cards.length) return; // still loading
    state.visible = [];
    cards.forEach(({ photo, node }) => {
      const show = node.dataset.broken !== "true" && matches(photo);
      node.hidden = !show;
      if (show) state.visible.push(photo);
    });

    const n = state.visible.length;
    const parts = [];
    if (state.filter !== "All") parts.push(state.filter.toLowerCase());
    if (state.query.trim()) parts.push(`matching “${state.query.trim()}”`);
    el.results.textContent = `${plural(n, "photo")}${parts.length ? " · " + parts.join(" · ") : ""}`;

    el.empty.hidden = n > 0;
    el.grid.hidden = n === 0;
    if (n === 0) describeEmptyState();

    el.filters.querySelectorAll(".chip").forEach((chip) =>
      chip.setAttribute("aria-pressed", String(chip.dataset.filter === state.filter))
    );
  }

  function describeEmptyState() {
    if (state.filter === "Favourites" && !state.query.trim() && state.favourites.size === 0) {
      el.emptyTitle.textContent = "No favourites yet";
      el.emptyText.textContent = "Tap the heart on any photo to save it here.";
      el.reset.textContent = "Browse all photos";
    } else if (state.query.trim()) {
      el.emptyTitle.textContent = "Nothing matches your search";
      el.emptyText.textContent = `No photos found for “${state.query.trim()}”. Check the spelling or try a broader word.`;
      el.reset.textContent = "Clear search and filters";
    } else {
      el.emptyTitle.textContent = "No photos here";
      el.emptyText.textContent = "This category has no photos right now.";
      el.reset.textContent = "Show all photos";
    }
  }

  function setFilter(name) {
    state.filter = name;
    applyFilters();
  }

  function resetAll() {
    state.filter = "All";
    state.query = "";
    el.search.value = "";
    applyFilters();
  }

  /* ---------- Favourites ---------- */
  function toggleFavourite(id) {
    state.favourites.has(id) ? state.favourites.delete(id) : state.favourites.add(id);
    store.set("northlight:favourites", [...state.favourites]);
    syncFavouriteUI();
    if (state.filter === "Favourites") applyFilters(); // un-liking removes it from this view
    if (el.lb.open) syncLightboxLike();
  }

  function syncFavouriteUI() {
    cards.forEach(({ photo, node }) => {
      const on = state.favourites.has(photo.id);
      const btn = node.querySelector(".like");
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", `${on ? "Remove" : "Add"} ${photo.title} ${on ? "from" : "to"} favourites`);
    });
    const count = state.favourites.size;
    el.favBadge.hidden = count === 0;
    el.favBadge.textContent = count;
    const chip = el.filters.querySelector('[data-filter="Favourites"] .chip__count');
    if (chip) chip.textContent = count;
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(photo) {
    lastFocus = document.activeElement;
    state.current = Math.max(0, state.visible.indexOf(photo));
    if (!el.lb.open) el.lb.showModal();
    document.body.style.overflow = "hidden";
    showPhoto(state.current);
    el.lbClose.focus();
  }

  function closeLightbox() {
    if (el.lb.open) el.lb.close();
  }

  function showPhoto(index) {
    const total = state.visible.length;
    if (!total) return closeLightbox();
    state.current = (index + total) % total;
    const photo = state.visible[state.current];

    el.lbImg.classList.add("is-loading");
    const loader = new Image();
    loader.onload = loader.onerror = () => {
      // ignore stale loads if the user already moved on
      if (state.visible[state.current] !== photo) return;
      el.lbImg.src = loader.src;
      el.lbImg.classList.remove("is-loading");
    };
    loader.src = largeUrl(photo);

    el.lbImg.alt = photo.alt;
    el.lbTitle.textContent = photo.title;
    el.lbCat.textContent = photo.category;
    el.lbCount.textContent = `${state.current + 1} / ${total}`;
    el.lbPrev.hidden = el.lbNext.hidden = total < 2;
    syncLightboxLike();

    // Warm the cache for neighbours so next/previous feel instant
    [1, -1].forEach((d) => { if (total > 1) new Image().src = largeUrl(state.visible[(state.current + d + total) % total]); });
  }

  function syncLightboxLike() {
    const photo = state.visible[state.current];
    if (!photo) return;
    const on = state.favourites.has(photo.id);
    el.lbLike.setAttribute("aria-pressed", String(on));
    el.lbLike.setAttribute("aria-label", on ? "Remove from favourites" : "Add to favourites");
  }

  async function downloadCurrent() {
    const photo = state.visible[state.current];
    if (!photo) return;
    const url = largeUrl(photo);
    const filename = `northlight-${photo.title.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    try {
      const blob = await (await fetch(url)).blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {
      // Cross-origin or offline: fall back to opening the image in a new tab
      window.open(url, "_blank", "noopener");
    }
  }

  function bindLightbox() {
    el.lbClose.addEventListener("click", closeLightbox);
    el.lbPrev.addEventListener("click", () => showPhoto(state.current - 1));
    el.lbNext.addEventListener("click", () => showPhoto(state.current + 1));
    el.lbDownload.addEventListener("click", downloadCurrent);
    el.lbLike.addEventListener("click", () => toggleFavourite(state.visible[state.current].id));

    // Escape is handled natively by <dialog>; here we handle arrows and cleanup
    el.lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") showPhoto(state.current - 1);
      if (e.key === "ArrowRight") showPhoto(state.current + 1);
    });
    el.lb.addEventListener("close", () => {
      document.body.style.overflow = "";
      el.lbImg.removeAttribute("src");
      if (lastFocus) lastFocus.focus();
    });
    // Click on the dark area (not the image or buttons) closes
    el.lb.addEventListener("click", (e) => {
      if (e.target === el.lb || e.target.classList.contains("lightbox__stage") || e.target.classList.contains("lightbox__figure")) closeLightbox();
    });

    // Swipe on touch screens
    let startX = null;
    el.lb.addEventListener("touchstart", (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
    el.lb.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) showPhoto(state.current + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  }

  /* ---------- Theme ---------- */
  function currentTheme() {
    return document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    el.themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  /* ---------- Navigation, back-to-top ---------- */
  function setMenu(open) {
    el.nav.classList.toggle("is-open", open);
    el.menuBtn.setAttribute("aria-expanded", String(open));
    el.menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  function bindPage() {
    el.menuBtn.addEventListener("click", () => setMenu(!el.nav.classList.contains("is-open")));
    el.nav.addEventListener("click", (e) => { if (e.target.closest("a, button")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    el.navFav.addEventListener("click", () => {
      setFilter("Favourites");
      document.getElementById("gallery").scrollIntoView();
    });

    el.themeBtn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      store.set("northlight:theme", next);
    });

    el.filters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) setFilter(chip.dataset.filter);
    });

    // Debounced live search
    let timer;
    el.search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.query = el.search.value; applyFilters(); }, 150);
    });
    el.searchForm.addEventListener("submit", (e) => e.preventDefault());
    el.reset.addEventListener("click", resetAll);

    // Back-to-top button
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { el.toTop.hidden = window.scrollY < 600; ticking = false; });
    }, { passive: true });
    el.toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));
  }

  /* ---------- Init ---------- */
  function init() {
    const savedTheme = store.get("northlight:theme", null);
    if (savedTheme) applyTheme(savedTheme); else applyTheme(currentTheme());

    state.favourites = new Set(store.get("northlight:favourites", []).filter((id) => PHOTOS.some((p) => p.id === id)));

    renderFilters();
    bindPage();
    bindLightbox();

    // Loading state: show skeleton tiles briefly, then build the real grid
    showSkeletons();
    setTimeout(() => { buildCards(); applyFilters(); }, 600);
  }

  init();
})();
