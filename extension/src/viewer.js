class LegalChatApp {

            scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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
                    
                    // Update document title to show extracted content
                    this.documentTitle.textContent = this.extractedData.title;
                    
                    // Display the extracted content in the document panel
                    this.displayExtractedContent();
                    return true; // MODIFICATION: Indicate success
                }
            } else {
                console.log('Chrome storage not available - running outside extension');
            }
        } catch (error) {
            console.error('Error loading extracted content:', error);
        }
        return false; // MODIFICATION: Indicate failure
    }

    displayExtractedContent() {
        if (!this.extractedData) return;

        const { text, title, timestamp, fileData, fileType } = this.extractedData;
        
        let contentHtml = '';
        
        // Add timestamp info if available
        if (timestamp) {
            const date = new Date(timestamp);
            contentHtml += `
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: #6b7280;">
                    <strong>${title}</strong><br>
                    Extracted on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}
                </div>
            `;
        }
        
        // Display content based on type
        if (fileData && (fileType === 'pdf' || fileType === 'image')) {
            if (fileType === 'image') {
                contentHtml += `
                    <div class="clause">
                        <div class="clause-content">
                            <div class="clause-number">🖼️</div>
                            <div class="clause-text">
                                <strong>Uploaded Image</strong><br>
                                <img src="${fileData}" style="max-width: 100%; height: auto; margin-top: 0.5rem; border-radius: 0.5rem;" />
                            </div>
                        </div>
                    </div>
                `;
            } else if (fileType === 'pdf') {
                contentHtml += `
                    <div class="clause">
                        <div class="clause-content">
                            <div class="clause-number">📄</div>
                            <div class="clause-text">
                                <strong>Uploaded PDF Document</strong><br>
                                <iframe src="${fileData}" style="width: 100%; height: 400px; margin-top: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"></iframe>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else if (text) {
            // Split text into paragraphs and display as clauses
            const paragraphs = text.split('\n\n').filter(p => p.trim());
            
            paragraphs.forEach((paragraph, index) => {
                if (paragraph.trim()) {
                    contentHtml += `
                        <div class="clause" data-paragraph-index="${index}">
                            <div class="clause-tooltip">Click to discuss</div>
                            <div class="clause-content">
                                <div class="clause-number">${index + 1}</div>
                                <div class="clause-text">${this.escapeHtml(paragraph.trim())}</div>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        contentHtml += `
            <div class="tip-box">
                <p><strong>💡 Tip:</strong> Click on any section to discuss it with the AI, or ask questions directly in the chat.</p>
            </div>
        `;
        
        this.documentContent.innerHTML = contentHtml;
        
        // Add click listeners to paragraphs
        this.documentContent.querySelectorAll('.clause[data-paragraph-index]').forEach(clauseElement => {
            clauseElement.addEventListener('click', (e) => {
                const paragraphIndex = parseInt(e.currentTarget.dataset.paragraphIndex);
                const paragraphs = text.split('\n\n').filter(p => p.trim());
                if (paragraphs[paragraphIndex]) {
                    this.handleExtractedContentClick(paragraphs[paragraphIndex].trim());
                }
            });
        });
    }

    handleExtractedContentClick(content) {
        const question = `Explain this content: ${content}`;
        this.messageInput.value = question;
        this.handleSendMessage();
    }
    
    constructor() {
        this.messages = [];
        this.document = [];
        this.documentTitle = '';
        this.isLoading = false;
        this.isLoadingDocument = false;
        
        this.API_BASE_URL = 'http://localhost:3000';
        this.AI_ENDPOINT = '/api/chat';
        this.DOCUMENT_ENDPOINT = '/api/document';
        
        this.initializeElements();
        this.attachEventListeners();
        this.init(); // MODIFICATION: Call the new init method
    }

    // NEW METHOD: Handles initial data loading logic
    async init() {
        // Try to load from extension storage first
        const loadedFromStorage = await this.loadExtractedData();
        
        // If nothing was loaded, load the default mock document
        if (!loadedFromStorage) {
            this.loadDocument();
        }
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.documentContent = document.getElementById('documentContent');
        this.documentTitle = document.getElementById('documentTitle');
        this.refreshButton = document.getElementById('refreshButton');
        this.welcomeMessage = document.getElementById('welcomeMessage');
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        // MODIFICATION: Refresh button should also try to load extracted data first
        this.refreshButton.addEventListener('click', () => this.init());
    }

    // ... (The rest of your file remains the same from here)

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
        this.setLoading(true);

        try {
            const aiResponse = await this.sendToAI(message);
            this.addMessage(aiResponse, 'ai');
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'ai');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(text, sender) {
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
    }

    async loadDocument() {
        this.isLoadingDocument = true;
        this.refreshButton.disabled = true;
        this.showDocumentLoading();

        try {
            const documentData = await this.fetchLegalDocument();
            this.documentTitle.textContent = documentData.title;
            this.document = documentData.clauses;
            this.renderDocument();
        } catch (error) {
            console.error('Error loading document:', error);
            this.documentTitle.textContent = 'Error Loading Document';
            this.showDocumentError();
        } finally {
            this.isLoadingDocument = false;
            this.refreshButton.disabled = false;
        }
    }

    async fetchLegalDocument() {
        // Mock document - replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    title: 'Terms and Conditions',
                    clauses: [
                        { id: 'clause-1', text: 'By using this service, you agree to be bound by these terms and conditions. These terms constitute a legal agreement between you and the company.', index: 1 },
                        { id: 'clause-2', text: 'The company reserves the right to modify these terms at any time without prior notice. Continued use of the service constitutes acceptance of modified terms.', index: 2 },
                        { id: 'clause-3', text: 'All intellectual property rights in the service and its content are owned by the company. Users may not reproduce, distribute, or create derivative works.', index: 3 },
                        { id: 'clause-4', text: 'The service is provided "as is" without any warranties. The company disclaims all liability for damages arising from use of the service.', index: 4 },
                        { id: 'clause-5', text: 'Users are responsible for maintaining the confidentiality of their account credentials and for all activities under their account.', index: 5 }
                    ]
                });
            }, 1000);
        });
    }

    showDocumentLoading() {
        this.documentContent.innerHTML = `
            <div class="loading-document">
                <div>
                    <div class="spinner"></div>
                    <p>Loading document from API...</p>
                </div>
            </div>
        `;
    }

    showDocumentError() {
        this.documentContent.innerHTML = `
            <div class="clause">
                <div class="clause-content">
                    <div class="clause-number">!</div>
                    <div class="clause-text">Failed to load document from API. Please try refreshing.</div>
                </div>
            </div>
        `;
    }

    renderDocument() {
        const clausesHtml = this.document.map(clause => `
            <div class="clause" data-clause-id="${clause.id}">
                <div class="clause-tooltip">Click to explain</div>
                <div class="clause-content">
                    <div class="clause-number">${clause.index}</div>
                    <div class="clause-text">${this.escapeHtml(clause.text)}</div>
                </div>
            </div>
        `).join('');

        this.documentContent.innerHTML = `
            <div>
                ${clausesHtml}
                <div class="tip-box">
                    <p><strong>💡 Tip:</strong> Click on any numbered clause to get an AI explanation in simple terms. You can also type questions directly in the chat.</p>
                </div>
            </div>
        `;

        this.documentContent.querySelectorAll('.clause').forEach(clauseElement => {
            clauseElement.addEventListener('click', (e) => {
                const clauseId = e.currentTarget.dataset.clauseId;
                const clause = this.document.find(c => c.id === clauseId);
                if (clause) {
                    this.handleClauseClick(clause);
                }
            });
        });
    }

    handleClauseClick(clause) {
        const question = `Explain this clause in simple terms: ${clause.text}`;
        this.messageInput.value = question;
        this.handleSendMessage();
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