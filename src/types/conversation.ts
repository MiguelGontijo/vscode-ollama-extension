// src/types/conversation.ts
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    provider: string;
    createdAt: number;
    updatedAt: number;
}