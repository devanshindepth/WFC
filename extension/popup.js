// Popup script for Text Extractor Pro

class TextExtractor {
    constructor() {
        this.status = document.getElementById('status');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('extractPage').addEventListener('click', () => {
            this.extractPageText();
        });

        document.getElementById('extractSelection').addEventListener('click', () => {
            this.extractSelection();
        });

        document.getElementById('uploadImage').addEventListener('click', () => {
            document.getElementById('imageFile').click();
        });

        document.getElementById('uploadPdf').addEventListener('click', () => {
            document.getElementById('pdfFile').click();
        });

        document.getElementById('imageFile').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        document.getElementById('pdfFile').addEventListener('change', (e) => {
            this.handlePdfUpload(e.target.files[0]);
        });
    }

    showStatus(message, type = '') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
    }

    async extractPageText() {
        this.showStatus('Extracting page text...', 'loading');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
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
                                if (style.display === 'none' || 
                                    style.visibility === 'hidden' ||
                                    ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    );
                    
                    let text = '';
                    let node;
                    while (node = walker.nextNode()) {
                        const nodeText = node.textContent.trim();
                        if (nodeText) {
                            text += nodeText + '\n';
                        }
                    }
                    
                    return text.trim();
                }
            });

            const extractedText = results[0].result;
            
            if (extractedText) {
                this.showTextViewer(extractedText, 'Page Text');
                this.showStatus('✅ Page text extracted!', 'success');
            } else {
                this.showStatus('No text found on page', 'error');
            }
        } catch (error) {
            console.error('Error extracting page text:', error);
            this.showStatus('❌ Failed to extract page text', 'error');
        }
    }

    async extractSelection() {
        this.showStatus('Extracting selected text...', 'loading');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const selection = window.getSelection();
                    return selection.toString().trim();
                }
            });

            const selectedText = results[0].result;
            
            if (selectedText) {
                this.showTextViewer(selectedText, 'Selected Text');
                this.showStatus('✅ Selection extracted!', 'success');
            } else {
                this.showStatus('No text selected', 'error');
            }
        } catch (error) {
            console.error('Error extracting selection:', error);
            this.showStatus('❌ Failed to extract selection', 'error');
        }
    }

    async handleImageUpload(file) {
        if (!file) return;
        
        this.showStatus('Processing image...', 'loading');
        
        try {
            const text = await this.extractTextFromImage(file);
            
            if (text.trim()) {
                this.showTextViewer(text, `Image Text: ${file.name}`);
                this.showStatus('✅ Image text extracted!', 'success');
            } else {
                this.showStatus('No text found in image', 'error');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            this.showStatus('❌ Failed to process image', 'error');
        }
    }

    async handlePdfUpload(file) {
        if (!file) return;
        
        this.showStatus('Processing PDF...', 'loading');
        
        try {
            const text = await this.extractTextFromPdf(file);
            
            if (text.trim()) {
                this.showTextViewer(text, `PDF Text: ${file.name}`);
                this.showStatus('✅ PDF text extracted!', 'success');
            } else {
                this.showStatus('No text found in PDF', 'error');
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showStatus('❌ Failed to process PDF', 'error');
        }
    }

    async extractTextFromImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        // Simple OCR simulation - in real implementation, you'd use Tesseract.js
                        // For now, we'll try to detect if it's a screenshot with text
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        
                        // This is a placeholder - real OCR would go here
                        resolve("OCR functionality would be implemented here using Tesseract.js or similar library. The image has been processed and text extraction would occur here.");
                        
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

    async showTextViewer(text, title) {
        // Store the extracted text
        await chrome.storage.local.set({
            extractedText: text,
            extractedTitle: title,
            timestamp: Date.now()
        });

        // Open the viewer window
        chrome.windows.create({
            url: chrome.runtime.getURL('viewer.html'),
            type: 'popup',
            width: 800,
            height: 600,
            left: 100,
            top: 100
        });
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextExtractor();
});