// content.js - (v21 - Improved with Review Suggestions)

(function() {
  "use strict";
  console.log("Tag Scout (v21) is ALIVE and starting...");

  // --- Constants for Selectors & Delays ---
  const ADD_TAG_BUTTON_SELECTOR = '[data-cy="AddTagButton"]';
  const TAG_INPUT_SELECTOR = 'input.DropList__Combobox__input';
  const CONTENT_CONTAINER_SELECTOR = '.sc-kKMBOm';
  const DEBOUNCE_DELAY = 500; // ms

  // --- Global State & Connection ---
  let currentConversationId = null;
  let hasRunForCurrentId = false;
  let clickedTags = new Set();
  let port = null;
  let debounceTimer;

  function setupConnection() {
    if (port) return; // Avoid creating multiple connections
    console.log("Tag Scout: Attempting to connect to background script...");
    port = chrome.runtime.connect({ name: "tag-scout-content-script" });
    
    port.onMessage.addListener(response => {
      if (response.error) {
        console.error("Tag Scout: Received error from background:", response.error);
        return;
      }
      console.log("Tag Scout: Received settings from background:", response);
      if (!(response.autoTagging ?? true)) return;
      const tags = suggestTags(getConversationContent(), response.rules || {});
      console.log(`Tag Scout: Found ${tags.length} suggested tags:`, tags);
      updateTagUI(tags);
    });

    port.onDisconnect.addListener(() => {
      console.warn("Tag Scout: Port disconnected. It will auto-reconnect on the next action.");
      port = null;
    });
  }

  // --- Core Logic ---
  function mainLogic() {
    const newId = getConversationIdFromUrl();
    if (newId && newId !== currentConversationId) {
      console.log(`Tag Scout: New conversation detected (${newId}). Resetting.`);
      currentConversationId = newId;
      hasRunForCurrentId = false;
      clickedTags.clear();
      const oldContainer = document.getElementById("tagScoutContainer");
      if (oldContainer) oldContainer.remove();
    }
    
    if (currentConversationId && !hasRunForCurrentId && document.querySelector(ADD_TAG_BUTTON_SELECTOR)) {
      hasRunForCurrentId = true;
      console.log("%cTag Scout: Anchor found! Requesting settings.", "color: green; font-weight: bold;");
      if (!port) setupConnection();
      if (port) {
          port.postMessage({ type: "getSettings" });
      } else {
          console.error("Tag Scout: Port connection failed. Cannot request settings.");
          hasRunForCurrentId = false; // Allow retry
      }
    }
  }
  
  // --- Using MutationObserver for better performance ---
  const observer = new MutationObserver(() => {
    // Debounce to prevent firing multiple times for a single navigation event
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(mainLogic, DEBOUNCE_DELAY);
  });

  // --- Helper Functions ---
  function addSingleTagToHelpScout(tagToAdd) {
    const addTagButton = document.querySelector(ADD_TAG_BUTTON_SELECTOR);
    if (!addTagButton) return;
    addTagButton.click();

    // More robustly wait for the input field to appear
    let retries = 10;
    function tryInput() {
      const tagInput = document.querySelector(TAG_INPUT_SELECTOR);
      if (!tagInput) {
        if (--retries > 0) return setTimeout(tryInput, 50);
        console.warn("Tag Scout: Tag input not found after retries.");
        return;
      }
      tagInput.value = tagToAdd;
      tagInput.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => {
        tagInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter", keyCode: 13 }));
      }, 100);
    }
    setTimeout(tryInput, 50);
  }

  function getConversationContent() {
    const conversationContainer = document.querySelector(CONTENT_CONTAINER_SELECTOR);
    if (!conversationContainer) {
      console.warn("Tag Scout: Conversation container not found.");
      return "";
    }
    return conversationContainer.innerText.toLowerCase();
  }
  
  // ... (suggestTags function remains the same) ...
  function suggestTags(content, tagRules) {
    const suggestedTags = new Set();
    for (const [keyword, tag] of Object.entries(tagRules)) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(content)) {
        suggestedTags.add(tag);
      }
    }
    return [...suggestedTags];
  }
  
  // ... (updateTagUI remains mostly the same, but with accessibility improvement) ...
  function updateTagUI(suggestedTags) {
    const tagButton = document.querySelector(ADD_TAG_BUTTON_SELECTOR);
    if (!tagButton || !tagButton.parentElement) return;
    const injectionPoint = tagButton.parentElement;
    let container = document.getElementById("tagScoutContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "tagScoutContainer";
      container.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 0 8px;`;
      injectionPoint.insertBefore(container, tagButton);
    }
    if (suggestedTags.length === 0) {
      container.style.display = "none";
      return;
    }
    container.style.display = "flex";
    container.innerHTML = '';
    const separator = document.createElement('div');
    separator.style.cssText = 'width: 1px; height: 24px; background-color: #dfe3e7; margin-right: 8px;';
    container.appendChild(separator);
    const label = document.createElement('strong');
    label.textContent = "Tag Scout:";
    label.style.cssText = 'font-size: 13px; color: #5f6f7d; font-weight: 500;';
    container.appendChild(label);
    
    suggestedTags.forEach(tag => {
      const tagPill = document.createElement('button');
      tagPill.textContent = tag;
      tagPill.setAttribute('aria-label', `Add tag: ${tag}`); // Accessibility improvement
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
  observer.observe(document.body, { childList: true, subtree: true });

})();