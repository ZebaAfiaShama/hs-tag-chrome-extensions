// content.js - FINAL VERSION (v20 - Resilient, Click-to-Add)

(function() {
  "use strict";
  console.log("Zeba (v20) is ALIVE and starting...");

  // --- Global State & Connection ---
  let currentConversationId = null;
  let hasRunForCurrentId = false;
  let clickedTags = new Set();
  let port = null; // Holds our persistent connection

  function setupConnection() {
    console.log("Zeba: Attempting to connect to background script...");
    port = chrome.runtime.connect({ name: "zeba-content-script" });
    
    port.onMessage.addListener(response => {
      console.log("Zeba: Received settings from background:", response);
      if (!(response.autoTagging ?? true)) return;
      const tags = suggestTags(getConversationContent(), response.rules || {});
      console.log(`Zeba: Found ${tags.length} suggested tags:`, tags);
      updateTagUI(tags);
    });

    port.onDisconnect.addListener(() => {
      console.warn("Zeba: Port disconnected. It will auto-reconnect on the next action.");
      port = null; // Mark port as dead so we know to reconnect
    });
  }

  // --- Main Heartbeat Loop ---
  function mainLoop() {
    const newId = getConversationIdFromUrl();
    if (newId && newId !== currentConversationId) {
      console.log(`Zeba: New conversation detected (${newId}). Resetting.`);
      currentConversationId = newId;
      hasRunForCurrentId = false;
      clickedTags.clear();
      const oldContainer = document.getElementById("zebaTagContainer");
      if (oldContainer) oldContainer.remove();
    }
    if (currentConversationId && !hasRunForCurrentId) {
      const tagButton = document.querySelector('[data-cy="AddTagButton"]');
      if (tagButton) {
        hasRunForCurrentId = true; 
        runTagSuggestionLogic();
      }
    }
  }

  // --- Core Logic ---
  function runTagSuggestionLogic() {
    console.log("%cZeba: Anchor found! Requesting settings.", "color: green; font-weight: bold;");
    if (!port) setupConnection();
    if (port) {
        port.postMessage({ type: "getSettings" });
    } else {
        console.error("Zeba: Port connection failed. Cannot request settings.");
    }
  }

  // --- Helper Functions ---
  function addSingleTagToHelpScout(tagToAdd) {
    const addTagButton = document.querySelector('[data-cy="AddTagButton"]');
    if (!addTagButton) return;
    addTagButton.click();

    setTimeout(() => {
      const tagInput = document.querySelector('input.DropList__Combobox__input');
      if (!tagInput) return;
      tagInput.value = tagToAdd;
      tagInput.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => {
        tagInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter", keyCode: 13 }));
      }, 100);
    }, 150);
  }

  function getConversationContent() {
    const conversationContainer = document.querySelector('.sc-kKMBOm');
    return conversationContainer ? conversationContainer.innerText.toLowerCase() : "";
  }

  function suggestTags(content, tagRules) {
    const suggestedTags = new Set();
    for (const [keyword, tag] of Object.entries(tagRules)) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(content)) {
        suggestedTags.add(tag);
      }
    }
    return [...suggestedTags];
  }

  function updateTagUI(suggestedTags) {
    const tagButton = document.querySelector('[data-cy="AddTagButton"]');
    if (!tagButton || !tagButton.parentElement) return;
    
    const injectionPoint = tagButton.parentElement;
    let container = document.getElementById("zebaTagContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "zebaTagContainer";
      container.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 0 8px;`;
      injectionPoint.insertBefore(container, tagButton);
    }
    
    if (suggestedTags.length === 0) {
      container.style.display = "none";
      return;
    }

    container.style.display = "flex";
    // THIS IS THE UI BUG FIX: Build elements programmatically
    container.innerHTML = ''; // Clear previous content safely
    
    const separator = document.createElement('div');
    separator.style.cssText = 'width: 1px; height: 24px; background-color: #dfe3e7; margin-right: 8px;';
    container.appendChild(separator);

    const label = document.createElement('strong');
    label.textContent = "Zeba:";
    label.style.cssText = 'font-size: 13px; color: #5f6f7d; font-weight: 500;';
    container.appendChild(label);
    
    suggestedTags.forEach(tag => {
      const tagPill = document.createElement('button');
      tagPill.textContent = tag;
      tagPill.title = `Click to add tag: "${tag}"`;
      tagPill.style.cssText = `padding: 2px 8px; background-color: #eaf2f8; color: #2c3e50; border: 1px solid #3498db; border-radius: 12px; font-size: 12px; cursor: pointer;`;
      
      tagPill.onclick = (e) => {
        e.preventDefault();
        if (clickedTags.has(tag)) return;
        clickedTags.add(tag);
        addSingleTagToHelpScout(tag);
        
        tagPill.disabled = true;
        tagPill.style.backgroundColor = '#f0f0f0';
        tagPill.style.borderColor = '#ccc';
        tagPill.style.color = '#aaa';
        tagPill.style.cursor = 'default';
        tagPill.textContent += ' ✓';
      };
      container.appendChild(tagPill);
    });
  }
  
  function getConversationIdFromUrl() {
    const match = window.location.pathname.match(/conversation\/(\d+)/);
    return match ? match[1] : null;
  }

  // --- Start the Engine ---
  setupConnection();
  setInterval(mainLoop, 750);

})();