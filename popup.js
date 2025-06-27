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

    if (!keyword || !tag) return alert("Please enter both fields.");

    chrome.storage.sync.get(["rules"], (data) => {
      const rules = data.rules || {};
      rules[keyword] = tag;

      chrome.storage.sync.set({ rules }, () => {
        renderRules(rules);
        keywordInput.value = "";
        tagInput.value = "";
      });
    });
  });

  // Render rule list
  function renderRules(rules) {
    ruleList.innerHTML = "";
    Object.entries(rules).forEach(([keyword, tag]) => {
      const li = document.createElement("li");
      li.textContent = `"${keyword}" → ${tag}`;

      const delBtn = document.createElement("button");
      delBtn.textContent = "x";
      delBtn.style.marginLeft = "10px";
      delBtn.onclick = () => {
        delete rules[keyword];
        chrome.storage.sync.set({ rules }, () => renderRules(rules));
      };

      li.appendChild(delBtn);
      ruleList.appendChild(li);
    });
  }
});