export interface Conversation {
    id: string;
    prompt: string;
    response: string;
    expanded: boolean;
}

export interface ConversationState {
    conversations: Conversation[];
}

export interface Message {
    type: 'createConversation' | 'response' | 'status';
    id?: string;
    text?: string;
    done?: boolean;
    status?: string;
    message?: string;
}
