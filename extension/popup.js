
class TermsPopup {
  constructor() {
    this.currentData = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadDetectionData();
  }

  setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshDetection();
    });

    document.getElementById('openTermsBtn').addEventListener('click', () => {
      this.openFirstTermsLink();
    });
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async loadDetectionData() {
    try {
      const tab = await this.getCurrentTab();
      
      // Try to get data from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getDetectionData' });
      
      if (response && response.timestamp) {
        this.currentData = response;
        this.displayResults();
      } else {
        // Fallback: trigger new detection
        this.refreshDetection();
      }
    } catch (error) {
      console.warn('Could not load detection data:', error);
      this.showEmptyState();
    }
  }

  async refreshDetection() {
    this.showLoading();
    
    try {
      const tab = await this.getCurrentTab();
      
      // Trigger re-detection in content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'redetect' });
      
      if (response) {
        this.currentData = response;
        this.displayResults();
      } else {
        this.showEmptyState();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      this.showEmptyState();
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
  }

  showEmptyState() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
  }

  displayResults() {
    const { termsLinks, acceptanceElements, termsContent, hasTermsAndAcceptance } = this.currentData;
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    // Update status card
    this.updateStatusCard(hasTermsAndAcceptance, termsLinks.length, acceptanceElements.length);

    // Display terms links
    if (termsLinks.length > 0) {
      this.displayTermsLinks(termsLinks);
    }

    // Display acceptance elements
    if (acceptanceElements.length > 0) {
      this.displayAcceptanceElements(acceptanceElements);
    }

    // Display terms content
    if (termsContent) {
      this.displayTermsContent(termsContent);
    }

    // Show/hide open terms button
    const openBtn = document.getElementById('openTermsBtn');
    if (termsLinks.length > 0) {
      openBtn.style.display = 'block';
      openBtn.setAttribute('data-url', termsLinks[0].href);
    } else {
      openBtn.style.display = 'none';
    }
  }

  updateStatusCard(hasTermsAndAcceptance, termsCount, acceptanceCount) {
    const statusCard = document.getElementById('statusCard');
    const statusText = document.getElementById('statusText');
    const statusInfo = document.getElementById('statusInfo');

    if (hasTermsAndAcceptance) {
      statusCard.className = 'status-card detected';
      statusText.textContent = '⚠️ Terms & Acceptance Detected!';
      statusInfo.textContent = 'This page contains terms/policies and requires acceptance.';
    } else if (termsCount > 0 || acceptanceCount > 0) {
      statusCard.className = 'status-card none';
      statusText.textContent = '📄 Terms or Policies Found';
      statusInfo.textContent = `Found ${termsCount} terms links and ${acceptanceCount} acceptance elements.`;
    } else {
      statusCard.className = 'status-card none';
      statusText.textContent = '✅ No Terms Detected';
      statusInfo.textContent = 'This page appears to be clear of terms/policies.';
    }
  }

  displayTermsLinks(termsLinks) {
    const section = document.getElementById('termsSection');
    const container = document.getElementById('termsLinks');
    const count = document.getElementById('termsCount');

    count.textContent = termsLinks.length;
    section.style.display = 'block';

    container.innerHTML = termsLinks.map(link => `
      <div class="link-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#1976d2">
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
        </svg>
        <a href="${link.href}" class="link-text" target="_blank" title="${link.href}">
          ${this.truncateText(link.text, 40)}
        </a>
      </div>
    `).join('');
  }

  displayAcceptanceElements(acceptanceElements) {
    const section = document.getElementById('acceptanceSection');
    const container = document.getElementById('acceptanceElements');
    const count = document.getElementById('acceptanceCount');

    count.textContent = acceptanceElements.length;
    section.style.display = 'block';

    container.innerHTML = acceptanceElements.map(element => `
      <div class="element-item">
        <span class="element-type">${element.type.toUpperCase()}</span>
        ${this.truncateText(element.text, 50)}
      </div>
    `).join('');
  }

  displayTermsContent(termsContent) {
    const section = document.getElementById('contentSection');
    const textContainer = document.getElementById('termsText');
    const urlContainer = document.getElementById('contentUrl');

    section.style.display = 'block';

    if (termsContent.error) {
      textContainer.textContent = `Error: ${termsContent.error}`;
      textContainer.style.color = '#dc3545';
    } else {
      textContainer.textContent = termsContent.summary;
      textContainer.style.color = '#333';
      
      if (termsContent.fullLength) {
        const info = document.createElement('div');
        info.className = 'info-text';
        info.style.marginTop = '10px';
        info.textContent = `Showing preview of ${termsContent.fullLength.toLocaleString()} characters`;
        textContainer.appendChild(info);
      }
    }

    urlContainer.textContent = `Source: ${termsContent.url}`;
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  async openFirstTermsLink() {
    if (this.currentData && this.currentData.termsLinks.length > 0) {
      const url = this.currentData.termsLinks[0].href;
      await chrome.tabs.create({ url });
    }
  }
}
// Popup script for Text Extractor Pro

class TextExtractor {
  constructor() {
    this.status = document.getElementById("status");
    this.logo = document.getElementById("logo");
    this.initializeEventListeners();
    this.setupLogo();
  }

  setupLogo() {
    if (this.logo) {
      this.logo.onerror = () => {
        this.logo.style.display = "none";
      };
    }
  }

  initializeEventListeners() {
    document.getElementById("extractPage").addEventListener("click", () => {
      this.extractPageText();
    });

    document
      .getElementById("extractSelection")
      .addEventListener("click", () => {
        this.extractSelection();
      });

    document.getElementById("uploadImage").addEventListener("click", () => {
      document.getElementById("imageFile").click();
    });

    document.getElementById("uploadPdf").addEventListener("click", () => {
      document.getElementById("pdfFile").click();
    });

    document.getElementById("imageFile").addEventListener("change", (e) => {
      this.handleImageUpload(e.target.files[0]);
    });

    document.getElementById("pdfFile").addEventListener("change", (e) => {
      this.handlePdfUpload(e.target.files[0]);
    });
  }

  showStatus(message, type = "") {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
  }

  async extractPageText() {
    this.showStatus("Extracting page text...", "loading");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Extract all visible text from the page
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const parent = node.parentElement;
                const style = window.getComputedStyle(parent);

                // Skip hidden elements and script/style tags
                if (
                  style.display === "none" ||
                  style.visibility === "hidden" ||
                  ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
                ) {
                  return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
              },
            }
          );

          let text = "";
          let node;
          while ((node = walker.nextNode())) {
            const nodeText = node.textContent.trim();
            if (nodeText) {
              text += nodeText + "\n";
            }
          }

          return text.trim();
        },
      });

      const extractedText = results[0].result;

      if (extractedText) {
        this.showTextViewer(extractedText, "Page Text");
        this.showStatus("✅ Page text extracted!", "success");
      } else {
        this.showStatus("No text found on page", "error");
      }
    } catch (error) {
      console.error("Error extracting page text:", error);
      this.showStatus("❌ Failed to extract page text", "error");
    }
  }

  async extractSelection() {
    this.showStatus("Extracting selected text...", "loading");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const selection = window.getSelection();
          return selection.toString().trim();
        },
      });

      const selectedText = results[0].result;

      if (selectedText) {
        this.showTextViewer(selectedText, "Selected Text");
        this.showStatus("✅ Selection extracted!", "success");
      } else {
        this.showStatus("No text selected", "error");
      }
    } catch (error) {
      console.error("Error extracting selection:", error);
      this.showStatus("❌ Failed to extract selection", "error");
    }
  }

  async handleImageUpload(file) {
    if (!file) return;

    this.showStatus("Processing image...", "loading");

    try {
      const dataUrl = await this.convertFileToDataUrl(file);

      // Store image data instead of extracting text
      await this.showFileViewer(dataUrl, "image", `Image: ${file.name}`);
      this.showStatus("✅ Image loaded!", "success");
    } catch (error) {
      console.error("Error processing image:", error);
      this.showStatus("❌ Failed to process image", "error");
    }
  }

  async handlePdfUpload(file) {
    if (!file) return;

    this.showStatus("Processing PDF...", "loading");

    try {
      const dataUrl = await this.convertFileToDataUrl(file);

      // Store PDF data instead of extracting text
      await this.showFileViewer(dataUrl, "pdf", `PDF: ${file.name}`);
      this.showStatus("✅ PDF loaded!", "success");
    } catch (error) {
      console.error("Error processing PDF:", error);
      this.showStatus("❌ Failed to process PDF", "error");
    }
  }
  async handlePdfUpload(file) {
    if (!file) return;

    this.showStatus("Processing PDF...", "loading");

    try {
      const dataUrl = await this.convertFileToDataUrl(file);

      // Store PDF data instead of extracting text
      await this.showFileViewer(dataUrl, "pdf", `PDF: ${file.name}`);
      this.showStatus("✅ PDF loaded!", "success");
    } catch (error) {
      console.error("Error processing PDF:", error);
      this.showStatus("❌ Failed to process PDF", "error");
    }
  }

  async extractTextFromImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Simple OCR simulation - in real implementation, you'd use Tesseract.js
            // For now, we'll try to detect if it's a screenshot with text
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // This is a placeholder - real OCR would go here
            resolve(
              "OCR functionality would be implemented here using Tesseract.js or similar library. The image has been processed and text extraction would occur here."
            );
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // This would typically use PDF.js library
          // For demonstration, we'll simulate PDF text extraction
          resolve(`PDF text extraction would be implemented here using PDF.js library. 
                    
File: ${file.name}
Size: ${(file.size / 1024).toFixed(2)} KB
Type: ${file.type}

The PDF content would be extracted and displayed here with proper formatting.`);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  convertFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async showFileViewer(fileData, fileType, title) {
    // Store the file data
    await chrome.storage.local.set({
      fileData: fileData,
      fileType: fileType,
      extractedTitle: title,
      timestamp: Date.now(),
    });

    // Open the viewer window
    chrome.windows.create({
      url: chrome.runtime.getURL("viewer.html"),
      type: "popup",
      width: 800,
      height: 600,
      left: 100,
      top: 100,
    });
  }

  async showTextViewer(text, title) {
    // Store the extracted text
    await chrome.storage.local.set({
      extractedText: text,
      extractedTitle: title,
      timestamp: Date.now(),
    });

    // Open the viewer window
    chrome.windows.create({
      url: chrome.runtime.getURL("viewer.html"),
      type: "popup",
      width: 800,
      height: 600,
      left: 100,
      top: 100,
    });
  }
}

// Initialize the extension when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TermsPopup();
  new TextExtractor();
});
