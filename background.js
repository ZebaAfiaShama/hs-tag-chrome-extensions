// background.js - FINAL VERSION (v20 - Robust Connection Handling)

console.log("Zeba Background Script (v20) started.");

chrome.runtime.onConnect.addListener(port => {
  // We expect the port to be named "zeba-content-script"
  if (port.name !== "zeba-content-script") {
    console.warn("Zeba: Unknown connection attempt.", port);
    return;
  }
  
  console.log("Zeba: Content script connected successfully.");

  // Listen for messages on this specific port
  port.onMessage.addListener(msg => {
    if (msg.type === 'getSettings') {
      chrome.storage.sync.get(['rules', 'autoTagging'], (data) => {
        if (chrome.runtime.lastError) {
          console.error("Zeba Background Storage Error:", chrome.runtime.lastError);
          return;
        }
        // Send the settings back through the same port
        port.postMessage(data);
      });
    }
  });

  port.onDisconnect.addListener(() => {
    // This is normal when a tab is closed or navigated.
    console.log("Zeba: Content script port disconnected.");
  });
});