// Fixed background.js
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: "extractText",
    title: "Extract Text Content",
    contexts: ["page", "selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "extractText") {
    // Extract text directly instead of sending message to content script
    if (info.selectionText) {
      // Handle selected text
      chrome.storage.local.set({
        extractedText: info.selectionText,
        extractedTitle: "Selected Text",
        timestamp: Date.now(),
        sourceUrl: tab.url
      }, () => {
        openViewerWindow();
      });
    } else {
      // Handle page text extraction
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractPageText
      }, (results) => {
        if (results && results[0] && results[0].result) {
          chrome.storage.local.set({
            extractedText: results[0].result,
            extractedTitle: "Page Text",
            timestamp: Date.now(),
            sourceUrl: tab.url
          }, () => {
            openViewerWindow();
          });
        }
      });
    }
  }
});

// Function to extract page text
function extractPageText() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const style = window.getComputedStyle(parent);
        const tagName = parent.tagName.toLowerCase();
        
        // Skip hidden elements
        if (style.display === 'none' || 
            style.visibility === 'hidden' ||
            style.opacity === '0') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip script, style, and other non-content elements
        if (['script', 'style', 'noscript', 'iframe', 'object', 'embed'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip very small text (likely decorative)
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 8) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textParts = [];
  const processedElements = new Set();
  let node;
  
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text && text.length > 1) {
      const parent = node.parentElement;
      
      // Add spacing based on element type
      let prefix = '';
      let suffix = '';
      
      if (parent) {
        const tagName = parent.tagName.toLowerCase();
        
        // Add extra spacing for block elements
        if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th'].includes(tagName)) {
          if (textParts.length > 0 && !textParts[textParts.length - 1].endsWith('\n')) {
            prefix = '\n';
          }
          suffix = '\n';
        }
        
        // Add extra spacing for headers
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          suffix = '\n\n';
        }
        
        // Add bullet points for list items
        if (tagName === 'li' && !processedElements.has(parent)) {
          prefix = prefix + '• ';
          processedElements.add(parent);
        }
      }
      
      textParts.push(prefix + text + suffix);
    }
  }
  
  // Clean up the text
  let finalText = textParts.join('');
  
  // Remove excessive whitespace while preserving structure
  finalText = finalText
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n') // Remove spaces/tabs at start of lines
    .replace(/[ \t]+\n/g, '\n') // Remove spaces/tabs at end of lines
    .replace(/\n{3,}/g, '\n\n') // Maximum 2 consecutive newlines
    .trim();
  
  return finalText;
}

// Function to open viewer window
function openViewerWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('viewer.html'),
    type: 'popup',
    width: 800,
    height: 600,
    left: 100,
    top: 100
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
  return true; // Keep message channel open
});