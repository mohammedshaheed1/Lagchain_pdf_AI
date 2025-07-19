
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { env } from "./config";
import { Document } from "@langchain/core/documents";


export async function embedAndStoreDocs(
  client: PineconeClient,
  docs: Document[]

) {
  try {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2", // 🔥 Fast & free
      apiKey: process.env.HUGGINGFACE_API_KEY,     
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
