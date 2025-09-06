
const config = {
  termsKeywords: ['terms', 'privacy', 'policy', 'agreement', 'cookie', 'condition', 'notice', 'legal'],
  acceptKeywords: ['accept', 'agree', 'continue', 'confirm', 'submit', 'acknowledge', 'consent']
};

class TermsDetector {
  constructor() {
    this.detectedData = {
      termsLinks: [],
      acceptanceElements: [],
      termsContent: null,
      timestamp: Date.now()
    };
    this.init();
  }

  init() {
    this.detectElements();
    this.setupMessageListener();
    this.observeChanges();
  }

  detectTermsLinks() {
    const links = document.querySelectorAll('a[href]');
    const termsLinks = [];
    
    links.forEach(link => {
      const text = (link.textContent + ' ' + link.href).toLowerCase();
      const hasTermsKeyword = config.termsKeywords.some(keyword => text.includes(keyword));
      
      if (hasTermsKeyword) {
        termsLinks.push({
          text: link.textContent.trim(),
          href: link.href,
          element: link
        });
      }
    });
    
    return termsLinks;
  }

  detectAcceptanceElements() {
    const acceptanceElements = [];
    
    // Check buttons and inputs
    const interactiveElements = document.querySelectorAll('button, input[type="submit"], input[type="button"], input[type="checkbox"]');
    
    interactiveElements.forEach(element => {
      let textToCheck = element.textContent || element.value || '';
      
      // For checkboxes, also check associated label
      if (element.type === 'checkbox') {
        const label = document.querySelector(`label[for="${element.id}"]`) || 
                     element.closest('label') || 
                     element.parentElement;
        if (label) textToCheck += ' ' + label.textContent;
      }
      
      textToCheck = textToCheck.toLowerCase();
      
      const hasAcceptKeyword = config.acceptKeywords.some(keyword => textToCheck.includes(keyword));
      const hasTermsReference = config.termsKeywords.some(keyword => textToCheck.includes(keyword));
      
      if (hasAcceptKeyword || hasTermsReference) {
        acceptanceElements.push({
          type: element.tagName.toLowerCase(),
          inputType: element.type || null,
          text: (element.textContent || element.value || '').trim(),
          element: element
        });
      }
    });
    
    return acceptanceElements;
  }

  async fetchTermsContent(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove script and style elements
      const scripts = doc.querySelectorAll('script, style, nav, header, footer');
      scripts.forEach(el => el.remove());
      
      // Get main content areas
      const contentSelectors = ['main', 'article', '.content', '#content', '.terms', '.policy'];
      let content = '';
      
      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          content = element.textContent;
          break;
        }
      }
      
      // Fallback to body if no main content found
      if (!content) {
        content = doc.body.textContent;
      }
      
      // Clean up text
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      // Return first 2000 characters with summary
      const summary = content.substring(0, 2000);
      return {
        summary: summary + (content.length > 2000 ? '...' : ''),
        fullLength: content.length,
        url: url
      };
      
    } catch (error) {
      console.warn('Could not fetch terms content:', error);
      return {
        summary: 'Could not fetch content from this URL.',
        error: error.message,
        url: url
      };
    }
  }

  async detectElements() {
    const termsLinks = this.detectTermsLinks();
    const acceptanceElements = this.detectAcceptanceElements();
    
    this.detectedData = {
      termsLinks,
      acceptanceElements,
      termsContent: null,
      timestamp: Date.now(),
      hasTermsAndAcceptance: termsLinks.length > 0 && acceptanceElements.length > 0
    };
    
    // If we found terms links, try to fetch content from the first one
    if (termsLinks.length > 0) {
      this.detectedData.termsContent = await this.fetchTermsContent(termsLinks[0].href);
    }
    
    // Store data for popup access
    chrome.runtime.sendMessage({
      action: 'termsDetected',
      data: this.detectedData
    }).catch(() => {
      // Extension might not be ready, store in sessionStorage as backup
      try {
        sessionStorage.setItem('termsDetectorData', JSON.stringify(this.detectedData));
      } catch (e) {
        console.warn('Could not store detection data:', e);
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getDetectionData') {
        sendResponse(this.detectedData);
      } else if (request.action === 'redetect') {
        this.detectElements().then(() => {
          sendResponse(this.detectedData);
        });
        return true; // Will respond asynchronously
      }
    });
  }

  observeChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.detectElements();
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }
}

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

class LegalTextExtractor {
  constructor() {
    this.legalKeywords = [
      // Legal terms
      'terms', 'conditions', 'privacy', 'policy', 'agreement', 'license',
      'disclaimer', 'liability', 'warranty', 'indemnification', 'arbitration',
      'jurisdiction', 'governing law', 'dispute', 'resolution', 'legal',
      'copyright', 'trademark', 'intellectual property', 'rights reserved',
      'confidentiality', 'non-disclosure', 'data protection', 'gdpr', 'ccpa',
      'cookies', 'consent', 'opt-out', 'compliance', 'regulation',
      
      // Legal phrases
      'terms of service', 'terms of use', 'privacy policy', 'cookie policy',
      'acceptable use', 'user agreement', 'end user', 'eula', 'service agreement',
      'binding agreement', 'legal notice', 'fair use', 'limitation of liability',
      'force majeure', 'severability', 'entire agreement', 'modification',
      'termination', 'suspension', 'prohibited', 'restrictions', 'obligations',
      'representations', 'warranties', 'covenants', 'shall', 'hereby',
      'whereas', 'herein', 'thereof', 'notwithstanding'
    ];

    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractLegalText') {
        const result = request.selectedText 
          ? this.extractFromSelection(request.selectedText)
          : this.extractLegalTextFromPage();
        sendResponse(result);
      }
      return true;
    });
  }

  extractFromSelection(selectedText) {
    // Process selected text to find legal content
    const processedText = this.processLegalText(selectedText);
    
    return {
      success: true,
      text: processedText.text,
      sections: processedText.sections,
      metadata: {
        source: 'selection',
        url: window.location.href,
        title: document.title,
        extractedAt: new Date().toISOString()
      }
    };
  }

  extractLegalTextFromPage() {
    const legalSections = [];
    const processedElements = new Set();
    
    // Find all potential legal text containers
    const elements = this.findLegalElements();
    
    elements.forEach(element => {
      if (processedElements.has(element)) return;
      
      const section = this.extractSectionContent(element);
      if (section && section.content.length > 100) { // Min length for valid section
        legalSections.push(section);
        processedElements.add(element);
      }
    });

    // Sort sections by relevance score
    legalSections.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Format the extracted text
    const formattedText = this.formatLegalSections(legalSections);

    return {
      success: true,
      text: formattedText.text,
      sections: formattedText.sections,
      metadata: {
        source: 'page',
        url: window.location.href,
        title: document.title,
        extractedAt: new Date().toISOString(),
        sectionsFound: legalSections.length
      }
    };
  }

  findLegalElements() {
    const elements = [];
    const selectors = [
      // Direct content selectors
      'main', 'article', '.content', '#content', '.legal', '.terms',
      '.privacy', '.policy', '.agreement', '.disclaimer', '.container',
      '[class*="terms"]', '[class*="privacy"]', '[class*="policy"]',
      '[class*="legal"]', '[id*="terms"]', '[id*="privacy"]', 
      '[id*="policy"]', '[id*="legal"]',
      
      // Section selectors
      'section', 'div.section', '.text-content', '.page-content'
    ];

    // Search by selectors
    selectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector);
        found.forEach(el => {
          if (this.hasLegalContent(el)) {
            elements.push(el);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    // Search all divs and sections for legal content
    const allContainers = document.querySelectorAll('div, section, article');
    allContainers.forEach(el => {
      const text = el.textContent.toLowerCase();
      const score = this.calculateLegalScore(text);
      if (score > 5) { // Threshold for legal content
        elements.push(el);
      }
    });

    // Remove duplicates and nested elements
    return this.filterUniqueElements(elements);
  }

  hasLegalContent(element) {
    const text = element.textContent.toLowerCase();
    const score = this.calculateLegalScore(text);
    return score > 3; // Lower threshold for initial detection
  }

  calculateLegalScore(text) {
    let score = 0;
    this.legalKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    return score;
  }

  extractSectionContent(element) {
    // Find section heading
    const heading = this.findSectionHeading(element);
    
    // Extract and clean content
    const content = this.cleanTextContent(element);
    
    // Calculate relevance score
    const relevanceScore = this.calculateLegalScore(content.toLowerCase());
    
    // Extract subsections if any
    const subsections = this.extractSubsections(element);
    
    return {
      heading: heading,
      content: content,
      subsections: subsections,
      relevanceScore: relevanceScore,
      element: element
    };
  }

  findSectionHeading(element) {
    // Look for headings within or before the element
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      return headings[0].textContent.trim();
    }
    
    // Check previous sibling for heading
    let prev = element.previousElementSibling;
    while (prev) {
      if (prev.tagName && prev.tagName.match(/^H[1-6]$/)) {
        return prev.textContent.trim();
      }
      prev = prev.previousElementSibling;
    }
    
    // Check parent for heading
    const parent = element.parentElement;
    if (parent) {
      const parentHeading = parent.querySelector('h1, h2, h3, h4, h5, h6');
      if (parentHeading && !element.contains(parentHeading)) {
        return parentHeading.textContent.trim();
      }
    }
    
    // Generate heading from content
    const firstWords = element.textContent.trim().split(/\s+/).slice(0, 5).join(' ');
    return firstWords.length > 50 ? firstWords.substring(0, 50) + '...' : firstWords;
  }

  extractSubsections(element) {
    const subsections = [];
    const subHeadings = element.querySelectorAll('h3, h4, h5, h6, strong, b');
    
    subHeadings.forEach(heading => {
      const text = heading.textContent.trim();
      if (text.length > 3 && text.length < 100) {
        const content = this.getFollowingContent(heading);
        if (content) {
          subsections.push({
            title: text,
            content: content
          });
        }
      }
    });
    
    return subsections;
  }

  getFollowingContent(heading) {
    let content = '';
    let sibling = heading.nextSibling;
    let charCount = 0;
    const maxChars = 1000;
    
    while (sibling && charCount < maxChars) {
      if (sibling.nodeType === Node.TEXT_NODE) {
        content += sibling.textContent;
        charCount += sibling.textContent.length;
      } else if (sibling.nodeType === Node.ELEMENT_NODE) {
        // Stop at next heading
        if (sibling.tagName && sibling.tagName.match(/^(H[1-6]|STRONG|B)$/)) {
          break;
        }
        const text = sibling.textContent || '';
        content += ' ' + text;
        charCount += text.length;
      }
      sibling = sibling.nextSibling;
    }
    
    return content.trim();
  }

  cleanTextContent(element) {
    // Clone to avoid modifying the original page
    const clone = element.cloneNode(true);
    
    // Remove scripts, styles, and other non-content elements
    const removeElements = clone.querySelectorAll('script, style, noscript, iframe, nav, header, footer, aside, .advertisement, .ad, .social-share, button, input, form');
    removeElements.forEach(el => el.remove());

    // Add newlines after block elements to preserve structure before getting textContent
    const blockElements = clone.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, br, tr, section');
    blockElements.forEach(el => {
        el.appendChild(document.createTextNode('\n'));
    });

    let text = clone.textContent || '';
    
    // Clean up whitespace while preserving paragraph breaks
    text = text
      .replace(/[ \t]+/g, ' ')      // Collapse multiple spaces/tabs into a single space
      .replace(/ \n/g, '\n')        // Remove space before a newline
      .replace(/\n /g, '\n')        // Remove space after a newline
      .replace(/\n{3,}/g, '\n\n')   // Collapse 3+ newlines into 2 (a paragraph break)
      .trim();
    
    return text;
  }

  filterUniqueElements(elements) {
    const unique = [];
    const processed = new Set();
    
    elements.forEach(el => {
      // Skip if already processed
      if (processed.has(el)) return;
      
      // Skip if parent is already in the list
      let hasParentInList = false;
      unique.forEach(existing => {
        if (existing.contains(el)) {
          hasParentInList = true;
        }
      });
      
      if (!hasParentInList) {
        // Remove any children that are already in the list
        unique.forEach((existing, index) => {
          if (el.contains(existing)) {
            unique.splice(index, 1);
          }
        });
        
        unique.push(el);
        processed.add(el);
      }
    });
    
    return unique;
  }

  processLegalText(text) {
    // Split into paragraphs
    const paragraphs = text.split(/\n\n+/);
    const sections = [];
    let currentSection = null;
    
    paragraphs.forEach(para => {
      // Check if this is a heading
      if (this.isLikelyHeading(para)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: para,
          content: []
        };
      } else {
        if (!currentSection) {
          currentSection = {
            heading: 'Legal Text',
            content: []
          };
        }
        currentSection.content.push(para);
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return {
      text: text,
      sections: sections
    };
  }

  isLikelyHeading(text) {
    // Check if text is likely a heading
    return (
      text.length < 100 &&
      (text === text.toUpperCase() ||
       text.match(/^\d+\.?\s+[A-Z]/) ||
       text.match(/^[A-Z][A-Z\s]+$/) ||
       this.legalKeywords.some(keyword => 
         text.toLowerCase().includes(keyword) && text.split(' ').length < 10
       ))
    );
  }

  formatLegalSections(sections) {
    let formattedText = '';
    const formattedSections = [];
    
    sections.forEach((section, index) => {
      const sectionNumber = index + 1;
      
      // Add section heading
      if (section.heading) {
        formattedText += `\n\n## ${sectionNumber}. ${section.heading}\n\n`;
      }
      
      // Add section content
      formattedText += section.content;
      
      // Add subsections
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(sub => {
          formattedText += `\n\n### ${sub.title}\n\n${sub.content}`;
        });
      }
      
      // Store formatted section
      formattedSections.push({
        number: sectionNumber,
        heading: section.heading,
        content: section.content,
        subsections: section.subsections,
        relevanceScore: section.relevanceScore
      });
    });
    
    return {
      text: formattedText.trim(),
      sections: formattedSections
    };
  }
}

// Initialize the legal text extractor
if (typeof window !== 'undefined' && window.document) {
  new LegalTextExtractor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TermsDetector());
} else {
  new TermsDetector();
}

// Initialize content script
if (typeof window !== 'undefined' && window.document) {
    new ContentExtractor();
}