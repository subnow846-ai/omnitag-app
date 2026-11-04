/**
 * OmniTag - Main Application Controller
 * Handles search workflow, grid rendering, lightbox viewer, favorites, and source management
 */

class OmniTagApp {
  constructor() {
    this.sourceManager = window.apiSourceManager;
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 0;
    this.currentQuery = "";
    this.isLoading = false;
    this.hasMore = true;
    this.lightboxIndex = -1;
    this.favorites = this.loadFavorites();
    this.searchHistory = this.loadHistory();

    this.filters = {
      rating: "all",
      media: "all",
      aspect: "all",
      sort: "default"
    };

    this.initElements();
    this.initTheme();
    this.initSourcesUI();
    this.initAutocomplete();
    this.bindEvents();
    this.renderHistory();

    // Check URL parameters for direct search (e.g. ?q=tag&source=safebooru)
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get("source");
    const queryParam = urlParams.get("q");

    if (sourceParam && this.sourceManager.getSource(sourceParam)) {
      this.sourceManager.setActiveSource(sourceParam);
      this.updateActiveSourceBadge();
    }

    if (queryParam) {
      this.searchInput.value = queryParam;
      this.executeSearch(queryParam);
    } else {
      // Auto-load feed on PC so users immediately see content
      this.executeSearch("", 0);
    }
  }

  initElements() {
    // App Layout
    this.heroSection = document.getElementById("hero-section");
    this.topBar = document.getElementById("top-bar");
    this.resultsSection = document.getElementById("results-section");
    this.galleryGrid = document.getElementById("gallery-grid");
    this.paginationEl = document.getElementById("pagination-container");
    this.resultsCountEl = document.getElementById("results-count");
    this.activeSourceBadge = document.getElementById("active-source-badge");
    this.quickSourcesDropdown = document.getElementById("quick-sources-dropdown");
    this.quickSourcesDropdownTop = document.getElementById("quick-sources-dropdown-top");

    // Inputs
    this.heroSearchInput = document.getElementById("hero-search-input");
    this.heroSearchBtn = document.getElementById("hero-search-btn");
    this.topSearchInput = document.getElementById("top-search-input");
    this.topSearchBtn = document.getElementById("top-search-btn");
    this.searchInput = this.heroSearchInput; // active pointer

    // Autocomplete dropdowns
    this.heroAutocompleteEl = document.getElementById("hero-autocomplete");
    this.topAutocompleteEl = document.getElementById("top-autocomplete");

    // Filter controls
    this.filterRating = document.getElementById("filter-rating");
    this.filterMedia = document.getElementById("filter-media");
    this.filterAspect = document.getElementById("filter-aspect");
    this.filterSort = document.getElementById("filter-sort");

    // Lightbox Elements
    this.lightboxModal = document.getElementById("lightbox-modal");
    this.lightboxMediaContainer = document.getElementById("lightbox-media-container");
    this.lightboxTagsContainer = document.getElementById("lightbox-tags-container");
    this.lightboxInfoTable = document.getElementById("lightbox-info-table");
    this.lightboxPrevBtn = document.getElementById("lightbox-prev-btn");
    this.lightboxNextBtn = document.getElementById("lightbox-next-btn");
    this.lightboxCloseBtn = document.getElementById("lightbox-close-btn");
    this.lightboxFavBtn = document.getElementById("lightbox-fav-btn");
    this.lightboxDownloadBtn = document.getElementById("lightbox-download-btn");
    this.lightboxCopyBtn = document.getElementById("lightbox-copy-btn");
    this.lightboxOriginalBtn = document.getElementById("lightbox-original-btn");

    // Source Manager Modal Elements
    this.sourcesModal = document.getElementById("sources-modal");
    this.sourcesListContainer = document.getElementById("sources-list-container");
    this.openSourcesBtn = document.getElementById("open-sources-btn");
    this.openSourcesBtnTop = document.getElementById("open-sources-btn-top");
    this.closeSourcesBtn = document.getElementById("close-sources-btn");
    this.addSourceBtn = document.getElementById("add-source-btn");
    this.sourceEditForm = document.getElementById("source-edit-form");
    this.sourceFormSection = document.getElementById("source-form-section");
    this.cancelSourceEditBtn = document.getElementById("cancel-source-edit");
    this.exportSourcesBtn = document.getElementById("export-sources-btn");
    this.importSourcesInput = document.getElementById("import-sources-file");
    this.resetSourcesBtn = document.getElementById("reset-sources-btn");

    // Favorites Drawer
    this.favDrawer = document.getElementById("favorites-drawer");
    this.openFavBtn = document.getElementById("open-fav-btn");
    this.closeFavBtn = document.getElementById("close-fav-btn");
    this.favGrid = document.getElementById("favorites-grid");
    this.favBadgeCount = document.getElementById("fav-badge-count");

    // Theme Toggle
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
  }

  initTheme() {
    const savedTheme = localStorage.getItem("omnitag_theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("omnitag_theme", next);
    this.updateThemeIcon(next);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggleBtn) return;
    this.themeToggleBtn.innerHTML = theme === "dark" 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }

  initAutocomplete() {
    this.heroAC = new window.TagAutocomplete(
      this.heroSearchInput,
      this.heroAutocompleteEl,
      (item, query) => {
        // Tag selected from autocomplete
      }
    );

    this.topAC = new window.TagAutocomplete(
      this.topSearchInput,
      this.topAutocompleteEl,
      (item, query) => {
        // Tag selected from autocomplete
      }
    );
  }

  initSourcesUI() {
    this.updateActiveSourceBadge();
    this.populateQuickSourcesMenu();
  }

  updateActiveSourceBadge() {
    const active = this.sourceManager.getActiveSource();
    if (!active) return;

    if (this.activeSourceBadge) {
      this.activeSourceBadge.textContent = active.name;
    }

    const heroSourceBadge = document.getElementById("hero-source-name");
    if (heroSourceBadge) {
      heroSourceBadge.textContent = active.name;
    }

    const topSourceBadge = document.getElementById("top-source-name");
    if (topSourceBadge) {
      topSourceBadge.textContent = active.name;
    }
  }

  populateQuickSourcesMenu() {
    const sources = this.sourceManager.getSources();
    const activeId = this.sourceManager.getActiveSource()?.id;

    const buildItems = (dropdown) => {
      if (!dropdown) return;
      dropdown.innerHTML = "";
      sources.forEach(src => {
        const item = document.createElement("button");
        item.className = `quick-source-item ${src.id === activeId ? "active" : ""}`;
        item.innerHTML = `
          <span class="source-item-name">${this.escapeHtml(src.name)}</span>
          <span class="source-item-type">${src.type.replace('_', ' ')}</span>
        `;
        item.addEventListener("click", () => {
          this.switchSource(src.id);
          dropdown.classList.remove("open");
        });
        dropdown.appendChild(item);
      });

      const manageItem = document.createElement("button");
      manageItem.className = "quick-source-item manage-action";
      manageItem.innerHTML = `⚙️ Manage / Add APIs...`;
      manageItem.addEventListener("click", () => {
        dropdown.classList.remove("open");
        this.openSourcesModal();
      });
      dropdown.appendChild(manageItem);
    };

    buildItems(this.quickSourcesDropdown);
    buildItems(this.quickSourcesDropdownTop);
  }

  switchSource(sourceId) {
    if (this.sourceManager.setActiveSource(sourceId)) {
      this.updateActiveSourceBadge();
      this.populateQuickSourcesMenu();
      this.showToast(`Switched API to ${this.sourceManager.getActiveSource().name}`);
      
      // If currently displaying results, refresh query for the new source
      if (this.resultsSection.style.display !== "none") {
        this.executeSearch(this.currentQuery, 0);
      }
    }
  }

  bindEvents() {
    // Theme
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

    // Search submissions
    this.heroSearchBtn.addEventListener("click", () => {
      this.heroAC.hide();
      this.executeSearch(this.heroSearchInput.value);
    });
    this.heroSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.heroAC && this.heroAC.selectedIndex >= 0) {
          // Handled by autocomplete selection
        } else {
          e.preventDefault();
          if (this.heroAC) this.heroAC.hide();
          this.executeSearch(this.heroSearchInput.value);
        }
      }
    });

    this.topSearchBtn.addEventListener("click", () => {
      this.topAC.hide();
      this.executeSearch(this.topSearchInput.value);
    });
    this.topSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.topAC && this.topAC.selectedIndex >= 0) {
          // Handled by autocomplete selection
        } else {
          e.preventDefault();
          if (this.topAC) this.topAC.hide();
          this.executeSearch(this.topSearchInput.value);
        }
      }
    });

    // Logo Click -> Return to Home
    document.querySelectorAll(".logo-action").forEach(el => {
      el.addEventListener("click", () => this.showHomeView());
    });

    // Quick source dropdown toggles
    const setupSourceDropdown = (btnId, menuId) => {
      const btn = document.getElementById(btnId);
      const menu = document.getElementById(menuId);
      if (!btn || !menu) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove("open");
        }
      });
    };

    setupSourceDropdown("hero-source-btn", "quick-sources-dropdown");
    setupSourceDropdown("top-source-btn", "quick-sources-dropdown-top");

    // Filter changes
    [this.filterRating, this.filterMedia, this.filterAspect, this.filterSort].forEach(sel => {
      if (sel) {
        sel.addEventListener("change", () => {
          this.filters.rating = this.filterRating.value;
          this.filters.media = this.filterMedia.value;
          this.filters.aspect = this.filterAspect.value;
          this.filters.sort = this.filterSort.value;
          this.applyFiltersAndRender();
        });
      }
    });

    // Lightbox Controls
    this.lightboxCloseBtn.addEventListener("click", () => this.closeLightbox());
    this.lightboxPrevBtn.addEventListener("click", () => this.prevLightbox());
    this.lightboxNextBtn.addEventListener("click", () => this.nextLightbox());

    document.addEventListener("keydown", (e) => {
      if (this.lightboxModal.style.display === "flex") {
        if (e.key === "ArrowLeft") this.prevLightbox();
        else if (e.key === "ArrowRight") this.nextLightbox();
        else if (e.key === "Escape") this.closeLightbox();
      }
    });

    this.lightboxModal.addEventListener("click", (e) => {
      if (e.target === this.lightboxModal) {
        this.closeLightbox();
      }
    });

    this.lightboxCopyBtn.addEventListener("click", () => this.copyCurrentMediaUrl());
    this.lightboxDownloadBtn.addEventListener("click", () => this.downloadCurrentMedia());
    this.lightboxFavBtn.addEventListener("click", () => this.toggleCurrentFavorite());

    // Sources Manager Modal
    const openSourcesHandler = () => this.openSourcesModal();
    if (this.openSourcesBtn) this.openSourcesBtn.addEventListener("click", openSourcesHandler);
    if (this.openSourcesBtnTop) this.openSourcesBtnTop.addEventListener("click", openSourcesHandler);
    this.closeSourcesBtn.addEventListener("click", () => this.closeSourcesModal());
    this.sourcesModal.addEventListener("click", (e) => {
      if (e.target === this.sourcesModal) this.closeSourcesModal();
    });

    this.addSourceBtn.addEventListener("click", () => this.showSourceForm());
    this.cancelSourceEditBtn.addEventListener("click", () => this.hideSourceForm());
    this.sourceEditForm.addEventListener("submit", (e) => this.handleSaveSource(e));

    this.exportSourcesBtn.addEventListener("click", () => this.handleExportSources());
    this.importSourcesInput.addEventListener("change", (e) => this.handleImportSources(e));
    this.resetSourcesBtn.addEventListener("click", () => this.handleResetSources());

    // Favorites Drawer
    this.openFavBtn.addEventListener("click", () => this.openFavoritesDrawer());
    this.closeFavBtn.addEventListener("click", () => this.closeFavoritesDrawer());
    this.updateFavBadge();

    // Source Preset Selector inside Source Form
    const typeSelect = document.getElementById("source-form-type");
    if (typeSelect) {
      typeSelect.addEventListener("change", () => this.handleSourceTypeChange(typeSelect.value));
    }
  }

  showHomeView() {
    this.heroSection.style.display = "flex";
    this.topBar.style.display = "none";
    this.resultsSection.style.display = "none";
    this.heroSearchInput.value = this.currentQuery;
    this.searchInput = this.heroSearchInput;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showResultsView() {
    this.heroSection.style.display = "none";
    this.topBar.style.display = "flex";
    this.resultsSection.style.display = "block";
    this.topSearchInput.value = this.currentQuery;
    this.searchInput = this.topSearchInput;
  }

  async executeSearch(query = "", page = 0) {
    this.currentQuery = query.trim();
    this.currentPage = page;
    this.showResultsView();

    // Synchronize inputs
    this.heroSearchInput.value = this.currentQuery;
    this.topSearchInput.value = this.currentQuery;

    // Save to history
    if (this.currentQuery) {
      this.saveHistory(this.currentQuery);
      this.renderHistory();
    }

    // Set loading state
    this.isLoading = true;
    this.galleryGrid.innerHTML = this.renderSkeletons(12);
    this.resultsCountEl.textContent = "Searching...";

    try {
      const posts = await this.sourceManager.fetchPosts(this.currentQuery, page, 28);
      this.posts = posts;
      this.hasMore = posts.length >= 24;
      this.applyFiltersAndRender();
      
      // Update URL without page reload
      const url = new URL(window.location);
      if (this.currentQuery) url.searchParams.set("q", this.currentQuery);
      else url.searchParams.delete("q");
      url.searchParams.set("source", this.sourceManager.getActiveSource().id);
      window.history.replaceState({}, "", url);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Search failed:", err);
      this.renderError(err.message);
    } finally {
      this.isLoading = false;
    }
  }

  applyFiltersAndRender() {
    let result = [...this.posts];

    // Rating filter
    if (this.filters.rating !== "all") {
      result = result.filter(p => {
        const r = (p.rating || "").toLowerCase();
        if (this.filters.rating === "s") return r === "s" || r === "safe" || r === "general";
        if (this.filters.rating === "q") return r === "q" || r === "questionable";
        if (this.filters.rating === "e") return r === "e" || r === "explicit";
        return true;
      });
    }

    // Media type filter
    if (this.filters.media === "video") {
      result = result.filter(p => p.isVideo || p.isGif);
    } else if (this.filters.media === "image") {
      result = result.filter(p => !p.isVideo && !p.isGif);
    }

    // Aspect ratio filter
    if (this.filters.aspect === "wide") {
      result = result.filter(p => p.aspectRatio > 1.2);
    } else if (this.filters.aspect === "tall") {
      result = result.filter(p => p.aspectRatio < 0.8);
    } else if (this.filters.aspect === "square") {
      result = result.filter(p => p.aspectRatio >= 0.8 && p.aspectRatio <= 1.2);
    }

    // Sort
    if (this.filters.sort === "score") {
      result.sort((a, b) => b.score - a.score);
    } else if (this.filters.sort === "id") {
      result.sort((a, b) => b.id - a.id);
    }

    this.filteredPosts = result;
    this.renderGallery();
    this.renderPagination();
  }

  renderGallery() {
    this.galleryGrid.innerHTML = "";

    if (this.filteredPosts.length === 0) {
      this.galleryGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No posts found</h3>
          <p>Try searching for different tags, checking tag spelling, or switching your active API source.</p>
          <div class="empty-suggestions">
            <span>Popular tags:</span>
            <button class="pill-btn" onclick="app.executeSearch('1girl')">1girl</button>
            <button class="pill-btn" onclick="app.executeSearch('landscape')">landscape</button>
            <button class="pill-btn" onclick="app.executeSearch('cat')">cat</button>
            <button class="pill-btn" onclick="app.executeSearch('cyberpunk')">cyberpunk</button>
          </div>
        </div>
      `;
      this.resultsCountEl.textContent = `0 results on ${this.sourceManager.getActiveSource().name}`;
      return;
    }

    this.resultsCountEl.textContent = `Showing ${this.filteredPosts.length} posts (Page ${this.currentPage + 1}) on ${this.sourceManager.getActiveSource().name}`;

    this.filteredPosts.forEach((post, index) => {
      const card = document.createElement("div");
      card.className = "post-card";
      
      const isFav = this.isFavorite(post.id);
      const favClass = isFav ? "active" : "";

      let badge = "";
      if (post.isVideo) {
        badge = `<span class="badge badge-video">${post.ext.toUpperCase()}</span>`;
      } else if (post.isGif) {
        badge = `<span class="badge badge-gif">GIF</span>`;
      } else if (post.width > 2500) {
        badge = `<span class="badge badge-hd">HD</span>`;
      }

      card.innerHTML = `
        <div class="card-media-wrapper">
          <img 
            src="${this.escapeHtml(post.previewUrl)}" 
            alt="Post ${post.id}" 
            loading="lazy" 
            onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'300\\' fill=\\'%23222\\'><rect width=\\'100%\\' height=\\'100%\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23666\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\'>Preview unavailable</text></svg>'"
          />
          ${badge}
          <button class="card-fav-btn ${favClass}" title="Save to favorites">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <div class="card-overlay">
            <div class="card-meta">
              <span>${post.width}×${post.height}</span>
              ${post.score ? `<span>★ ${post.score}</span>` : ""}
            </div>
          </div>
        </div>
      `;

      // Open lightbox on card click
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".card-fav-btn")) {
          this.openLightbox(index);
        }
      });

      // Toggle favorite on button click
      const favBtn = card.querySelector(".card-fav-btn");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFavorite(post);
        favBtn.classList.toggle("active");
        favBtn.querySelector("svg").setAttribute("fill", this.isFavorite(post.id) ? "currentColor" : "none");
      });

      this.galleryGrid.appendChild(card);
    });
  }

  renderPagination() {
    this.paginationEl.innerHTML = "";
    if (this.posts.length === 0 && this.currentPage === 0) return;

    const nav = document.createElement("div");
    nav.className = "pagination-bar";

    const prevBtn = document.createElement("button");
    prevBtn.className = "btn-secondary";
    prevBtn.innerHTML = "&larr; Previous";
    prevBtn.disabled = this.currentPage <= 0;
    prevBtn.addEventListener("click", () => {
      if (this.currentPage > 0) {
        this.executeSearch(this.currentQuery, this.currentPage - 1);
      }
    });

    const pageNum = document.createElement("span");
    pageNum.className = "page-number-display";
    pageNum.textContent = `Page ${this.currentPage + 1}`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn-secondary";
    nextBtn.innerHTML = "Next &rarr;";
    nextBtn.disabled = !this.hasMore;
    nextBtn.addEventListener("click", () => {
      this.executeSearch(this.currentQuery, this.currentPage + 1);
    });

    nav.appendChild(prevBtn);
    nav.appendChild(pageNum);
    nav.appendChild(nextBtn);
    this.paginationEl.appendChild(nav);
  }

  renderSkeletons(count = 12) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<div class="post-card skeleton-card"><div class="skeleton-shimmer"></div></div>`;
    }
    return html;
  }

  renderError(message) {
    const isGhPages = window.location.hostname.includes("github.io");
    let ghHint = "";
    if (isGhPages) {
      ghHint = `<p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
        ${this.sourceManager.getActiveSource().name} does not allow direct cross-origin requests from GitHub Pages without a proxy.<br>
        <strong>Danbooru</strong> natively supports cross-origin requests and works 24/7 on GitHub Pages.
      </p>
      <div style="margin-bottom: 14px;">
        <button class="btn-primary" onclick="app.switchSource('danbooru')">Switch to Danbooru (Works 24/7)</button>
      </div>`;
    }

    this.galleryGrid.innerHTML = `
      <div class="empty-state error-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to fetch from ${this.sourceManager.getActiveSource().name}</h3>
        <p class="error-msg">${this.escapeHtml(message)}</p>
        ${ghHint}
        <div class="empty-actions">
          <button class="btn-secondary" onclick="app.executeSearch(app.currentQuery, app.currentPage)">Retry</button>
          <button class="btn-secondary" onclick="app.openSourcesModal()">Configure API / Proxy</button>
        </div>
      </div>
    `;
    this.resultsCountEl.textContent = "Error occurred";
  }

  // ==========================================
  // LIGHTBOX VIEWER
  // ==========================================

  openLightbox(index) {
    if (index < 0 || index >= this.filteredPosts.length) return;
    this.lightboxIndex = index;
    const post = this.filteredPosts[index];

    this.lightboxModal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scroll

    this.renderLightboxContent(post);
  }

  renderLightboxContent(post) {
    this.lightboxMediaContainer.innerHTML = '<div class="spinner"></div>';

    // Render Media (Video or Image)
    if (post.isVideo) {
      const video = document.createElement("video");
      video.src = post.fileUrl || post.sampleUrl;
      video.controls = true;
      video.autoplay = true;
      video.loop = true;
      video.className = "lightbox-video";
      this.lightboxMediaContainer.innerHTML = "";
      this.lightboxMediaContainer.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = post.sampleUrl || post.fileUrl;
      img.alt = `Post ${post.id}`;
      img.className = "lightbox-img";
      img.onload = () => {
        this.lightboxMediaContainer.innerHTML = "";
        this.lightboxMediaContainer.appendChild(img);
      };
      img.onerror = () => {
        // Fallback to fileUrl or previewUrl
        img.src = post.fileUrl || post.previewUrl;
      };
    }

    // Render categorized tags
    this.lightboxTagsContainer.innerHTML = "";
    
    // Group tags
    const renderTagGroup = (title, tags, categoryClass) => {
      if (!tags || tags.length === 0) return;
      const grp = document.createElement("div");
      grp.className = "tag-group";
      grp.innerHTML = `<div class="tag-group-title">${title} (${tags.length})</div>`;
      
      const tagList = document.createElement("div");
      tagList.className = "tag-chips-wrapper";

      tags.forEach(tag => {
        const chip = document.createElement("button");
        chip.className = `tag-chip ${categoryClass}`;
        chip.textContent = tag.replace(/_/g, " ");
        chip.title = `Search tag: ${tag}`;
        chip.addEventListener("click", () => {
          this.closeLightbox();
          this.executeSearch(tag);
        });
        tagList.appendChild(chip);
      });

      grp.appendChild(tagList);
      this.lightboxTagsContainer.appendChild(grp);
    };

    if (post.tagCategories && (post.tagCategories.artist?.length || post.tagCategories.character?.length)) {
      renderTagGroup("Artist", post.tagCategories.artist, "cat-artist");
      renderTagGroup("Character", post.tagCategories.character, "cat-character");
      renderTagGroup("Copyright / Series", post.tagCategories.copyright, "cat-copyright");
      renderTagGroup("General", post.tagCategories.general, "cat-general");
    } else {
      renderTagGroup("Tags", post.tags, "cat-general");
    }

    // Info table
    this.lightboxInfoTable.innerHTML = `
      <tr><td>Source</td><td><strong>${this.escapeHtml(post.sourceSite)}</strong></td></tr>
      <tr><td>Post ID</td><td>#${post.id}</td></tr>
      <tr><td>Dimensions</td><td>${post.width} × ${post.height}</td></tr>
      <tr><td>Rating</td><td class="rating-badge rating-${post.rating}">${post.rating.toUpperCase()}</td></tr>
      <tr><td>Score</td><td>★ ${post.score}</td></tr>
      <tr><td>Format</td><td>${post.ext.toUpperCase()}</td></tr>
    `;

    // External link
    this.lightboxOriginalBtn.href = post.postPageUrl || post.fileUrl;

    // Update favorite button state
    const isFav = this.isFavorite(post.id);
    this.lightboxFavBtn.classList.toggle("active", isFav);
    this.lightboxFavBtn.querySelector("svg").setAttribute("fill", isFav ? "currentColor" : "none");
  }

  closeLightbox() {
    this.lightboxModal.style.display = "none";
    this.lightboxMediaContainer.innerHTML = "";
    document.body.style.overflow = "";
    this.lightboxIndex = -1;
  }

  prevLightbox() {
    if (this.lightboxIndex > 0) {
      this.openLightbox(this.lightboxIndex - 1);
    }
  }

  nextLightbox() {
    if (this.lightboxIndex < this.filteredPosts.length - 1) {
      this.openLightbox(this.lightboxIndex + 1);
    }
  }

  copyCurrentMediaUrl() {
    if (this.lightboxIndex < 0) return;
    const post = this.filteredPosts[this.lightboxIndex];
    const url = post.fileUrl || post.sampleUrl;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast("Direct URL copied to clipboard!");
    });
  }

  downloadCurrentMedia() {
    if (this.lightboxIndex < 0) return;
    const post = this.filteredPosts[this.lightboxIndex];
    const url = post.fileUrl || post.sampleUrl;
    
    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post.sourceId}_${post.id}.${post.ext}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast("Download started!");
  }

  toggleCurrentFavorite() {
    if (this.lightboxIndex < 0) return;
    const post = this.filteredPosts[this.lightboxIndex];
    this.toggleFavorite(post);
    const isFav = this.isFavorite(post.id);
    this.lightboxFavBtn.classList.toggle("active", isFav);
    this.lightboxFavBtn.querySelector("svg").setAttribute("fill", isFav ? "currentColor" : "none");
  }

  // ==========================================
  // FAVORITES & BOOKMARKS
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
    this.updateFavBadge();
  }

  isFavorite(postId) {
    return this.favorites.some(f => f.id === postId);
  }

  toggleFavorite(post) {
    if (this.isFavorite(post.id)) {
      this.favorites = this.favorites.filter(f => f.id !== post.id);
      this.showToast("Removed from favorites");
    } else {
      this.favorites.unshift(post);
      this.showToast("Saved to favorites!");
    }
    this.saveFavorites();
    if (this.favDrawer.classList.contains("open")) {
      this.renderFavoritesDrawer();
    }
  }

  updateFavBadge() {
    if (this.favBadgeCount) {
      this.favBadgeCount.textContent = this.favorites.length;
      this.favBadgeCount.style.display = this.favorites.length > 0 ? "inline-flex" : "none";
    }
  }

  openFavoritesDrawer() {
    this.renderFavoritesDrawer();
    this.favDrawer.classList.add("open");
  }

  closeFavoritesDrawer() {
    this.favDrawer.classList.remove("open");
  }

  renderFavoritesDrawer() {
    this.favGrid.innerHTML = "";
    if (this.favorites.length === 0) {
      this.favGrid.innerHTML = `<div class="empty-state"><p>No saved favorites yet.</p></div>`;
      return;
    }

    this.favorites.forEach((post) => {
      const item = document.createElement("div");
      item.className = "fav-card";
      item.innerHTML = `
        <img src="${this.escapeHtml(post.previewUrl)}" alt="Post ${post.id}" />
        <button class="fav-delete-btn" title="Remove">&times;</button>
      `;

      item.querySelector("img").addEventListener("click", () => {
        this.closeFavoritesDrawer();
        this.filteredPosts = [post];
        this.openLightbox(0);
      });

      item.querySelector(".fav-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFavorite(post);
      });

      this.favGrid.appendChild(item);
    });
  }

  // ==========================================
  // SOURCE MANAGER MODAL
  // ==========================================

  openSourcesModal() {
    this.renderSourcesList();
    this.hideSourceForm();
    this.sourcesModal.style.display = "flex";
  }

  closeSourcesModal() {
    this.sourcesModal.style.display = "none";
  }

  renderSourcesList() {
    const sources = this.sourceManager.getSources();
    const activeId = this.sourceManager.getActiveSource()?.id;
    this.sourcesListContainer.innerHTML = "";

    sources.forEach(src => {
      const card = document.createElement("div");
      card.className = `source-card ${src.id === activeId ? "active" : ""}`;
      
      const badgeText = src.isPreset ? "Preset" : "Custom";

      card.innerHTML = `
        <div class="source-card-main">
          <div class="source-card-header">
            <h4>${this.escapeHtml(src.name)}</h4>
            <span class="source-tag-type">${badgeText}</span>
            ${src.id === activeId ? '<span class="active-pill">Active</span>' : ''}
          </div>
          <p class="source-url-text">${this.escapeHtml(src.baseUrl)}</p>
          <p class="source-desc-text">${this.escapeHtml(src.description || src.type)}${src.requiresAuth && (!src.apiKey || !src.userId) ? ' <strong>&#9888; API key + User ID required. Click Edit to add them.</strong>' : ''}</p>
        </div>
        <div class="source-card-actions">
          ${src.id !== activeId ? `<button class="btn-primary btn-sm btn-activate">Activate</button>` : `<button class="btn-secondary btn-sm" disabled>Current</button>`}
          <button class="btn-secondary btn-sm btn-edit">Edit</button>
          ${!src.isPreset ? `<button class="btn-danger btn-sm btn-delete">Delete</button>` : ''}
        </div>
      `;

      const actBtn = card.querySelector(".btn-activate");
      if (actBtn) {
        actBtn.addEventListener("click", () => {
          this.switchSource(src.id);
          this.renderSourcesList();
        });
      }

      card.querySelector(".btn-edit").addEventListener("click", () => {
        this.showSourceForm(src);
      });

      const delBtn = card.querySelector(".btn-delete");
      if (delBtn) {
        delBtn.addEventListener("click", () => {
          if (confirm(`Delete custom source "${src.name}"?`)) {
            this.sourceManager.deleteSource(src.id);
            this.renderSourcesList();
            this.populateQuickSourcesMenu();
            this.updateActiveSourceBadge();
          }
        });
      }

      this.sourcesListContainer.appendChild(card);
    });
  }

  showSourceForm(existing = null) {
    this.sourceFormSection.style.display = "block";
    this.sourcesListContainer.style.display = "none";

    document.getElementById("source-form-id").value = existing ? existing.id : "";
    document.getElementById("source-form-name").value = existing ? existing.name : "";
    document.getElementById("source-form-type").value = existing ? existing.type : "gelbooru_dapi";
    document.getElementById("source-form-base").value = existing ? existing.baseUrl : "https://";
    document.getElementById("source-form-posts").value = existing ? (existing.postsUrl || "") : "";
    document.getElementById("source-form-tags").value = existing ? (existing.tagsUrl || "") : "";
    document.getElementById("source-form-proxy").value = existing ? (existing.proxyMode || "auto") : "auto";
    document.getElementById("source-form-custom-proxy").value = existing ? (existing.customProxyUrl || "") : "";
    document.getElementById("source-form-apikey").value = existing ? (existing.apiKey || "") : "";
    document.getElementById("source-form-userid").value = (existing && existing.userId === "7003718") ? "" : (existing ? (existing.userId || "") : "");

    document.getElementById("source-form-title").textContent = existing ? "Edit API Source" : "Add New API Source";
  }

  hideSourceForm() {
    this.sourceFormSection.style.display = "none";
    this.sourcesListContainer.style.display = "flex";
  }

  handleSourceTypeChange(type) {
    const base = document.getElementById("source-form-base").value.replace(/\/$/, "");
    const postsInput = document.getElementById("source-form-posts");
    const tagsInput = document.getElementById("source-form-tags");

    if (type === "gelbooru_dapi") {
      postsInput.placeholder = `${base}/index.php?page=dapi&s=post&q=index&json=1&limit={limit}&pid={page}&tags={tags}`;
      tagsInput.placeholder = `${base}/autocomplete.php?q={query}`;
    } else if (type === "danbooru_v2") {
      postsInput.placeholder = `${base}/posts.json?limit={limit}&page={page}&tags={tags}`;
      tagsInput.placeholder = `${base}/autocomplete.json?search[query]={query}&search[type]=tag_query&version=1&limit=12`;
    } else if (type === "moebooru") {
      postsInput.placeholder = `${base}/post.json?limit={limit}&page={page}&tags={tags}`;
      tagsInput.placeholder = `${base}/tag.json?name={query}&order=count&limit=12`;
    }
  }

  handleSaveSource(e) {
    e.preventDefault();
    const id = document.getElementById("source-form-id").value;
    const name = document.getElementById("source-form-name").value.trim();
    const type = document.getElementById("source-form-type").value;
    const baseUrl = document.getElementById("source-form-base").value.trim().replace(/\/$/, "");
    let postsUrl = document.getElementById("source-form-posts").value.trim();
    let tagsUrl = document.getElementById("source-form-tags").value.trim();
    const proxyMode = document.getElementById("source-form-proxy").value;
    const customProxyUrl = document.getElementById("source-form-custom-proxy").value.trim();
    const apiKey = document.getElementById("source-form-apikey").value.trim();
    const userId = document.getElementById("source-form-userid").value.trim();
    const existing = id ? this.sourceManager.getSource(id) : null;

    if (!name || !baseUrl) {
      alert("Source Name and Base URL are required.");
      return;
    }

    if (id === "rule34" || baseUrl.includes("rule34.xxx")) {
      if (apiKey && !userId) {
        alert("Rule34 requires BOTH your API Key and your numeric User ID.\n\n1. Go to https://rule34.xxx/index.php?page=account&s=options\n2. Copy your numeric User ID\n3. Enter your User ID here along with your API Key.");
        document.getElementById("source-form-userid").focus();
        return;
      }
      if (!apiKey && userId) {
        alert("Please also enter your Rule34 API Key from https://rule34.xxx/index.php?page=account&s=options");
        document.getElementById("source-form-apikey").focus();
        return;
      }
    }

    // Fill defaults if blank based on type
    if (!postsUrl) {
      if (type === "gelbooru_dapi") {
        postsUrl = `${baseUrl}/index.php?page=dapi&s=post&q=index&json=1&limit={limit}&pid={page}&tags={tags}`;
      } else if (type === "danbooru_v2") {
        postsUrl = `${baseUrl}/posts.json?limit={limit}&page={page}&tags={tags}`;
      } else if (type === "moebooru") {
        postsUrl = `${baseUrl}/post.json?limit={limit}&page={page}&tags={tags}`;
      }
    }

    if (!tagsUrl) {
      if (type === "gelbooru_dapi") {
        tagsUrl = `${baseUrl}/autocomplete.php?q={query}`;
      } else if (type === "danbooru_v2") {
        tagsUrl = `${baseUrl}/autocomplete.json?search[query]={query}&search[type]=tag_query&version=1&limit=12`;
      } else if (type === "moebooru") {
        tagsUrl = `${baseUrl}/tag.json?name={query}&order=count&limit=12`;
      }
    }

    // If credentials were entered but the URL has no placeholders, add them
    if (apiKey && userId && !postsUrl.includes("{api_key}")) {
      postsUrl += (postsUrl.includes("?") ? "&" : "?") + "api_key={api_key}&user_id={user_id}";
    }

    const sourceData = {
      id: id || "custom_" + Date.now().toString(36),
      name,
      type,
      baseUrl,
      postsUrl,
      tagsUrl,
      proxyMode,
      customProxyUrl,
      apiKey,
      userId,
      isPreset: existing ? !!existing.isPreset : false,
      description: existing?.description || "Custom user-configured source"
    };

    this.sourceManager.saveSource(sourceData);
    this.sourceManager.setActiveSource(sourceData.id);
    this.updateActiveSourceBadge();
    this.populateQuickSourcesMenu();
    this.hideSourceForm();
    this.renderSourcesList();
    this.showToast(`Saved and activated source: ${name}`);
  }

  handleExportSources() {
    const json = this.sourceManager.exportSources();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omnitag_sources.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast("Exported sources to JSON file!");
  }

  handleImportSources(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        this.sourceManager.importSources(event.target.result);
        this.updateActiveSourceBadge();
        this.populateQuickSourcesMenu();
        this.renderSourcesList();
        this.showToast("Sources successfully imported!");
      } catch (err) {
        alert("Failed to import sources: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  handleResetSources() {
    if (confirm("Reset all sources back to default presets? Custom sources will be replaced.")) {
      this.sourceManager.resetToDefaults();
      this.updateActiveSourceBadge();
      this.populateQuickSourcesMenu();
      this.renderSourcesList();
      this.showToast("Reset sources to factory defaults");
    }
  }

  // ==========================================
  // SEARCH HISTORY
  // ==========================================

  loadHistory() {
    try {
      const h = localStorage.getItem("omnitag_history");
      return h ? JSON.parse(h) : [];
    } catch {
      return [];
    }
  }

  saveHistory(query) {
    if (!query) return;
    this.searchHistory = this.searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 10);
    localStorage.setItem("omnitag_history", JSON.stringify(this.searchHistory));
  }

  renderHistory() {
    const heroTags = document.getElementById("hero-history-tags");
    if (!heroTags) return;

    heroTags.innerHTML = "";
    const list = this.searchHistory.length > 0 ? this.searchHistory : ["1girl", "landscape", "cat", "genshin_impact"];

    list.slice(0, 6).forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "history-pill";
      btn.textContent = tag;
      btn.addEventListener("click", () => {
        this.executeSearch(tag);
      });
      heroTags.appendChild(btn);
    });
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  showToast(message) {
    let toast = document.getElementById("omnitag-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "omnitag-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "show";
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.className = "";
    }, 2800);
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new OmniTagApp();
});
