import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { messages, text } = await request.json();

    // Handle both text input and chat messages
    let userMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (text) {
      // Direct text analysis - convert to message format
      userMessages = [{ role: 'user', content: text }];
    } else if (messages && Array.isArray(messages)) {
      // Chat format - use messages directly
      userMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid input format. Provide either 'text' or 'messages'." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!userMessages.length || !userMessages[userMessages.length - 1]?.content?.trim()) {
      return new Response(JSON.stringify({ error: 'No content provided for analysis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Google Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
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

    // Use AI SDK with generateText for JSON response
    const result = await generateText({
      model: google('gemini-1.5-flash-latest'),
      messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Return JSON response
    return new Response(
      JSON.stringify({
        response: result.text,
        usage: result.usage,
        finishReason: result.finishReason
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Legal chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process your legal question',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try rephrasing your question or check back in a moment!',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}