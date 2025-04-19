// src/services/ConversationService.ts
import * as vscode from 'vscode';
import { Conversation, Message } from '../types/conversation';
import { v4 as uuidv4 } from 'uuid';

export class ConversationService {
    private static instance: ConversationService;
    private context: vscode.ExtensionContext | undefined;
    private conversations: Map<string, Conversation> = new Map();
    private activeConversationId: string | null = null;

    private constructor() {}

    public static getInstance(): ConversationService {
        if (!ConversationService.instance) {
            ConversationService.instance = new ConversationService();
        }
        return ConversationService.instance;
    }

    public setContext(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadConversations();
    }

    private loadConversations(): void {
        if (!this.context) {
            return;
        }

        const savedConversations = this.context.globalState.get<{ [key: string]: Conversation }>('conversations', {});
        this.conversations = new Map(Object.entries(savedConversations));
        
        // Set active conversation to the most recent one, if any
        if (this.conversations.size > 0) {
            const sortedConversations = Array.from(this.conversations.values())
                .sort((a, b) => b.updatedAt - a.updatedAt);
            
            if (sortedConversations.length > 0) {
                this.activeConversationId = sortedConversations[0].id;
            }
        }
    }

    private saveConversations(): void {
        if (!this.context) {
            return;
        }

        const conversationsObj = Object.fromEntries(this.conversations.entries());
        this.context.globalState.update('conversations', conversationsObj);
    }

    public createNewConversation(model: string, provider: string): string {
        const id = uuidv4();
        const now = Date.now();
        
        const conversation: Conversation = {
            id,
            title: 'Nova conversa',
            messages: [],
            model,
            provider,
            createdAt: now,
            updatedAt: now
        };
        
        this.conversations.set(id, conversation);
        this.activeConversationId = id;
        this.saveConversations();
        
        return id;
    }

    public getActiveConversation(): Conversation | null {
        if (!this.activeConversationId) {
            return null;
        }
        
        return this.conversations.get(this.activeConversationId) || null;
    }

    public setActiveConversation(id: string): boolean {
        if (this.conversations.has(id)) {
            this.activeConversationId = id;
            return true;
        }
        return false;
    }

    public getAllConversations(): Conversation[] {
        return Array.from(this.conversations.values())
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    public addMessageToActiveConversation(message: Omit<Message, 'timestamp'>): boolean {
        if (!this.activeConversationId) {
            return false;
        }
        
        const conversation = this.conversations.get(this.activeConversationId);
        if (!conversation) {
            return false;
        }
        
        const fullMessage: Message = {
            ...message,
            timestamp: Date.now()
        };
        
        conversation.messages.push(fullMessage);
        conversation.updatedAt = fullMessage.timestamp;
        
        // Update title based on first user message if title is default
        if (conversation.title === 'Nova conversa' && message.role === 'user') {
            const title = message.content.substring(0, 30);
            conversation.title = title + (title.length >= 30 ? '...' : '');
        }
        
        this.saveConversations();
        return true;
    }

    public updateActiveConversationTitle(title: string): boolean {
        if (!this.activeConversationId) {
            return false;
        }
        
        const conversation = this.conversations.get(this.activeConversationId);
        if (!conversation) {
            return false;
        }
        
        conversation.title = title;
        conversation.updatedAt = Date.now();
        
        this.saveConversations();
        return true;
    }

    public deleteConversation(id: string): boolean {
        if (!this.conversations.has(id)) {
            return false;
        }
        
        this.conversations.delete(id);
        
        if (this.activeConversationId === id) {
            const conversations = this.getAllConversations();
            this.activeConversationId = conversations.length > 0 ? conversations[0].id : null;
        }
        
        this.saveConversations();
        return true;
    }

    public clearAllConversations(): void {
        this.conversations.clear();
        this.activeConversationId = null;
        this.saveConversations();
    }
}