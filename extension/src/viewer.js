class LegalChatApp {
    constructor() {
        this.messages = [];
        this.document = [];
        this.documentTitle = '';
        this.isLoading = false;
        this.isLoadingDocument = false;
        this.viewMode = 'chat'; // 'chat' or 'read'
        this.readMode = 'normal'; // 'normal' or 'focus'
        this.currentClauseIndex = 0;
        this.selectedText = '';
        this.extractedData = null;
        
        this.API_BASE_URL = 'http://localhost:3000';
        this.AI_ENDPOINT = '/api/ai/chat';
        this.DOCUMENT_ENDPOINT = '/api/ai/document';
        
        this.initializeElements();
        this.attachEventListeners();
        this.init();
    }

    initializeElements() {
        // Main containers
        this.chatModeContainer = document.getElementById('chatModeContainer');
        this.readModeContainer = document.getElementById('readModeContainer');
        this.normalReadContent = document.getElementById('normalReadContent');
        this.focusReadContent = document.getElementById('focusReadContent');
        
        // Navigation elements
        this.chatModeBtn = document.getElementById('chatModeBtn');
        this.readModeBtn = document.getElementById('readModeBtn');
        this.normalReadBtn = document.getElementById('normalReadBtn');
        this.focusReadBtn = document.getElementById('focusReadBtn');
        this.readModeToggle = document.getElementById('readModeToggle');
        
        // Chat elements
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        
        // Document elements
        this.documentContentElement = document.getElementById('documentContent');
        this.documentTitleElement = document.getElementById('documentTitle');
        this.refreshButton = document.getElementById('refreshButton');
        
        // Read mode elements
        this.readDocumentTitleElement = document.getElementById('readDocumentTitle');
        this.readRefreshButton = document.getElementById('readRefreshButton');
        this.readDocumentContent = document.getElementById('readDocumentContent');
        
        // Focus mode elements
        this.focusDocumentTitleElement = document.getElementById('focusDocumentTitle');
        this.focusClauseCounter = document.getElementById('focusClauseCounter');
        this.focusClauseContent = document.getElementById('focusClauseContent');
        this.prevClauseBtn = document.getElementById('prevClauseBtn');
        this.nextClauseBtn = document.getElementById('nextClauseBtn');
        this.focusRefreshButton = document.getElementById('focusRefreshButton');
    }

    attachEventListeners() {
        // Navigation
        this.chatModeBtn.addEventListener('click', () => this.switchToMode('chat'));
        this.readModeBtn.addEventListener('click', () => this.switchToMode('read'));
        this.normalReadBtn.addEventListener('click', () => this.switchReadMode('normal'));
        this.focusReadBtn.addEventListener('click', () => this.switchReadMode('focus'));
        
        // Chat functionality
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        
        // Document refresh
        this.refreshButton.addEventListener('click', () => this.init());
        this.readRefreshButton.addEventListener('click', () => this.init());
        this.focusRefreshButton.addEventListener('click', () => this.init());
        
        // Focus mode navigation
        this.prevClauseBtn.addEventListener('click', () => this.handlePrevClause());
        this.nextClauseBtn.addEventListener('click', () => this.handleNextClause());
        
        // Document selection handling
        document.addEventListener('mouseup', () => this.handleTextSelection());
        
        // Keyboard shortcuts for focus mode
        document.addEventListener('keydown', (e) => {
            if (this.viewMode === 'read' && this.readMode === 'focus') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.handlePrevClause();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.handleNextClause();
                }
            }
        });
    }

    async init() {
    try {
        // Ensure we are in a Chrome extension environment
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            
            // Fetch all necessary data, including additional metadata
            const data = await chrome.storage.local.get([
                'extractedText', 
                'extractedTitle', 
                'timestamp', 
                'fileName', 
                'fileType', 
                'extractionTimestamp'
            ]);
            
            if (data.extractedText) {
                // Set this.extractedData with comprehensive metadata
                this.extractedData = {
                    text: data.extractedText,
                    title: data.extractedTitle || 'Extracted Content',
                    timestamp: data.timestamp,
                    fileName: data.fileName,
                    fileType: data.fileType,
                    extractionTimestamp: data.extractionTimestamp
                };
                
                // Create the object with the structure that displayProcessedContent expects
                const processedDocument = {
                    content: data.extractedText, 
                    title: data.extractedTitle || 'Extracted Content'
                };
                
                // Set the title and display the content
                this.setDocumentTitle(processedDocument.title);
                this.displayProcessedContent(processedDocument);

                console.log('Successfully loaded extracted document:', {
                    title: this.extractedData.title,
                    textLength: this.extractedData.text.length,
                    timestamp: new Date(this.extractedData.timestamp).toLocaleString()
                });

            } else {
                // If no extracted text is found in storage, show appropriate message
                this.loadDocument();
            }
        } else {
            // Fallback for non-extension environments
            this.loadDocument();
        }
    } catch (error) {
        console.error('Error loading extracted content:', error);
        // If there's an error, show error message and load fallback
        this.showDocumentError('Error loading document content. Please try uploading again.');
    }
}

    _formatTextToHtml(text) {
        // Sanitize text to prevent rendering unintended HTML
        let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Split the entire text into blocks based on double newlines (paragraphs)
        const blocks = safeText.split(/\n\n+/);
        
        let html = '';
        
        blocks.forEach(block => {
            const trimmedBlock = block.trim();
            if (trimmedBlock) {
                if (trimmedBlock.startsWith('## ')) {
                    // It's a main heading (H2)
                    html += `<h2>${trimmedBlock.substring(3)}</h2>`;
                } else if (trimmedBlock.startsWith('### ')) {
                    // It's a sub-heading (H3)
                    html += `<h3>${trimmedBlock.substring(4)}</h3>`;
                } else {
                    // It's a paragraph. Replace single newlines within the paragraph with <br>.
                    const paragraphHtml = trimmedBlock.replace(/\n/g, '<br>');
                    html += `<p>${paragraphHtml}</p>`;
                }
            }
        });
        
        return html || '<p>No legal text found or content is empty.</p>';
    }

    async loadExtractedData() {
        try {
            // Check if we're in a Chrome extension environment
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const data = await chrome.storage.local.get(['extractedText', 'extractedTitle', 'timestamp', 'fileData', 'fileType']);
                
                if (data.extractedText || data.fileData) {
                    this.extractedData = {
                        text: data.extractedText || '',
                        title: data.extractedTitle || 'Extracted Content',
                        timestamp: data.timestamp,
                        fileData: data.fileData,
                        fileType: data.fileType
                    };
                    
                    // Send extracted text to backend API
                    const processedDocument = await this.sendDocumentToBackend(this.extractedData.text);
                    
                    // Update document title to show extracted content
                    this.setDocumentTitle(this.extractedData.title);
                    
                    // Display the processed content from the backend
                    this.displayProcessedContent(processedDocument);
                    return true;
                }
            } else {
                console.log('Chrome storage not available - running outside extension');
            }
        } catch (error) {
            console.error('Error loading extracted content:', error);
        }
        return false;
    }

    displayProcessedContent(processedDocument) {
        if (!processedDocument) {
            this.showDocumentError('No document content available to display.');
            return;
        }

        // Parse the processed content into clauses for document structure
        if (processedDocument.content) {
            const paragraphs = processedDocument.content.split('\n\n').filter(p => p.trim());
            
            // Update document array for consistency with better structure
            this.document = paragraphs.map((paragraph, index) => ({
                id: `clause-${index}`,
                text: paragraph.trim(),
                index: index + 1
            }));
            
            // Render all document views with the extracted content
            this.renderAllDocumentViews();
            
            console.log(`Document processed: ${this.document.length} sections found`);
        } else {
            this.showDocumentError('Document content is empty or could not be processed.');
        }
    }

    switchToMode(mode) {
        this.viewMode = mode;
        this.updateModeDisplay();
    }

    switchReadMode(mode) {
        this.readMode = mode;
        this.updateReadModeDisplay();
    }

    updateModeDisplay() {
        // Update button states
        this.chatModeBtn.className = this.viewMode === 'chat' 
            ? 'mode-btn mode-btn-active' 
            : 'mode-btn';
        this.readModeBtn.className = this.viewMode === 'read' 
            ? 'mode-btn mode-btn-active' 
            : 'mode-btn';
        
        // Show/hide containers
        this.chatModeContainer.style.display = this.viewMode === 'chat' ? 'flex' : 'none';
        this.readModeContainer.style.display = this.viewMode === 'read' ? 'flex' : 'none';
        
        // Show/hide read mode toggle
        this.readModeToggle.style.display = this.viewMode === 'read' ? 'flex' : 'none';
        
        if (this.viewMode === 'read') {
            this.updateReadModeDisplay();
        }
    }

    updateReadModeDisplay() {
        // Update read mode button states
        this.normalReadBtn.className = this.readMode === 'normal' 
            ? 'read-mode-btn read-mode-btn-active' 
            : 'read-mode-btn';
        this.focusReadBtn.className = this.readMode === 'focus' 
            ? 'read-mode-btn read-mode-btn-active' 
            : 'read-mode-btn';
        
        // Show/hide read mode content
        this.normalReadContent.style.display = this.readMode === 'normal' ? 'flex' : 'none';
        this.focusReadContent.style.display = this.readMode === 'focus' ? 'flex' : 'none';
        
        if (this.readMode === 'focus') {
            this.updateFocusMode();
        }
    }

    updateFocusMode() {
        if (this.document.length > 0 && this.currentClauseIndex < this.document.length) {
            const clause = this.document[this.currentClauseIndex];
            this.focusClauseCounter.textContent = `Clause ${this.currentClauseIndex + 1} of ${this.document.length}`;
            
            this.focusClauseContent.innerHTML = `
                <div class="focus-clause" data-clause-id="${clause.id}">
                    <div class="focus-clause-content">
                        <span class="focus-clause-number">${clause.index}</span>
                        <div class="focus-clause-text">${this.escapeHtml(clause.text)}</div>
                    </div>
                </div>
            `;
            
            // Update navigation button states
            this.prevClauseBtn.disabled = this.currentClauseIndex === 0;
            this.nextClauseBtn.disabled = this.currentClauseIndex === this.document.length - 1;
        }
    }

    handlePrevClause() {
        if (this.currentClauseIndex > 0) {
            this.currentClauseIndex--;
            this.updateFocusMode();
        }
    }

    handleNextClause() {
        if (this.currentClauseIndex < this.document.length - 1) {
            this.currentClauseIndex++;
            this.updateFocusMode();
        }
    }

    handleTextSelection() {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const text = selection.toString().trim();
            this.selectedText = text;
            
            // Auto-explain selected text
            const question = `Explain this selected text in simple terms: "${text}"`;
            if (this.viewMode === 'chat') {
                this.addMessage(question, 'user');
            } else {
                // Switch to chat mode and add the question
                this.switchToMode('chat');
                setTimeout(() => {
                    this.addMessage(question, 'user');
                }, 100);
            }
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
    }

    async addMessage(text, sender) {
        const message = {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();

        if (this.messages.length === 1) {
            this.welcomeMessage.style.display = 'none';
        }

        if (sender === 'user') {
            this.setLoading(true);
            try {
                const aiResponse = await this.sendToAI(text);
                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    sender: 'ai',
                    timestamp: new Date()
                };
                
                this.messages.push(aiMessage);
                this.renderMessage(aiMessage);
                this.scrollToBottom();
            } catch (error) {
                console.error('Error getting AI response:', error);
                const errorMessage = {
                    id: (Date.now() + 1).toString(),
                    text: 'Sorry, I encountered an error processing your request. Please try again.',
                    sender: 'ai',
                    timestamp: new Date()
                };
                
                this.messages.push(errorMessage);
                this.renderMessage(errorMessage);
                this.scrollToBottom();
            } finally {
                this.setLoading(false);
            }
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        this.messagesContainer.appendChild(messageDiv);
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.sendButton.disabled = isLoading;
        this.messageInput.disabled = isLoading;

        if (isLoading) {
            this.showLoadingMessage();
        } else {
            this.hideLoadingMessage();
        }
    }

    showLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = `
            <div class="message-bubble">
                <div class="loading-message">
                    <div class="spinner"></div>
                    <span>AI is thinking...</span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(loadingDiv);
        this.scrollToBottom();
    }

    hideLoadingMessage() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    async sendToAI(message) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.AI_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: message
                        }
                    ]
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || data.message || 'Sorry, I could not process your request.';
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async loadDocument() {
        // This function is now a fallback that shows a clear message.
        this.isLoadingDocument = false;
        this.setDocumentLoading(false);
        this.setDocumentTitle('No Document Loaded');
        this.showDocumentError('Please upload a document using the extension icon to get started.');
    }

    setDocumentTitle(title) {
        // Fixed: Set textContent on DOM elements, not on string properties
        if (this.documentTitleElement) this.documentTitleElement.textContent = title;
        if (this.readDocumentTitleElement) this.readDocumentTitleElement.textContent = title;
        if (this.focusDocumentTitleElement) this.focusDocumentTitleElement.textContent = title;
    }

    setDocumentLoading(isLoading) {
        if (this.refreshButton) this.refreshButton.disabled = isLoading;
        if (this.readRefreshButton) this.readRefreshButton.disabled = isLoading;
        if (this.focusRefreshButton) this.focusRefreshButton.disabled = isLoading;
        
        if (isLoading) {
            this.showDocumentLoading();
        }
    }

    renderAllDocumentViews() {
        this.renderChatDocument();
        this.renderReadDocument();
        this.updateFocusMode();
    }

    renderChatDocument() {
        if (!this.documentContentElement) return;
        
        // Add metadata header if available
        let metadataHtml = '';
        if (this.extractedData?.timestamp) {
            const date = new Date(this.extractedData.timestamp);
            metadataHtml = `
                <div style="background: #eff6ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: #1e40af; border-left: 4px solid #2563eb;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">${this.escapeHtml(this.extractedData.title)}</div>
                    <div>Extracted on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
                    ${this.extractedData.fileName ? `<div>File: ${this.escapeHtml(this.extractedData.fileName)}</div>` : ''}
                </div>
            `;
        }
        
        const clausesHtml = this.document.map(clause => `
            <div class="clause" data-clause-id="${clause.id}">
                <div class="clause-tooltip">Click to explain</div>
                <div class="clause-content">
                    <div class="clause-number">${clause.index}</div>
                    <div class="clause-text">${this.escapeHtml(clause.text)}</div>
                </div>
            </div>
        `).join('');

        this.documentContentElement.innerHTML = `
            <div>
                ${metadataHtml}
                ${clausesHtml}
                <div class="tip-box">
                    <p><strong>💡 Tip:</strong> Click on any numbered clause to get an AI explanation in simple terms. You can also type questions directly in the chat.</p>
                </div>
            </div>
        `;

        this.documentContentElement.querySelectorAll('.clause').forEach(clauseElement => {
            clauseElement.addEventListener('click', (e) => {
                const clauseId = e.currentTarget.dataset.clauseId;
                const clause = this.document.find(c => c.id === clauseId);
                if (clause) {
                    this.handleClauseClick(clause);
                }
            });
        });
    }

    renderReadDocument() {
        if (!this.readDocumentContent || !this.extractedData?.text) {
            this.readDocumentContent.innerHTML = '<p>No content available to display.</p>';
            return;
        }
        
        // Add metadata header if available
        let metadataHtml = '';
        if (this.extractedData.timestamp) {
            const date = new Date(this.extractedData.timestamp);
            metadataHtml = `
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: #6b7280; border-left: 4px solid #059669;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">${this.escapeHtml(this.extractedData.title)}</div>
                    <div>Extracted on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
                    ${this.extractedData.fileName ? `<div>File: ${this.escapeHtml(this.extractedData.fileName)}</div>` : ''}
                </div>
            `;
        }
        
        // Use the formatting function to generate HTML from the raw text
        const formattedHtml = this._formatTextToHtml(this.extractedData.text);

        // Set the innerHTML of the read mode container
        this.readDocumentContent.innerHTML = `
            <div class="read-document-wrapper">
                ${metadataHtml}
                ${formattedHtml}
                <div class="read-tip-box">
                    <p><strong>💡 Reading Mode:</strong> Select any text in the document to get an AI explanation. Use Focus Mode for clause-by-clause reading.</p>
                </div>
            </div>
        `;
    }

    handleClauseClick(clause) {
        const question = `Explain this clause in simple terms: ${clause.text}`;
        this.messageInput.value = question;
        this.handleSendMessage();
    }

    showDocumentError(message = 'Failed to load document. Please try refreshing.') {
        const errorHtml = `
            <div class="clause" style="cursor: default;">
                <div class="clause-content">
                    <div class="clause-number" style="background: #fee2e2; color: #b91c1c;">!</div>
                    <div class="clause-text">${this.escapeHtml(message)}</div>
                </div>
            </div>
        `;
        
        if (this.documentContentElement) this.documentContentElement.innerHTML = errorHtml;
        if (this.readDocumentContent) this.readDocumentContent.innerHTML = errorHtml;
        if (this.focusClauseContent) this.focusClauseContent.innerHTML = errorHtml;
    }

    showDocumentError() {
        const errorHtml = `
            <div class="clause">
                <div class="clause-content">
                    <div class="clause-number">!</div>
                    <div class="clause-text">Failed to load document from API. Please try refreshing.</div>
                </div>
            </div>
        `;
        
        if (this.documentContentElement) this.documentContentElement.innerHTML = errorHtml;
        if (this.readDocumentContent) this.readDocumentContent.innerHTML = errorHtml;
        if (this.focusClauseContent) this.focusClauseContent.innerHTML = errorHtml;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LegalChatApp();
});