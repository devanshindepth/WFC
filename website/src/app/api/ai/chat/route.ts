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
    const systemPrompt = `You are a specialized legal assistant named "LegalPal" who exclusively helps people understand legal documents, contracts, and terms. Your expertise is strictly limited to legal terminology, contract clauses, and consumer rights in legal contexts.

STRICT GUIDELINES:
1. ONLY respond to questions about legal documents, contracts, terms, or legal concepts
2. If asked about non-legal topics, politely decline and explain you specialize only in legal matters
3. Explain legal terms in simple, accessible language without legal jargon when possible
4. Focus on consumer protection and rights in legal agreements
5. Highlight potential risks or concerning clauses in legal documents
6. Use analogies to make complex legal concepts understandable
7. Maintain a professional yet approachable tone
8. Always clarify that you provide general information, not legal advice

For non-legal questions, respond: "I specialize only in legal documents and terms. Please ask me about contract clauses, legal terminology, or terms and conditions."

For legal questions, provide clear explanations focused on helping users understand their rights and obligations.`;


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