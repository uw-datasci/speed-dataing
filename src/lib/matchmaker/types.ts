export interface ConversationStarter {
  type: "commonality" | "question";
  text: string;
}

export type ConversationStarters = [ConversationStarter, ConversationStarter];

export interface Match {
  id?: string;
  person1_id: string;
  person2_id: string;
  similarity_score: number;
  emoji: string;
  conversation_starters?: ConversationStarters | null;
}
