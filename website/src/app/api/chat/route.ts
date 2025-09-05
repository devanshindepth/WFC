import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

  try {
    const { messages } = await request.json();

    const systemPrompt = {
      role: "system",
      content: `You are an AI that analyzes Terms and Conditions text for potential risks. Your only job is to classify each detected risk into severity levels: Low, Medium, or High.

                Output must only contain the severity levels in a comma-separated list.
                Do not explain, justify, or provide text excerpts.
                Do not include anything except the severity levels.
                Example:
                Input: Terms and Conditions text
                Output: Low, High, Medium`
    }
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [systemPrompt, ...messages]
      })
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