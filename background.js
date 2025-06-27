// background.js - (v21 - Improved with Review Suggestions)

console.log("Tag Scout Background Script (v21) started.");

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== "tag-scout-content-script") {
    console.warn("Tag Scout: Unknown connection attempt.", port);
    return;
  }
  
  console.log("Tag Scout: Content script connected successfully.");

  port.onMessage.addListener(msg => {
    // Using a switch statement for better scalability
    switch (msg.type) {
      case 'getSettings':
        chrome.storage.sync.get(['rules', 'autoTagging'], (data) => {
          // Send an error message back to the port if storage fails
          if (chrome.runtime.lastError) {
            console.error("Tag Scout Background Storage Error:", chrome.runtime.lastError);
            port.postMessage({ error: chrome.runtime.lastError.message });
          } else {
            port.postMessage(data);
          }
        });
        break;
      
      default:
        console.warn("Tag Scout: Received unknown message type:", msg.type);
        port.postMessage({ error: "Unknown message type" });
        break;
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Tag Scout: Content script port disconnected.");
  });
});