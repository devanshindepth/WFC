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

    document.getElementById("openChatBtn").addEventListener("click", () => {
      this.openChatInterface();
    });

    document
      .getElementById("analyzeSeverityBtn")
      .addEventListener("click", () => {
        this.analyzeSeverity();
      });
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  async analyzeSeverity() {
    if (
      !this.currentData ||
      (!this.currentData.termsLinks.length &&
        !this.currentData.acceptanceElements.length)
    ) {
      this.showSeverityError("No terms detected to analyze");
      return;
    }

    this.showSeverityLoading(true);

    try {
      // Prepare data for analysis
      const analysisData = {
        termsLinks: this.currentData.termsLinks,
        acceptanceElements: this.currentData.acceptanceElements,
        termsContent: this.currentData.termsContent,
        url: window.location.href,
        timestamp: this.currentData.timestamp,
      };

      const response = await fetch("http://localhost:3000/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: JSON.stringify(analysisData, null, 2),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const severityText = data.choices[0]?.message?.content?.trim();

      if (severityText) {
        this.displaySeverityResult(severityText);
      } else {
        this.showSeverityError("No severity analysis received");
      }
    } catch (error) {
      console.error("Error analyzing severity:", error);
      this.showSeverityError(
        "Failed to analyze terms severity. Please try again."
      );
    } finally {
      this.showSeverityLoading(false);
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

  showSeverityLoading(show) {
    const loadingElement = document.querySelector(".severity-loading");
    const resultElement = document.getElementById("severityResult");

    if (show) {
      loadingElement.style.display = "block";
      resultElement.style.display = "none";
    } else {
      loadingElement.style.display = "none";
      resultElement.style.display = "block";
    }
  }

  showSeverityError(message) {
    const resultElement = document.getElementById("severityResult");
    resultElement.innerHTML = `
      <div style="color: #dc2626; font-size: 12px; padding: 10px; background: #fee2e2; border-radius: 4px;">
        ⚠️ ${message}
      </div>
    `;
    this.showSeverityLoading(false);
  }

  displaySeverityResult(severityText) {
    const resultElement = document.getElementById("severityResult");

    // Parse severity levels from the response
    const severities = severityText
      .split(",")
      .map((s) => s.trim().toLowerCase());
    const uniqueSeverities = [...new Set(severities)];

    // Count occurrences
    const severityCounts = {
      high: severities.filter((s) => s === "high").length,
      medium: severities.filter((s) => s === "medium").length,
      low: severities.filter((s) => s === "low").length,
    };

    // Determine overall severity
    let overallSeverity = "low";
    if (severityCounts.high > 0) {
      overallSeverity = "high";
    } else if (severityCounts.medium > 0) {
      overallSeverity = "medium";
    }

    // Create severity badges
    const badges = uniqueSeverities
      .map((severity) => {
        const count = severityCounts[severity];
        if (count > 0) {
          return `<span class="severity-badge severity-${severity}">${severity} (${count})</span>`;
        }
        return "";
      })
      .filter((badge) => badge)
      .join("");

    // Create summary message
    let summaryMessage = "";
    switch (overallSeverity) {
      case "high":
        summaryMessage =
          "⚠️ High risk detected. Review these terms carefully before accepting.";
        break;
      case "medium":
        summaryMessage =
          "⚡ Medium risk detected. Consider reviewing the highlighted clauses.";
        break;
      case "low":
        summaryMessage =
          "✅ Low risk detected. These terms appear to be standard.";
        break;
    }

    resultElement.innerHTML = `
      <div class="severity-badges" style="margin-bottom: 10px;">
        ${badges}
      </div>
      <div class="severity-summary">
        ${summaryMessage}
      </div>
    `;
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

    // Display terms links
    if (termsLinks.length > 0) {
      this.displayTermsLinks(termsLinks);
    }

    // Display acceptance elements
    if (acceptanceElements.length > 0) {
      this.displayAcceptanceElements(acceptanceElements);
    }

    // Show severity analysis section if terms are detected
    if (hasTermsAndAcceptance || termsLinks.length > 0) {
      this.showSeveritySection();
    }

    // Show/hide open chat button
    const openBtn = document.getElementById("openChatBtn");
    if (hasTermsAndAcceptance || termsLinks.length > 0) {
      openBtn.style.display = "block";
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

  showSeveritySection() {
    const section = document.getElementById("severitySection");
    const resultElement = document.getElementById("severityResult");

    section.style.display = "block";

    // Reset the result area
    resultElement.innerHTML = `
      <div style="color: #6b7280; font-size: 12px; text-align: center; padding: 20px;">
        Click "Analyze Terms Severity" to get AI-powered risk assessment
      </div>
    `;
  }

  truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  async fetchFullTermsContent() {
    const { termsLinks } = this.currentData;
    const fullContent = [];

    for (const link of termsLinks) {
      try {
        // Fetch the actual terms page content
        const response = await fetch(link.href);
        const html = await response.text();

        // Extract text from HTML (you'll need to parse this)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const textContent = doc.body.innerText || doc.body.textContent;

        fullContent.push({
          title: link.text,
          url: link.href,
          content: textContent,
        });
      } catch (error) {
        console.error(`Failed to fetch content from ${link.href}:`, error);
      }
    }

    return fullContent;
  }

  async openChatInterface() {
    if (!this.currentData) {
      console.error("No terms data available to open chat");
      return;
    }

    try {
      // Get current tab info for better context
      const tab = await this.getCurrentTab();

      const fullTermsContent = await this.fetchFullTermsContent();

      const formattedTermsData = await this.formatTermsForChat(
        {
          ...this.currentData,
          fullTermsContent: fullTermsContent,
        },
        tab
      );

      // Store the formatted terms data in chrome storage for the viewer to access
      await chrome.storage.local.set({
        extractedText: formattedTermsData.text,
        extractedTitle: formattedTermsData.title,
        timestamp: Date.now(),
        fileName: "Terms & Conditions Analysis",
        fileType: "text/plain",
        extractionTimestamp: this.currentData.timestamp,
        sourceUrl: tab?.url || "Unknown",
      });

      // Open the viewer window (chat interface)
      const viewerWindow = await chrome.windows.create({
        url: chrome.runtime.getURL("viewer.html"),
        type: "popup",
        width: 1000,
        height: 700,
        left: Math.max(0, Math.round((screen.width - 1000) / 2)),
        top: Math.max(0, Math.round((screen.height - 700) / 2)),
        focused: true,
      });

      if (viewerWindow && viewerWindow.id) {
        console.log(
          `Chat interface opened successfully with ID: ${viewerWindow.id}`
        );
      } else {
        throw new Error("Failed to create chat interface window");
      }
    } catch (error) {
      console.error("Error opening chat interface:", error);

      // Fallback: try to open in a new tab
      try {
        await chrome.tabs.create({
          url: chrome.runtime.getURL("viewer.html"),
          active: true,
        });
        console.log("Chat interface opened in new tab as fallback");
      } catch (tabError) {
        console.error("Error opening chat interface tab:", tabError);
        alert(
          "Could not open chat interface. Please try refreshing the extension."
        );
      }
    }
  }

  formatTermsForChat(data, tab = null) {
    const { termsLinks, acceptanceElements, termsContent, fullTermsContent } =
      data;

    let formattedText = "# Terms & Conditions Analysis\n\n";

    // Add current page info
    let hostname = "Current webpage";
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        hostname = url.hostname;
      } catch (e) {
        hostname = "Current webpage";
      }
    }

    formattedText += `**Analyzed Page:** ${hostname}\n`;
    formattedText += `**Analysis Time:** ${new Date(
      data.timestamp
    ).toLocaleString()}\n\n`;

    formattedText += "---\n\n";

    // Add detection summary with emojis for better readability
    formattedText += "## 📊 Detection Summary\n\n";
    formattedText += `🔗 **Terms Links Found:** ${termsLinks.length}\n`;
    formattedText += `✅ **Acceptance Elements Found:** ${acceptanceElements.length}\n`;
    formattedText += `⚠️ **Risk Level:** ${
      data.hasTermsAndAcceptance
        ? "High - Terms require acceptance"
        : "Medium - Terms detected"
    }\n\n`;

    // Add terms links section with better formatting
    if (termsLinks.length > 0) {
      formattedText += "## 📄 Terms & Policy Links\n\n";
      termsLinks.forEach((link, index) => {
        formattedText += `### ${index + 1}. ${link.text}\n`;
        formattedText += `**URL:** [${link.href}](${link.href})\n\n`;
      });
    }

    // Add acceptance elements section with better categorization
    if (acceptanceElements.length > 0) {
      formattedText += "## ✍️ Acceptance Elements\n\n";

      // Group by type for better organization
      const groupedElements = acceptanceElements.reduce((groups, element) => {
        const key = element.type.toUpperCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(element);
        return groups;
      }, {});

      Object.entries(groupedElements).forEach(([type, elements]) => {
        formattedText += `### ${type} Elements (${elements.length})\n\n`;
        elements.forEach((element, index) => {
          formattedText += `${index + 1}. `;
          if (element.inputType) {
            formattedText += `**${element.inputType}** - `;
          }
          formattedText += `"${element.text}"\n`;
        });
        formattedText += "\n";
      });
    }

    // Add full terms content if available
    if (fullTermsContent && fullTermsContent.length > 0) {
      formattedText += "## 📖 Full Terms & Conditions Content\n\n";

      fullTermsContent.forEach((termDoc, index) => {
        if (termDoc.content && termDoc.content.trim()) {
          formattedText += `### ${index + 1}. ${termDoc.title}\n\n`;
          formattedText += `**Source URL:** [${termDoc.url}](${termDoc.url})\n\n`;

          // Add the full content
          const cleanContent = termDoc.content.trim();
          formattedText += `**Full Content:**\n\n${cleanContent}\n\n`;

          formattedText += `*📏 Content Length: ${cleanContent.length.toLocaleString()} characters*\n\n`;
          formattedText += "---\n\n";
        }
      });
    } else if (termsContent && !termsContent.error && termsContent.summary) {
      // Fallback to preview content if full content is not available
      formattedText += "## 📖 Terms Content Preview\n\n";

      // Split content into paragraphs for better readability
      const paragraphs = termsContent.summary
        .split("\n\n")
        .filter((p) => p.trim());
      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
          formattedText += `${paragraph.trim()}\n\n`;
        }
      });

      if (termsContent.url) {
        formattedText += `**📍 Source:** [${termsContent.url}](${termsContent.url})\n\n`;
      }
      if (termsContent.fullLength) {
        formattedText += `*📏 Note: This is a preview of ${termsContent.fullLength.toLocaleString()} total characters*\n\n`;
      }
    }

    // Add separator
    formattedText += "---\n\n";

    // Add helpful context for the AI
    formattedText += "## 🤖 AI Analysis Context\n\n";
    formattedText +=
      "This document contains terms and conditions data extracted from a webpage. ";
    formattedText +=
      "The user may ask questions about privacy policies, user agreements, data collection, ";
    formattedText +=
      "cancellation policies, liability clauses, or other legal aspects. ";
    formattedText +=
      "Please provide clear, helpful analysis focusing on user rights and potential risks.\n\n";

    return {
      text: formattedText,
      title: "Terms & Conditions Analysis",
    };
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

    // Update to allow document and image upload
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

    // Validate file type before upload - add image types
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      this.showStatus(
        "❌ Unsupported file type. Please upload .txt, .pdf, .doc, .docx, or image files.",
        "error"
      );
      return;
    }

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      this.showStatus("❌ File too large. Maximum size is 20MB.", "error");
      return;
    }

    this.showStatus("Processing document...", "loading");

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("http://localhost:3000/api/ai/extraction", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to process document");
      }

      // Store the extracted content and metadata properly in chrome.storage.local
      const extractionData = {
        extractedText: result.extractedText,
        extractedTitle: `Uploaded: ${result.fileName}`,
        timestamp: Date.now(),
        fileName: result.fileName,
        fileType: result.fileType || file.type,
        extractionTimestamp: result.timestamp,
      };

      await chrome.storage.local.set(extractionData);

      this.showStatus("✅ Document processed! Opening viewer...", "success");

      // Automatically open viewer window with proper positioning and sizing
      try {
        const viewerWindow = await chrome.windows.create({
          url: chrome.runtime.getURL("viewer.html"),
          type: "popup",
          width: 1000,
          height: 700,
          left: Math.max(0, Math.round((screen.width - 1000) / 2)),
          top: Math.max(0, Math.round((screen.height - 700) / 2)),
          focused: true,
        });

        // Verify viewer window opened successfully
        if (viewerWindow && viewerWindow.id) {
          console.log(
            `Viewer window opened successfully with ID: ${viewerWindow.id}`
          );

          // Update status to show successful completion
          setTimeout(() => {
            this.showStatus("✅ Document ready in viewer!", "success");
          }, 500);
        } else {
          throw new Error("Failed to create viewer window");
        }
      } catch (viewerError) {
        console.error("Error opening viewer window:", viewerError);
        this.showStatus(
          "⚠️ Document processed, but viewer failed to open. Please click the extension icon to view.",
          "error"
        );

        // Fallback: try to open in a new tab if popup fails
        try {
          await chrome.tabs.create({
            url: chrome.runtime.getURL("viewer.html"),
            active: true,
          });
          this.showStatus("✅ Document opened in new tab!", "success");
        } catch (tabError) {
          console.error("Error opening viewer tab:", tabError);
          this.showStatus(
            "❌ Could not open viewer. Document is saved - try refreshing the extension.",
            "error"
          );
        }
      }
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
