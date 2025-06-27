// background.js - FINAL VERSION with chrome.runtime.connect

console.log("Tag Scout Background Script (v20) started.");

chrome.runtime.onConnect.addListener(port => {
  // We expect the port to be named "tag-scout-content-script"
  if (port.name !== "tag-scout-content-script") { // Changed port name
    console.warn("Tag Scout: Unknown connection attempt.", port);
    return;
  }
  
  console.log("Tag Scout: Content script connected successfully.");

  // Listen for messages on this specific port
  port.onMessage.addListener(msg => {
    if (msg.type === 'getSettings') {
      chrome.storage.sync.get(['rules', 'autoTagging'], (data) => {
        if (chrome.runtime.lastError) {
          console.error("Tag Scout Background Storage Error:", chrome.runtime.lastError);
          return;
        }
        port.postMessage(data);
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Tag Scout: Content script port disconnected.");
  });
});