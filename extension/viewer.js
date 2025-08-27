// Updated TextViewer class for displaying extracted text and files

class TextViewer {
    constructor() {
        this.originalText = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.initializeElements();
        this.initializeEventListeners();
        this.loadExtractedText();
    }

    initializeElements() {
        this.elements = {
            welcomeMessage: document.getElementById('welcomeMessage'),
            contentArea: document.getElementById('contentArea'),
            textInfo: document.getElementById('textInfo'),
            sourceTitle: document.getElementById('sourceTitle'),
            timestamp: document.getElementById('timestamp'),
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount'),
            lineCount: document.getElementById('lineCount'),
            extractedTextDisplay: document.getElementById('extractedTextDisplay'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton')
        };
    }

    initializeEventListeners() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'c':
                        if (window.getSelection().toString() === '') {
                            e.preventDefault();
                            this.copyText();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadText();
                        break;
                }
            }
        });

        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    async loadExtractedText() {
        try {
            const data = await chrome.storage.local.get(['extractedText', 'extractedTitle', 'timestamp', 'fileData', 'fileType']);
            
            if (data.extractedText || data.fileData) {
                this.hideWelcomeMessage();
                
                if (data.fileData && (data.fileType === 'pdf' || data.fileType === 'image')) {
                    this.displayFile(data.fileData, data.fileType, data.extractedTitle || 'Uploaded File', data.timestamp);
                } else if (data.extractedText) {
                    this.displayText(data.extractedText, data.extractedTitle || 'Extracted Text', data.timestamp);
                }
            }
        } catch (error) {
            console.error('Error loading extracted content:', error);
        }
    }

    hideWelcomeMessage() {
        this.elements.welcomeMessage.style.display = 'none';
    }

    displayText(text, title, timestamp) {
        this.originalText = text;
        
        // Show content
        this.elements.textInfo.style.display = 'flex';
        this.elements.extractedTextDisplay.style.display = 'block';
        
        // Update title and info
        this.elements.sourceTitle.textContent = title;
        
        if (timestamp) {
            const date = new Date(timestamp);
            this.elements.timestamp.textContent = `Extracted on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        }
        
        // Calculate statistics
        const stats = this.calculateTextStats(text);
        this.elements.charCount.textContent = stats.characters.toLocaleString();
        this.elements.wordCount.textContent = stats.words.toLocaleString();
        this.elements.lineCount.textContent = stats.lines.toLocaleString();
        
        // Display text
        this.elements.extractedTextDisplay.textContent = text;
        
        // Update document title
        document.title = `Text Extractor - ${title}`;
    }

    displayFile(fileData, fileType, title, timestamp) {
        this.hideWelcomeMessage();
        
        // Show content info
        this.elements.textInfo.style.display = 'flex';
        this.elements.extractedTextDisplay.style.display = 'block';
        
        // Update title and info
        this.elements.sourceTitle.textContent = title;
        
        if (timestamp) {
            const date = new Date(timestamp);
            this.elements.timestamp.textContent = `Uploaded on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        }

        // Clear text stats for files
        this.elements.charCount.textContent = '-';
        this.elements.wordCount.textContent = '-';
        this.elements.lineCount.textContent = '-';
        
        // Create file viewer
        this.elements.extractedTextDisplay.innerHTML = '';
        
        if (fileType === 'image') {
            const img = document.createElement('img');
            img.src = fileData;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid #3a3a3a';
            img.style.borderRadius = '8px';
            this.elements.extractedTextDisplay.appendChild(img);
        } else if (fileType === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = fileData;
            iframe.style.width = '100%';
            iframe.style.height = '60vh';
            iframe.style.border = '1px solid #3a3a3a';
            iframe.style.borderRadius = '8px';
            this.elements.extractedTextDisplay.appendChild(iframe);
        }
        
        // Update document title
        document.title = `Text Extractor - ${title}`;
    }

    calculateTextStats(text) {
        const characters = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const lines = text.split('\n').length;
        
        return { characters, words, lines };
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    async copyText() {
        try {
            const textToCopy = window.getSelection().toString() || this.originalText;
            if (!textToCopy) return;
            
            await navigator.clipboard.writeText(textToCopy);
            console.log('Text copied to clipboard');
        } catch (error) {
            console.error('Failed to copy text:', error);
        }
    }

    downloadText() {
        if (!this.originalText) return;
        
        const title = this.elements.sourceTitle.textContent || 'extracted-text';
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
        
        const blob = new Blob([this.originalText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextViewer();
});