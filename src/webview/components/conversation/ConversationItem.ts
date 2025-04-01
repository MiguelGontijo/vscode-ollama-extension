export class ConversationItem {
    public static render(text: string, responseId: string): string {
        return `
            <div class="conversation expanded" data-response-id="${responseId}">
                <div class="conversation-header" onclick="window.toggleConversation(this)">
                    <span class="title">${text.substring(0, 50)}...</span>
                    <div class="actions">
                        <span class="delete" onclick="window.deleteConversation(event, '${responseId}')">🗑️</span>
                        <span class="toggle">▼</span>
                    </div>
                </div>
                <div class="conversation-content">
                    <div class="prompt">${text}</div>
                    <div class="response">
                        <div class="loading">Processando resposta...</div>
                    </div>
                </div>
            </div>
        `;
    }
}