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
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
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
                    const providerSelect = document.getElementById('provider-select');
                    
                    // Configurar marked para usar highlight.js
                    marked.setOptions({
                        highlight: function(code, lang) {
                            if (lang && hljs.getLanguage(lang)) {
                                return hljs.highlight(code, { language: lang }).value;
                            }
                            return hljs.highlightAuto(code).value;
                        },
                        breaks: true,
                        gfm: true
                    });
                    
                    // Função para renderizar Markdown
                    function renderMarkdown(text) {
                        return marked.parse(text);
                    }
                    
                    // Função para criar o indicador de carregamento
                    function createLoadingIndicator() {
                        const loadingIndicator = document.createElement('div');
                        loadingIndicator.className = 'loading-indicator';
                        loadingIndicator.innerHTML = '<div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
                        return loadingIndicator;
                    }
                    
                    sendButton.addEventListener('click', () => {
                        const text = chatInput.value.trim();
                        if (text) {
                            // Desabilitar o botão de envio durante o processamento
                            sendButton.disabled = true;
                            
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: text,
                                model: modelSelect.value,
                                provider: providerSelect.value
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
                        const conversationList = document.querySelector('.conversation-list');
                        
                        switch (message.command) {
                            case 'addMessage':
                                // Adicionar mensagem à conversa
                                const messageElement = document.createElement('div');
                                messageElement.className = 'message ' + message.message.role;
                                
                                // Renderizar como Markdown apenas se for uma mensagem do assistente
                                if (message.message.role === 'assistant') {
                                    messageElement.innerHTML = '<div class="message-content markdown-content">' + 
                                        renderMarkdown(message.message.content) + '</div>';
                                } else {
                                    messageElement.innerHTML = '<div class="message-content">' + 
                                        message.message.content + '</div>';
                                }
                                
                                conversationList.appendChild(messageElement);
                                conversationList.scrollTop = conversationList.scrollHeight;
                                
                                // Aplicar highlight.js aos blocos de código
                                messageElement.querySelectorAll('pre code').forEach((block) => {
                                    hljs.highlightElement(block);
                                });
                                break;
                                
                            case 'startResponse':
                                // Iniciar uma nova resposta do assistente
                                const startResponseElement = document.createElement('div');
                                startResponseElement.className = 'message assistant';
                                startResponseElement.id = 'current-response';
                                
                                // Adicionar o indicador de carregamento
                                const loadingIndicator = createLoadingIndicator();
                                startResponseElement.appendChild(loadingIndicator);
                                
                                // Adicionar o contêiner para o conteúdo da resposta
                                const contentContainer = document.createElement('div');
                                contentContainer.className = 'message-content markdown-content';
                                startResponseElement.appendChild(contentContainer);
                                
                                conversationList.appendChild(startResponseElement);
                                conversationList.scrollTop = conversationList.scrollHeight;
                                break;
                                
                            case 'updateResponse':
                                // Atualizar a resposta atual
                                const currentResponse = document.getElementById('current-response');
                                if (currentResponse) {
                                    // Remover o indicador de carregamento se for a primeira atualização
                                    const loadingIndicator = currentResponse.querySelector('.loading-indicator');
                                    if (loadingIndicator) {
                                        currentResponse.removeChild(loadingIndicator);
                                    }
                                    
                                    const contentElement = currentResponse.querySelector('.message-content');
                                    if (contentElement) {
                                        // Renderizar como Markdown
                                        contentElement.innerHTML = renderMarkdown(message.content);
                                        
                                        // Aplicar highlight.js aos blocos de código
                                        currentResponse.querySelectorAll('pre code').forEach((block) => {
                                            hljs.highlightElement(block);
                                        });
                                        
                                        conversationList.scrollTop = conversationList.scrollHeight;
                                    }
                                }
                                break;
                                
                            case 'error':
                                // Mostrar erro
                                vscode.window.showErrorMessage(message.message);
                                // Reativar o botão de envio
                                sendButton.disabled = false;
                                break;
                                
                            case 'responseComplete':
                                // Reativar o botão de envio quando a resposta estiver completa
                                sendButton.disabled = false;
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