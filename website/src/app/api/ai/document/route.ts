import { NextRequest, NextResponse } from "next/server";
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload (PDF/photo)
      return await handleFileUpload(request);
    } else {
      // Handle JSON/text input
      return await handleTextAnalysis(request);
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

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or image files." },
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

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Extraction prompt for documents
    const extractionPrompt = `
    Extract all text content from this document (PDF or image).

    REQUIREMENTS:
    1. Extract all readable text content
    2. Preserve document structure (headings, sections, paragraphs)
    3. Convert tables to markdown format
    4. Include headers, footers, and important notices
    5. Maintain reading order and logical flow
    6. If it's a scanned document, note image quality

    OUTPUT FORMAT:
    - Use markdown for structure (# ## ### for headings)
    - Preserve paragraph breaks
    - Format tables as markdown tables
    - Include page breaks as --- PAGE BREAK ---

    Return ONLY the extracted content without meta-commentary.
    `;

    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Use Gemini for text extraction
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

    // Now analyze the extracted text for legal content
    const analysisResult = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      system: `You are a consumer protection expert analyzing legal documents.

📋 **SIMPLE EXPLANATION**
Rewrite the document in plain English that anyone can understand.

⚠️ **RISKY CLAUSES**
Identify clauses that could harm consumers:
- 🔴 HIGH RISK: Significant financial harm
- 🟡 MEDIUM RISK: Inconvenience or minor harm
- 🟢 LOW RISK: Generally fair but notable

📝 **KEY TAKEAWAYS**
What users should know and watch out for.

🎯 **OVERALL RATING**
SAFE / MODERATE / RISKY / VERY RISKY`,
      prompt: `Please analyze these extracted terms and conditions:\n\n${extractedText}`,
      temperature: 0.1,
      maxTokens: 4096
    });

    return NextResponse.json({
      success: true,
      extractedText,
      analysis: analysisResult.text,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
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

async function handleTextAnalysis(request: NextRequest) {
  try {
    const { text, messages } = await request.json();

    let contentToAnalyze = '';

    if (text) {
      contentToAnalyze = text;
    } else if (messages && Array.isArray(messages)) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      contentToAnalyze = lastUserMessage ? lastUserMessage.content : '';
    }

    if (!contentToAnalyze.trim()) {
      return NextResponse.json(
        { error: "No text provided for analysis" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Analyze the text content
    const analysisResult = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      system: `You are a consumer protection expert analyzing legal documents.

📋 **SIMPLE EXPLANATION**
Rewrite the document in plain English that anyone can understand.

⚠️ **RISKY CLAUSES**
Identify clauses that could harm consumers:
- 🔴 HIGH RISK: Significant financial harm
- 🟡 MEDIUM RISK: Inconvenience or minor harm
- 🟢 LOW RISK: Generally fair but notable

📝 **KEY TAKEAWAYS**
What users should know and watch out for.

🎯 **OVERALL RATING**
SAFE / MODERATE / RISKY / VERY RISKY`,
      prompt: `Please analyze these terms and conditions:\n\n${contentToAnalyze}`,
      temperature: 0.1,
      maxTokens: 4096
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze text" },
      { status: 500 }
    );
  }
}