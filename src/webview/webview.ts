// src/webview/webview.ts
import { ChatInput } from './components/ChatInput';
import { ModelSelector } from './components/ModelSelector';
import { ConversationList } from './components/conversation/ConversationList';
import { ModelGroup, Provider } from '../types/ollama';

interface StyleUris {
    styleMainUri: string;
    styleChatUri: string;
    styleInputUri: string;
    styleConversationUri: string;
}

export class WebView {
    private chatInput: ChatInput;
    private modelSelector: ModelSelector;
    private conversationList: ConversationList;

    constructor(
        modelGroups: ModelGroup[] = [],
        providers: Provider[] = [],
        private readonly styleUris: StyleUris
    ) {
        this.chatInput = new ChatInput();
        this.modelSelector = new ModelSelector(modelGroups, providers);
        this.conversationList = new ConversationList();
    }

    public render(): string {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MigsIA Chat</title>
            <link rel="stylesheet" href="${this.styleUris.styleMainUri}">
            <link rel="stylesheet" href="${this.styleUris.styleChatUri}">
            <link rel="stylesheet" href="${this.styleUris.styleInputUri}">
            <link rel="stylesheet" href="${this.styleUris.styleConversationUri}">
        </head>
        <body>
            <div class="container">
                <div class="input-section">
                    ${this.chatInput.render()}
                    <div class="controls-container">
                        ${this.modelSelector.render()}
                        <button class="send-button" id="send" title="Enviar">
                            <div class="play-icon"></div>
                        </button>
                    </div>
                </div>
                ${this.conversationList.render()}
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const sendButton = document.getElementById('send');
                    const chatInput = document.querySelector('.chat-input');
                    const modelSelect = document.getElementById('model-select');
                    
                    sendButton.addEventListener('click', () => {
                        const text = chatInput.value.trim();
                        if (text) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: text,
                                model: modelSelect.value
                            });
                            chatInput.value = '';
                        }
                    });
                    
                    chatInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendButton.click();
                        }
                    });
                    
                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        switch (message.command) {
                            case 'addMessage':
                                // Adicionar mensagem à conversa
                                const conversationList = document.querySelector('.conversation-list');
                                const messageElement = document.createElement('div');
                                messageElement.className = 'message ' + message.message.role;
                                messageElement.innerHTML = '<div class="message-content">' + message.message.content + '</div>';
                                conversationList.appendChild(messageElement);
                                conversationList.scrollTop = conversationList.scrollHeight;
                                break;
                            case 'error':
                                // Mostrar erro
                                vscode.window.showErrorMessage(message.message);
                                break;
                        }
                    });
                })();
            </script>
        </body>
        </html>
        `;
    }
}