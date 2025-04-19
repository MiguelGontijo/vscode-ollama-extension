// src/webview/components/conversation/ConversationList.ts
import { Message } from '../../../types/conversation';

export class ConversationList {
    constructor(private messages: Message[] = []) {}

    public render(): string {
        return `
        <div class="conversation-list">
            ${this.renderMessages()}
        </div>
        `;
    }

    private renderMessages(): string {
        if (this.messages.length === 0) {
            return '';
        }

        return this.messages
            .map(message => {
                const isAssistant = message.role === 'assistant';
                return `
                <div class="message ${message.role}">
                    <div class="message-content ${isAssistant ? 'markdown-content' : ''}">
                        ${this.escapeHtml(message.content)}
                    </div>
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