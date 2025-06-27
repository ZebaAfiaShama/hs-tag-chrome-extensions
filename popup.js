document.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keyword");
  const tagInput = document.getElementById("tag");
  const addRuleBtn = document.getElementById("addRule");
  const ruleList = document.getElementById("ruleList");
  const toggleAutoTag = document.getElementById("toggleAutoTag");

  // Load saved settings
  chrome.storage.sync.get(["rules", "autoTagging"], (data) => {
    const rules = data.rules || {};
    const autoTagging = data.autoTagging ?? true;
    toggleAutoTag.checked = autoTagging;
    renderRules(rules);
  });

  // Save toggle state
  toggleAutoTag.addEventListener("change", () => {
    chrome.storage.sync.set({ autoTagging: toggleAutoTag.checked });
  });

  // Function to handle adding a rule
  function handleAddRule() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const tag = tagInput.value.trim();
    if (!keyword || !tag) return alert("Please enter both a keyword and a tag.");

    chrome.storage.sync.get(["rules"], (data) => {
      const rules = data.rules || {};
      
      rules[keyword] = tag;
      chrome.storage.sync.set({ rules }, () => {
        if (chrome.runtime.lastError) {
          alert("Error saving rule: " + chrome.runtime.lastError.message);
          return;
        }
        renderRules(rules);
        keywordInput.value = "";
        tagInput.value = "";
        keywordInput.focus();
      });
    });
  }

  // Add new rule on button click
  addRuleBtn.addEventListener("click", handleAddRule);
  
  // Add new rule on Enter key press in the tag input field
  tagInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        handleAddRule();
    }
  });


  // --- UPDATED RENDER FUNCTION ---
  function renderRules(rules) {
    ruleList.innerHTML = "";
    const sortedKeywords = Object.keys(rules).sort(); // Sort rules alphabetically

    sortedKeywords.forEach((keyword) => {
      const tag = rules[keyword];
      const li = document.createElement("li");

      // Container for the rule text content
      const ruleContent = document.createElement("div");
      ruleContent.className = "rule-content";

      const keywordSpan = document.createElement("span");
      keywordSpan.className = "rule-keyword";
      keywordSpan.textContent = keyword;
      
      const arrowSpan = document.createElement("span");
      arrowSpan.className = "rule-arrow";
      arrowSpan.textContent = "→";

      const tagSpan = document.createElement("span");
      tagSpan.className = "rule-tag";
      tagSpan.textContent = tag;

      ruleContent.appendChild(keywordSpan);
      ruleContent.appendChild(arrowSpan);
      ruleContent.appendChild(tagSpan);

      // Delete button with SVG icon
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.setAttribute('aria-label', `Delete rule for ${keyword}`);
      delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>';
      
      delBtn.onclick = () => {
        delete rules[keyword];
        chrome.storage.sync.set({ rules }, () => {
            if (chrome.runtime.lastError) {
                alert("Error deleting rule: " + chrome.runtime.lastError.message);
            }
            renderRules(rules);
        });
      };
      
      li.appendChild(ruleContent);
      li.appendChild(delBtn);
      ruleList.appendChild(li);
    });
  }
});