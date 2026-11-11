import type { ConversationStarter, ConversationStarters } from "./types";

export function getFallbackConversationStarters(): ConversationStarters {
  return [
    { type: "question", text: "What's something you love doing outside of class?" },
    { type: "question", text: "What's one thing you'd like to try this term?" },
  ];
}

/** Validate both generated output and JSONB read from older match rows. */
export function parseConversationStarters(value: unknown): ConversationStarters | null {
  if (!Array.isArray(value) || value.length !== 2) return null;

  const starters: ConversationStarter[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    if (item.type !== "commonality" && item.type !== "question") return null;
    if (typeof item.text !== "string") return null;
    const text = item.text.replace(/\s+/g, " ").trim();
    if (!text || text.length > 240) return null;
    starters.push({ type: item.type, text });
  }

  if (starters[0].text.toLowerCase() === starters[1].text.toLowerCase()) return null;
  return [starters[0], starters[1]];
}
