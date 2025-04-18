// src/webview/components/ChatInput.ts
export class ChatInput {
    constructor() {}

    public render(): string {
        return `
        <textarea class="chat-input" placeholder="Digite sua mensagem aqui..."></textarea>
        `;
    }
}