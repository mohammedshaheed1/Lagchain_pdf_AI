// import { ChatOpenAI } from "@langchain/openai";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { RunnableSequence } from "@langchain/core/runnables";
// import { VectorStore } from "@langchain/core/vectorstores";

// interface ProcessMessageArgs {
//   userPrompt: string;
//   conversationHistory: string;
//   vectorStore: VectorStore;
//   model: ChatOpenAI;
// }

// interface ProcessMessageResponse {
//   answer: string;
//   inquiry: string;
// }

// export async function processUserMessage({
//   userPrompt,
//   conversationHistory,
//   vectorStore,
//   model,
// }: ProcessMessageArgs) {
//   try {
//     // Create non-streaming model for inquiry generation
//     const nonStreamingModel = new ChatOpenAI({
//       modelName: "gpt-3.5-turbo",
//       temperature: 0,
//       streaming: false,
//     });

//     // Generate focused inquiry using non-streaming model
//     const inquiryResult = await inquiryPrompt
//       .pipe(nonStreamingModel)
//       .pipe(new StringOutputParser())
//       .invoke({
//         userPrompt,
//         conversationHistory,
//       });

//     // Get relevant documents
//     const relevantDocs = await vectorStore.similaritySearch(inquiryResult, 3);
//     const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

//     return qaPrompt.pipe(model).pipe(new StringOutputParser()).stream({
//       context,
//       question: inquiryResult,
//     });
//   } catch (error) {
//     console.error("Error processing message:", error);
//     throw new Error("Failed to process your message");
//   }
// }

// // Updated prompt templates
// const inquiryPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `Given the following user prompt and conversation log, formulate a question that would be the most relevant to provide the user with an answer from a knowledge base.
    
//     Rules:
//     - Always prioritize the user prompt over the conversation log
//     - Ignore any conversation log that is not directly related to the user prompt
//     - Only attempt to answer if a question was posed
//     - The question should be a single sentence
//     - Remove any punctuation from the question
//     - Remove any words that are not relevant to the question
//     - If unable to formulate a question, respond with the same USER PROMPT received`,
//   ],
//   [
//     "human",
//     `USER PROMPT: {userPrompt}\n\nCONVERSATION LOG: {conversationHistory}`,
//   ],
// ]);

// const qaPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `You are an AI assistant specialized in providing accurate, context-based responses. Analyze the provided context carefully and follow these guidelines:

//     CORE RESPONSIBILITIES:
//     - Base responses primarily on the provided context
//     - Cite specific parts of the context to support answers
//     - Maintain high accuracy and transparency
//     - Acknowledge limitations clearly

//     RESPONSE GUIDELINES:
//     1. Use the context precisely and effectively
//     2. Distinguish between context-based facts and general knowledge
//     3. Structure responses clearly and logically
//     4. Include relevant quotes when beneficial
//     5. State confidence levels when appropriate

//     IMPORTANT RULES:
//     - Never make up information not present in the context
//     - Don't speculate beyond the given information
//     - If the context is insufficient, explicitly state what's missing
//     - Ask for clarification if the question is ambiguous

//     When you cannot answer based on the context:
//     1. State clearly that the context lacks the necessary information
//     2. Explain what specific information would be needed
//     3. Suggest how the question might be refined

//     Context: {context}`,
//   ],
//   ["human", "Question: {question}"],
// ]);

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { VectorStore } from "@langchain/core/vectorstores";

interface ProcessMessageArgs {
  userPrompt: string;
  conversationHistory: string;
  vectorStore: VectorStore;
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
      modelName:  "moonshotai/kimi-k2", // ✅ For OpenRouter, must use full model slug
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

// 🧠 Contextual QA prompt
const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a precise, context-aware assistant. Use only the context to answer. If something is missing, say so.

Rules:
- Base answers on the provided context
- Do not guess or add anything not in context
- Clearly state if info is missing
- Highlight exact quotes when possible

Context:
{context}`,
  ],
  ["human", "Question: {question}"],
]);
