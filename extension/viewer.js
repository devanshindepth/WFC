// Viewer script for displaying extracted text

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
            viewerTitle: document.getElementById('viewerTitle'),
            textInfo: document.getElementById('textInfo'),
            sourceTitle: document.getElementById('sourceTitle'),
            timestamp: document.getElementById('timestamp'),
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount'),
            lineCount: document.getElementById('lineCount'),
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            textDisplay: document.getElementById('textDisplay'),
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            closeBtn: document.getElementById('closeBtn')
        };
    }

    initializeEventListeners() {
        this.elements.copyBtn.addEventListener('click', () => this.copyText());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadText());
        this.elements.closeBtn.addEventListener('click', () => window.close());
        this.elements.searchBtn.addEventListener('click', () => this.searchText());
        this.elements.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchText();
            }
        });

        this.elements.searchInput.addEventListener('input', (e) => {
            if (e.target.value === '') {
                this.clearSearch();
            }
        });

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
                    case 'f':
                        e.preventDefault();
                        this.elements.searchInput.focus();
                        break;
                }
            } else if (e.key === 'Escape') {
                if (this.elements.searchInput === document.activeElement) {
                    this.clearSearch();
                } else {
                    window.close();
                }
            }
        });
    }

    async loadExtractedText() {
        try {
            const data = await chrome.storage.local.get(['extractedText', 'extractedTitle', 'timestamp']);
            
            if (data.extractedText) {
                this.originalText = data.extractedText;
                this.displayText(data.extractedText, data.extractedTitle || 'Extracted Text', data.timestamp);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading extracted text:', error);
            this.showEmptyState();
        }
    }

    displayText(text, title, timestamp) {
        // Hide loading state
        this.elements.loadingState.style.display = 'none';
        this.elements.emptyState.style.display = 'none';
        
        // Show content
        this.elements.textInfo.style.display = 'flex';
        this.elements.textDisplay.style.display = 'block';
        
        // Update title and info
        this.elements.viewerTitle.textContent = title;
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
        this.elements.textDisplay.textContent = text;
        
        // Update document title
        document.title = `Text Extractor - ${title}`;
    }

    showEmptyState() {
        this.elements.loadingState.style.display = 'none';
        this.elements.textInfo.style.display = 'none';
        this.elements.textDisplay.style.display = 'none';
        this.elements.emptyState.style.display = 'block';
    }

    calculateTextStats(text) {
        const characters = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const lines = text.split('\n').length;
        
        return { characters, words, lines };
    }

    searchText() {
        const searchTerm = this.elements.searchInput.value.trim();
        
        if (!searchTerm || !this.originalText) {
            return;
        }

        this.clearSearch();
        
        // Find all matches (case-insensitive)
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = [...this.originalText.matchAll(regex)];
        
        if (matches.length === 0) {
            this.showSearchResults(0);
            return;
        }

        // Highlight matches
        let highlightedText = this.originalText;
        let offset = 0;
        
        matches.forEach((match, index) => {
            const start = match.index + offset;
            const end = start + match[0].length;
            const highlightedMatch = `<span class="highlight" data-match="${index}">${match[0]}</span>`;
            
            highlightedText = highlightedText.slice(0, start) + 
                             highlightedMatch + 
                             highlightedText.slice(end);
            
            offset += highlightedMatch.length - match[0].length;
        });
        
        this.elements.textDisplay.innerHTML = highlightedText;
        this.searchMatches = matches;
        this.showSearchResults(matches.length);
        
        // Scroll to first match
        if (matches.length > 0) {
            this.scrollToMatch(0);
        }
    }

    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.textDisplay.innerHTML = '';
        this.elements.textDisplay.textContent = this.originalText;
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.showSearchResults(0);
    }

    showSearchResults(count) {
        if (count > 0) {
            this.elements.searchBtn.textContent = `🔍 Found ${count}`;
            this.elements.searchBtn.style.background = 'rgba(40, 167, 69, 0.2)';
        } else if (this.elements.searchInput.value.trim()) {
            this.elements.searchBtn.textContent = '🔍 No matches';
            this.elements.searchBtn.style.background = 'rgba(220, 53, 69, 0.2)';
        } else {
            this.elements.searchBtn.textContent = '🔍 Search';
            this.elements.searchBtn.style.background = '';
        }
    }

    scrollToMatch(index) {
        const matchElement = document.querySelector(`[data-match="${index}"]`);
        if (matchElement) {
            matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.currentMatchIndex = index;
        }
    }

    async copyText() {
        try {
            const textToCopy = window.getSelection().toString() || this.originalText;
            await navigator.clipboard.writeText(textToCopy);
            
            // Visual feedback
            const originalText = this.elements.copyBtn.textContent;
            this.elements.copyBtn.textContent = '✅ Copied!';
            this.elements.copyBtn.style.background = 'rgba(40, 167, 69, 0.3)';
            
            setTimeout(() => {
                this.elements.copyBtn.textContent = originalText;
                this.elements.copyBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy text:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = window.getSelection().toString() || this.originalText;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.elements.copyBtn.textContent = '✅ Copied!';
                this.elements.copyBtn.style.background = 'rgba(40, 167, 69, 0.3)';
                
                setTimeout(() => {
                    this.elements.copyBtn.textContent = '📋 Copy';
                    this.elements.copyBtn.style.background = '';
                }, 2000);
            } catch (fallbackError) {
                console.error('Fallback copy also failed:', fallbackError);
            }
            
            document.body.removeChild(textArea);
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
        
        // Visual feedback
        const originalText = this.elements.downloadBtn.textContent;
        this.elements.downloadBtn.textContent = '✅ Downloaded!';
        this.elements.downloadBtn.style.background = 'rgba(40, 167, 69, 0.3)';
        
        setTimeout(() => {
            this.elements.downloadBtn.textContent = originalText;
            this.elements.downloadBtn.style.background = '';
        }, 2000);
    }
}

// Initialize the viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextViewer();
});