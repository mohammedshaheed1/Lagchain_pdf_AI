import { Message } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Scrolls to the last child of the container
 * (used in chat apps to scroll to the latest message)
 */
export function scrollToBottom(containerRef: React.RefObject<HTMLElement | null>) {
  if (containerRef.current) {
    const lastMessage = containerRef.current.lastElementChild;
    if (lastMessage) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "end",
      };
      lastMessage.scrollIntoView(scrollOptions);
    }
  }
}

/**
 * Formats chat history into a readable transcript
 */
export const formatChatHistory = (chatHistory: [string, string][]) => {
  const formattedDialogueTurns = chatHistory.map(
    ([user, assistant]) => `Human: ${user}\nAssistant: ${assistant}`
  );
  return formattedDialogueTurns.join("\n");
};

/**
 * Cleans up text: removes newlines, joins hyphenated words, compresses spaces
 */
export function formattedText(inputText: string) {
  return inputText
    .replace(/\n+/g, " ") // Replace multiple newlines with a single space
    .replace(/(\w) - (\w)/g, "$1$2") // Join hyphenated words
    .replace(/\s+/g, " "); // Replace multiple spaces with one
}

/**
 * Default message shown when the assistant loads
 */
export const initialMessages: Message[] = [
  {
    role: "assistant",
    id: "0",
    content:
      "Hi! Personal assistant from shaheed tech. Please ask  — I'm here to help.",
  },
];

interface Data {
  sources: string[];
}

/**
 * Extracts sources linked to a specific assistant message
 */
export const getSources = (data: Data[], role: string, index: number) => {
  if (role === "assistant" && index >= 2 && (index - 2) % 2 === 0) {
    const sourcesIndex = (index - 2) / 2;
    if (data[sourcesIndex] && data[sourcesIndex].sources) {
      return data[sourcesIndex].sources;
    }
  }
  return [];
};
