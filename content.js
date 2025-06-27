// content.js - FINAL VERSION (v18 - Persistent Connection & Brute-Force Content)

(function() {
  "use strict";
  console.log("Zeba (v18) is ALIVE and starting...");

  // --- Global State & Connection ---
  let currentConversationId = null;
  let hasRunForCurrentId = false;
  let port = null; // To hold our connection to the background script

  function setupConnection() {
    console.log("Zeba: Setting up connection to background script.");
    port = chrome.runtime.connect({ name: "zeba-content-script" });

    // Listen for the response from the background script
    port.onMessage.addListener(response => {
      console.log("Zeba: Received settings from background:", response);
      if (!(response.autoTagging ?? true)) return;
      
      const tags = suggestTags(getConversationContent(), response.rules || {});
      console.log(`Zeba: Found ${tags.length} suggested tags:`, tags);
      updateTagUI(tags);
    });

    // Handle disconnection (e.g., when extension is reloaded)
    port.onDisconnect.addListener(() => {
      console.warn("Zeba: Port disconnected. Will attempt to reconnect on next action.");
      port = null; // Mark the port as dead
    });
  }

  // --- Main Heartbeat Loop ---
  function mainLoop() {
    const newId = getConversationIdFromUrl();

    if (newId && newId !== currentConversationId) {
      console.log(`Zeba: New conversation detected (${newId}). Resetting state.`);
      currentConversationId = newId;
      hasRunForCurrentId = false;
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
    
    // If the port is dead, try to reconnect.
    if (!port) {
      setupConnection();
    }
    
    // Now that we have a port, send the message.
    if (port) {
        port.postMessage({ type: "getSettings" });
    } else {
        console.error("Zeba: Could not establish a connection to the background script.");
    }
  }

  // --- Helper Functions ---
  function getConversationContent() {
    // THE FINAL, BRUTE-FORCE CONTENT FIX: Read all visible text on the page.
    const fullText = document.body.innerText;
    console.log(`Zeba: Scraped Content (full body): "${fullText.substring(0, 200).replace(/\n/g, " ")}..."`);
    return fullText.toLowerCase();
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
    const tagsToCopy = suggestedTags.join(',');
    container.innerHTML = `
      <div style="width: 1px; height: 24px; background-color: #dfe3e7; margin-right: 8px;"></div>
      <strong style="font-size: 13px; color: #5f6f7d; font-weight: 500;">Zeba:</strong>
      <div id="tagPillsContainer" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
      <button id="zebaCopyBtn" title="Copy Suggested Tags" style="background:none; border:none; cursor:pointer; padding:2px; display:flex; align-items:center;"><span style="font-size: 18px; line-height: 1;">📋</span></button>
    `;

    const tagPillsContainer = container.querySelector('#tagPillsContainer');
    suggestedTags.slice(0, 3).forEach(tag => {
      const tagPill = document.createElement('span');
      tagPill.textContent = tag;
      tagPill.style.cssText = "padding:2px 8px; background-color:#eaf2f8; color:#2c3e50; border-radius:12px; font-size:12px;";
      tagPillsContainer.appendChild(tagPill);
    });
    if (suggestedTags.length > 3) {
      const morePill = document.createElement('span');
      morePill.textContent = `+${suggestedTags.length - 3}`;
      morePill.style.cssText = tagPillsContainer.firstChild.style.cssText;
      tagPillsContainer.appendChild(morePill);
    }
    container.querySelector('#zebaCopyBtn').onclick = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(tagsToCopy).then(() => {
        e.currentTarget.innerHTML = '<span style="font-size: 18px; line-height: 1;">✅</span>';
        setTimeout(() => { e.currentTarget.innerHTML = '<span style="font-size: 18px; line-height: 1;">📋</span>'; }, 1500);
      });
    };
  }
  
  function getConversationIdFromUrl() {
    const match = window.location.pathname.match(/conversation\/(\d+)/);
    return match ? match[1] : null;
  }

  // --- Start the Engine ---
  setupConnection(); // Establish the connection once at the start.
  setInterval(mainLoop, 750); // Start the heartbeat.

})();