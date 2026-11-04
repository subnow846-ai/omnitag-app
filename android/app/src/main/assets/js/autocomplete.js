/**
 * OmniTag - Google-Style Multi-Tag Autocomplete Engine
 * Automatically queries active API source tags as you type
 */

class TagAutocomplete {
  constructor(inputEl, dropdownEl, onSelect) {
    this.input = inputEl;
    this.dropdown = dropdownEl;
    this.onSelect = onSelect;
    this.selectedIndex = -1;
    this.suggestions = [];
    this.debounceTimer = null;
    this.currentToken = "";
    this.tokenStartIndex = 0;
    this.isNegative = false;

    this.init();
  }

  init() {
    this.input.addEventListener("input", () => this.handleInput());
    this.input.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // Hide dropdown on click outside
    document.addEventListener("click", (e) => {
      if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hide();
      }
    });

    this.input.addEventListener("focus", () => {
      if (this.suggestions.length > 0) {
        this.show();
      }
    });
  }

  getCurrentToken() {
    const val = this.input.value;
    const cursorPos = this.input.selectionStart || val.length;

    // Find the word bounds around cursor
    const beforeCursor = val.slice(0, cursorPos);
    const lastSpace = Math.max(beforeCursor.lastIndexOf(" "), beforeCursor.lastIndexOf("+"));
    const start = lastSpace + 1;
    let token = beforeCursor.slice(start);

    // Check negation prefix
    if (token.startsWith("-")) {
      this.isNegative = true;
      token = token.slice(1);
    } else {
      this.isNegative = false;
    }

    this.tokenStartIndex = start;
    this.currentToken = token;
    return token;
  }

  handleInput() {
    clearTimeout(this.debounceTimer);
    const token = this.getCurrentToken();

    if (!token || token.length < 2) {
      this.hide();
      this.suggestions = [];
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await window.apiSourceManager.fetchTags(token);
        this.suggestions = results;
        this.render();
      } catch (e) {
        console.warn("Autocomplete error:", e);
        this.hide();
      }
    }, 180);
  }

  handleKeyDown(e) {
    if (this.dropdown.style.display === "none" || this.suggestions.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
      this.updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
      this.updateSelection();
    } else if (e.key === "Enter" && this.selectedIndex >= 0) {
      e.preventDefault();
      this.selectSuggestion(this.suggestions[this.selectedIndex]);
    } else if (e.key === "Escape") {
      this.hide();
    }
  }

  updateSelection() {
    const items = this.dropdown.querySelectorAll(".autocomplete-item");
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  selectSuggestion(item) {
    if (!item) return;

    const val = this.input.value;
    const cursorPos = this.input.selectionStart || val.length;
    const beforeToken = val.slice(0, this.tokenStartIndex);
    const afterToken = val.slice(cursorPos);

    const prefix = this.isNegative ? "-" : "";
    const newWord = `${prefix}${item.name} `;
    
    this.input.value = `${beforeToken}${newWord}${afterToken.trimStart()}`;
    const newCursorPos = beforeToken.length + newWord.length;
    this.input.setSelectionRange(newCursorPos, newCursorPos);

    this.hide();
    this.suggestions = [];
    this.input.focus();

    if (this.onSelect) {
      this.onSelect(item, this.input.value);
    }
  }

  render() {
    if (!this.suggestions || this.suggestions.length === 0) {
      this.hide();
      return;
    }

    this.dropdown.innerHTML = "";
    this.selectedIndex = -1;

    this.suggestions.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "autocomplete-item";
      
      // Category color badge
      const catClass = `cat-${item.category || "general"}`;
      const prefix = this.isNegative ? '<span class="neg-sign">-</span>' : '';

      // Highlight match
      const highlightedName = this.highlightMatch(item.name, this.currentToken);

      let countStr = "";
      if (item.count !== null && item.count !== undefined) {
        countStr = `<span class="tag-count">${this.formatCount(item.count)}</span>`;
      }

      row.innerHTML = `
        <div class="tag-info">
          <span class="cat-dot ${catClass}"></span>
          <span class="tag-text">${prefix}${highlightedName}</span>
        </div>
        ${countStr}
      `;

      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.selectSuggestion(item);
      });

      this.dropdown.appendChild(row);
    });

    this.show();
  }

  highlightMatch(name, query) {
    if (!query) return name;
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return name.replace(new RegExp(`(${q})`, 'gi'), '<strong class="highlight">$1</strong>');
  }

  formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  }

  show() {
    this.dropdown.style.display = "block";
  }

  hide() {
    this.dropdown.style.display = "none";
    this.selectedIndex = -1;
  }
}

window.TagAutocomplete = TagAutocomplete;
