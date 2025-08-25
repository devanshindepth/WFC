// Background script for handling context menu and communication
chrome.runtime.onInstalled.addListener(() => {
  // Check if contextMenus API is available
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: "extractText",
      title: "Extract Text Content",
      contexts: ["page", "selection"]
    });
  }
});

// Handle context menu clicks
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "extractText") {
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, {
        action: "extractText",
        selectedText: info.selectionText || null
      }).catch((error) => {
        console.log("Could not send message to content script:", error);
      });
    }
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "textExtracted") {
    // Store the extracted text
    chrome.storage.local.set({
      extractedText: message.text,
      extractedTimestamp: Date.now(),
      sourceUrl: sender.tab.url,
      pageTitle: message.title
    });
    
    sendResponse({success: true});
  }
});