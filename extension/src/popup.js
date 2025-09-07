// Authentication functionality
document.addEventListener("DOMContentLoaded", function () {
  const loginArea = document.querySelector(".loginArea");
  const loggedInArea = document.querySelector(".loggedInArea");
  const loadingElement = document.querySelector(".loading");
  const userEmailElement = document.getElementById("userEmail");
  const googleLoginBtn = document.querySelector(".google-login-btn");
  const logoutBtn = document.querySelector(".logout-btn");

  // Check authentication status
  checkAuthStatus();

  // Google login button event listener
  googleLoginBtn.addEventListener("click", function () {
    loadingElement.style.display = "block";
    loginArea.style.display = "none";
    googleLogin();
  });

  // Logout button event listener
  logoutBtn.addEventListener("click", function () {
    loadingElement.style.display = "block";
    logout();
  });

  // Check authentication status
  function checkAuthStatus() {
    loadingElement.style.display = "block";

    chrome.runtime.sendMessage({ command: "checkAuth" }, (response) => {
      loadingElement.style.display = "none";

      if (chrome.runtime.lastError) {
        console.error("Error checking auth:", chrome.runtime.lastError);
        loginArea.style.display = "block";
        return;
      }

      if (response && response.status === "success") {
        loggedInArea.style.display = "block";
        loginArea.style.display = "none";
        userEmailElement.textContent = response.message?.email || "User";
      } else {
        loggedInArea.style.display = "none";
        loginArea.style.display = "block";
      }
    });
  }

  // Google login function
  function googleLogin() {
    chrome.runtime.sendMessage({ command: "googleLogin" }, (response) => {
      loadingElement.style.display = "none";

      if (chrome.runtime.lastError) {
        console.error("Google login error:", chrome.runtime.lastError);
        loginArea.style.display = "block";
        alert("Google login failed: " + chrome.runtime.lastError.message);
        return;
      }

      if (response && response.status === "success") {
        loggedInArea.style.display = "block";
        loginArea.style.display = "none";
        userEmailElement.textContent = response.message?.email || "User";
      } else {
        loggedInArea.style.display = "none";
        loginArea.style.display = "block";
        alert(
          "Google login failed: " +
            (response?.error?.message || "Unknown error")
        );
      }
    });
  }

  // Logout function
  function logout() {
    chrome.runtime.sendMessage({ command: "logoutAuth" }, (response) => {
      loadingElement.style.display = "none";

      if (chrome.runtime.lastError) {
        console.error("Logout error:", chrome.runtime.lastError);
      }

      loggedInArea.style.display = "none";
      loginArea.style.display = "block";
    });
  }
});

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
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshDetection();
    });

    document.getElementById("openTermsBtn").addEventListener("click", () => {
      this.openFirstTermsLink();
    });
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  async analyzeTermsSeverity(termsText) {
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: termsText,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      // Extract the severity text from the response
      const severityText = data.choices[0].message.content.trim();
      return severityText;
    } catch (error) {
      console.error("Error analyzing terms severity:", error);
      return null;
    }
  }

  showSeverityAlert(severityText) {
    // Parse the severity text which might be a list
    const severities = severityText.split(",").map((s) => s.trim());
    let overallSeverity = "Low";
    if (severities.includes("High")) {
      overallSeverity = "High";
    } else if (severities.includes("Medium")) {
      overallSeverity = "Medium";
    }

    alert(`Terms and Conditions Severity: ${overallSeverity}`);
  }

  async loadDetectionData() {
    try {
      const tab = await this.getCurrentTab();

      // Check if tab URL is supported
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        this.showEmptyState();
        return;
      }

      // First try to inject the content script if it's not already there
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (injectionError) {
        // Content script might already be injected, continue
        console.log(
          "Content script injection skipped:",
          injectionError.message
        );
      }

      // Wait a moment for content script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to get data from content script with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: "getDetectionData" }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        ),
      ]);

      if (response && response.timestamp) {
        this.currentData = response;
        this.displayResults();
      } else {
        // Trigger new detection
        this.refreshDetection();
      }
    } catch (error) {
      console.warn("Could not load detection data:", error.message);

      // Try fallback: check sessionStorage
      try {
        const tab = await this.getCurrentTab();
        const fallbackData = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            try {
              const stored = sessionStorage.getItem("termsDetectorData");
              return stored ? JSON.parse(stored) : null;
            } catch (e) {
              return null;
            }
          },
        });

        if (fallbackData[0]?.result) {
          this.currentData = fallbackData[0].result;
          this.displayResults();
          return;
        }
      } catch (fallbackError) {
        console.warn("Fallback also failed:", fallbackError.message);
      }

      this.showEmptyState();
    }
  }

  async sendTermsToBackend(data) {
    try {
      // We will serialize the detected data to send it for analysis.
      const contentToAnalyze = JSON.stringify(data, null, 2);

      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // FIX: The body is now structured correctly for the backend API.
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: contentToAnalyze,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      // The backend returns the full API response from OpenRouter.
      // We need to extract the content from the first choice.
      const severityText = result.choices[0]?.message?.content.trim();
      return severityText || null;

    } catch (error) {
      console.error("Error sending data to backend:", error);
      this.showStatus(
        "Could not connect to severity analysis service",
        "error"
      );
      return null;
    }
  }

  async refreshDetection() {
    this.showLoading();

    try {
      const tab = await this.getCurrentTab();

      // Check if tab URL is supported
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        this.showEmptyState();
        return;
      }

      // Ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (injectionError) {
        console.log(
          "Content script injection skipped:",
          injectionError.message
        );
      }

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger re-detection with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: "redetect" }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Detection timeout")), 5000)
        ),
      ]);

      if (response) {
        this.currentData = response;
        this.displayResults();
      } else {
        // Manual detection fallback
        const detectionResult = await this.manualDetection(tab.id);
        if (detectionResult) {
          this.currentData = detectionResult;
          this.displayResults();
        } else {
          this.showEmptyState();
        }
      }
    } catch (error) {
      console.error("Refresh failed:", error.message);

      // Try manual detection as last resort
      try {
        const tab = await this.getCurrentTab();
        const detectionResult = await this.manualDetection(tab.id);
        if (detectionResult) {
          this.currentData = detectionResult;
          this.displayResults();
        } else {
          this.showEmptyState();
        }
      } catch (manualError) {
        console.error("Manual detection also failed:", manualError.message);
        this.showEmptyState();
      }
    }
  }

  // Add this helper method to the TermsPopup class
  async manualDetection(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          // Inline detection logic as fallback
          const config = {
            termsKeywords: [
              "terms",
              "privacy",
              "policy",
              "agreement",
              "cookie",
              "condition",
              "notice",
              "legal",
            ],
            acceptKeywords: [
              "accept",
              "agree",
              "continue",
              "confirm",
              "submit",
              "acknowledge",
              "consent",
            ],
          };

          // Detect terms links
          const links = document.querySelectorAll("a[href]");
          const termsLinks = [];

          links.forEach((link) => {
            const text = (link.textContent + " " + link.href).toLowerCase();
            const hasTermsKeyword = config.termsKeywords.some((keyword) =>
              text.includes(keyword)
            );

            if (hasTermsKeyword) {
              termsLinks.push({
                text: link.textContent.trim(),
                href: link.href,
              });
            }
          });

          // Detect acceptance elements
          const acceptanceElements = [];
          const interactiveElements = document.querySelectorAll(
            'button, input[type="submit"], input[type="button"], input[type="checkbox"]'
          );

          interactiveElements.forEach((element) => {
            let textToCheck = element.textContent || element.value || "";

            if (element.type === "checkbox") {
              const label =
                document.querySelector(`label[for="${element.id}"]`) ||
                element.closest("label") ||
                element.parentElement;
              if (label) textToCheck += " " + label.textContent;
            }

            textToCheck = textToCheck.toLowerCase();

            const hasAcceptKeyword = config.acceptKeywords.some((keyword) =>
              textToCheck.includes(keyword)
            );
            const hasTermsReference = config.termsKeywords.some((keyword) =>
              textToCheck.includes(keyword)
            );

            if (hasAcceptKeyword || hasTermsReference) {
              acceptanceElements.push({
                type: element.tagName.toLowerCase(),
                inputType: element.type || null,
                text: (element.textContent || element.value || "").trim(),
              });
            }
          });

          return {
            termsLinks,
            acceptanceElements,
            termsContent: null,
            timestamp: Date.now(),
            hasTermsAndAcceptance:
              termsLinks.length > 0 && acceptanceElements.length > 0,
          };
        },
      });

      return results[0]?.result || null;
    } catch (error) {
      console.error("Manual detection failed:", error);
      return null;
    }
  }

  showLoading() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("emptyState").style.display = "none";
  }

  showEmptyState() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("results").style.display = "none";
    document.getElementById("emptyState").style.display = "block";
  }

  showSeverityAlert(severity) {
    // You can customize this alert as needed
    const alertMessage = `Terms Severity: ${severity.toUpperCase()}\n\n`;

    switch (severity) {
      case "high":
        alert(
          alertMessage + "Warning: These terms may contain concerning clauses."
        );
        break;
      case "medium":
        alert(
          alertMessage + "Note: Review these terms carefully before accepting."
        );
        break;
      case "low":
        alert(alertMessage + "These terms appear to be standard.");
        break;
      default:
        alert(alertMessage + "Severity assessment completed.");
    }
  }

  displayResults() {
    const {
      termsLinks,
      acceptanceElements,
      termsContent,
      hasTermsAndAcceptance,
    } = this.currentData;

    document.getElementById("loading").style.display = "none";
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("results").style.display = "block";

    // Update status card
    this.updateStatusCard(
      hasTermsAndAcceptance,
      termsLinks.length,
      acceptanceElements.length
    );

    if (termsContent && !termsContent.error && termsContent.summary) {
      this.analyzeTermsSeverity(termsContent.summary)
        .then((severity) => {
          if (severity) {
            this.showSeverityAlert(severity);
          }
        })
        .catch((error) => {
          console.error("Failed to analyze severity:", error);
        });
    }
    // Send data to backend if terms detected
    if (hasTermsAndAcceptance || termsLinks.length > 0) {
      this.sendTermsToBackend(this.currentData).then((severity) => {
        if (severity) {
          this.showSeverityAlert(severity);
        }
      });
    }

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
    const openBtn = document.getElementById("openTermsBtn");
    if (termsLinks.length > 0) {
      openBtn.style.display = "block";
      openBtn.setAttribute("data-url", termsLinks[0].href);
    } else {
      openBtn.style.display = "none";
    }
  }

  updateStatusCard(hasTermsAndAcceptance, termsCount, acceptanceCount) {
    const statusCard = document.getElementById("statusCard");
    const statusText = document.getElementById("statusText");
    const statusInfo = document.getElementById("statusInfo");

    if (hasTermsAndAcceptance) {
      statusCard.className = "status-card detected";
      statusText.textContent = "⚠️ Terms & Acceptance Detected!";
      statusInfo.textContent =
        "This page contains terms/policies and requires acceptance.";
    } else if (termsCount > 0 || acceptanceCount > 0) {
      statusCard.className = "status-card none";
      statusText.textContent = "📄 Terms or Policies Found";
      statusInfo.textContent = `Found ${termsCount} terms links and ${acceptanceCount} acceptance elements.`;
    } else {
      statusCard.className = "status-card none";
      statusText.textContent = "✅ No Terms Detected";
      statusInfo.textContent =
        "This page appears to be clear of terms/policies.";
    }
  }

  displayTermsLinks(termsLinks) {
    const section = document.getElementById("termsSection");
    const container = document.getElementById("termsLinks");
    const count = document.getElementById("termsCount");

    count.textContent = termsLinks.length;
    section.style.display = "block";

    container.innerHTML = termsLinks
      .map(
        (link) => `
      <div class="link-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#1976d2">
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
        </svg>
        <a href="${link.href}" class="link-text" target="_blank" title="${
          link.href
        }">
          ${this.truncateText(link.text, 40)}
        </a>
      </div>
    `
      )
      .join("");
  }

  displayAcceptanceElements(acceptanceElements) {
    const section = document.getElementById("acceptanceSection");
    const container = document.getElementById("acceptanceElements");
    const count = document.getElementById("acceptanceCount");

    count.textContent = acceptanceElements.length;
    section.style.display = "block";

    container.innerHTML = acceptanceElements
      .map(
        (element) => `
      <div class="element-item">
        <span class="element-type">${element.type.toUpperCase()}</span>
        ${this.truncateText(element.text, 50)}
      </div>
    `
      )
      .join("");
  }

  displayTermsContent(termsContent) {
    const section = document.getElementById("contentSection");
    const textContainer = document.getElementById("termsText");
    const urlContainer = document.getElementById("contentUrl");

    section.style.display = "block";

    if (termsContent.error) {
      textContainer.textContent = `Error: ${termsContent.error}`;
      textContainer.style.color = "#dc3545";
    } else {
      textContainer.textContent = termsContent.summary;
      textContainer.style.color = "#333";

      if (termsContent.fullLength) {
        const info = document.createElement("div");
        info.className = "info-text";
        info.style.marginTop = "10px";
        info.textContent = `Showing preview of ${termsContent.fullLength.toLocaleString()} characters`;
        textContainer.appendChild(info);
      }
    }

    urlContainer.textContent = `Source: ${termsContent.url}`;
  }

  truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
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

    document.getElementById("extractSelection").addEventListener("click", () => {
        this.extractSelection();
    });

    // Replace image/PDF upload with document upload
    document.getElementById("uploadDocument").addEventListener("click", () => {
        document.getElementById("documentFile").click();
    });

    document.getElementById("documentFile").addEventListener("change", (e) => {
        this.handleDocumentUpload(e.target.files[0]);
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

  async handleDocumentUpload(file) {
    if (!file) return;

    this.showStatus("Uploading document...", "loading");

    try {
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch('http://localhost:3000/api/ai/document', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || "Failed to process document");
        }

        // Store the processed content
        await chrome.storage.local.set({
            extractedText: result.content,
            extractedTitle: result.title || `Uploaded: ${file.name}`,
            timestamp: Date.now(),
        });

        // Open the viewer
        chrome.windows.create({
            url: chrome.runtime.getURL("viewer.html"),
            type: "popup",
            width: 800,
            height: 600,
            left: 100,
            top: 100,
        });

        this.showStatus("✅ Document processed!", "success");
    } catch (error) {
        console.error("Error uploading document:", error);
        this.showStatus(`❌ ${error.message}`, "error");
    }
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
