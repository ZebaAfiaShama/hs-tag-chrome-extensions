// background.js - FINAL VERSION with chrome.runtime.connect

console.log("Zeba Background Script (v18) started.");

// Listen for a long-lived connection from a content script
chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === "zeba-content-script");
  console.log("Zeba: Content script connected.");

  // Listen for messages on this specific port
  port.onMessage.addListener(msg => {
    if (msg.type === 'getSettings') {
      chrome.storage.sync.get(['rules', 'autoTagging'], (data) => {
        if (chrome.runtime.lastError) {
          console.error("Zeba Background Error:", chrome.runtime.lastError);
          // Don't send a response if storage fails
          return;
        }
        // Send the settings back through the same port
        port.postMessage(data);
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Zeba: Content script disconnected.");
  });
});