// import { env } from "./config";
// import { PineconeStore } from "@langchain/pinecone";
// import { OpenAIEmbeddings } from "@langchain/openai";
// import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

// export async function embedAndStoreDocs(
//   client: PineconeClient,
//   // @ts-ignore docs type error
//   docs: Document<Record<string, any>>[]
// ) {
//   /*create and store the embeddings in the vectorStore*/
//   try {
//     const embeddings = new OpenAIEmbeddings();
//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     //embed the PDF documents
//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });
//   } catch (error) {
//     console.log("error ", error);
//     throw new Error("Failed to load your docs !");
//   }
// }

// // Returns vector-store handle to be used a retrievers on langchains
// export async function getVectorStore(client: PineconeClient) {
//   try {
//     const embeddings = new OpenAIEmbeddings();
//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });

//     return vectorStore;
//   } catch (error) {
//     console.log("error ", error);
//     throw new Error("Something went wrong while getting vector store !");
//   }
// }



// import { env } from "./config";
// import { PineconeStore } from "@langchain/pinecone";
// import { OpenAIEmbeddings } from "@langchain/openai";
// import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

// export async function embedAndStoreDocs(
//   client: PineconeClient,
//   // @ts-ignore docs type error
//   docs: Document<Record<string, any>>[]
// ) {
//   try {
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: env.OPENROUTER_API_KEY,
//       configuration: {
//         baseURL: "https://openrouter.ai/api/v1", // Required for OpenRouter
//       },
//       modelName:"thenlper/gte-small"
//     });

//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });
//   } catch (error) {
//     console.log("error ", error);
//     throw new Error("Failed to load your docs!");
//   }
// }

// export async function getVectorStore(client: PineconeClient) {
//   try {
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: env.OPENROUTER_API_KEY,
//       configuration: {
//         baseURL: "https://openrouter.ai/api/v1", // Required for OpenRouter
//       },
//         modelName:"thenlper/gte-small"
//     });

//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });

//     return vectorStore;
//   } catch (error) {
//     console.log("error ", error);
//     throw new Error("Something went wrong while getting vector store!");
//   }
// // }
// import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// import { PineconeStore } from "@langchain/pinecone";
// import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
// import { env } from "./config";

// export async function embedAndStoreDocs(
//   client: PineconeClient,
//   docs: Document<Record<string, any>>[]
// ) {
//   try {
//     const embeddings = new HuggingFaceTransformersEmbeddings({
      
//       model: "thenlper/gte-small", // ✅ Free & fast
//     });

//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });
//   } catch (error) {
//     console.log("❌ Error embedding docs:", error);
//     throw new Error("Failed to load your docs!");
//   }
// }

// export async function getVectorStore(client: PineconeClient) {
//   try {
//     const embeddings = new HuggingFaceTransformersEmbeddings({
//       model: "thenlper/gte-small",

//     });

//     const index = client.Index(env.PINECONE_INDEX_NAME);

//     return await PineconeStore.fromExistingIndex(embeddings, {
//       pineconeIndex: index,
//       textKey: "text",
//     });
//   } catch (error) {
//     console.log("❌ Error getting vector store:", error);
//     throw new Error("Something went wrong while getting vector store!");
//   }
// }

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { env } from "./config";

export async function embedAndStoreDocs(
  client: PineconeClient,
  docs: Document<Record<string, any>>[]
) {
  try {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2", // 🔥 Fast & free
      apiKey: process.env.HUGGINGFACE_API_KEY,     
        configuration: {
    provider: "default", // DO NOT use "hf-inference"
  },
    });

    const index = client.Index(env.PINECONE_INDEX_NAME);

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      textKey: "text",
    });
  } catch (error) {
    console.error("❌ Error embedding docs:", error);
    throw new Error("Failed to load your docs!");
  }
}

export async function getVectorStore(client: PineconeClient) {
  try {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    const index = client.Index(env.PINECONE_INDEX_NAME);

    return await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "text",
    });
  } catch (error) {
    console.error("❌ Error getting vector store:", error);
    throw new Error("Something went wrong while getting vector store!");
  }
}
