import { NextRequest, NextResponse } from "next/server";
import { Message } from "ai";
import { LangChainAdapter } from "ai";
import { getVectorStore } from "@/lib/vector-store";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { processUserMessage } from "@/lib/langchain";
import { getPineconeClient } from "@/lib/pinecone-client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    const currentQuestion = messages[messages.length - 1].content;
    if (!currentQuestion?.trim()) {
      return NextResponse.json(
        { error: "Empty question provided" },
        { status: 400 }
      );
    }

    const formattedPreviousMessages = messages
      .slice(0, -1)
      .map((message) => `${message.role === "user" ? "Human" : "Assistant"}: ${message.content}`)
      .join("\n");

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }

    const model = new ChatOpenAI({
      modelName: "openai/gpt-3.5-turbo", // ✅ OpenRouter slug
      openAIApiKey: openRouterApiKey,
      streaming: true,
      temperature: 0.7,
      configuration: {
        basePath: "https://openrouter.ai/api/v1", // ✅ use OpenRouter
      },
    });

    const pc = await getPineconeClient();
    const vectorStore = await getVectorStore(pc);
    const parser = new StringOutputParser();

    const stream = await processUserMessage({
      userPrompt: currentQuestion,
      conversationHistory: formattedPreviousMessages,
      vectorStore,
      model,
    });

    return LangChainAdapter.toDataStreamResponse(stream);

  } catch (error) {
    console.error("Chat endpoint error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
