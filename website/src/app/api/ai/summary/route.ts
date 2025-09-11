import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const systemPrompt = {
      role: "system",
      content: `you are an AI assistant specialized in legal topics. User will provide you terms and conditions text. You will analyze the text for potential risks. Classify each detected risk into severity levels: Low, Medium, or High. Your output must only contain the severity levels in a comma-separated list. Do not explain, justify, or provide text excerpts. Example: Input: Terms and Conditions text Output: Low, High, Medium`,

    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // free + fast
        messages: [systemPrompt, ...messages],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}