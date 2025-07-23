import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { VectorStore } from "@langchain/core/vectorstores";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ProcessMessageArgs {
  userPrompt: string;
  conversationHistory: string;
  vectorStore: VectorStore;
  model: BaseChatModel;
}

export async function processUserMessage({
  userPrompt,
  conversationHistory,
  vectorStore,
}: ProcessMessageArgs) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }

    // 🧠 Non-streaming model for refining the question
    const nonStreamingModel = new ChatOpenAI({
      openAIApiKey: openRouterApiKey,
      modelName: "moonshotai/kimi-k2", // ✅ For OpenRouter, must use full model slug
      temperature: 0,
      streaming: false,
      maxTokens: 512,
      configuration: {
        basePath: "https://openrouter.ai/api/v1",
      },
    });

    // 💬 Streaming model for answering the question
    const streamingModel = new ChatOpenAI({
      openAIApiKey: openRouterApiKey,
      modelName: "moonshotai/kimi-k2", // ✅ Use full slug from OpenRouter
      temperature: 0.7,
      streaming: true,
      maxTokens: 512,
      configuration: {
        basePath: "https://openrouter.ai/api/v1",
      },
    });

    // 1️⃣ Refine user question
    const refinedQuestion = await inquiryPrompt
      .pipe(nonStreamingModel)
      .pipe(new StringOutputParser())
      .invoke({
        userPrompt,
        conversationHistory,
      });

    // 2️⃣ Search for context in vector DB
    const relevantDocs = await vectorStore.similaritySearch(refinedQuestion, 3);
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // 3️⃣ Generate answer from context
    return qaPrompt
      .pipe(streamingModel)
      .pipe(new StringOutputParser())
      .stream({
        context,
        question: refinedQuestion,
      });

  } catch (error) {
    console.error("❌ Error in processUserMessage:", error);
    throw new Error("Failed to process your message");
  }
}

// 🔍 Refine prompt
const inquiryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Given the following user prompt and conversation log, formulate the most relevant question for searching a knowledge base.

Rules:
- Prioritize the user prompt over the conversation log
- Ignore unrelated parts of the log
- Only respond if there's a valid question
- Keep it short, remove punctuation and irrelevant words
- If no clear question, return the original user prompt.`,
  ],
  ["human", "USER PROMPT: {userPrompt}\n\nCONVERSATION LOG: {conversationHistory}"],
]);

// // 🧠 Contextual QA prompt
// const qaPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `You are a precise, context-aware assistant. Use only the context to answer. If something is missing, say so.

// Rules:
// - Base answers on the provided context
// - Do not guess or add anything not in context
// - Clearly state if info is missing
// - Highlight exact quotes when possible

// Context:
// {context}`,
//   ],
//   ["human", "Question: {question}"],
// ]);


const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a precise, context-aware assistant. Use only the context to answer. 
If the user asks to be alerted, respond using this format:
__TRIGGER_ALERT__ Your alert message here

Otherwise, respond normally.

Rules:
- Base answers on the provided context
- Do not guess or add anything not in context
- Clearly state if info is missing
- Highlight exact quotes when possible

Context:
{context}`
  ],
  ["human", "Question: {question}"],
]);
