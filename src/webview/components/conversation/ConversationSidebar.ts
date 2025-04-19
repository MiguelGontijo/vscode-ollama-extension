// src/webview/components/conversation/ConversationSidebar.ts
import { Conversation } from '../../../types/conversation';

export class ConversationSidebar {
    constructor(
        private conversations: Conversation[] = [],
        private activeConversationId: string | null = null
    ) {}

    public render(): string {
        return `
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Conversas</h2>
                <button id="new-conversation" class="new-conversation-btn" title="Nova conversa">
                    <span>+</span>
                </button>
            </div>
            <div class="conversations-list" id="conversations-list">
                ${this.renderConversationsList()}
            </div>
        </div>
        `;
    }

    private renderConversationsList(): string {
        if (this.conversations.length === 0) {
            return '<div class="empty-state">Nenhuma conversa ainda</div>';
        }

        return this.conversations
            .map(conversation => {
                const isActive = conversation.id === this.activeConversationId;
                return `
                <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conversation.id}">
                    <div class="conversation-title">${this.escapeHtml(conversation.title)}</div>
                    <button class="delete-conversation" title="Excluir conversa">&times;</button>
                </div>
                `;
            })
            .join('');
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}