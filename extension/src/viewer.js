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
        this.DOCUMENT_ENDPOINT = '/api/ai/extraction';
        
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
        
        // Resize handle
        this.resizeHandle = document.getElementById('resizeHandle');
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
        
        // Initialize resize functionality
        this.initResizeHandle();
    }

    initResizeHandle() {
        const chatPanel = document.querySelector('.chat-panel');
        const documentPanel = document.querySelector('.document-panel');
        
        if (this.resizeHandle && chatPanel && documentPanel) {
            let isResizing = false;
            
            this.resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                this.resizeHandle.style.background = '#4a5568';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const containerRect = chatPanel.parentElement.getBoundingClientRect();
                const percentage = (e.clientX - containerRect.left) / containerRect.width * 100;
                const newChatWidth = Math.min(Math.max(percentage, 20), 80); // Limit between 20% and 80%
                
                chatPanel.style.flex = `0 0 ${newChatWidth}%`;
                documentPanel.style.flex = `0 0 ${100 - newChatWidth}%`;
            });
            
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                this.resizeHandle.style.background = '#e5e7eb';
            });
            
            // Handle touch events for mobile
            this.resizeHandle.addEventListener('touchstart', (e) => {
                isResizing = true;
                document.body.style.userSelect = 'none';
                this.resizeHandle.style.background = '#4a5568';
                e.preventDefault();
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!isResizing) return;
                
                const touch = e.touches[0];
                const containerRect = chatPanel.parentElement.getBoundingClientRect();
                const percentage = (touch.clientX - containerRect.left) / containerRect.width * 100;
                const newChatWidth = Math.min(Math.max(percentage, 20), 80);
                
                chatPanel.style.flex = `0 0 ${newChatWidth}%`;
                documentPanel.style.flex = `0 0 ${100 - newChatWidth}%`;
            });
            
            document.addEventListener('touchend', () => {
                isResizing = false;
                document.body.style.userSelect = '';
                this.resizeHandle.style.background = '#e5e7eb';
            });
        }
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
                
                if (data.extractedText && data.extractedText.trim()) {
                    // Set this.extractedData with comprehensive metadata
                    this.extractedData = {
                        text: data.extractedText.trim(),
                        title: data.extractedTitle || data.fileName || 'Extracted Document',
                        timestamp: data.timestamp || data.extractionTimestamp || Date.now(),
                        fileName: data.fileName,
                        fileType: data.fileType,
                        extractionTimestamp: data.extractionTimestamp
                    };
                    
                    // Create the object with the structure that displayProcessedContent expects
                    const processedDocument = {
                        content: this.extractedData.text, 
                        title: this.extractedData.title
                    };
                    
                    // Set the title and display the content
                    this.setDocumentTitle(processedDocument.title);
                    this.displayProcessedContent(processedDocument);

                    console.log('Successfully loaded extracted document:', {
                        title: this.extractedData.title,
                        textLength: this.extractedData.text.length,
                        timestamp: new Date(this.extractedData.timestamp).toLocaleString(),
                        fileName: this.extractedData.fileName,
                        fileType: this.extractedData.fileType
                    });

                } else {
                    // If no extracted text is found in storage, show appropriate message
                    console.log('No extracted text found in storage');
                    this.loadDocument();
                }
            } else {
                // Fallback for non-extension environments
                console.log('Chrome storage not available - running outside extension');
                this.loadDocument();
            }
        } catch (error) {
            console.error('Error loading extracted content:', error);
            // If there's an error, show error message and load fallback
            this.showDocumentError('Error loading document content. Please try uploading again.');
        }
    }

    _formatTextToHtml(text) {
        if (!text || !text.trim()) {
            return '<p>No content available to display.</p>';
        }

        // Sanitize text to prevent rendering unintended HTML
        let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Split the entire text into blocks based on double newlines (paragraphs)
        const blocks = safeText.split(/\n\s*\n/).filter(block => block.trim());
        
        let html = '';
        
        blocks.forEach(block => {
            const trimmedBlock = block.trim();
            if (trimmedBlock) {
                // Enhanced heading detection
                if (trimmedBlock.startsWith('# ')) {
                    // Main heading (H1)
                    html += `<h1 class="document-heading-1">${trimmedBlock.substring(2)}</h1>`;
                } else if (trimmedBlock.startsWith('## ')) {
                    // Sub heading (H2)
                    html += `<h2 class="document-heading-2">${trimmedBlock.substring(3)}</h2>`;
                } else if (trimmedBlock.startsWith('### ')) {
                    // Sub-sub heading (H3)
                    html += `<h3 class="document-heading-3">${trimmedBlock.substring(4)}</h3>`;
                } else if (trimmedBlock.startsWith('#### ')) {
                    // Minor heading (H4)
                    html += `<h4 class="document-heading-4">${trimmedBlock.substring(5)}</h4>`;
                } else if (trimmedBlock.match(/^[A-Z][A-Z\s]{5,50}$/) && trimmedBlock.length < 100) {
                    // All caps text that looks like a heading
                    html += `<h3 class="document-heading-caps">${trimmedBlock}</h3>`;
                } else if (trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('* ') || trimmedBlock.match(/^\d+\.\s/)) {
                    // List items - convert to proper HTML lists
                    const listItems = trimmedBlock.split('\n').filter(line => line.trim());
                    const isNumbered = listItems[0].match(/^\d+\.\s/);
                    const listTag = isNumbered ? 'ol' : 'ul';
                    
                    const listHtml = listItems.map(item => {
                        const cleanItem = item.replace(/^[-*]\s|^\d+\.\s/, '').trim();
                        return `<li>${cleanItem}</li>`;
                    }).join('');
                    
                    html += `<${listTag} class="document-list">${listHtml}</${listTag}>`;
                } else {
                    // Regular paragraph - preserve line breaks within paragraphs
                    const paragraphHtml = trimmedBlock.replace(/\n/g, '<br>');
                    html += `<p class="document-paragraph">${paragraphHtml}</p>`;
                }
            }
        });
        
        // Add some basic styling for better readability
        const styledHtml = `
    <div class="formatted-document-content">
        ${html}
    </div>
    <style>
        .formatted-document-content {
            line-height: 1.6;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .document-heading-1 {
            font-size: 1.75em;
            font-weight: 700;
            margin: 2em 0 0.75em 0;
            color: #1f2937;
            border-bottom: 2px solid #374151;
            padding-bottom: 0.5em;
        }
        .document-heading-2 {
            font-size: 1.5em;
            font-weight: 600;
            margin: 1.5em 0 0.75em 0;
            color: #1f2937;
        }
        .document-heading-3 {
            font-size: 1.25em;
            font-weight: 600;
            margin: 1.25em 0 0.5em 0;
            color: #374151;
        }
        .document-heading-4 {
            font-size: 1.1em;
            font-weight: 600;
            margin: 1em 0 0.5em 0;
            color: #4b5563;
        }
        .document-heading-caps {
            font-size: 1.1em;
            font-weight: 700;
            margin: 1.25em 0 0.5em 0;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .document-paragraph {
            margin: 1em 0;
            text-align: left;
            color: #374151;
            line-height: 1.7;
        }
        .document-list {
            margin: 1em 0;
            padding-left: 1.5em;
            color: #374151;
        }
        .document-list li {
            margin: 0.5em 0;
            line-height: 1.6;
        }
    </style>
`
        
        return styledHtml;
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
        if (!processedDocument || !processedDocument.content) {
            this.showDocumentError('No document content available to display.');
            return;
        }

        const content = processedDocument.content.trim();
        if (!content) {
            this.showDocumentError('Document content is empty or could not be processed.');
            return;
        }

        // Enhanced parsing for better structure detection
        // Split by double newlines first to get major sections
        const majorSections = content.split(/\n\s*\n/).filter(section => section.trim());
        
        // Process each section to create meaningful document structure
        this.document = [];
        let sectionIndex = 1;
        
        majorSections.forEach(section => {
            const trimmedSection = section.trim();
            if (trimmedSection) {
                // Check if this looks like a heading (starts with #, all caps, or is very short)
                const isHeading = trimmedSection.match(/^#{1,6}\s/) || 
                                 (trimmedSection.length < 100 && trimmedSection === trimmedSection.toUpperCase()) ||
                                 trimmedSection.match(/^[A-Z][A-Z\s]{5,50}$/);
                
                // For headings, keep them as single sections
                if (isHeading) {
                    this.document.push({
                        id: `section-${sectionIndex}`,
                        text: trimmedSection,
                        index: sectionIndex,
                        type: 'heading'
                    });
                    sectionIndex++;
                } else {
                    // For regular content, split by sentences if it's very long
                    if (trimmedSection.length > 500) {
                        // Split long paragraphs by sentences for better readability
                        const sentences = trimmedSection.split(/(?<=[.!?])\s+/).filter(s => s.trim());
                        let currentChunk = '';
                        
                        sentences.forEach(sentence => {
                            if (currentChunk.length + sentence.length > 400 && currentChunk) {
                                // Save current chunk and start new one
                                this.document.push({
                                    id: `section-${sectionIndex}`,
                                    text: currentChunk.trim(),
                                    index: sectionIndex,
                                    type: 'content'
                                });
                                sectionIndex++;
                                currentChunk = sentence;
                            } else {
                                currentChunk += (currentChunk ? ' ' : '') + sentence;
                            }
                        });
                        
                        // Add remaining chunk
                        if (currentChunk.trim()) {
                            this.document.push({
                                id: `section-${sectionIndex}`,
                                text: currentChunk.trim(),
                                index: sectionIndex,
                                type: 'content'
                            });
                            sectionIndex++;
                        }
                    } else {
                        // Keep shorter paragraphs as single sections
                        this.document.push({
                            id: `section-${sectionIndex}`,
                            text: trimmedSection,
                            index: sectionIndex,
                            type: 'content'
                        });
                        sectionIndex++;
                    }
                }
            }
        });
        
        // Ensure we have at least one section
        if (this.document.length === 0) {
            this.document.push({
                id: 'section-1',
                text: content,
                index: 1,
                type: 'content'
            });
        }
        
        // Render all document views with the extracted content
        this.renderAllDocumentViews();
        
        console.log(`Document processed: ${this.document.length} sections found`, {
            headings: this.document.filter(d => d.type === 'heading').length,
            content: this.document.filter(d => d.type === 'content').length
        });
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
            const section = this.document[this.currentClauseIndex];
            const sectionType = section.type === 'heading' ? 'Heading' : 'Section';
            
            this.focusClauseCounter.textContent = `${sectionType} ${this.currentClauseIndex + 1} of ${this.document.length}`;
            
            // Enhanced focus display with better styling and section type awareness
            const sectionIcon = section.type === 'heading' ? 'Head' : 'Clause';
            const sectionClass = section.type === 'heading' ? 'focus-heading' : 'focus-content';
            

this.focusClauseContent.innerHTML = `
    <div class="focus-section ${sectionClass}" data-section-id="${section.id}">
        <div class="focus-section-header">
            <span class="focus-section-icon">${sectionIcon}</span>
            <span class="focus-section-type">${sectionType} ${section.index}</span>
            <button class="focus-explain-btn" data-section-id="${section.id}">
                💬 Explain This
            </button>
        </div>
        <div class="focus-section-content">
            <div class="focus-section-text">${this.escapeHtml(section.text)}</div>
        </div>
    </div>
    <style>
        .focus-section {
            background: #ffffff;
            border-radius: 0.75rem;
            border: 2px solid #e5e7eb;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: box-shadow 0.2s ease;
        }
        .focus-section:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .focus-heading {
            border-color: #6b7280;
            background: #ffffff;
        }
        .focus-content {
            border-color: #6b7280;
            background: #ffffff;
        }
        .focus-section-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }
        .focus-heading .focus-section-header {
            background: #f3f4f6;
            border-bottom-color: #d1d5db;
        }
        .focus-content .focus-section-header {
            background: #f3f4f6;
            border-bottom-color: #d1d5db;
        }
        .focus-section-icon {
            font-size: 1.25rem;
            color: #4b5563;
        }
        .focus-section-type {
            font-weight: 600;
            color: #1f2937;
            flex: 1;
        }
        .focus-explain-btn {
            background: #4b5563;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .focus-explain-btn:hover {
            background: #374151;
            transform: translateY(-1px);
        }
        .focus-heading .focus-explain-btn {
            background: #6b7280;
        }
        .focus-heading .focus-explain-btn:hover {
            background: #4b5563;
        }
        .focus-section-content {
            padding: 1.5rem;
            background: #ffffff;
        }
        .focus-section-text {
            line-height: 1.7;
            font-size: 1rem;
            color: #374151;
            text-align: justify;
        }
    </style>
`

            
            // Add click handler for the explain button
            const explainBtn = this.focusClauseContent.querySelector('.focus-explain-btn');
            if (explainBtn) {
                explainBtn.addEventListener('click', () => {
                    this.handleSectionClick(section);
                });
            }
            
            // Update navigation button states
            this.prevClauseBtn.disabled = this.currentClauseIndex === 0;
            this.nextClauseBtn.disabled = this.currentClauseIndex === this.document.length - 1;
            
            // Update button text to reflect section types
            this.prevClauseBtn.textContent = this.currentClauseIndex > 0 ? 
                `← Previous ${this.document[this.currentClauseIndex - 1].type === 'heading' ? 'Heading' : 'Section'}` : 
                '← Previous';
            this.nextClauseBtn.textContent = this.currentClauseIndex < this.document.length - 1 ? 
                `Next ${this.document[this.currentClauseIndex + 1].type === 'heading' ? 'Heading' : 'Section'} →` : 
                'Next →';
        } else {
            // Handle case where no document is loaded
            this.focusClauseCounter.textContent = 'No content available';
            this.focusClauseContent.innerHTML = `
                <div class="focus-no-content">
                    <div class="no-content-icon"></div>
                    <h3>No Document Loaded</h3>
                    <p>Please upload a document using the extension popup to use Focus Mode.</p>
                </div>
                <style>
                    .focus-no-content {
                        text-align: center;
                        padding: 3rem 1rem;
                        color: #6b7280;
                    }
                    .focus-no-content .no-content-icon {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                    }
                    .focus-no-content h3 {
                        margin: 1rem 0 0.5rem 0;
                        color: #374151;
                    }
                    .focus-no-content p {
                        margin: 0;
                        font-size: 0.875rem;
                    }
                </style>
            `;
            this.prevClauseBtn.disabled = true;
            this.nextClauseBtn.disabled = true;
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
            // Include document context if available
            let contextualMessage = message;
            if (this.extractedData?.text) {
                contextualMessage = `Based on this document: "${this.extractedData.title}"\n\nDocument content:\n${this.extractedData.text.substring(0, 2000)}...\n\nUser question: ${message}`;
            }

            const response = await fetch(`${this.API_BASE_URL}${this.AI_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: contextualMessage
                        }
                    ]
                }),
            });

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorText = await response.text();
                    console.log('Error response text:', errorText);
                    
                    // Try to parse as JSON
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch (jsonError) {
                        // If JSON parsing fails, use the raw text (truncated)
                        errorMessage = `${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`;
                    }
                } catch (e) {
                    // If we can't read the response at all, use status text
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Check if response is streaming (has readable stream)
            const contentType = response.headers.get('content-type');
            
            if (contentType && (contentType.includes('text/plain') || contentType.includes('application/octet-stream'))) {
                // Handle streaming response from AI SDK
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';
                let buffer = '';
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer
                        
                        for (const line of lines) {
                            if (line.trim()) {
                                try {
                                    // Try to parse as AI SDK data stream format
                                    if (line.startsWith('0:')) {
                                        const jsonStr = line.substring(2);
                                        const data = JSON.parse(jsonStr);
                                        if (data.type === 'text-delta' && data.textDelta) {
                                            fullResponse += data.textDelta;
                                        }
                                    } else if (line.startsWith('data: ')) {
                                        // Handle Server-Sent Events format
                                        const jsonStr = line.substring(6);
                                        if (jsonStr !== '[DONE]') {
                                            const data = JSON.parse(jsonStr);
                                            if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                                                fullResponse += data.choices[0].delta.content;
                                            }
                                        }
                                    } else {
                                        // Try to parse as direct JSON
                                        const data = JSON.parse(line);
                                        if (data.type === 'text-delta' && data.textDelta) {
                                            fullResponse += data.textDelta;
                                        } else if (data.content) {
                                            fullResponse += data.content;
                                        } else if (data.text) {
                                            fullResponse += data.text;
                                        }
                                    }
                                } catch (e) {
                                    // If JSON parsing fails, check if it's plain text response
                                    if (line.trim() && !line.startsWith('{') && !line.startsWith('0:') && !line.startsWith('data:')) {
                                        fullResponse += line + '\n';
                                    }
                                }
                            }
                        }
                    }
                    
                    // Process any remaining buffer
                    if (buffer.trim()) {
                        try {
                            if (buffer.startsWith('0:')) {
                                const jsonStr = buffer.substring(2);
                                const data = JSON.parse(jsonStr);
                                if (data.type === 'text-delta' && data.textDelta) {
                                    fullResponse += data.textDelta;
                                }
                            } else {
                                const data = JSON.parse(buffer);
                                if (data.type === 'text-delta' && data.textDelta) {
                                    fullResponse += data.textDelta;
                                }
                            }
                        } catch (e) {
                            // Ignore buffer parsing errors
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
                
                if (fullResponse.trim()) {
                    return fullResponse.trim();
                } else {
                    // If no streaming content found, try to read as regular response
                    const responseText = await response.text();
                    if (responseText.trim()) {
                        return responseText.trim();
                    }
                    throw new Error('No response received from AI service');
                }
            } else {
                // Handle regular JSON response (fallback)
                const responseText = await response.text();
                console.log('Raw API response:', responseText);
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    console.error('JSON parsing failed:', jsonError);
                    console.error('Response text that failed to parse:', responseText);
                    throw new Error(`Invalid response from server. Response: ${responseText.substring(0, 100)}...`);
                }
                
                // Handle different response formats
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                } else if (data.message) {
                    return data.message;
                } else if (data.response) {
                    return data.response;
                } else if (data.content) {
                    return data.content;
                } else {
                    console.warn('Unexpected API response format:', data);
                    return 'I received a response but couldn\'t parse it properly. Please try asking your question again.';
                }
            }
            
        } catch (error) {
            console.error('API request failed:', error);
            
            // Provide more helpful error messages with fallback responses
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to AI service. Please check if the server is running on localhost:3000. \n\nAs a fallback, here\'s some general guidance: Legal documents often contain important terms about your rights, obligations, and potential risks. Consider consulting with a legal professional for specific advice.');
            } else if (error.message.includes('404')) {
                throw new Error('AI service endpoint not found. Please check the server configuration.');
            } else if (error.message.includes('500')) {
                throw new Error('AI service encountered an internal error. Please try again.');
            } else {
                throw new Error(`AI service error: ${error.message}`);
            }
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

    showDocumentLoading() {
        const loadingHtml = `
            <div class="loading-document">
                <div>
                    <div class="spinner"></div>
                    <p>Loading document...</p>
                </div>
            </div>
        `;
        
        if (this.documentContentElement) this.documentContentElement.innerHTML = loadingHtml;
        if (this.readDocumentContent) this.readDocumentContent.innerHTML = loadingHtml;
        if (this.focusClauseContent) this.focusClauseContent.innerHTML = loadingHtml;
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
                <div class="document-metadata">
                    <div class="metadata-title">${this.escapeHtml(this.extractedData.title)}</div>
                    <div class="metadata-info">Extracted on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
                    ${this.extractedData.fileName ? `<div class="metadata-file">File: ${this.escapeHtml(this.extractedData.fileName)}</div>` : ''}
                    ${this.extractedData.fileType ? `<div class="metadata-type">Type: ${this.escapeHtml(this.extractedData.fileType)}</div>` : ''}
                </div>
            `;
        }
        
        // Enhanced section rendering with better visual distinction
        const sectionsHtml = this.document.map(section => {
            const sectionClass = section.type === 'heading' ? 'document-section heading-section' : 'document-section content-section';
            const sectionIcon = section.type === 'heading' ? '' : '';
            
            return `
                <div class="${sectionClass}" data-section-id="${section.id}">
                    <div class="section-tooltip">Click to discuss this ${section.type}</div>
                    <div class="section-content">
                        <div class="section-number">${sectionIcon} ${section.index}</div>
                        <div class="section-text">${this.escapeHtml(section.text)}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.documentContentElement.innerHTML = `
    <div class="chat-document-container">
        ${metadataHtml}
        <div class="document-sections">
            ${sectionsHtml}
        </div>
        <div class="tip-box">
            <p><strong>Tip:</strong> Click on any numbered section to get an AI explanation. You can also select text and ask questions directly in the chat.</p>
        </div>
    </div>
    <style>
        .document-metadata {
            background: #ffffff;
            padding: 1rem;
            border-radius: 0.75rem;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #4b5563;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .metadata-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
        .metadata-info, .metadata-file, .metadata-type {
            color: #374151;
            margin: 0.25rem 0;
        }
        .document-sections {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .document-section {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .document-section:hover {
            border-color: #6b7280;
            box-shadow: 0 2px 8px rgba(107, 114, 128, 0.15);
            transform: translateY(-1px);
        }
        .heading-section {
            background: #f9fafb;
        }
        .content-section {
            background: #ffffff;
        }
        .section-tooltip {
            position: absolute;
            top: -2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            white-space: nowrap;
            z-index: 10;
        }
        .document-section:hover .section-tooltip {
            opacity: 1;
        }
        .section-content {
            display: flex;
            align-items: flex-start;
            padding: 1rem;
            gap: 0.75rem;
        }
        .section-number {
            flex-shrink: 0;
            width: 2.5rem;
            height: 2.5rem;
            background: #4b5563;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.875rem;
        }
        .heading-section .section-number {
            background: #374151;
        }
        .section-text {
            flex: 1;
            line-height: 1.6;
            color: #374151;
        }
        .tip-box {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #6b7280;
        }
        .tip-box p {
            margin: 0;
            color: #374151;
            font-size: 0.875rem;
        }
    </style>
`

        // Add click handlers for sections
        this.documentContentElement.querySelectorAll('.document-section').forEach(sectionElement => {
            sectionElement.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.dataset.sectionId;
                const section = this.document.find(s => s.id === sectionId);
                if (section) {
                    this.handleSectionClick(section);
                }
            });
        });
    }

    renderReadDocument() {
        if (!this.readDocumentContent) {
            console.error('Read document content element not found');
            return;
        }

        if (!this.extractedData?.text) {
            this.readDocumentContent.innerHTML = `
                <div class="no-content-message">
                    <div class="no-content-icon"></div>
                    <h3>No Document Content</h3>
                    <p>Please upload a document using the extension popup to view content here.</p>
                </div>
            `;
            return;
        }
        
        // Enhanced metadata header
        let metadataHtml = '';
        if (this.extractedData.timestamp) {
            const date = new Date(this.extractedData.timestamp);
            metadataHtml = `
                <div class="read-metadata">
                    <div class="read-metadata-title">${this.escapeHtml(this.extractedData.title)}</div>
                    <div class="read-metadata-details">
                        <span class="metadata-item">Extracted: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</span>
                        ${this.extractedData.fileName ? `<span class="metadata-item">📁 File: ${this.escapeHtml(this.extractedData.fileName)}</span>` : ''}
                        ${this.extractedData.fileType ? `<span class="metadata-item">🏷️ Type: ${this.escapeHtml(this.extractedData.fileType)}</span>` : ''}
                        <span class="metadata-item">Length: ${this.extractedData.text.length.toLocaleString()} characters</span>
                    </div>
                </div>
            `;
        }
        
        // Use the enhanced formatting function to generate HTML from the raw text
        const formattedHtml = this._formatTextToHtml(this.extractedData.text);

        // Set the innerHTML of the read mode container with enhanced styling
        this.readDocumentContent.innerHTML = `
    <div class="read-document-wrapper">
        ${metadataHtml}
        <div class="read-content-body">
            ${formattedHtml}
        </div>
        <div class="read-tip-box">
            <div class="tip-icon">ℹ</div>
            <div class="tip-content">
                <strong>Reading Mode Tips:</strong>
                <ul>
                    <li>Select any text to get an AI explanation in chat mode</li>
                    <li>Use Focus Mode for section-by-section reading</li>
                    <li>Scroll through the document at your own pace</li>
                </ul>
            </div>
        </div>
    </div>
    <style>
        .no-content-message {
            text-align: center;
            padding: 3rem 1rem;
            color: #6b7280;
        }
        .no-content-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        /* Updated metadata section to use white and gray theme */
        .read-metadata {
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 0.75rem;
            margin-bottom: 2rem;
            border-left: 4px solid #4b5563;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }
        .read-metadata-title {
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.75rem;
            font-size: 1.25rem;
        }
        .read-metadata-details {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        /* Updated metadata items to use gray theme */
        .metadata-item {
            background: #f9fafb;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        .read-content-body {
            background: #ffffff;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 2rem;
            max-width: none;
        }
        /* Updated tip box to use white and gray theme */
        .read-tip-box {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 0.75rem;
            border-left: 4px solid #6b7280;
            margin-top: 2rem;
            border: 1px solid #e5e7eb;
        }
        /* Updated tip icon to use information symbol instead of emoji */
        .tip-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
            color: #4b5563;
            font-weight: bold;
        }
        /* Updated tip content colors to use gray theme */
        .tip-content {
            color: #4b5563;
            font-size: 0.875rem;
        }
        .tip-content strong {
            color: #1f2937;
            display: block;
            margin-bottom: 0.5rem;
        }
        .tip-content ul {
            margin: 0;
            padding-left: 1.25rem;
        }
        .tip-content li {
            margin: 0.25rem 0;
        }
        .read-document-wrapper {
            max-width: 100%;
            margin: 0 auto;
        }
    </style>
`
    }

    handleClauseClick(clause) {
        const question = `Explain this clause in simple terms: ${clause.text}`;
        this.messageInput.value = question;
        this.handleSendMessage();
    }

    handleSectionClick(section) {
        // Switch to chat mode if not already there
        if (this.viewMode !== 'chat') {
            this.switchToMode('chat');
        }
        
        // Create appropriate question based on section type
        const sectionType = section.type === 'heading' ? 'heading' : 'section';
        const question = `Explain this ${sectionType} in simple terms: "${section.text}"`;
        
        // Set the question in the input and send it
        setTimeout(() => {
            this.messageInput.value = question;
            this.handleSendMessage();
        }, 100); // Small delay to ensure chat mode is active
    }

    showDocumentError(message = 'Failed to load document. Please try refreshing.') {
        const errorHtml = `
            <div class="clause" style="cursor: default;">
                <div class="clause-content">
                    <div class="clause-number" style="background: #fee2e2; color: #000000ff;">!</div>
                    <div class="clause-text">${this.escapeHtml(message)}</div>
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
    window.legalChatApp = new LegalChatApp();
});