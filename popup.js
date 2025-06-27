// popup.js - (v21 - Improved with Review Suggestions)

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

  // Add new rule
  addRuleBtn.addEventListener("click", () => {
    const keyword = keywordInput.value.trim().toLowerCase();
    const tag = tagInput.value.trim();
    if (!keyword || !tag) return alert("Please enter both a keyword and a tag.");

    chrome.storage.sync.get(["rules"], (data) => {
      const rules = data.rules || {};
      
      // Warn user if keyword already exists
      if (rules[keyword]) {
        if (!confirm(`A rule for "${keyword}" already exists. Do you want to overwrite it?`)) {
          return; // Stop if user cancels
        }
      }

      rules[keyword] = tag;
      chrome.storage.sync.set({ rules }, () => {
        // Add error handling for storage set
        if (chrome.runtime.lastError) {
          alert("Error saving rule: " + chrome.runtime.lastError.message);
          return;
        }
        renderRules(rules);
        keywordInput.value = "";
        tagInput.value = "";
        keywordInput.focus(); // Focus back on keyword input for faster entry
      });
    });
  });

  // Render rule list
  function renderRules(rules) {
    ruleList.innerHTML = "";
    Object.entries(rules).forEach(([keyword, tag]) => {
      const li = document.createElement("li");
      
      // Span for text to help with overflow
      const textSpan = document.createElement('span');
      textSpan.textContent = `"${keyword}" → ${tag}`;
      textSpan.className = 'rule-text'; // Add class for styling
      li.appendChild(textSpan);

      const delBtn = document.createElement("button");
      delBtn.textContent = "x";
      delBtn.setAttribute('aria-label', `Delete rule for keyword: ${keyword}`); // Accessibility improvement
      delBtn.onclick = () => {
        delete rules[keyword];
        chrome.storage.sync.set({ rules }, () => {
            if (chrome.runtime.lastError) {
                alert("Error deleting rule: " + chrome.runtime.lastError.message);
                return;
            }
            renderRules(rules);
        });
      };
      li.appendChild(delBtn);
      ruleList.appendChild(li);
    });
  }
});