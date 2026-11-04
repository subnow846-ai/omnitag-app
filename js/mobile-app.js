/**
 * OmniTag Mobile - Mobile Edition Controller
 * Powers the dedicated smartphone UI (TikTok-style feed, grid search, saved library)
 * Optimized for modern Android (Samsung Galaxy A56+, S24/S25, Pixel 8/9, 120Hz smooth scrolling)
 */

class OmniTagMobileApp {
  constructor() {
    this.sourceManager = window.apiSourceManager;
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 0;
    this.currentQuery = "";
    this.activeTab = "feed"; // Start on TikTok Feed
    this.activeFilter = "all";
    this.activeRating = "all";
    this.activeMedia = "all";
    this.activeAspect = "all";
    this.activeSort = "default";
    this.viewerIndex = -1;
    this.favorites = this.loadFavorites();

    // TikTok Feed State
    this.feedPosts = [];
    this.feedPage = 0;
    this.feedQuery = "";
    this.feedLoading = false;
    this.feedHasMore = true;

    this.initElements();
    this.initTheme();
    this.initAccounts();
    this.initAutocomplete();
    this.updateSourceBadge();
    this.initInstallPrompt();
    this.bindEvents();

    // Android back navigation support for viewer modal and bottom sheet
    window.addEventListener("popstate", () => {
      if (this.viewerModal && this.viewerModal.style.display !== "none") {
        if (this.viewerInfoSheet && !this.viewerInfoSheet.classList.contains("collapsed")) {
          this.closeViewerSheet();
        } else {
          this.closeViewer(false);
        }
      }
    });

    // Auto-load initial TikTok feed
    this.loadFeedPosts(true);
  }

  initElements() {
    // Navigation / Containers
    this.feedView = document.getElementById("mobile-feed-view");
    this.gridView = document.getElementById("mobile-grid-view");
    this.feedContainer = document.getElementById("mobile-feed-container");
    this.mobileHeader = document.getElementById("mobile-header");
    this.mobileSearchSection = document.getElementById("mobile-search-section");
    this.mobileScrollBody = document.getElementById("mobile-scroll-body");

    // Feed Top Bar & Drawer
    this.feedTagPill = document.getElementById("feed-tag-pill");
    this.feedTagLabel = document.getElementById("feed-tag-label");
    this.feedClearTagBtn = document.getElementById("feed-clear-tag-btn");
    this.feedSourceChip = document.getElementById("feed-source-chip");
    this.feedActiveSourceName = document.getElementById("feed-active-source-name");
    this.feedTagDrawer = document.getElementById("feed-tag-drawer");
    this.feedTagInput = document.getElementById("feed-tag-input");
    this.feedTagApplyBtn = document.getElementById("feed-tag-apply-btn");
    this.feedTagCloseBtn = document.getElementById("feed-tag-close-btn");
    this.feedLoadingSpinner = document.getElementById("feed-loading-spinner");
    this.feedDrawerApiPills = document.getElementById("feed-drawer-api-pills");
    this.feedDrawerManageApisBtn = document.getElementById("feed-drawer-manage-apis-btn");

    // Search & Grid Elements
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

    // Accounts & Profile Elements
    this.feedAccountBtn = document.getElementById("feed-account-btn");
    this.feedAccountAvatar = document.getElementById("feed-account-avatar");
    this.feedAccountLabel = document.getElementById("feed-account-label");
    this.headerAccountBtn = document.getElementById("header-account-btn");
    this.headerAccountAvatar = document.getElementById("header-account-avatar");
    this.headerAccountLabel = document.getElementById("header-account-label");
    this.accountModal = document.getElementById("mobile-account-modal");
    this.closeAccountModalBtn = document.getElementById("close-account-modal-btn");
    this.currentAccountAvatar = document.getElementById("current-account-avatar");
    this.currentAccountName = document.getElementById("current-account-name");
    this.currentAccountIdBadge = document.getElementById("current-account-id-badge");
    this.currentAccountHandle = document.getElementById("current-account-handle");
    this.currentAccountStats = document.getElementById("current-account-stats");
    this.editProfileBtn = document.getElementById("edit-profile-btn");
    this.createAccountBtn = document.getElementById("create-account-btn");
    this.accountsListContainer = document.getElementById("accounts-list-container");
    this.newAccountDrawer = document.getElementById("new-account-drawer");
    this.newAccountNameInput = document.getElementById("new-account-name-input");
    this.confirmCreateAccountBtn = document.getElementById("confirm-create-account-btn");
    this.cancelCreateAccountBtn = document.getElementById("cancel-create-account-btn");
    this.newAccountIdHint = document.getElementById("new-account-id-hint");

    // Source Manager & Edit Sheet
    this.editSourceSheet = document.getElementById("mobile-edit-source-sheet");
    this.closeEditSourceBtn = document.getElementById("close-edit-source-btn");
    this.sourceForm = document.getElementById("mobile-source-form");
    this.editSheetTitle = document.getElementById("m-edit-sheet-title");
    this.cancelEditBtn = document.getElementById("m-src-cancel-btn");
    this.deleteSourceBtn = document.getElementById("m-src-delete-btn");
    this.exportBtn = document.getElementById("m-export-btn");
    this.importFile = document.getElementById("m-import-file");
    this.resetSourcesBtn = document.getElementById("m-reset-btn");
    this.srcProxySelect = document.getElementById("m-src-proxy");
    this.srcCustomProxyGroup = document.getElementById("m-src-custom-proxy-group");

    // Viewer Modal Elements
    this.viewerModal = document.getElementById("mobile-viewer-modal");
    this.viewerStage = document.getElementById("viewer-media-stage");
    this.viewerCloseBtn = document.getElementById("viewer-close-btn");
    this.viewerFavBtn = document.getElementById("viewer-fav-btn");
    this.viewerDownloadBtn = document.getElementById("viewer-download-btn");
    this.viewerCopyBtn = document.getElementById("viewer-copy-btn");
    this.viewerSourceBtn = document.getElementById("viewer-source-btn");
    this.viewerMetaRow = document.getElementById("viewer-meta-row");
    this.viewerTagsWrap = document.getElementById("viewer-tags-chips");
    this.viewerTopBar = document.querySelector(".viewer-top-bar");
    this.viewerQuickDownloadBtn = document.getElementById("viewer-quick-download-btn");
    this.viewerToggleInfoBtn = document.getElementById("viewer-toggle-info-btn");
    this.viewerInfoPillBtn = document.getElementById("viewer-info-pill-btn");
    this.viewerInfoSheet = document.getElementById("viewer-info-sheet");
    this.viewerSheetBackdrop = document.getElementById("viewer-sheet-backdrop");
    this.viewerSheetDragHeader = document.getElementById("viewer-sheet-drag-header");
    this.viewerCollapseBtn = document.getElementById("viewer-collapse-btn");

    // Viewer Sidebar Buttons
    this.viewerSidebarHeartBtn = document.getElementById("viewer-sidebar-heart-btn");
    this.viewerSidebarHeartLabel = document.getElementById("viewer-sidebar-heart-label");
    this.viewerSidebarSaveBtn = document.getElementById("viewer-sidebar-save-btn");
    this.viewerSidebarSaveLabel = document.getElementById("viewer-sidebar-save-label");
    this.viewerSidebarDownloadBtn = document.getElementById("viewer-sidebar-download-btn");
    this.viewerSidebarTagsBtn = document.getElementById("viewer-sidebar-tags-btn");

    // Toast
    this.toastEl = document.getElementById("mobile-toast");

    // Install Banner & Modal
    this.installBanner = document.getElementById("install-banner");
    this.installBtn = document.getElementById("install-btn");
    this.dismissInstallBannerBtn = document.getElementById("dismiss-install-banner-btn");
    this.installModal = document.getElementById("install-modal");
    this.installInstructions = document.getElementById("install-instructions");
    this.closeInstallModalBtn = document.getElementById("close-install-modal-btn");
    this.dismissInstallModalBtn = document.getElementById("dismiss-install-modal-btn");

    // Desktop View Links
    this.mobileToDesktopBtn = document.getElementById("mobile-to-desktop-btn");
    this.feedToDesktopBtn = document.getElementById("feed-to-desktop-btn");
  }

  initInstallPrompt() {
    this.deferredInstallPrompt = null;

    // Desktop view switcher handlers
    const setDesktopFlag = () => {
      sessionStorage.setItem("omnitag_force_desktop", "1");
    };
    if (this.mobileToDesktopBtn) this.mobileToDesktopBtn.addEventListener("click", setDesktopFlag);
    if (this.feedToDesktopBtn) this.feedToDesktopBtn.addEventListener("click", setDesktopFlag);

    // Detect if running inside Android APK or installed standalone PWA
    const isApkOrStandalone = 
      location.protocol === "file:" ||
      navigator.userAgent.includes("OmniTagApp") ||
      !!window.AndroidBridge ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isApkOrStandalone) {
      if (this.installBanner) this.installBanner.remove();
      if (this.installModal) this.installModal.remove();
      document.body.classList.remove("with-install-banner");
      return;
    }

    const isBannerDismissed = sessionStorage.getItem("dismiss_install_banner") === "1";

    if (!isBannerDismissed && this.installBanner) {
      this.installBanner.style.display = "flex";
      document.body.classList.add("with-install-banner");
    }

    if (this.dismissInstallBannerBtn) {
      this.dismissInstallBannerBtn.addEventListener("click", () => {
        sessionStorage.setItem("dismiss_install_banner", "1");
        if (this.installBanner) this.installBanner.style.display = "none";
        document.body.classList.remove("with-install-banner");
      });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.installBanner && sessionStorage.getItem("dismiss_install_banner") !== "1") {
        this.installBanner.style.display = "flex";
        document.body.classList.add("with-install-banner");
      }
    });

    if (this.installBtn) {
      this.installBtn.addEventListener("click", async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const choice = await this.deferredInstallPrompt.userChoice;
          if (choice.outcome === "accepted") {
            if (this.installBanner) this.installBanner.style.display = "none";
            document.body.classList.remove("with-install-banner");
          }
          this.deferredInstallPrompt = null;
        } else {
          this.showInstallInstructions();
        }
      });
    }

    if (this.closeInstallModalBtn) {
      this.closeInstallModalBtn.addEventListener("click", () => {
        if (this.installModal) this.installModal.classList.remove("open");
      });
    }
    if (this.dismissInstallModalBtn) {
      this.dismissInstallModalBtn.addEventListener("click", () => {
        if (this.installModal) this.installModal.classList.remove("open");
      });
    }
    if (this.installModal) {
      const overlay = this.installModal.querySelector(".sheet-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => {
          this.installModal.classList.remove("open");
        });
      }
    }
  }

  showInstallInstructions() {
    if (!this.installModal) return;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let html = "";
    if (isIOS) {
      html = `
        <p><strong>To install on iOS:</strong></p>
        <ol style="margin-left: 20px; margin-top: 8px;">
          <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> in the top-right corner.</li>
        </ol>
      `;
    } else if (isAndroid) {
      html = `
        <p><strong>To install on Android:</strong></p>
        <ol style="margin-left: 20px; margin-top: 8px;">
          <li>Tap the <strong>three dots</strong> menu in Chrome.</li>
          <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li>Confirm by tapping <strong>Install</strong>.</li>
        </ol>
      `;
    } else {
      html = `
        <p>Use your browser menu (Chrome / Edge / Safari) and click <strong>Install App</strong> to add OmniTag to your home screen or desktop.</p>
      `;
    }
    if (this.installInstructions) this.installInstructions.innerHTML = html;
    this.installModal.classList.add("open");
  }

  initTheme() {
    const saved = localStorage.getItem("omnitag_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    if (this.themeBtn) {
      this.themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("omnitag_theme", next);
        this.showToast(`Switched to ${next} theme`);
      });
    }
  }

  initAutocomplete() {
    try {
      if (!this.searchInput || !this.autocompleteEl) return;
      const AutoClass = window.MobileAutocomplete || window.TagAutocomplete;
      if (typeof AutoClass === "function") {
        this.autocomplete = new AutoClass(
          this.searchInput,
          this.autocompleteEl,
          (item) => {
            if (this.activeTab === "saved") {
              this.renderSavedPosts(this.searchInput.value);
            } else {
              this.executeSearch(this.searchInput.value, 0);
            }
          }
        );
      }
    } catch (autoErr) {
      console.warn("Autocomplete init error:", autoErr);
    }
  }

  updateSourceBadge() {
    const active = this.sourceManager.getActiveSource();
    if (active) {
      if (this.activeSourceName) this.activeSourceName.textContent = active.name;
      if (this.feedActiveSourceName) this.feedActiveSourceName.textContent = active.name;
    }
    this.renderFeedDrawerApiPills();
  }

  bindEvents() {
    // Search routing based on active tab (Search vs Saved)
    this.searchBtn.addEventListener("click", () => {
      if (this.activeTab === "saved") {
        this.renderSavedPosts(this.searchInput.value);
      } else {
        this.executeSearch(this.searchInput.value, 0);
      }
    });

    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.activeTab === "saved") {
          this.renderSavedPosts(this.searchInput.value);
        } else {
          this.executeSearch(this.searchInput.value, 0);
        }
      }
    });

    this.searchInput.addEventListener("input", () => {
      this.clearBtn.style.display = this.searchInput.value ? "block" : "none";
    });

    this.clearBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.clearBtn.style.display = "none";
      if (this.activeTab === "saved") {
        this.renderSavedPosts("");
      } else {
        this.executeSearch("", 0);
      }
    });

    this.refreshBtn.addEventListener("click", () => {
      if (this.activeTab === "saved") {
        this.renderSavedPosts(this.searchInput.value);
      } else {
        this.executeSearch(this.currentQuery, this.currentPage);
      }
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

    // Bottom Navigation Tabs
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // TikTok Feed Controls
    if (this.feedTagPill) {
      this.feedTagPill.addEventListener("click", () => this.toggleFeedTagDrawer());
    }
    if (this.feedTagCloseBtn) {
      this.feedTagCloseBtn.addEventListener("click", () => this.toggleFeedTagDrawer(false));
    }
    if (this.feedTagApplyBtn) {
      this.feedTagApplyBtn.addEventListener("click", () => this.applyFeedTagInput());
    }
    if (this.feedTagInput) {
      this.feedTagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.applyFeedTagInput();
      });
    }
    if (this.feedClearTagBtn) {
      this.feedClearTagBtn.addEventListener("click", () => this.clearFeedTag());
    }
    if (this.feedSourceChip) {
      this.feedSourceChip.addEventListener("click", () => {
        this.previousTab = "feed";
        this.openSourcesSheet();
      });
    }
    if (this.feedDrawerManageApisBtn) {
      this.feedDrawerManageApisBtn.addEventListener("click", () => {
        this.toggleFeedTagDrawer(false);
        this.previousTab = "feed";
        this.openSourcesSheet();
      });
    }
    document.querySelectorAll(".quick-tag-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        this.setFeedTag(chip.dataset.tag);
      });
    });

    // Sources Bottom Sheet
    this.sourceChip.addEventListener("click", () => this.openSourcesSheet());
    this.closeSourcesBtn.addEventListener("click", () => this.closeSourcesSheet());
    this.sourcesSheet.querySelector(".sheet-overlay").addEventListener("click", () => this.closeSourcesSheet());
    this.addSourceBtn.addEventListener("click", () => this.openEditSourceSheet());

    // Source Edit Sheet Events
    if (this.closeEditSourceBtn) {
      this.closeEditSourceBtn.addEventListener("click", () => this.closeEditSourceSheet());
    }
    if (this.editSourceSheet) {
      this.editSourceSheet.querySelector(".sheet-overlay").addEventListener("click", () => this.closeEditSourceSheet());
    }
    if (this.cancelEditBtn) {
      this.cancelEditBtn.addEventListener("click", () => this.closeEditSourceSheet());
    }
    if (this.srcProxySelect) {
      this.srcProxySelect.addEventListener("change", (e) => {
        if (this.srcCustomProxyGroup) {
          this.srcCustomProxyGroup.style.display = e.target.value === "custom" ? "block" : "none";
        }
      });
    }
    if (this.sourceForm) {
      this.sourceForm.addEventListener("submit", (e) => this.handleSaveSource(e));
    }
    if (this.deleteSourceBtn) {
      this.deleteSourceBtn.addEventListener("click", () => this.handleDeleteSource());
    }
    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => this.exportSources());
    }
    if (this.importFile) {
      this.importFile.addEventListener("change", (e) => this.importSources(e));
    }
    if (this.resetSourcesBtn) {
      this.resetSourcesBtn.addEventListener("click", () => this.resetSources());
    }

    // Fullscreen Viewer Controls
    this.viewerCloseBtn.addEventListener("click", () => this.closeViewer());
    this.viewerFavBtn.addEventListener("click", () => this.toggleViewerFavorite());
    if (this.viewerQuickDownloadBtn) {
      this.viewerQuickDownloadBtn.addEventListener("click", () => this.downloadViewerMedia());
    }
    if (this.viewerToggleInfoBtn) {
      this.viewerToggleInfoBtn.addEventListener("click", () => this.toggleViewerSheet());
    }
    this.viewerCopyBtn.addEventListener("click", () => this.copyViewerMediaUrl());
    this.viewerDownloadBtn.addEventListener("click", () => this.downloadViewerMedia());

    if (this.viewerInfoPillBtn) {
      this.viewerInfoPillBtn.addEventListener("click", () => this.openViewerSheet());
    }
    if (this.viewerCollapseBtn) {
      this.viewerCollapseBtn.addEventListener("click", () => this.closeViewerSheet());
    }

    // Viewer Sidebar Controls
    if (this.viewerSidebarHeartBtn) {
      this.viewerSidebarHeartBtn.addEventListener("click", () => this.toggleViewerFavorite());
    }
    if (this.viewerSidebarSaveBtn) {
      this.viewerSidebarSaveBtn.addEventListener("click", () => this.toggleViewerFavorite());
    }
    if (this.viewerSidebarDownloadBtn) {
      this.viewerSidebarDownloadBtn.addEventListener("click", () => this.downloadViewerMedia());
    }
    if (this.viewerSidebarTagsBtn) {
      this.viewerSidebarTagsBtn.addEventListener("click", () => this.toggleViewerSheet());
    }

    this.initViewerGestures();

    // Accounts & Profile Events
    if (this.feedAccountBtn) {
      this.feedAccountBtn.addEventListener("click", () => this.openAccountModal());
    }
    if (this.headerAccountBtn) {
      this.headerAccountBtn.addEventListener("click", () => this.openAccountModal());
    }
    if (this.closeAccountModalBtn) {
      this.closeAccountModalBtn.addEventListener("click", () => this.closeAccountModal());
    }
    if (this.accountModal) {
      const overlay = this.accountModal.querySelector(".sheet-overlay");
      if (overlay) overlay.addEventListener("click", () => this.closeAccountModal());
    }
    if (this.editProfileBtn) {
      this.editProfileBtn.addEventListener("click", () => this.editProfile());
    }
    if (this.createAccountBtn) {
      this.createAccountBtn.addEventListener("click", () => this.toggleNewAccountDrawer());
    }
    if (this.confirmCreateAccountBtn) {
      this.confirmCreateAccountBtn.addEventListener("click", () => this.handleConfirmCreateAccount());
    }
    if (this.cancelCreateAccountBtn) {
      this.cancelCreateAccountBtn.addEventListener("click", () => this.toggleNewAccountDrawer(false));
    }
    document.querySelectorAll(".avatar-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        this.selectedNewAvatar = opt.dataset.avatar;
      });
    });
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================

  switchTab(tab) {
    if (tab === "sources" || tab === "apis") {
      this.previousTab = (this.activeTab !== "sources" && this.activeTab !== "apis") ? this.activeTab : (this.previousTab || "feed");
      document.querySelectorAll(".nav-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === "sources" || t.dataset.tab === "apis");
      });
      this.openSourcesSheet();
      return;
    }

    this.activeTab = tab;
    this.previousTab = tab;
    document.querySelectorAll(".nav-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });

    if (tab === "feed") {
      if (this.feedView) this.feedView.style.display = "block";
      if (this.gridView) this.gridView.style.display = "none";
      if (this.feedPosts.length === 0) {
        this.loadFeedPosts(true);
      }
    } else if (tab === "search") {
      if (this.feedView) this.feedView.style.display = "none";
      if (this.gridView) this.gridView.style.display = "flex";
      this.searchInput.placeholder = "Search tags (e.g. 1girl, -tag)...";
      if (this.posts.length === 0) {
        this.executeSearch(this.currentQuery, 0);
      } else {
        this.renderGrid();
      }
    } else if (tab === "saved") {
      if (this.feedView) this.feedView.style.display = "none";
      if (this.gridView) this.gridView.style.display = "flex";
      this.searchInput.value = "";
      this.clearBtn.style.display = "none";
      this.searchInput.placeholder = "Search within your saved posts...";
      this.renderSavedPosts("");
    }
  }

  // ==========================================
  // TIKTOK-STYLE VERTICAL FEED ENGINE
  // ==========================================

  async loadFeedPosts(reset = false) {
    if (reset) {
      this.feedPage = 0;
      this.feedPosts = [];
      if (this.feedContainer) {
        this.feedContainer.innerHTML = `
          <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--m-text-sub); text-align: center;">
            <div class="feed-spinner" style="width: 38px; height: 38px; border-width: 3px; margin-bottom: 14px;"></div>
            <p style="font-size: 14px; font-weight: 600; color: var(--m-text);">Loading feed...</p>
          </div>
        `;
      }
      this.feedHasMore = true;
    }

    if (this.feedLoading || !this.feedHasMore) return;
    this.feedLoading = true;
    if (this.feedLoadingSpinner) this.feedLoadingSpinner.style.display = "block";

    try {
      const posts = await this.sourceManager.fetchPosts(this.feedQuery, this.feedPage, 12);
      if (!posts || posts.length === 0) {
        this.feedHasMore = false;
        if (this.feedPosts.length === 0 && this.feedContainer) {
          this.feedContainer.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--m-text-sub); text-align: center; padding: 24px;">
              <p style="font-size: 16px; font-weight: 700; color: var(--m-text); margin-bottom: 8px;">No posts found</p>
              <p style="font-size: 13px;">Try different tags or clear the filter to view all posts.</p>
              <button id="feed-empty-clear-btn" class="feed-drawer-btn primary" style="margin-top: 14px; padding: 8px 18px;">Show All Posts</button>
            </div>
          `;
          const emptyBtn = document.getElementById("feed-empty-clear-btn");
          if (emptyBtn) emptyBtn.addEventListener("click", () => this.clearFeedTag());
        }
      } else {
        if (reset && this.feedContainer) {
          this.feedContainer.innerHTML = "";
        }
        const startIndex = this.feedPosts.length;
        this.feedPosts.push(...posts);
        posts.forEach((post, i) => {
          this.renderFeedSlide(post, startIndex + i);
        });

        this.initFeedObserver();
      }
    } catch (err) {
      console.error("Feed load error:", err);
      // Auto-fallback to Danbooru if primary source failed on first load
      if (this.feedPosts.length === 0 && reset && this.sourceManager && this.sourceManager.activeId !== "danbooru") {
        console.warn("Primary source failed on initial feed load, attempting Danbooru auto-fallback...");
        this.sourceManager.setActiveSource("danbooru");
        this.updateSourceBadge();
        this.feedLoading = false;
        return this.loadFeedPosts(true);
      }
      this.showToast("Feed error: " + err.message);
      if (this.feedPosts.length === 0 && this.feedContainer) {
        // Fallback to high-quality trending feed on web so user never sees a black screen
        this.loadSampleFeed(err.message);
      }
    } finally {
      this.feedLoading = false;
      if (this.feedLoadingSpinner) this.feedLoadingSpinner.style.display = "none";
    }
  }

  loadSampleFeed(errMsg = "") {
    if (!this.feedContainer) return;
    const samplePosts = [
      {
        id: "7292879",
        sampleUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1080&auto=format&fit=crop&q=80",
        fileUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1080&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=360&auto=format&fit=crop&q=80",
        width: 1080,
        height: 1440,
        score: 185,
        source: "Trending Web Feed",
        tags: ["anime", "cyberpunk", "neon_city", "1girl", "illustration", "trending"]
      },
      {
        id: "7292880",
        sampleUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1080&auto=format&fit=crop&q=80",
        fileUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1080&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=360&auto=format&fit=crop&q=80",
        width: 1080,
        height: 1520,
        score: 142,
        source: "Trending Web Feed",
        tags: ["scenery", "cherry_blossom", "japan", "aesthetic", "landscape", "wallpaper"]
      },
      {
        id: "7292881",
        sampleUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1080&auto=format&fit=crop&q=80",
        fileUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1080&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=360&auto=format&fit=crop&q=80",
        width: 1080,
        height: 1350,
        score: 120,
        source: "Trending Web Feed",
        tags: ["digital_art", "synthwave", "vibrant", "abstract", "wallpaper", "purple_glow"]
      },
      {
        id: "7292882",
        sampleUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
        fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=360&auto=format&fit=crop&q=80",
        width: 1080,
        height: 1600,
        score: 198,
        source: "Trending Web Feed",
        tags: ["fluid", "acrylic", "neon_glow", "dreamscape", "fantasy", "art"]
      }
    ];

    this.feedContainer.innerHTML = "";
    this.feedPosts = samplePosts;
    samplePosts.forEach((post, i) => {
      this.renderFeedSlide(post, i);
    });
    this.initFeedObserver();

    this.showToast("Loaded trending web feed. Tap API chip to switch live source.");
  }

  renderFeedSlide(post, index) {
    if (!this.feedContainer) return;
    const isFav = this.isFavorite(post.id);
    const isVideo = !!post.isVideo;

    const slide = document.createElement("div");
    slide.className = "tiktok-slide";
    slide.dataset.index = index;
    slide.dataset.id = post.id;

    const mediaSrc = isVideo ? (post.videoUrl || post.fileUrl || post.sampleUrl) : (post.sampleUrl || post.fileUrl || post.previewUrl || "");
    const fallbackSrc = isVideo ? (post.sampleUrl || post.fileUrl) : (post.previewUrl || mediaSrc);
    const sourceDisplayName = post.source || post.sourceSite || (this.sourceManager?.getActiveSource()?.name) || "Safebooru";

    slide.innerHTML = `
      <div class="tiktok-media-stage">
        ${isVideo ? `
          <div class="tiktok-video-wrapper" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
            <video 
              src="${mediaSrc}" 
              class="tiktok-media-el tiktok-video-el" 
              playsinline 
              webkit-playsinline 
              loop 
              muted 
              autoplay
              preload="auto"
              poster="${post.previewUrl || ''}" 
              referrerpolicy="no-referrer">
            </video>
            <div class="tiktok-video-badge">▶ VIDEO</div>
          </div>
        ` : `
          <img 
            src="${mediaSrc}" 
            alt="Post #${post.id}" 
            class="tiktok-media-el" 
            loading="lazy" 
            referrerpolicy="no-referrer"
            onerror="
              if (!this.dataset.step) {
                this.dataset.step = '1';
                if ('${fallbackSrc}' && this.src !== '${fallbackSrc}') {
                  this.src = '${fallbackSrc}';
                  return;
                }
              }
              if (this.dataset.step === '1') {
                this.dataset.step = '2';
                this.src = 'https://corsproxy.org/?url=' + encodeURIComponent('${mediaSrc}');
                return;
              }
              if (this.dataset.step === '2' && '${fallbackSrc}') {
                this.dataset.step = '3';
                this.src = 'https://corsproxy.org/?url=' + encodeURIComponent('${fallbackSrc}');
                return;
              }
            "
          >
        `}
      </div>

      <div class="tiktok-heart-burst">
        <svg width="90" height="90" viewBox="0 0 24 24" fill="#f85149" stroke="#f85149" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </div>

      <div class="tiktok-actions-sidebar">
        <!-- Heart / Like -->
        <button class="tiktok-action-btn heart-btn ${isFav ? 'liked' : ''}" title="Like">
          <div class="action-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="${isFav ? '#f85149' : 'none'}" stroke="${isFav ? '#f85149' : 'currentColor'}" stroke-width="2.2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <span class="action-label">${post.score > 0 ? post.score : 'Like'}</span>
        </button>

        <!-- Save Button -->
        <button class="tiktok-action-btn save-btn ${isFav ? 'saved' : ''}" title="Save">
          <div class="action-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="${isFav ? '#388bfd' : 'none'}" stroke="${isFav ? '#388bfd' : 'currentColor'}" stroke-width="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span class="action-label">${isFav ? 'Saved' : 'Save'}</span>
        </button>

        <!-- Download Button (Underneath Save Button) -->
        <button class="tiktok-action-btn download-btn" title="Download">
          <div class="action-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <span class="action-label">Download</span>
        </button>

        <!-- Tags Button -->
        <button class="tiktok-action-btn info-btn" title="Tags & Info">
          <div class="action-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <span class="action-label">Tags</span>
        </button>
      </div>

      <div class="tiktok-info-overlay">
        <div class="tiktok-author-row">
          <span class="tiktok-post-id">#${post.id}</span>
          <span class="tiktok-source-pill">${sourceDisplayName}</span>
          <span class="tiktok-meta-dim">${post.width}&times;${post.height}</span>
        </div>
        <div class="tiktok-tag-chips">
          ${(post.tags || []).slice(0, 5).map(rawTag => {
            const cleanTag = this.decodeHtmlEntities(rawTag).replace(/_/g, " ");
            return `<button class="tiktok-tag-pill" data-rawtag="${rawTag}">#${cleanTag}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    // Action button listeners
    const heartBtn = slide.querySelector(".heart-btn");
    const saveBtn = slide.querySelector(".save-btn");
    const updateFavUI = (fav) => {
      heartBtn.classList.toggle("liked", fav);
      heartBtn.querySelector("svg").setAttribute("fill", fav ? "#f85149" : "none");
      heartBtn.querySelector("svg").setAttribute("stroke", fav ? "#f85149" : "currentColor");
      saveBtn.classList.toggle("saved", fav);
      saveBtn.querySelector("svg").setAttribute("fill", fav ? "#388bfd" : "none");
      saveBtn.querySelector("svg").setAttribute("stroke", fav ? "#388bfd" : "currentColor");
      saveBtn.querySelector(".action-label").textContent = fav ? "Saved" : "Save";
    };

    heartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFavorite(post);
      updateFavUI(this.isFavorite(post.id));
    });

    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFavorite(post);
      updateFavUI(this.isFavorite(post.id));
    });

    const downloadBtn = slide.querySelector(".download-btn");
    downloadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = post.fileUrl || post.sampleUrl;
      const filename = `omnitag_${post.id}.${post.ext || 'jpg'}`;
      this.downloadMedia(url, filename);
    });

    const infoBtn = slide.querySelector(".info-btn");
    infoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openViewerInfoSheetForPost(post);
    });

    slide.querySelectorAll(".tiktok-tag-pill").forEach(chip => {
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setFeedTag(chip.dataset.rawtag);
      });
    });

    // Double tap heart burst gesture
    let lastTap = 0;
    const burst = slide.querySelector(".tiktok-heart-burst");
    const stage = slide.querySelector(".tiktok-media-stage");

    stage.addEventListener("click", () => {
      const now = Date.now();
      if (now - lastTap < 320) {
        burst.classList.add("pop");
        setTimeout(() => burst.classList.remove("pop"), 600);
        if (!this.isFavorite(post.id)) {
          this.toggleFavorite(post);
          updateFavUI(true);
        }
      } else if (isVideo) {
        const video = slide.querySelector("video");
        if (video) {
          if (video.paused) video.play();
          else video.pause();
        }
      }
      lastTap = now;
    });

    this.feedContainer.appendChild(slide);
  }

  initFeedObserver() {
    if (!this.feedContainer) return;

    // Auto play / pause videos
    if (!this.feedSlideObserver) {
      this.feedSlideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target.querySelector("video");
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { root: this.feedContainer, threshold: 0.6 });
    }

    const slides = this.feedContainer.querySelectorAll(".tiktok-slide");
    slides.forEach(slide => this.feedSlideObserver.observe(slide));

    // Infinite scroll loading
    if (this.feedScrollObserver) this.feedScrollObserver.disconnect();
    this.feedScrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.feedLoading && this.feedHasMore) {
        this.feedPage++;
        this.loadFeedPosts(false);
      }
    }, { root: this.feedContainer, rootMargin: "600px 0px" });

    if (slides.length > 0) {
      this.feedScrollObserver.observe(slides[slides.length - 1]);
    }
  }

  setFeedTag(tag) {
    this.feedQuery = (tag || "").trim();
    if (this.feedTagLabel) {
      this.feedTagLabel.textContent = this.feedQuery ? `#${this.feedQuery}` : "All / Trending";
    }
    if (this.feedClearTagBtn) {
      this.feedClearTagBtn.style.display = this.feedQuery ? "block" : "none";
    }
    this.toggleFeedTagDrawer(false);
    this.loadFeedPosts(true);
    this.showToast(this.feedQuery ? `Feed: #${this.feedQuery}` : "Showing all trending posts");
  }

  clearFeedTag() {
    this.setFeedTag("");
  }

  toggleFeedTagDrawer(force = null) {
    if (!this.feedTagDrawer) return;
    const shouldShow = force !== null ? force : this.feedTagDrawer.classList.contains("hidden");
    this.feedTagDrawer.classList.toggle("hidden", !shouldShow);
    if (shouldShow) {
      this.renderFeedDrawerApiPills();
      if (this.feedTagInput) {
        this.feedTagInput.value = this.feedQuery;
        this.feedTagInput.focus();
      }
    }
  }

  renderFeedDrawerApiPills() {
    if (!this.feedDrawerApiPills) return;
    const sources = (this.sourceManager?.getAllSources ? this.sourceManager.getAllSources() : this.sourceManager?.getSources()) || [];
    const active = this.sourceManager?.getActiveSource();
    this.feedDrawerApiPills.innerHTML = "";

    sources.forEach(src => {
      const btn = document.createElement("button");
      btn.type = "button";
      const isActive = active && active.id === src.id;
      btn.className = `feed-drawer-api-chip ${isActive ? "active" : ""}`;
      btn.innerHTML = `
        <span class="feed-chip-dot ${isActive ? "active" : ""}"></span>
        <span>${this.escapeHtml(src.name)}</span>
      `;
      btn.addEventListener("click", () => {
        if (active && active.id === src.id) {
          this.toggleFeedTagDrawer(false);
          return;
        }
        this.sourceManager.setActiveSource(src.id);
        this.updateSourceBadge();
        this.toggleFeedTagDrawer(false);
        this.showToast(`Feed API: ${src.name}`);
        this.loadFeedPosts(true);
      });
      this.feedDrawerApiPills.appendChild(btn);
    });
  }

  applyFeedTagInput() {
    if (!this.feedTagInput) return;
    const tag = this.feedTagInput.value.trim();
    this.setFeedTag(tag);
  }

  // ==========================================
  // SEARCH & GALLERY GRID (GRID TAB)
  // ==========================================

  async executeSearch(query = "", page = 0) {
    this.currentQuery = query;
    this.currentPage = page;
    this.resultsInfoEl.textContent = "Loading posts...";
    this.grid.innerHTML = '<div class="feed-spinner" style="margin: 40px auto;"></div>';

    try {
      const posts = await this.sourceManager.fetchPosts(this.currentQuery, this.currentPage, 24);
      this.posts = posts;
      this.applyFiltersAndRender();
      this.renderPagination();
    } catch (err) {
      if (!window.AndroidBridge && this.sourceManager && this.sourceManager.activeId !== "danbooru") {
        console.warn("Search failed on primary booru in browser, trying Danbooru fallback...");
        this.sourceManager.setActiveSource("danbooru");
        this.updateSourceBadge();
        return this.executeSearch(query, page);
      }
      this.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px; color: var(--m-danger);">
          <p style="font-weight: 700; margin-bottom: 6px;">Error fetching posts</p>
          <p style="font-size: 13px; color: var(--m-text-sub);">${err.message}</p>
        </div>
      `;
      this.resultsInfoEl.textContent = "Search failed";
    }
  }

  applyFiltersAndRender() {
    let list;
    if (this.activeTab === "saved") {
      const q = (this.searchInput?.value || "").trim().toLowerCase();
      list = [...this.favorites];
      if (q) {
        list = list.filter(p => {
          const idMatch = String(p.id).includes(q);
          const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
          const srcMatch = (p.source || p.sourceSite || "").toLowerCase().includes(q);
          return idMatch || tagMatch || srcMatch;
        });
      }
    } else {
      list = [...this.posts];
    }

    if (this.activeRating !== "all") {
      list = list.filter(p => (p.rating || "").toLowerCase() === this.activeRating.toLowerCase());
    }

    if (this.activeMedia === "video") {
      list = list.filter(p => p.isVideo);
    } else if (this.activeMedia === "image") {
      list = list.filter(p => !p.isVideo);
    }

    if (this.activeAspect === "tall") {
      list = list.filter(p => p.height > p.width);
    } else if (this.activeAspect === "wide") {
      list = list.filter(p => p.width > p.height);
    }

    if (this.activeSort === "score") {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    this.filteredPosts = list;
    if (this.activeTab === "saved") {
      this.resultsInfoEl.textContent = `Showing ${list.length} saved bookmarks`;
    } else {
      this.resultsInfoEl.textContent = `Showing ${list.length} posts (Page ${this.currentPage + 1})`;
    }
    this.renderGrid();
  }

  renderGrid() {
    this.grid.innerHTML = "";
    if (this.filteredPosts.length === 0) {
      this.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--m-text-sub);">
          <p style="font-size: 16px; font-weight: 600; color: var(--m-text); margin-bottom: 6px;">No posts match filters</p>
          <p style="font-size: 13px;">Try switching filters or searching another tag.</p>
        </div>
      `;
      return;
    }

    this.filteredPosts.forEach((post, idx) => {
      const card = document.createElement("div");
      card.className = "mobile-card";
      card.dataset.index = idx;

      const isFav = this.isFavorite(post.id);
      const thumbUrl = post.previewUrl || post.sampleUrl || post.fileUrl;

      card.innerHTML = `
        <div class="card-thumb-wrap">
          <img 
            src="${thumbUrl}" 
            alt="Post #${post.id}" 
            class="card-thumb" 
            loading="lazy" 
            referrerpolicy="no-referrer"
            onerror="if (!this.dataset.p) { this.dataset.p = '1'; this.src = 'https://corsproxy.org/?url=' + encodeURIComponent('${thumbUrl}'); }"
          >
          ${post.isVideo ? '<span class="card-badge video">VIDEO</span>' : ""}
          <button class="card-fav-btn ${isFav ? "active" : ""}" data-id="${post.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? "#f85149" : "none"}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="card-meta">
          <div class="card-meta-row">
            <span class="card-id">#${post.id}</span>
            <span class="card-score">&#9733; ${post.score || 0}</span>
          </div>
          <div class="card-dim">${post.width}&times;${post.height}</div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-fav-btn")) {
          e.stopPropagation();
          this.toggleFavorite(post);
          const btn = card.querySelector(".card-fav-btn");
          const fav = this.isFavorite(post.id);
          btn.classList.toggle("active", fav);
          btn.querySelector("svg").setAttribute("fill", fav ? "#f85149" : "none");
          return;
        }
        this.openViewer(idx);
      });

      this.grid.appendChild(card);
    });
  }

  renderPagination() {
    this.paginationEl.innerHTML = "";
    if (this.currentPage > 0) {
      const prev = document.createElement("button");
      prev.className = "sheet-action-btn";
      prev.innerHTML = "&larr; Previous";
      prev.addEventListener("click", () => this.executeSearch(this.currentQuery, this.currentPage - 1));
      this.paginationEl.appendChild(prev);
    }

    const next = document.createElement("button");
    next.className = "sheet-action-btn primary";
    next.innerHTML = "Next Page &rarr;";
    next.addEventListener("click", () => this.executeSearch(this.currentQuery, this.currentPage + 1));
    this.paginationEl.appendChild(next);
  }

  // ==========================================
  // FULLSCREEN VIEWER MODAL
  // ==========================================

  openViewer(index) {
    if (index < 0 || index >= this.filteredPosts.length) return;
    this.viewerIndex = index;
    const post = this.filteredPosts[index];

    // Push history state so Android hardware back gesture closes viewer
    try {
      if (!history.state || !history.state.omnitagViewer) {
        history.pushState({ omnitagViewer: true }, "");
      }
    } catch (_) {}

    this.viewerModal.style.display = "flex";
    this.viewerStage.innerHTML = '<div style="color: #fff;">Loading...</div>';

    // Start with sheet closed so image is 100% visible immediately
    this.closeViewerSheet();
    if (this.viewerTopBar) this.viewerTopBar.classList.remove("hidden");

    if (post.isVideo) {
      const vid = document.createElement("video");
      vid.src = post.fileUrl || post.sampleUrl;
      vid.controls = true;
      vid.autoplay = true;
      vid.loop = true;
      vid.setAttribute("referrerpolicy", "no-referrer");
      vid.style.maxWidth = "100%";
      vid.style.maxHeight = "100%";
      this.viewerStage.innerHTML = "";
      this.viewerStage.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.setAttribute("referrerpolicy", "no-referrer");
      const initialSrc = post.sampleUrl || post.fileUrl || post.previewUrl;
      img.src = initialSrc;
      img.onload = () => {
        this.viewerStage.innerHTML = "";
        this.viewerStage.appendChild(img);
      };
      img.onerror = () => {
        if (!img.dataset.step) {
          img.dataset.step = "1";
          const fallback = post.fileUrl || post.previewUrl;
          if (fallback && fallback !== initialSrc) {
            img.src = fallback;
            return;
          }
        }
        if (img.dataset.step === "1") {
          img.dataset.step = "2";
          img.src = `https://corsproxy.org/?url=${encodeURIComponent(initialSrc)}`;
          return;
        }
        if (img.dataset.step === "2" && post.previewUrl) {
          img.dataset.step = "3";
          img.src = `https://corsproxy.org/?url=${encodeURIComponent(post.previewUrl)}`;
          return;
        }
        this.viewerStage.innerHTML = `<div style="color: var(--m-text-sub); padding: 40px; text-align: center;">Preview unavailable</div>`;
      };
    }

    this.viewerMetaRow.innerHTML = `
      <span>#${post.id}</span>
      <span>${post.width}&times;${post.height}</span>
      <span>&#9733; ${post.score}</span>
      <span>${(post.ext || "JPG").toUpperCase()}</span>
    `;

    this.viewerSourceBtn.href = post.postPageUrl || post.fileUrl;

    // Render tags with entity decoding
    this.viewerTagsWrap.innerHTML = "";
    (post.tags || []).slice(0, 40).forEach(rawTag => {
      const decodedTag = this.decodeHtmlEntities(rawTag).replace(/_/g, " ");
      const chip = document.createElement("button");
      chip.className = "mobile-tag-chip";
      chip.textContent = decodedTag;
      chip.addEventListener("click", () => {
        this.closeViewer();
        if (this.activeTab === "feed") {
          this.setFeedTag(rawTag);
        } else {
          this.executeSearch(rawTag, 0);
        }
      });
      this.viewerTagsWrap.appendChild(chip);
    });

    const isFav = this.isFavorite(post.id);
    if (this.viewerFavBtn) {
      this.viewerFavBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
    }

    // Update sidebar buttons for viewer modal
    if (this.viewerSidebarHeartBtn) {
      this.viewerSidebarHeartBtn.classList.toggle("liked", isFav);
      this.viewerSidebarHeartBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
      this.viewerSidebarHeartBtn.querySelector("svg").setAttribute("stroke", isFav ? "#f85149" : "currentColor");
    }
    if (this.viewerSidebarHeartLabel) {
      this.viewerSidebarHeartLabel.textContent = post.score > 0 ? post.score : "Like";
    }
    if (this.viewerSidebarSaveBtn) {
      this.viewerSidebarSaveBtn.classList.toggle("saved", isFav);
      this.viewerSidebarSaveBtn.querySelector("svg").setAttribute("fill", isFav ? "#388bfd" : "none");
      this.viewerSidebarSaveBtn.querySelector("svg").setAttribute("stroke", isFav ? "#388bfd" : "currentColor");
    }
    if (this.viewerSidebarSaveLabel) {
      this.viewerSidebarSaveLabel.textContent = isFav ? "Saved" : "Save";
    }
  }

  closeViewer(handleHistory = true) {
    this.viewerModal.style.display = "none";
    this.viewerStage.innerHTML = "";
    this.viewerIndex = -1;
    this.closeViewerSheet();
    if (this.viewerTopBar) this.viewerTopBar.classList.remove("hidden");
    if (handleHistory) {
      try {
        if (history.state && history.state.omnitagViewer) {
          history.back();
        }
      } catch (_) {}
    }
  }

  openViewerSheet() {
    if (!this.viewerInfoSheet) return;
    this.viewerInfoSheet.classList.remove("collapsed");
    this.viewerInfoSheet.style.transform = "";
    if (this.viewerInfoPillBtn) this.viewerInfoPillBtn.classList.add("hidden");
    if (this.viewerSheetBackdrop) this.viewerSheetBackdrop.classList.add("active");
  }

  closeViewerSheet() {
    if (!this.viewerInfoSheet) return;
    this.viewerInfoSheet.classList.add("collapsed");
    this.viewerInfoSheet.style.transform = "";
    if (this.viewerInfoPillBtn) this.viewerInfoPillBtn.classList.remove("hidden");
    if (this.viewerSheetBackdrop) this.viewerSheetBackdrop.classList.remove("active");
  }

  toggleViewerSheet() {
    if (this.viewerInfoSheet?.classList.contains("collapsed")) {
      this.openViewerSheet();
    } else {
      this.closeViewerSheet();
    }
  }

  openViewerInfoSheetForPost(post) {
    if (!this.viewerInfoSheet) return;
    this.viewerMetaRow.innerHTML = `
      <span>#${post.id}</span>
      <span>${post.width}&times;${post.height}</span>
      <span>&#9733; ${post.score}</span>
      <span>${(post.ext || "JPG").toUpperCase()}</span>
    `;

    this.viewerSourceBtn.href = post.postPageUrl || post.fileUrl;

    this.viewerTagsWrap.innerHTML = "";
    (post.tags || []).slice(0, 40).forEach(rawTag => {
      const decodedTag = this.decodeHtmlEntities(rawTag).replace(/_/g, " ");
      const chip = document.createElement("button");
      chip.className = "mobile-tag-chip";
      chip.textContent = decodedTag;
      chip.addEventListener("click", () => {
        this.closeViewerSheet();
        if (this.activeTab === "feed") {
          this.setFeedTag(rawTag);
        } else {
          this.executeSearch(rawTag, 0);
        }
      });
      this.viewerTagsWrap.appendChild(chip);
    });

    this.openViewerSheet();
  }

  initViewerGestures() {
    if (!this.viewerInfoSheet) return;

    // 0. Dedicated Backdrop Tap to Close Sheet
    if (this.viewerSheetBackdrop) {
      this.viewerSheetBackdrop.addEventListener("click", () => this.closeViewerSheet());
      this.viewerSheetBackdrop.addEventListener("touchstart", (e) => {
        if (e.cancelable) e.preventDefault();
        this.closeViewerSheet();
      }, { passive: false });
    }

    // 0b. Explicit Collapse / Close button in sheet header
    if (this.viewerCollapseBtn) {
      this.viewerCollapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeViewerSheet();
      });
    }

    // 1. Drag Header pull-down touch gesture
    if (this.viewerSheetDragHeader) {
      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      this.viewerSheetDragHeader.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        this.viewerInfoSheet.classList.add("dragging");
      }, { passive: false });

      this.viewerSheetDragHeader.addEventListener("touchmove", (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) {
          if (e.cancelable) e.preventDefault();
          this.viewerInfoSheet.style.transform = `translateY(${deltaY}px)`;
        }
      }, { passive: false });

      const endHeaderDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        this.viewerInfoSheet.classList.remove("dragging");
        const deltaY = currentY - startY;
        this.viewerInfoSheet.style.transform = "";
        if (deltaY > 30) {
          this.closeViewerSheet();
        }
      };

      this.viewerSheetDragHeader.addEventListener("touchend", endHeaderDrag, { passive: true });
      this.viewerSheetDragHeader.addEventListener("touchcancel", endHeaderDrag, { passive: true });

      // Tap header to collapse
      this.viewerSheetDragHeader.addEventListener("click", (e) => {
        if (e.target.closest("#viewer-collapse-btn")) return;
        if (Math.abs(currentY - startY) < 10) {
          this.closeViewerSheet();
        }
      });
    }

    // 2. Dragging down on the sheet body when at the top (scrollTop <= 0)
    let bodyStartY = 0;
    let bodyCurrentY = 0;
    let isBodyDragging = false;

    this.viewerInfoSheet.addEventListener("touchstart", (e) => {
      if (this.viewerInfoSheet.scrollTop <= 0 && e.touches.length === 1) {
        bodyStartY = e.touches[0].clientY;
        bodyCurrentY = bodyStartY;
        isBodyDragging = true;
      } else {
        isBodyDragging = false;
      }
    }, { passive: false });

    this.viewerInfoSheet.addEventListener("touchmove", (e) => {
      if (!isBodyDragging || e.touches.length !== 1) return;
      bodyCurrentY = e.touches[0].clientY;
      const deltaY = bodyCurrentY - bodyStartY;
      if (deltaY > 0 && this.viewerInfoSheet.scrollTop <= 0) {
        if (e.cancelable) e.preventDefault();
        this.viewerInfoSheet.classList.add("dragging");
        this.viewerInfoSheet.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: false });

    const endBodyDrag = () => {
      if (!isBodyDragging) return;
      isBodyDragging = false;
      this.viewerInfoSheet.classList.remove("dragging");
      const deltaY = bodyCurrentY - bodyStartY;
      this.viewerInfoSheet.style.transform = "";
      if (deltaY > 40 && this.viewerInfoSheet.scrollTop <= 0) {
        this.closeViewerSheet();
      }
    };

    this.viewerInfoSheet.addEventListener("touchend", endBodyDrag, { passive: true });
    this.viewerInfoSheet.addEventListener("touchcancel", endBodyDrag, { passive: true });

    // 3. Stage swipe gestures on media (Pull DOWN to close viewer, swipe UP/side to navigate)
    let stageStartY = 0;
    let stageCurrentY = 0;
    let stageStartX = 0;
    let stageCurrentX = 0;

    this.viewerStage.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        stageStartY = e.touches[0].clientY;
        stageCurrentY = stageStartY;
        stageStartX = e.touches[0].clientX;
        stageCurrentX = stageStartX;
      }
    }, { passive: true });

    this.viewerStage.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        stageCurrentY = e.touches[0].clientY;
        stageCurrentX = e.touches[0].clientX;
      }
    }, { passive: true });

    this.viewerStage.addEventListener("touchend", (e) => {
      const deltaY = stageCurrentY - stageStartY;
      const deltaX = stageCurrentX - stageStartX;
      const absY = Math.abs(deltaY);
      const absX = Math.abs(deltaX);

      // If bottom sheet is open, any tap or gesture on stage dismisses sheet first
      if (this.viewerInfoSheet && !this.viewerInfoSheet.classList.contains("collapsed")) {
        this.closeViewerSheet();
        return;
      }

      // Swipe DOWN -> Dismiss / Close post viewer (mobile standard)
      if (deltaY > 65 && absY > absX) {
        this.closeViewer();
        return;
      }

      // Swipe UP -> Next post (TikTok style)
      if (deltaY < -65 && absY > absX) {
        if (this.viewerIndex < this.filteredPosts.length - 1) {
          this.openViewer(this.viewerIndex + 1);
        }
        return;
      }

      // Swipe LEFT -> Next post
      if (deltaX < -70 && absX > absY) {
        if (this.viewerIndex < this.filteredPosts.length - 1) {
          this.openViewer(this.viewerIndex + 1);
        }
        return;
      }

      // Swipe RIGHT -> Previous post
      if (deltaX > 70 && absX > absY) {
        if (this.viewerIndex > 0) {
          this.openViewer(this.viewerIndex - 1);
        }
        return;
      }

      // Quick Tap on image: Toggle top bar & sidebar controls
      if (absY < 12 && absX < 12) {
        const isHidden = this.viewerTopBar?.classList.contains("hidden");
        this.viewerTopBar?.classList.toggle("hidden", !isHidden);
        this.viewerInfoPillBtn?.classList.toggle("hidden", !isHidden);
        const sidebar = document.querySelector(".viewer-sidebar");
        if (sidebar) sidebar.classList.toggle("hidden", !isHidden);
      }
    });

    this.viewerStage.addEventListener("click", () => {
      if (this.viewerInfoSheet && !this.viewerInfoSheet.classList.contains("collapsed")) {
        this.closeViewerSheet();
      }
    });
  }

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  decodeHtmlEntities(str) {
    if (!str) return "";
    let s = String(str);
    s = s.replace(/&#0*39;/g, "'")
         .replace(/&#x27;/gi, "'")
         .replace(/&apos;/g, "'")
         .replace(/&quot;/g, '"')
         .replace(/&#0*34;/g, '"')
         .replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>');
    if (s.includes("&") || s.includes("&#")) {
      try {
        const txt = document.createElement("textarea");
        txt.innerHTML = s;
        s = txt.value;
      } catch (_) {}
    }
    return s;
  }

  toggleViewerFavorite() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    this.toggleFavorite(post);
    const isFav = this.isFavorite(post.id);
    if (this.viewerFavBtn) {
      this.viewerFavBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
    }
    if (this.viewerSidebarHeartBtn) {
      this.viewerSidebarHeartBtn.classList.toggle("liked", isFav);
      this.viewerSidebarHeartBtn.querySelector("svg").setAttribute("fill", isFav ? "#f85149" : "none");
      this.viewerSidebarHeartBtn.querySelector("svg").setAttribute("stroke", isFav ? "#f85149" : "currentColor");
    }
    if (this.viewerSidebarSaveBtn) {
      this.viewerSidebarSaveBtn.classList.toggle("saved", isFav);
      this.viewerSidebarSaveBtn.querySelector("svg").setAttribute("fill", isFav ? "#388bfd" : "none");
      this.viewerSidebarSaveBtn.querySelector("svg").setAttribute("stroke", isFav ? "#388bfd" : "currentColor");
      this.viewerSidebarSaveLabel.textContent = isFav ? "Saved" : "Save";
    }
  }

  downloadViewerMedia() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    const url = post.fileUrl || post.sampleUrl;
    const filename = `omnitag_${post.id}.${post.ext || 'jpg'}`;
    this.downloadMedia(url, filename);
  }

  copyViewerMediaUrl() {
    if (this.viewerIndex < 0) return;
    const post = this.filteredPosts[this.viewerIndex];
    const url = post.fileUrl || post.sampleUrl;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => this.showToast("Media URL copied!"))
        .catch(() => this.showToast("Failed to copy URL"));
    } else {
      this.showToast(url);
    }
  }

  async downloadMedia(url, filename) {
    if (!url) return;
    if (window.AndroidBridge && typeof window.AndroidBridge.downloadFile === "function") {
      window.AndroidBridge.downloadFile(url, filename || "omnitag_media.jpg");
      return;
    }
    this.showToast("Starting download...");
    try {
      const resp = await fetch(url, { referrerPolicy: "no-referrer" });
      if (resp.ok) {
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "omnitag_media.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (_) {}

    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "omnitag_media";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) {
      window.open(url, "_blank");
    }
  }

  // ==========================================
  // SOURCES MANAGEMENT (SHEETS)
  // ==========================================

  openSourcesSheet() {
    if (this.activeTab !== "sources") {
      this.previousTab = this.activeTab;
    }
    this.renderSourcesList();
    this.sourcesSheet.classList.add("open");
  }

  closeSourcesSheet() {
    this.sourcesSheet.classList.remove("open");
    const tabToRestore = (this.previousTab && this.previousTab !== "sources" && this.previousTab !== "apis") ? this.previousTab : (this.feedView && this.feedView.style.display !== "none" ? "feed" : "search");
    document.querySelectorAll(".nav-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.tab === tabToRestore);
    });
    this.activeTab = tabToRestore;
  }

  renderSourcesList() {
    const sources = (this.sourceManager?.getAllSources ? this.sourceManager.getAllSources() : this.sourceManager?.getSources()) || [];
    const active = this.sourceManager?.getActiveSource();
    this.sourcesList.innerHTML = "";

    sources.forEach(src => {
      const isCurrentActive = active && active.id === src.id;
      const card = document.createElement("div");
      card.className = `sheet-source-card ${isCurrentActive ? "active" : ""}`;
      
      const hasKey = !!(src.apiKey && src.apiKey.trim());
      const displayUrl = (src.baseUrl || "").replace(/^https?:\/\//, "");

      card.innerHTML = `
        <div class="sheet-source-info">
          <div class="sheet-source-name-row">
            <span class="sheet-source-title">${this.escapeHtml(src.name)}</span>
            <span class="sheet-source-badge">${this.escapeHtml(src.type || "gelbooru")}</span>
            ${hasKey ? '<span class="sheet-source-key-badge">&#10003; Key Set</span>' : ''}
          </div>
          <div class="sheet-source-url">${this.escapeHtml(displayUrl)} &bull; ${this.escapeHtml(src.description || "Booru API")}</div>
        </div>
        <div class="sheet-source-actions">
          ${isCurrentActive ? '<span class="sheet-source-active-pill">&#10003; Selected</span>' : ''}
          <button class="sheet-source-edit-btn" type="button" title="Edit Source Settings">Edit</button>
        </div>
      `;

      card.addEventListener("click", () => {
        this.sourceManager.setActiveSource(src.id);
        this.updateSourceBadge();
        this.closeSourcesSheet();
        this.showToast(`Switched to ${src.name}`);

        const returnTab = (this.previousTab && this.previousTab !== "sources" && this.previousTab !== "apis") ? this.previousTab : (this.activeTab === "feed" ? "feed" : "search");
        
        if (returnTab === "feed") {
          this.switchTab("feed");
          this.loadFeedPosts(true);
        } else if (returnTab === "saved") {
          this.switchTab("saved");
        } else {
          this.switchTab("search");
          this.executeSearch(this.currentQuery, 0);
        }
      });

      const editBtn = card.querySelector(".sheet-source-edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.openEditSourceSheet(src.id);
        });
      }

      this.sourcesList.appendChild(card);
    });
  }

  openEditSourceSheet(sourceId = null) {
    if (!this.editSourceSheet) return;
    this.sourceForm.reset();
    document.getElementById("m-src-id").value = "";

    if (sourceId) {
      const src = this.sourceManager.getSource(sourceId);
      if (src) {
        this.editSheetTitle.textContent = `Edit Source: ${src.name}`;
        document.getElementById("m-src-id").value = src.id;
        document.getElementById("m-src-name").value = src.name;
        document.getElementById("m-src-type").value = src.type || "gelbooru_dapi";
        document.getElementById("m-src-base").value = src.baseUrl || "";
        document.getElementById("m-src-apikey").value = src.apiKey || "";
        document.getElementById("m-src-userid").value = src.userId || "";
        document.getElementById("m-src-proxy").value = src.proxyMode || "auto";
        document.getElementById("m-src-custom-proxy").value = src.customProxyUrl || "";
        document.getElementById("m-src-posts").value = src.customPostsUrl || "";
        document.getElementById("m-src-tags").value = src.customTagsUrl || "";
        if (this.deleteSourceBtn) this.deleteSourceBtn.style.display = src.isDefault ? "none" : "block";
      }
    } else {
      this.editSheetTitle.textContent = "Add Custom API Source";
      if (this.deleteSourceBtn) this.deleteSourceBtn.style.display = "none";
    }

    if (this.srcProxySelect && this.srcCustomProxyGroup) {
      this.srcCustomProxyGroup.style.display = this.srcProxySelect.value === "custom" ? "block" : "none";
    }

    this.editSourceSheet.classList.add("open");
  }

  closeEditSourceSheet() {
    if (this.editSourceSheet) this.editSourceSheet.classList.remove("open");
  }

  handleSaveSource(e) {
    e.preventDefault();
    const id = document.getElementById("m-src-id").value;
    const name = document.getElementById("m-src-name").value.trim();
    const type = document.getElementById("m-src-type").value;
    const baseUrl = document.getElementById("m-src-base").value.trim();
    const apiKey = document.getElementById("m-src-apikey").value.trim();
    const userId = document.getElementById("m-src-userid").value.trim();
    const proxyMode = document.getElementById("m-src-proxy").value;
    const customProxyUrl = document.getElementById("m-src-custom-proxy").value.trim();
    const customPostsUrl = document.getElementById("m-src-posts").value.trim();
    const customTagsUrl = document.getElementById("m-src-tags").value.trim();

    const data = {
      name,
      type,
      baseUrl,
      apiKey: apiKey || null,
      userId: userId || null,
      proxyMode,
      customProxyUrl: customProxyUrl || null,
      customPostsUrl: customPostsUrl || null,
      customTagsUrl: customTagsUrl || null,
      requiresAuth: !!(apiKey && userId)
    };

    if (id) {
      this.sourceManager.updateSource(id, data);
      this.showToast(`Updated source "${name}"`);
    } else {
      const newSrc = this.sourceManager.addSource(data);
      this.sourceManager.setActiveSource(newSrc.id);
      this.showToast(`Added source "${name}"`);
    }

    this.updateSourceBadge();
    this.closeEditSourceSheet();
    this.renderSourcesList();
    if (this.activeTab === "feed") {
      this.loadFeedPosts(true);
    } else {
      this.executeSearch(this.currentQuery, 0);
    }
  }

  handleDeleteSource() {
    const id = document.getElementById("m-src-id").value;
    if (!id) return;
    if (confirm("Delete this API source?")) {
      this.sourceManager.deleteSource(id);
      this.showToast("Source deleted");
      this.closeEditSourceSheet();
      this.renderSourcesList();
      this.updateSourceBadge();
      if (this.activeTab === "feed") {
        this.loadFeedPosts(true);
      } else {
        this.executeSearch(this.currentQuery, 0);
      }
    }
  }

  exportSources() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.sourceManager.exportSources());
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `omnitag_sources_backup_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  }

  importSources(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        this.sourceManager.importSources(event.target.result);
        this.renderSourcesList();
        this.updateSourceBadge();
        this.showToast("Sources imported successfully!");
        if (this.activeTab === "feed") {
          this.loadFeedPosts(true);
        } else {
          this.executeSearch(this.currentQuery, 0);
        }
      } catch (err) {
        this.showToast("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  resetSources() {
    if (confirm("Reset all sources to default? Any custom endpoints will be cleared.")) {
      this.sourceManager.resetToDefaults();
      this.renderSourcesList();
      this.updateSourceBadge();
      this.showToast("Reset sources to default");
      if (this.activeTab === "feed") {
        this.loadFeedPosts(true);
      } else {
        this.executeSearch(this.currentQuery, 0);
      }
    }
  }

  // ==========================================
  // SAVED POSTS (LIBRARY & LOCAL SEARCH)
  // ==========================================

  loadFavorites() {
    try {
      const saved = localStorage.getItem("omnitag_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  }

  saveFavorites() {
    localStorage.setItem("omnitag_favorites", JSON.stringify(this.favorites));
  }

  isFavorite(id) {
    return this.favorites.some(f => String(f.id) === String(id));
  }

  toggleFavorite(post) {
    const idx = this.favorites.findIndex(f => String(f.id) === String(post.id));
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      this.showToast("Removed from Bookmarks");
    } else {
      this.favorites.unshift(post);
      this.showToast("Saved to Bookmarks!");
    }
    this.saveFavorites();
    if (this.activeAccount) {
      this.activeAccount.favorites = this.favorites;
      this.saveAccounts();
      this.updateAccountUI();
    }

    if (this.activeTab === "saved") {
      this.renderSavedPosts(this.searchInput.value);
    }
  }

  renderSavedPosts(query = "") {
    let posts = this.favorites;
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      posts = this.favorites.filter(p => {
        const idMatch = String(p.id).includes(q);
        const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
        const srcMatch = (p.source || "").toLowerCase().includes(q);
        return idMatch || tagMatch || srcMatch;
      });
      this.resultsInfoEl.textContent = `Found ${posts.length} of ${this.favorites.length} saved bookmarks for "${query}"`;
    } else {
      this.resultsInfoEl.textContent = `${this.favorites.length} saved bookmarks`;
    }
    this.filteredPosts = posts;
    this.renderGrid();
    this.paginationEl.innerHTML = "";
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 2400);
  }

  // ==========================================
  // MULTI-ACCOUNT PROFILE SYSTEM (Unique IDs 1, 2, 3...)
  // ==========================================

  initAccounts() {
    try {
      const raw = localStorage.getItem("omnitag_accounts");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.accounts = parsed;
        }
      }
    } catch (_) {}

    if (!this.accounts || this.accounts.length === 0) {
      // First time initialization: Create default primary Account #1
      const legacyFavorites = this.loadFavorites();
      const primaryAccount = {
        id: 1, // Unique ID 1
        name: "OmniUser",
        handle: "@user1",
        avatar: "\u{1F464}",
        color: "#388bfd",
        createdAt: Date.now(),
        favorites: legacyFavorites
      };
      this.accounts = [primaryAccount];
      this.saveAccounts();
    }

    // Load active account
    const savedActiveId = localStorage.getItem("omnitag_active_account_id");
    const activeId = savedActiveId ? parseInt(savedActiveId, 10) : 1;
    this.activeAccount = this.accounts.find(a => a.id === activeId) || this.accounts[0];
    localStorage.setItem("omnitag_active_account_id", String(this.activeAccount.id));

    // Point favorites to active account's isolated favorites list
    this.favorites = this.activeAccount.favorites || [];

    // Update UI elements
    setTimeout(() => this.updateAccountUI(), 50);
  }

  saveAccounts() {
    localStorage.setItem("omnitag_accounts", JSON.stringify(this.accounts));
  }

  getNextAccountId() {
    // Strictly sequential and unique IDs from 1 and up
    const maxId = this.accounts.reduce((max, a) => Math.max(max, a.id || 0), 0);
    return maxId + 1;
  }

  openAccountModal() {
    if (!this.accountModal) return;
    this.updateAccountUI();
    this.renderAccountsList();
    this.toggleNewAccountDrawer(false);
    this.accountModal.classList.add("open");
  }

  closeAccountModal() {
    if (this.accountModal) this.accountModal.classList.remove("open");
  }

  updateAccountUI() {
    if (!this.activeAccount) return;
    const nameStr = `#${this.activeAccount.id} ${this.activeAccount.name}`;

    if (this.feedAccountAvatar) this.feedAccountAvatar.textContent = this.activeAccount.avatar;
    if (this.feedAccountLabel) this.feedAccountLabel.textContent = nameStr;
    if (this.headerAccountAvatar) this.headerAccountAvatar.textContent = this.activeAccount.avatar;
    if (this.headerAccountLabel) this.headerAccountLabel.textContent = nameStr;

    if (this.currentAccountAvatar) this.currentAccountAvatar.textContent = this.activeAccount.avatar;
    if (this.currentAccountName) this.currentAccountName.textContent = this.activeAccount.name;
    if (this.currentAccountIdBadge) this.currentAccountIdBadge.textContent = `ID #${this.activeAccount.id}`;
    if (this.currentAccountHandle) this.currentAccountHandle.textContent = this.activeAccount.handle;
    if (this.currentAccountStats) {
      const count = (this.activeAccount.favorites || []).length;
      this.currentAccountStats.textContent = `${count} saved bookmark${count === 1 ? '' : 's'}`;
    }

    if (this.newAccountIdHint) {
      this.newAccountIdHint.textContent = `Next account will be assigned sequential unique ID #${this.getNextAccountId()}.`;
    }
  }

  renderAccountsList() {
    if (!this.accountsListContainer) return;
    this.accountsListContainer.innerHTML = "";

    this.accounts.forEach(acc => {
      const isActive = acc.id === this.activeAccount.id;
      const count = (acc.favorites || []).length;

      const card = document.createElement("div");
      card.className = `account-list-item ${isActive ? 'active' : ''}`;

      card.innerHTML = `
        <div class="account-list-item-left">
          <div class="account-item-avatar">${acc.avatar || '\u{1F464}'}</div>
          <div>
            <div class="account-item-name">${acc.name} ${isActive ? '<span style="font-size: 11px; color: var(--m-accent); font-weight: 700;">(Active)</span>' : ''}</div>
            <div class="account-item-meta">
              <span class="account-item-id">ID #${acc.id}</span>
              <span>&bull;</span>
              <span>${acc.handle}</span>
              <span>&bull;</span>
              <span>${count} saved</span>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${isActive ? `
            <span style="font-size: 18px; color: var(--m-accent); font-weight: 700;">&check;</span>
          ` : `
            <button class="sheet-action-btn switch-acc-btn" style="padding: 5px 10px; font-size: 11px;">Switch</button>
            ${this.accounts.length > 1 ? `<button class="sheet-action-btn delete-acc-btn" style="padding: 5px 8px; font-size: 11px; color: var(--m-danger);" title="Delete Account">&times;</button>` : ''}
          `}
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".delete-acc-btn")) {
          e.stopPropagation();
          this.deleteAccount(acc.id);
          return;
        }
        if (!isActive) {
          this.switchAccount(acc.id);
        }
      });

      this.accountsListContainer.appendChild(card);
    });
  }

  toggleNewAccountDrawer(force = null) {
    if (!this.newAccountDrawer) return;
    const shouldShow = force !== null ? force : this.newAccountDrawer.classList.contains("hidden");
    this.newAccountDrawer.classList.toggle("hidden", !shouldShow);
    if (shouldShow) {
      if (this.newAccountNameInput) {
        this.newAccountNameInput.value = `User #${this.getNextAccountId()}`;
        this.newAccountNameInput.focus();
      }
      if (this.newAccountIdHint) {
        this.newAccountIdHint.textContent = `This account will be assigned sequential unique ID #${this.getNextAccountId()}.`;
      }
    }
  }

  handleConfirmCreateAccount() {
    const name = this.newAccountNameInput ? this.newAccountNameInput.value.trim() : "";
    const avatar = this.selectedNewAvatar || "\u{1F464}";
    this.createAccount(name, avatar);
    this.toggleNewAccountDrawer(false);
  }

  createAccount(name, avatar = "\u{1F464}") {
    // Generate next sequential unique ID strictly from 1 and up
    const nextId = this.getNextAccountId();
    const cleanName = (name || "").trim() || `User #${nextId}`;

    const newAccount = {
      id: nextId,
      name: cleanName,
      handle: `@user${nextId}`,
      avatar: avatar || "\u{1F464}",
      color: "#388bfd",
      createdAt: Date.now(),
      favorites: []
    };

    this.accounts.push(newAccount);
    this.saveAccounts();
    this.switchAccount(nextId);
    this.showToast(`Created Account #${nextId} (${cleanName})!`);
  }

  switchAccount(accountId) {
    const target = this.accounts.find(a => a.id === accountId);
    if (!target) return;

    this.activeAccount = target;
    localStorage.setItem("omnitag_active_account_id", String(target.id));
    this.favorites = target.favorites || [];
    this.saveFavorites();

    this.updateAccountUI();
    this.renderAccountsList();

    if (this.activeTab === "saved") {
      this.renderSavedPosts(this.searchInput.value);
    }

    this.showToast(`Switched to Account #${target.id} (${target.name})`);
  }

  deleteAccount(accountId) {
    if (this.accounts.length <= 1) {
      this.showToast("Cannot delete the only account!");
      return;
    }
    const target = this.accounts.find(a => a.id === accountId);
    if (!target) return;

    if (confirm(`Delete Account #${target.id} (${target.name}) and all its saved bookmarks?`)) {
      this.accounts = this.accounts.filter(a => a.id !== accountId);
      this.saveAccounts();
      if (this.activeAccount.id === accountId) {
        this.switchAccount(this.accounts[0].id);
      } else {
        this.updateAccountUI();
        this.renderAccountsList();
      }
      this.showToast(`Account #${target.id} deleted`);
    }
  }

  editProfile() {
    if (!this.activeAccount) return;
    const newName = prompt(`Enter new profile name for Account #${this.activeAccount.id}:`, this.activeAccount.name);
    if (newName && newName.trim()) {
      this.activeAccount.name = newName.trim();
      this.saveAccounts();
      this.updateAccountUI();
      this.renderAccountsList();
      this.showToast("Profile name updated!");
    }
  }
}

// Initialize robustly on DOM Ready or immediately if DOM is already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.omniTagMobile = new OmniTagMobileApp();
  });
} else {
  window.omniTagMobile = new OmniTagMobileApp();
}
