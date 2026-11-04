/**
 * OmniTag - API Sources & Adapter Engine
 * Manages switchable Booru/Image APIs, proxies, and normalizes post/tag data.
 */

const DEFAULT_SOURCES = [
  {
    id: "safebooru",
    name: "Safebooru",
    type: "gelbooru_dapi",
    baseUrl: "https://safebooru.org",
    postsUrl: "https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit={limit}&pid={page}&tags={tags}",
    tagsUrl: "https://safebooru.org/autocomplete.php?q={query}",
    thumbTemplate: "https://safebooru.org/thumbnails/{directory}/thumbnail_{image}",
    sampleTemplate: "https://safebooru.org/samples/{directory}/sample_{image}",
    fileTemplate: "https://safebooru.org/images/{directory}/{image}",
    proxyMode: "auto", // 'auto', 'direct', 'corsproxy', 'allorigins', 'local', 'custom'
    customProxyUrl: "",
    isPreset: true,
    description: "Anime & manga art (Safe for work)"
  },
  {
    id: "danbooru",
    name: "Danbooru (Safe)",
    type: "danbooru_v2",
    baseUrl: "https://danbooru.donmai.us",
    postsUrl: "https://danbooru.donmai.us/posts.json?limit={limit}&page={page}&tags={tags}",
    tagsUrl: "https://danbooru.donmai.us/autocomplete.json?search[query]={query}&search[type]=tag_query&version=1&limit=12",
    thumbTemplate: "",
    sampleTemplate: "",
    fileTemplate: "",
    proxyMode: "auto",
    customProxyUrl: "",
    isPreset: true,
    description: "Danbooru General / Safe posts"
  },
  {
    id: "yande",
    name: "Yande.re (Safe)",
    type: "moebooru",
    baseUrl: "https://yande.re",
    postsUrl: "https://yande.re/post.json?limit={limit}&page={page}&tags=rating:s+{tags}",
    tagsUrl: "https://yande.re/tag.json?name={query}&order=count&limit=12",
    thumbTemplate: "",
    sampleTemplate: "",
    fileTemplate: "",
    proxyMode: "auto",
    customProxyUrl: "",
    isPreset: true,
    description: "High resolution anime wallpapers"
  },
  {
    id: "konachan",
    name: "Konachan (Safe)",
    type: "moebooru",
    baseUrl: "https://konachan.net",
    postsUrl: "https://konachan.net/post.json?limit={limit}&page={page}&tags=rating:s+{tags}",
    tagsUrl: "https://konachan.net/tag.json?name={query}&order=count&limit=12",
    thumbTemplate: "",
    sampleTemplate: "",
    fileTemplate: "",
    proxyMode: "auto",
    customProxyUrl: "",
    isPreset: true,
    description: "Anime wallpapers & illustrations"
  },
  {
    id: "rule34",
    name: "Rule34 (18+)",
    type: "gelbooru_dapi",
    baseUrl: "https://rule34.xxx",
    postsUrl: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit={limit}&pid={page}&tags={tags}&api_key={api_key}&user_id={user_id}",
    tagsUrl: "https://api.rule34.xxx/autocomplete.php?q={query}",
    thumbTemplate: "",
    sampleTemplate: "",
    fileTemplate: "",
    proxyMode: "auto",
    customProxyUrl: "",
    requiresAuth: true,
    apiKey: "", // paste your key via "Manage / Add APIs" in the app (stays in your browser)
    userId: "7003718",
    authHelp: "Find your API key and user ID in your rule34.xxx account options.",
    excludeTags: ["loli", "shota", "child", "young", "underage"],
    isPreset: true,
    description: "Adult (explicit) content. Requires an API key."
  }
];

// Bump this whenever new presets are added to DEFAULT_SOURCES so that
// existing installs (which already have a saved list) receive them once.
const PRESET_VERSION = 5;

class ApiSourceManager {
  constructor() {
    this.storageKey = "omnitag_sources_v1";
    this.activeKey = "omnitag_active_source_id";
    this.presetVersionKey = "omnitag_preset_version";
    this.sources = this.loadSources();
    
    // In any web browser environment (without native AndroidBridge), Danbooru is the default
    // because it natively supports CORS headers (Access-Control-Allow-Origin: *)
    const isWeb = typeof window !== "undefined" && !window.AndroidBridge;
    const defaultId = isWeb ? "danbooru" : "safebooru";
    this.activeId = localStorage.getItem(this.activeKey) || defaultId;
    
    // In web mode, ensure active source has native CORS support (Danbooru) so requests never fail
    if (isWeb && this.activeId === "safebooru" && !localStorage.getItem("omnitag_user_explicit_safebooru")) {
      this.activeId = "danbooru";
      localStorage.setItem(this.activeKey, "danbooru");
    }
    
    // Ensure active source exists
    if (!this.getSource(this.activeId)) {
      this.activeId = defaultId;
    }
  }

  loadSources() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.addMissingPresets(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load sources from localStorage, using defaults", e);
    }
    this.saveSources(DEFAULT_SOURCES);
    localStorage.setItem(this.presetVersionKey, String(PRESET_VERSION));
    return JSON.parse(JSON.stringify(DEFAULT_SOURCES));
  }

  /**
   * One-time migration: add any built-in presets that an older saved list
   * doesn't have yet. Runs once per PRESET_VERSION, so a preset the user
   * later deletes will not keep coming back.
   */
  addMissingPresets(list) {
    const seen = parseInt(localStorage.getItem(this.presetVersionKey) || "1", 10);
    if (seen >= PRESET_VERSION) return list;

    for (const def of DEFAULT_SOURCES) {
      const existing = list.find(s => s.id === def.id);
      if (!existing) {
        list.push(JSON.parse(JSON.stringify(def)));
      } else if (def.apiKey && def.userId && !existing.apiKey && !existing.userId) {
        // Already saved but with blank credentials: fill them in (never overwrites a key you typed)
        existing.apiKey = def.apiKey;
        existing.userId = def.userId;
      }
    }
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    localStorage.setItem(this.presetVersionKey, String(PRESET_VERSION));
    return list;
  }

  saveSources(sources) {
    this.sources = sources;
    localStorage.setItem(this.storageKey, JSON.stringify(sources));
  }

  getSources() {
    return this.sources;
  }

  getAllSources() {
    return this.getSources();
  }

  addSource(data) {
    return this.saveSource(data);
  }

  updateSource(id, data) {
    return this.saveSource({ id, ...data });
  }

  getSource(id) {
    return this.sources.find(s => s.id === id) || null;
  }

  getActiveSource() {
    return this.getSource(this.activeId) || this.sources[0];
  }

  setActiveSource(id) {
    if (this.getSource(id)) {
      this.activeId = id;
      localStorage.setItem(this.activeKey, id);
      if (id === "safebooru") {
        localStorage.setItem("omnitag_user_explicit_safebooru", "1");
      } else {
        localStorage.removeItem("omnitag_user_explicit_safebooru");
      }
      return true;
    }
    return false;
  }

  saveSource(sourceData) {
    const existingIndex = this.sources.findIndex(s => s.id === sourceData.id);
    if (existingIndex >= 0) {
      this.sources[existingIndex] = { ...this.sources[existingIndex], ...sourceData };
    } else {
      if (!sourceData.id) {
        sourceData.id = "custom_" + Date.now().toString(36);
      }
      this.sources.push(sourceData);
    }
    this.saveSources(this.sources);
    return sourceData;
  }

  deleteSource(id) {
    this.sources = this.sources.filter(s => s.id !== id);
    if (this.activeId === id) {
      this.activeId = this.sources[0]?.id || "";
      localStorage.setItem(this.activeKey, this.activeId);
    }
    this.saveSources(this.sources);
  }

  resetToDefaults() {
    this.saveSources(JSON.parse(JSON.stringify(DEFAULT_SOURCES)));
    localStorage.setItem(this.presetVersionKey, String(PRESET_VERSION));
    this.setActiveSource("safebooru");
    return this.sources;
  }

  exportSources() {
    return JSON.stringify(this.sources, null, 2);
  }

  importSources(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      this.saveSources(parsed);
      this.setActiveSource(parsed[0].id);
      return true;
    }
    throw new Error("Invalid sources JSON format");
  }

  /**
   * Fill {api_key} / {user_id} placeholders from the source's saved credentials
   */
  applyAuth(url, source) {
    const key = encodeURIComponent((source.apiKey || "").trim());
    const uid = encodeURIComponent((source.userId || "").trim());
    return url.replace(/\{api_key\}/g, () => key).replace(/\{user_id\}/g, () => uid);
  }

  /**
   * Determine proxy wrapping for target URL based on source config and environment
   */
  resolveUrl(targetUrl, source) {
    if (!targetUrl) return "";
    const mode = source.proxyMode || "auto";

    // Direct mode: no proxy
    if (mode === "direct") {
      return targetUrl;
    }

    // If served from local server or Cloudflare tunnel, use /api/proxy
    const hasLocalServer = window.location.protocol.startsWith("http") && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1" || 
       window.location.hostname.includes("trycloudflare.com") ||
       window.location.hostname.startsWith("192.168."));

    if (mode === "local" || (mode === "auto" && hasLocalServer)) {
      return `${window.location.origin}/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }

    if (mode === "custom" && source.customProxyUrl) {
      return source.customProxyUrl.replace("{url}", encodeURIComponent(targetUrl));
    }

    return targetUrl;
  }

  /**
   * Fetch tag suggestions from the active source's API
   */
  async fetchTags(query) {
    const source = this.getActiveSource();
    if (!source || !query || !query.trim()) return [];

    const cleanQuery = query.trim().toLowerCase();
    let url = (source.tagsUrl || "").replace("{query}", encodeURIComponent(cleanQuery));
    if (!url) {
      url = `${source.baseUrl}/autocomplete.php?q=${encodeURIComponent(cleanQuery)}`;
    }

    // If running in native Android APK with AndroidBridge, use native connection
    if (window.AndroidBridge && typeof window.AndroidBridge.fetchUrl === "function") {
      try {
        const text = window.AndroidBridge.fetchUrl(url);
        if (text && !text.includes('{"error":')) {
          const data = JSON.parse(text);
          return this.normalizeTags(data, source, cleanQuery);
        }
      } catch (bridgeErr) {
        console.warn("AndroidBridge fetchTags fallback:", bridgeErr);
      }
    }

    const fetchUrl = this.resolveUrl(url, source);

    try {
      const resp = await fetch(fetchUrl, {
        headers: { Accept: "application/json, text/plain, */*" }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      return this.normalizeTags(data, source, cleanQuery);
    } catch (err) {
      console.warn("Tag fetch failed:", err);
      return [];
    }
  }

  /**
   * Normalize tag autocomplete results across different booru formats
   */
  normalizeTags(raw, source, query) {
    if (!raw) return [];
    const results = [];

    // Safebooru / Gelbooru autocomplete format:
    // [{"label": "cat_ears (1234)", "value": "cat_ears"}, ...]
    // or array of strings: ["cat", "cat_ears"]
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === "string") {
          results.push({
            name: item,
            label: item,
            count: null,
            category: "general"
          });
        } else if (item && typeof item === "object") {
          // Danbooru autocomplete format:
          // { type: "tag", value: "tag_name", label: "tag_name (1234)", category: 0 }
          const name = item.value || item.name || item.tag || "";
          let label = item.label || item.value || item.name || "";
          let count = item.post_count || item.count || null;

          // Extract count from label if format is "tag (123)"
          if (!count && label.includes("(") && label.endsWith(")")) {
            const match = label.match(/\((\d+)\)$/);
            if (match) count = parseInt(match[1], 10);
          }

          let category = "general";
          if (item.category !== undefined) {
            const catMap = { 0: "general", 1: "artist", 3: "copyright", 4: "character", 5: "meta" };
            category = catMap[item.category] || "general";
          } else if (item.type) {
            category = item.type;
          }

          if (name) {
            results.push({ name, label: name, count, category });
          }
        }
      }
    }
    return results.slice(0, 15);
  }

  /**
   * Fetch posts for given search tags and page
   */
  async fetchPosts(tags = "", page = 0, limit = 24) {
    const source = this.getActiveSource();
    if (!source) throw new Error("No active API source configured");

    if (source.requiresAuth && (!(source.apiKey || "").trim() || !(source.userId || "").trim())) {
      throw new Error(`${source.name} needs an API key and User ID. Open "Manage / Add APIs", click Edit on ${source.name} and paste them in. ${source.authHelp || ""}`.trim());
    }

    const cleanTags = (tags || "").trim();
    let url = source.postsUrl || "";

    if (!url) {
      // Default to Gelbooru DAPI style
      url = `${source.baseUrl}/index.php?page=dapi&s=post&q=index&json=1&limit={limit}&pid={page}&tags={tags}`;
    }

    // Danbooru and Moebooru use 1-indexed pages (page 1, 2, 3...)
    // Gelbooru/Safebooru DAPI uses 0-indexed pid (0, 1, 2...)
    let pageParam = page;
    if (source.type === "danbooru_v2" || source.type === "moebooru") {
      pageParam = Math.max(1, page + 1);
    }

    // Danbooru safe rating filter
    let finalTags = cleanTags;
    if (source.id === "danbooru" || source.type === "danbooru_v2") {
      finalTags = cleanTags ? `rating:g ${cleanTags}` : "rating:g";
    }

    // Per-source tags that are always excluded
    if (Array.isArray(source.excludeTags) && source.excludeTags.length) {
      const negs = source.excludeTags.map(t => `-${t}`).join(" ");
      finalTags = finalTags ? `${finalTags} ${negs}` : negs;
    }

    url = url
      .replace("{limit}", limit.toString())
      .replace("{page}", pageParam.toString())
      .replace("{tags}", encodeURIComponent(finalTags));

    // If running in native Android APK with AndroidBridge, use native connection (bypasses browser CORS completely)
    if (window.AndroidBridge && typeof window.AndroidBridge.fetchUrl === "function") {
      try {
        const text = window.AndroidBridge.fetchUrl(url);
        if (text) {
          const trimmed = text.trim();
          if (trimmed.startsWith('{"error":') && !trimmed.includes('"id":')) {
            const errObj = JSON.parse(trimmed);
            throw new Error(errObj.error);
          }
          if (!trimmed) return [];
          let json;
          try {
            json = JSON.parse(text);
          } catch (_) {
            if (text.includes("<?xml") || text.includes("<posts")) {
              json = this.parseXmlPosts(text);
            } else {
              throw new Error("Unable to parse server response as JSON or XML");
            }
          }
          return this.normalizePosts(json, source);
        }
      } catch (bridgeErr) {
        console.warn("AndroidBridge fetch error, falling back to browser fetch:", bridgeErr);
      }
    }

    const fetchUrl = this.resolveUrl(url, source);

    let resp;
    try {
      resp = await fetch(fetchUrl, {
        headers: { Accept: "application/json, text/plain, */*" }
      });
      if (!resp.ok && (resp.status === 403 || resp.status === 0)) {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (netErr) {
      // In web browsers/GitHub Pages, direct fetch can fail with CORS. Try reliable proxy fallback chain
      const proxyFallbacks = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`
      ];

      let lastError = netErr;
      for (const pUrl of proxyFallbacks) {
        try {
          const pResp = await fetch(pUrl, {
            headers: { Accept: "application/json, text/plain, */*" }
          });
          if (pResp && pResp.ok) {
            resp = pResp;
            lastError = null;
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }
      if (lastError && !resp) {
        throw lastError;
      }
    }

    if (!resp.ok) {
      throw new Error(`Failed to load posts (HTTP ${resp.status})`);
    }

    const text = await resp.text();
    const trimmed = text.trim();

    // Gelbooru-style APIs (Rule34) return an empty body when nothing matches
    if (!trimmed) return [];

    // Some of them answer HTTP 200 with a short plain-text auth error
    if (trimmed.length < 500 && !/^[\[{<]/.test(trimmed) && /authenticat|credential|api[ _]?key/i.test(trimmed)) {
      throw new Error(`${source.name} rejected the API credentials: "${trimmed}". ${source.authHelp || ""}`.trim());
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Check if response is XML (older boorus)
      if (text.includes("<?xml") || text.includes("<posts")) {
        json = this.parseXmlPosts(text);
      } else {
        throw new Error("Unable to parse server response as JSON or XML");
      }
    }

    return this.normalizePosts(json, source);
  }

  /**
   * Search posts alias for fetchPosts
   */
  async searchPosts(tags = "", page = 0, limit = 24) {
    return this.fetchPosts(tags, page, limit);
  }

  /**
   * Fallback XML parser for DAPI v0.1 / v0.2 XML responses
   */
  parseXmlPosts(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    const postsEl = doc.querySelectorAll("post");
    const list = [];

    postsEl.forEach(p => {
      const item = {};
      for (const attr of p.attributes) {
        item[attr.name] = attr.value;
      }
      list.push(item);
    });

    return list;
  }

  /**
   * Normalize posts into unified Post model
   */
  normalizePosts(raw, source) {
    let rawList = [];
    if (Array.isArray(raw)) {
      rawList = raw;
    } else if (raw && Array.isArray(raw.post)) {
      rawList = raw.post;
    } else if (raw && Array.isArray(raw.posts)) {
      rawList = raw.posts;
    } else if (raw && typeof raw === "object") {
      // Some Gelbooru versions return { "@attributes": {...}, "post": [...] }
      if (raw.post && Array.isArray(raw.post)) {
        rawList = raw.post;
      }
    }

    const normalized = [];

    for (const item of rawList) {
      if (!item) continue;

      let id = item.id || item.post_id || Math.random().toString(36).substr(2, 9);
      let width = parseInt(item.width || item.image_width || 0, 10);
      let height = parseInt(item.height || item.image_height || 0, 10);
      let score = parseInt(item.score || 0, 10);
      let rating = item.rating || "general";

      // Tag extraction
      let rawTags = item.tags || item.tag_string || "";
      let tagList = [];
      if (Array.isArray(rawTags)) {
        tagList = rawTags;
      } else if (typeof rawTags === "string") {
        tagList = rawTags.trim().split(/\s+/).filter(Boolean);
      }

      // Categorized tags if available (Danbooru style)
      const tagCategories = {
        artist: (item.tag_string_artist || "").split(/\s+/).filter(Boolean),
        character: (item.tag_string_character || "").split(/\s+/).filter(Boolean),
        copyright: (item.tag_string_copyright || "").split(/\s+/).filter(Boolean),
        general: (item.tag_string_general || "").split(/\s+/).filter(Boolean)
      };

      // URL building
      let fileUrl = item.file_url || "";
      let sampleUrl = item.sample_url || item.large_file_url || fileUrl;
      let previewUrl = item.preview_url || item.preview_file_url || sampleUrl;

      // Gelbooru / Safebooru directory & image format
      if ((!fileUrl || !fileUrl.startsWith("http")) && item.directory && item.image) {
        if (source.thumbTemplate) {
          previewUrl = source.thumbTemplate.replace("{directory}", item.directory).replace("{image}", item.image);
        } else {
          previewUrl = `${source.baseUrl}/thumbnails/${item.directory}/thumbnail_${item.image}`;
        }

        if (source.sampleTemplate && item.sample) {
          sampleUrl = source.sampleTemplate.replace("{directory}", item.directory).replace("{image}", item.image);
        } else {
          sampleUrl = `${source.baseUrl}/samples/${item.directory}/sample_${item.image}`;
        }

        if (source.fileTemplate) {
          fileUrl = source.fileTemplate.replace("{directory}", item.directory).replace("{image}", item.image);
        } else {
          fileUrl = `${source.baseUrl}/images/${item.directory}/${item.image}`;
        }
      }

      // Ensure full absolute URLs
      if (previewUrl && !previewUrl.startsWith("http")) {
        previewUrl = `${source.baseUrl}/${previewUrl.replace(/^\//, '')}`;
      }
      if (sampleUrl && !sampleUrl.startsWith("http")) {
        sampleUrl = `${source.baseUrl}/${sampleUrl.replace(/^\//, '')}`;
      }
      if (fileUrl && !fileUrl.startsWith("http")) {
        fileUrl = `${source.baseUrl}/${fileUrl.replace(/^\//, '')}`;
      }

      // Determine extension & media type
      const urlForExt = fileUrl || sampleUrl || "";
      const extMatch = urlForExt.split('?')[0].match(/\.([a-z0-9]+)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const isVideo = ["mp4", "webm", "zip"].includes(ext);
      const isGif = ext === "gif";

      normalized.push({
        id,
        tags: tagList,
        tagCategories,
        previewUrl,
        sampleUrl: sampleUrl || previewUrl,
        fileUrl: fileUrl || sampleUrl || previewUrl,
        width,
        height,
        aspectRatio: width && height ? (width / height) : 1,
        score,
        rating,
        ext,
        isVideo,
        isGif,
        sourceSite: source.name,
        sourceId: source.id,
        postPageUrl: `${source.baseUrl}/index.php?page=post&s=view&id=${id}`,
        createdAt: item.change || item.created_at || ""
      });
    }

    return normalized;
  }
}

// Export singleton
window.apiSourceManager = new ApiSourceManager();
