/**
 * OmniTag Mobile - Mobile Edition Controller
 * Powers the dedicated smartphone UI while reusing the core API sources engine
 */

class OmniTagMobileApp {
  constructor() {
    this.sourceManager = window.apiSourceManager;
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 0;
    this.currentQuery = "";
    this.activeTab = "search";
    this.activeFilter = "all";
    this.activeRating = "all";
    this.activeMedia = "all";
    this.activeAspect = "all";
    this.activeSort = "default";
    this.viewerIndex = -1;
    this.favorites = this.loadFavorites();

    this.initElements();
    this.initTheme();
    this.initAutocomplete();
    this.updateSourceBadge();
    this.initInstallPrompt();
    this.bindEvents();
    
    // Auto-load initial feed
    this.executeSearch("", 0);
  }

  initElements() {
    this.searchInput = document.getElementById("mobile-search-input");
    this.searchBtn = document.getElementById("mobile-search-btn");
    this.clearBtn = document.getElementById("mobile-clear-btn");
    this.autocompleteEl = document.getElementById("mobile-autocomplete");
    this.grid = document.getElementById("mobile-grid");
    this.paginationEl = document.getElementById("mobile-pagination");
    this.resultsInfoEl = document.getElementById("feed-results-info");
    this.refreshBtn = document.getElementById("feed-refresh-btn");
    this.sourceChip = document.getElementById("mobile-source-chip");
    this.activeSourceName = document.getElementById("active-source-name");
    this.themeBtn = document.getElementById("mobile-theme-btn");
    this.sourcesSheet = document.getElementById("mobile-sources-sheet");
    this.sourcesList = document.getElementById("mobile-sources-list");
    this.closeSourcesBtn = document.getElementById("close-sources-sheet-btn");
    this.addSourceBtn = document.getElementById("mobile-add-source-btn");

    // Viewer
    this.viewerModal = document.getElementById("mobile-viewer-modal");
    this.viewerStage = document.getElementById("viewer-media-stage");
    this.viewerCloseBtn = document.getElementById("viewer-close-btn");
    this.viewerFavBtn = document.getElementById("viewer-fav-btn");
    this.viewerDownloadBtn = document.getElementById("viewer-download-btn");
    this.viewerCopyBtn = document.getElementById("viewer-copy-btn");
    this.viewerSourceBtn = document.getElementById("viewer-source-btn");
    this.viewerMetaRow = document.getElementById("viewer-meta-row");
    this.viewerTagsWrap = document.getElementById("viewer-tags-chips");

    // Toast
    this.toastEl = document.getElementById("mobile-toast");

    // Install Banner & Modal
    this.installBanner = document.getElementById("install-banner");
    this.installBtn = document.getElementById("install-btn");
    this.installModal = document.getElementById("install-modal");
    this.installInstructions = document.getElementById("install-instructions");
    this.closeInstallModalBtn = document.getElementById("close-install-modal-btn");
    this.dismissInstallModalBtn = document.getElementById("dismiss-install-modal-btn");
  }

  initInstallPrompt() {
    this.deferredInstallPrompt = null;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.installBanner) this.installBanner.style.display = "flex";
    });

    if (this.installBtn) {
      this.installBtn.addEventListener("click", async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const choice = await this.deferredInstallPrompt.userChoice;
          if (choice.outcome === "accepted") {
            if (this.installBanner) this.installBanner.style.display = "none";
          }
          this.deferredInstallPrompt = null;
        } else {
          this.showInstallHelp();
        }
      });
    }

    if (this.closeInstallModalBtn) {
      this.closeInstallModalBtn.addEventListener("click", () => {
        this.installModal.style.display = "none";
      });
    }

    if (this.dismissInstallModalBtn) {
      this.dismissInstallModalBtn.addEventListener("click", () => {
        this.installModal.style.display = "none";
      });
    }

    if (this.installModal) {
      const overlay = this.installModal.querySelector(".sheet-overlay");
      if (overlay) overlay.addEventListener("click", () => {
        this.installModal.style.display = "none";
      });
    }
  }

  showInstallHelp() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let html = "";

    if (isIOS) {
      html = `
        <div style="background: var(--m-surface-elevated); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
          <strong style="color: var(--m-accent);">How to install on iPhone (Safari):</strong>
          <ol style="margin: 8px 0 0 18px; padding: 0;">
            <li style="margin-bottom: 6px;">Tap the <strong>Share</strong> button <span style="font-size: 16px;">[↑]</span> at the bottom of Safari.</li>
            <li style="margin-bottom: 6px;">Scroll down and tap <strong>"Add to Home Screen"</strong> (➕).</li>
            <li>Tap <strong>"Add"</strong> in the top right corner.</li>
          </ol>
        </div>
        <p style="color: var(--m-text-sub); font-size: 12px;">OmniTag will now be installed as an icon on your home screen and open in full-screen mode!</p>
      `;
    } else {
      html = `
        <div style="background: var(--m-surface-elevated); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
          <strong style="color: var(--m-accent);">How to install on Android (Chrome):</strong>
          <ol style="margin: 8px 0 0 18px; padding: 0;">
            <li style="margin-bottom: 6px;">Tap the <strong>three dots (⋮)</strong> in the top-right corner of Chrome.</li>
            <li style="margin-bottom: 6px;">Tap <strong>"Install App"</strong> (or <strong>"Add to Home screen"</strong>).</li>
            <li>Tap <strong>"Install"</strong> in the popup.</li>
          </ol>
        </div>
        <p style="color: var(--m-text-sub); font-size: 12px;">OmniTag will be downloaded into your apps list just like an app store app!</p>
      `;
    }

    if (this.installInstructions) this.installInstructions.innerHTML = html;
    if (this.installModal) this.installModal.style.display = "flex";
  }

  initTheme() {
    const saved = localStorage.getItem("omnitag_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }

  toggleTheme() {
    const curr = document.documentElement.getAttribute("data-theme") || "dark";
    const next = curr === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("omnitag_theme", next);
  }

  initAutocomplete() {
    this.ac = new window.TagAutocomplete(
      this.searchInput,
      this.autocompleteEl,
      (item) => {
        this.executeSearch(this.searchInput.value);
      }
    );
  }

  updateSourceBadge() {
    const active = this.sourceManager.getActiveSource();
    if (this.activeSourceName && active) {
      this.activeSourceName.textContent = active.name;
    }
  }

  bindEvents() {
    // Theme
    this.themeBtn.addEventListener("click", () => this.toggleTheme());

    // Search events
    this.searchBtn.addEventListener("click", () => this.executeSearch(this.searchInput.value));
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.executeSearch(this.searchInput.value);
    });

    this.searchInput.addEventListener("input", () => {
      this.clearBtn.style.display = this.searchInput.value ? "block" : "none";
    });

    this.clearBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.clearBtn.style.display = "none";
      this.executeSearch("");
    });

    this.refreshBtn.addEventListener("click", () => {
      this.executeSearch(this.currentQuery, this.currentPage);
    });

    // Filter pills
    document.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        if (pill.dataset.filter === "all") {
          this.activeRating = "all";
          this.activeMedia = "all";
          this.activeAspect = "all";
          this.activeSort = "default";
        } else if (pill.dataset.rating) {
          this.activeRating = pill.dataset.rating;
        } else if (pill.dataset.media) {
          this.activeMedia = pill.dataset.media;
        } else if (pill.dataset.aspect) {
          this.activeAspect = pill.dataset.aspect;
        } else if (pill.dataset.sort) {
          this.activeSort = pill.dataset.sort;
        }

        this.applyFiltersAndRender();
      });
    });

    // Bottom Tab Bar
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.switchTab(tab.dataset.tab);
      });
    });

    // Sources Bottom Sheet
    this.sourceChip.addEventListener("click", () => this.openSourcesSheet());
    this.closeSourcesBtn.addEventListener("click", () => this.closeSourcesSheet());
    this.sourcesSheet.querySelector(".sheet-overlay").addEventListener("click", () => this.closeSourcesSheet());
    this.addSourceBtn.addEventListener("click", () => {
      const name = prompt("Enter Custom API Source Name:");
      if (!name) return;
      const url = prompt("Enter Base URL (e.g. https://example.com):");
      if (!url) return;
      
      const newSource = {
        name,
        baseUrl: url.replace(/\/$/, ""),
        type: "gelbooru_dapi",
        proxyMode: "auto"
      };
      this.sourceManager.saveSource(newSource);
      this.sourceManager.setActiveSource(newSource.id);
      this.updateSourceBadge();
      this.closeSourcesSheet();
      this.showToast(`Switched to ${name}`);
      this.executeSearch(this.currentQuery, 0);
    });

    // Viewer Controls
    this.viewerCloseBtn.addEventListener("click", () => this.closeViewer());
    this.viewerFavBtn.addEventListener("click", () => this.toggleViewerFavorite());
    this.viewerCopyBtn.addEventListener("click", () => this.copyViewerMediaUrl());
    this.viewerDownloadBtn.addEventListener("click", () => this.downloadViewerMedia());
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (tab === "search") {
      this.executeSearch(this.currentQuery, 0);
    } else if (tab === "explore") {
      this.searchInput.value = "landscape";
      this.executeSearch("landscape", 0);
    } else if (tab === "saved") {
      this.renderSavedPosts();
    } else if (tab === "sources") {
      this.openSourcesSheet();
    }
  }

  switchSource(id) {
    if (this.sourceManager.setActiveSource(id)) {
      this.updateSourceBadge();
      this.showToast(`Switched to ${this.sourceManager.getActiveSource().name}`);
      this.executeSearch(this.currentQuery, 0);
    }
  }

  async executeSearch(query = "", page = 0) {
    this.currentQuery = query.trim();
    this.currentPage = page;
    this.searchInput.value = this.currentQuery;

    this.resultsInfoEl.textContent = "Loading...";
    this.grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--m-text-sub);">Loading feed...</div>';

    try {
      const posts = await this.sourceManager.fetchPosts(this.currentQuery, page, 24);
      this.posts = posts;
      this.applyFiltersAndRender();
    } catch (err) {
      this.resultsInfoEl.textContent = "Error loading";
      let errMsg = err.message || "Failed to load posts";
      let isCors = errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError") || errMsg.includes("CORS");
      
      let suggestion = "";
      if (isCors && window.location.hostname.includes("github.io")) {
        errMsg = `${this.sourceManager.getActiveSource().name} blocks direct requests from GitHub Pages due to browser CORS policies.`;
        suggestion = `<p style="font-size: 12px; color: var(--m-text-sub); margin-bottom: 12px;">Danbooru supports direct requests and works 24/7 on GitHub Pages.</p>
        <button class="sheet-action-btn primary" onclick="mobileApp.switchSource('danbooru')" style="margin-bottom: 8px;">Switch to Danbooru (Works 24/7)</button>`;
      }

      this.grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 30px;">
          <p style="color: var(--m-danger); margin-bottom: 10px; font-size: 13px; line-height: 1.5;">${this.escapeHtml(errMsg)}</p>
          ${suggestion}
          <button class="sheet-action-btn" onclick="mobileApp.executeSearch(mobileApp.currentQuery, mobileApp.currentPage)">Retry</button>
        </div>
      `;
    }
  }

  applyFiltersAndRender() {
    let result = [...this.posts];

    if (this.activeRating === "s") {
      result = result.filter(p => (p.rating || "").toLowerCase().startsWith("s") || (p.rating || "").toLowerCase() === "general");
    }

    if (this.activeMedia === "video") {
      result = result.filter(p => p.isVideo || p.isGif);
    } else if (this.activeMedia === "image") {
      result = result.filter(p => !p.isVideo && !p.isGif);
    }

    if (this.activeAspect === "tall") {
      result = result.filter(p => p.aspectRatio < 0.9);
    } else if (this.activeAspect === "wide") {
      result = result.filter(p => p.aspectRatio > 1.1);
    }

    if (this.activeSort === "score") {
      result.sort((a, b) => b.score - a.score);
    }

    this.filteredPosts = result;
    this.renderGrid();
  }

  renderGrid() {
    this.grid.innerHTML = "";
    this.resultsInfoEl.textContent = `${this.filteredPosts.length} posts (Page ${this.currentPage + 1})`;

    if (this.filteredPosts.length === 0) {
      this.grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--m-text-sub);">
          <p style="font-size: 16px; margin-bottom: 6px;">No posts found</p>
          <p style="font-size: 12px;">Try different tags or switch API source</p>
        </div>
      `;
      this.paginationEl.innerHTML = "";
      return;
    }

    this.filteredPosts.forEach((post, index) => {
      const card = document.createElement("div");
      card.className = "mobile-card";

      let badge = "";
      if (post.isVideo) badge = `<span class="card-badge">VIDEO</span>`;
      else if (post.isGif) badge = `<span class="card-badge">GIF</span>`;

      const isFav = this.isFavorite(post.id);

      card.innerHTML = `
        <img src="${this.escapeHtml(post.previewUrl)}" alt="Post ${post.id}" loading="lazy" />
        ${badge}
        <button class="card-fav-star ${isFav ? "active" : ""}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      `;

      card.addEventListener("click", () => this.openViewer(index));

      const star = card.querySelector(".card-fav-star");
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFavorite(post);
        star.classList.toggle("active");
        star.querySelector("svg").setAttribute("fill", this.isFavorite(post.id) ? "currentColor" : "none");
      });

      this.grid.appendChild(card);
    });

    this.renderPagination();
  }

  renderPagination() {
    this.paginationEl.innerHTML = `
      <button class="sheet-action-btn" id="m-prev-btn" ${this.currentPage <= 0 ? "disabled" : ""}>&larr; Prev</button>
      <span style="font-size: 13px; font-weight: 600;">Page ${this.currentPage + 1}</span>
      <button class="sheet-action-btn" id="m-next-btn">Next &rarr;</button>
    `;

    const prev = document.getElementById("m-prev-btn");
    const next = document.getElementById("m-next-btn");

    if (prev) {
      prev.addEventListener("click", () => {
        if (this.currentPage > 0) this.executeSearch(this.currentQuery, this.currentPage - 1);
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        this.executeSearch(this.currentQuery, this.currentPage + 1);
      });
    }
  }

  // ==========================================
  // MOBILE FULLSCREEN VIEWER
  // ==========================================

  openViewer(index) {
    if (index < 0 || index >= this.filteredPosts.length) return;
    this.viewerIndex = index;
    const post = this.filteredPosts[index];

    this.viewerModal.style.display = "flex";
    this.viewerStage.innerHTML = '<div style="color: #fff;">Loading...</div>';

    if (post.isVideo) {
      const vid = document.createElement("video");
      vid.src = post.fileUrl || post.sampleUrl;
      vid.controls = true;
      vid.autoplay = true;
      vid.loop = true;
      vid.style.maxWidth = "100%";
      vid.style.maxHeight = "100%";
      this.viewerStage.innerHTML = "";
      this.viewerStage.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = post.sampleUrl || post.fileUrl;
      img.onload = () => {
        this.viewerStage.innerHTML = "";
        this.viewerStage.appendChild(img);
      };
      img.onerror = () => {
        img.src = post.fileUrl || post.previewUrl;
      };
    }

    this.viewerMetaRow.innerHTML = `
      <span>#${post.id}</span>
      <span>${post.width}×${post.height}</span>
      <span>★ ${post.score}</span>
      <span>${post.ext.toUpperCase()}</span>
    `;

    this.viewerSourceBtn.href = post.postPageUrl || post.fileUrl;

    // Render tags
    this.viewerTagsWrap.innerHTML = "";
    (post.tags || []).slice(0, 30).forEach(tag => {
      const chip = document.createElement("button");
      chip.className = "mobile-tag-chip";
      chip.textContent = tag.replace(/_/g, " ");
      chip.addEventListener("click", () => {
        this.closeViewer();
        this.executeSearch(tag, 0);
      });
      this.viewerTagsWrap.appendChild(chip);
    });

    const isFav = this.isFavorite(post.id);
    this.viewerFavBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
  }

  closeViewer() {
    this.viewerModal.style.display = "none";
    this.viewerStage.innerHTML = "";
    this.viewerIndex = -1;
  }

  toggleViewerFavorite() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    this.toggleFavorite(post);
    const isFav = this.isFavorite(post.id);
    this.viewerFavBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
  }

  copyViewerMediaUrl() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    navigator.clipboard.writeText(post.fileUrl || post.sampleUrl).then(() => {
      this.showToast("Copied link to clipboard!");
    });
  }

  downloadViewerMedia() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    const a = document.createElement("a");
    a.href = post.fileUrl || post.sampleUrl;
    a.download = `${post.sourceId}_${post.id}.${post.ext}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast("Download started!");
  }

  // ==========================================
  // SOURCES BOTTOM SHEET
  // ==========================================

  openSourcesSheet() {
    const sources = this.sourceManager.getSources();
    const activeId = this.sourceManager.getActiveSource()?.id;

    this.sourcesList.innerHTML = "";
    sources.forEach(src => {
      const row = document.createElement("div");
      row.className = `sheet-source-card ${src.id === activeId ? "active" : ""}`;
      row.innerHTML = `
        <div>
          <div style="font-weight: 600; font-size: 14px;">${this.escapeHtml(src.name)}</div>
          <div style="font-size: 11px; color: var(--m-text-sub);">${this.escapeHtml(src.baseUrl)}</div>
        </div>
        <span style="font-size: 11px; font-weight: 700; color: var(--m-accent);">${src.id === activeId ? "ACTIVE" : "SWITCH"}</span>
      `;
      row.addEventListener("click", () => {
        this.sourceManager.setActiveSource(src.id);
        this.updateSourceBadge();
        this.closeSourcesSheet();
        this.showToast(`Switched API to ${src.name}`);
        this.executeSearch(this.currentQuery, 0);
      });
      this.sourcesList.appendChild(row);
    });

    this.sourcesSheet.style.display = "flex";
  }

  closeSourcesSheet() {
    this.sourcesSheet.style.display = "none";
  }

  // ==========================================
  // SAVED POSTS
  // ==========================================

  loadFavorites() {
    try {
      const saved = localStorage.getItem("omnitag_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveFavorites() {
    localStorage.setItem("omnitag_favorites", JSON.stringify(this.favorites));
  }

  isFavorite(id) {
    return this.favorites.some(f => f.id === id);
  }

  toggleFavorite(post) {
    if (this.isFavorite(post.id)) {
      this.favorites = this.favorites.filter(f => f.id !== post.id);
      this.showToast("Removed from saved");
    } else {
      this.favorites.unshift(post);
      this.showToast("Saved to favorites!");
    }
    this.saveFavorites();
    if (this.activeTab === "saved") {
      this.renderSavedPosts();
    }
  }

  renderSavedPosts() {
    this.filteredPosts = this.favorites;
    this.resultsInfoEl.textContent = `${this.favorites.length} saved bookmarks`;
    this.renderGrid();
    this.paginationEl.innerHTML = "";
  }

  showToast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 2400);
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.mobileApp = new OmniTagMobileApp();
});
