import { StateHandler } from '../handlers/StateHandler';
import { InputHandler } from '../handlers/InputHandler';
import { Message } from '../../../types/webview';

export class ConversationManager {
    private stateHandler: StateHandler;
    private inputHandler: InputHandler;
    private activeConversations: Map<string, HTMLElement>;

    constructor(stateHandler: StateHandler, inputHandler: InputHandler) {
        this.stateHandler = stateHandler;
        this.inputHandler = inputHandler;
        this.activeConversations = new Map();
        this.initializeConversations();
    }

    private initializeConversations(): void {
        const state = this.stateHandler.getState();
        if (state?.conversations?.length) {
            state.conversations.forEach((conv) => {
                if (conv.id && (conv.text || conv.prompt)) {
                    this.createConversation(conv.text || conv.prompt, conv.id);
                }
            });
        }
    }

    public handleMessage(message: Message): void {
        if (!message || !message.type) return;

        switch (message.type) {
            case 'createConversation':
                if (!message.id || !message.text) return;
                this.createConversation(message.text, message.id);
                break;

            case 'response':
                if (!message.id || !message.text) return;
                this.updateResponse(message.id, message.text, message.done || false);
                break;

            case 'status':
                if (message.message) {
                    this.updateStatus(message.message);
                }
                break;
        }
    }

    public createConversation(text: string, id: string): void {
        const conversationDiv = window.DOMUtils.createElement('div', 'conversation expanded');
        const header = window.DOMUtils.createElement('div', 'conversation-header');
        const toggle = window.DOMUtils.createElement('span', 'toggle', '▼');
        const prompt = window.DOMUtils.createElement('div', 'prompt', text);
        
        header.setAttribute('onclick', 'window.toggleConversation(this)');
        
        window.DOMUtils.appendChildren(header, toggle, prompt);

        const content = window.DOMUtils.createElement('div', 'conversation-content');
        const responseContainer = window.DOMUtils.createElement('div', 'response-container');
        const response = window.DOMUtils.createElement('div', 'response');
        response.innerHTML = '<div class="loading">Processando resposta...</div>';
        
        // Criar container de ações
        const responseActions = window.DOMUtils.createElement('div', 'response-actions');
        const copyButton = document.createElement('button') as HTMLButtonElement;
        copyButton.className = 'copy-button';
        copyButton.innerHTML = `
            <span class="copy-icon">📋</span>
            <span class="copy-text">Copiar</span>
        `;
        
        copyButton.onclick = (e) => {
            e.stopPropagation();
            // Selecionar apenas o texto da resposta, excluindo elementos filhos como o loading e actions
            const responseText = Array.from(response.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent)
                .join('');
                
            this.inputHandler.copyToClipboard(responseText || '', copyButton);
        };
        
        responseActions.appendChild(copyButton);
        responseContainer.appendChild(response);
        responseContainer.appendChild(responseActions);
        
        window.DOMUtils.appendChildren(content, responseContainer);
        window.DOMUtils.appendChildren(conversationDiv, header, content);

        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            const emptyState = conversationsList.querySelector('.empty-state');
            if (emptyState) {
                conversationsList.removeChild(emptyState);
            }
            conversationsList.appendChild(conversationDiv);
            this.activeConversations.set(id, conversationDiv);
        }
    }

    public updateResponse(id: string, text: string, done: boolean): void {
        const conversation = this.activeConversations.get(id);
        if (!conversation) {
            console.error('[ConversationManager] Conversa não encontrada:', id);
            return;
        }

        let responseDiv = conversation.querySelector('.response');
        if (!responseDiv) {
            const content = conversation.querySelector('.conversation-content');
            if (!content) return;
            
            responseDiv = window.DOMUtils.createElement('div', 'response');
            content.appendChild(responseDiv);
        }

        const loadingDiv = responseDiv.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

        // Criar um elemento de texto puro para a resposta
        const textNode = document.createTextNode(text);
        responseDiv.innerHTML = ''; // Limpa o conteúdo atual
        responseDiv.appendChild(textNode); // Adiciona apenas o texto

        if (done) {
            responseDiv.classList.add('done');
            this.stateHandler.updateConversation(id, text, true);
        }
    }

    public updateStatus(message: string): void {
        window.DOMUtils.updateStatus(message);
    }

    public deleteConversation(id: string): void {
        const conversation = this.activeConversations.get(id);
        if (!conversation) return;

        conversation.remove();
        this.activeConversations.delete(id);
        this.stateHandler.deleteConversation(id);

        if (this.activeConversations.size === 0) {
            const conversationsList = document.getElementById('conversationsList');
            if (conversationsList) {
                window.DOMUtils.showEmptyState(conversationsList);
            }
        }
    }
}