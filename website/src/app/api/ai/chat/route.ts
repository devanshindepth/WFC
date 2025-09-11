import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, text } = await request.json();

    // Handle both text input and chat messages
    let userContent = '';

    if (text) {
      // Direct text analysis
      userContent = text;
    } else if (messages && Array.isArray(messages)) {
      // Chat format - get the last user message
      const lastUserMessage = messages[messages.length - 1];
      userContent = lastUserMessage ? lastUserMessage.content : '';
    } else {
      return NextResponse.json(
        { error: "Invalid input format. Provide either 'text' or 'messages'." },
        { status: 400 },
      );
    }

    if (!userContent.trim()) {
      return NextResponse.json({ error: 'No content provided for analysis' }, { status: 400 });
    }

    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Google Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.',
        },
        { status: 500 },
      );
    }

    // Create friendly system prompt
    const systemPrompt = `You are a friendly legal assistant named "LegalPal" who helps people understand legal terms and consumer rights. Explain things in simple, everyday language like a helpful friend would.

Key guidelines:
- Be friendly and approachable
- Use simple analogies when explaining complex terms
- Always prioritize consumer protection
- If something is risky for consumers, clearly explain why
- Ask follow-up questions to better help users
- Keep responses conversational, not robotic

For legal questions, provide clear, practical advice focused on protecting user rights.`;

    // Make direct API call to Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemPrompt}\n\nUser question: ${userContent}` }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI service' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Return in OpenAI-compatible format for easier integration
    return NextResponse.json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: aiResponse,
          },
        },
      ],
      usage: {
        promptTokens: Math.ceil(userContent.length / 4), // Rough estimate
        completionTokens: Math.ceil(aiResponse.length / 4),
        totalTokens: Math.ceil((userContent.length + aiResponse.length) / 4)
      },
      model: 'gemini-1.5-flash-latest',
    });

  } catch (error) {
    console.error('Legal chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process your legal question',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try rephrasing your question or check back in a moment!',
      },
      { status: 500 },
    );
  }
}
