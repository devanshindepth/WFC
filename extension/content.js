// Content script for Text Extractor Pro

class ContentExtractor {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        this.isInitialized = true;
    }

    handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case 'extractPageText':
            this.extractPageText().then(sendResponse);
            return true;
        case 'extractSelection':
            this.extractSelection().then(sendResponse);
            return true;
        case 'extractText': // Handle context menu action
            if (request.selectedText) {
                // Extract selection if text was selected
                this.extractSelection().then(sendResponse);
            } else {
                // Extract full page if no selection
                this.extractPageText().then(sendResponse);
            }
            return true; // Keep message channel open for async response
        case 'highlightText':
            this.highlightText(request.text);
            sendResponse({ success: true });
            break;
        default:
            sendResponse({ error: 'Unknown action' });
    }
}

    async extractPageText() {
        try {
            const extractedText = this.getPageText();
            
            // Send to background script
            chrome.runtime.sendMessage({
                action: "textExtracted",
                text: extractedText,
                title: document.title,
                url: window.location.href,
                source: 'page'
            });
            
            return {
                success: true,
                text: extractedText,
                source: 'page',
                url: window.location.href,
                title: document.title
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async extractSelection() {
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (!selectedText) {
                return {
                    success: false,
                    error: 'No text selected'
                };
            }

            // Send to background script
            chrome.runtime.sendMessage({
                action: "textExtracted",
                text: selectedText,
                title: document.title,
                url: window.location.href,
                source: 'selection'
            });
            
            return {
                success: true,
                text: selectedText,
                source: 'selection',
                url: window.location.href,
                title: document.title
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getPageText() {
        // Create a tree walker to traverse text nodes
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

    highlightText(searchText) {
        if (!searchText) return;
        
        // Remove existing highlights
        this.removeHighlights();
        
        // Create a tree walker to find text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
                textNodes.push(node);
            }
        }
        
        // Highlight matching text in each node
        textNodes.forEach(textNode => {
            const parent = textNode.parentElement;
            if (!parent || parent.classList.contains('text-extractor-highlight')) return;
            
            const text = textNode.textContent;
            const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            
            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, '<span class="text-extractor-highlight" style="background-color: yellow; padding: 2px;">$1</span>');
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = highlightedHTML;
                
                // Replace the text node with highlighted content
                while (tempDiv.firstChild) {
                    parent.insertBefore(tempDiv.firstChild, textNode);
                }
                parent.removeChild(textNode);
            }
        });
    }

    removeHighlights() {
        const highlights = document.querySelectorAll('.text-extractor-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentElement;
            if (parent) {
                parent.insertBefore(document.createTextNode(highlight.textContent), highlight);
                parent.removeChild(highlight);
            }
        });
    }
}

// Initialize content script
if (typeof window !== 'undefined' && window.document) {
    new ContentExtractor();
}