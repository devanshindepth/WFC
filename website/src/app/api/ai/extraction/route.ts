import { NextRequest, NextResponse } from "next/server";
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload for text extraction only
      return await handleFileUpload(request);
    } else {
      return NextResponse.json(
        { error: "This endpoint only supports file uploads" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleFileUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type - support .txt, .pdf, .doc, .docx
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload .txt, .pdf, .doc, or .docx files." },
        { status: 400 }
      );
    }

    // Check file size (Gemini limit is ~20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    // Handle text files directly
    if (file.type === 'text/plain') {
      const textContent = await file.text();
      return NextResponse.json({
        success: true,
        extractedText: textContent,
        fileName: file.name,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });
    }

    // Convert file to base64 for binary files (PDF, DOC, DOCX)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Simplified extraction prompt focused only on text extraction
    const extractionPrompt = `
    Extract all text content from this document.

    REQUIREMENTS:
    1. Extract all readable text content
    2. Preserve basic document structure (paragraphs, headings)
    3. Maintain reading order and logical flow

    OUTPUT FORMAT:
    - Preserve paragraph breaks
    - Keep headings and structure clear
    - Return clean, readable text

    Return ONLY the extracted text content without any meta-commentary or analysis.
    `;

    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Use Gemini for text extraction only
    const extractionResult = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: extractionPrompt },
            {
              type: 'file',
              data: base64Data,
              mimeType: file.type
            }
          ]
        }
      ],
      temperature: 0.1,
      maxTokens: 8192
    });

    const extractedText = extractionResult.text;

    // Return simplified response with only extracted text
    return NextResponse.json({
      success: true,
      extractedText,
      fileName: file.name,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File upload processing error:', error);
    return NextResponse.json(
      { error: "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}

