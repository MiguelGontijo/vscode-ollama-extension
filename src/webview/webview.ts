// src/webview/webview.ts
import { ChatInput } from './components/ChatInput';
import { ModelSelector } from './components/ModelSelector';
import { ConversationList } from './components/conversation/ConversationList';
import { ConversationSidebar } from './components/conversation/ConversationSidebar';
import { ModelGroup, Provider } from '../types/ollama';
import { Conversation } from '../types/conversation';

interface StyleUris {
    styleMainUri: string;
    styleChatUri: string;
    styleInputUri: string;
    styleConversationUri: string;
    styleSidebarUri: string;
}

export class WebView {
    private chatInput: ChatInput;
    private modelSelector: ModelSelector;
    private conversationList: ConversationList;
    private conversationSidebar: ConversationSidebar;

    constructor(
        modelGroups: ModelGroup[] = [],
        providers: Provider[] = [],
        private readonly styleUris: StyleUris,
        private readonly conversations: Conversation[] = [],
        private readonly activeConversation: Conversation | null = null
    ) {
        this.chatInput = new ChatInput();
        this.modelSelector = new ModelSelector(modelGroups, providers);
        this.conversationList = new ConversationList(activeConversation?.messages || []);
        this.conversationSidebar = new ConversationSidebar(conversations, activeConversation?.id);
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
            <link rel="stylesheet" href="${this.styleUris.styleSidebarUri}">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
        </head>
        <body>
            <div class="container">
                <!-- Container 1: Input e botões da conversa -->
                <div class="input-container">
                    <div class="input-section">
                        ${this.chatInput.render()}
                        <div class="controls-container">
                            ${this.modelSelector.render()}
                            <button class="send-button" id="send" title="Enviar">
                                <div class="play-icon"></div>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Container 2: Conversa atual -->
                <div class="conversation-container">
                    <!-- Botão de toggle para o histórico -->
                    <div class="sidebar-toggle" id="sidebar-toggle" title="Histórico de conversas">
                        <div class="toggle-icon"></div>
                    </div>
                    
                    <!-- Container 3: Histórico de conversas (sobrepõe o container 2) -->
                    ${this.conversationSidebar.render()}
                    
                    <!-- Lista de mensagens da conversa atual -->
                    ${this.conversationList.render()}
                </div>
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const sendButton = document.getElementById('send');
                    const chatInput = document.querySelector('.chat-input');
                    const modelSelect = document.getElementById('model-select');
                    const providerSelect = document.getElementById('provider-select');
                    const conversationList = document.querySelector('.conversation-list');
                    const sidebarToggle = document.getElementById('sidebar-toggle');
                    const sidebar = document.querySelector('.sidebar');
                    
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
                    
                    // Função para renderizar mensagens
                    function renderMessages(messages) {
                        conversationList.innerHTML = '';
                        
                        messages.forEach(message => {
                            const messageElement = document.createElement('div');
                            messageElement.className = 'message ' + message.role;
                            
                            if (message.role === 'assistant') {
                                messageElement.innerHTML = '<div class="message-content markdown-content">' + 
                                    renderMarkdown(message.content) + '</div>';
                            } else {
                                messageElement.innerHTML = '<div class="message-content">' + 
                                    message.content + '</div>';
                            }
                            
                            conversationList.appendChild(messageElement);
                            
                            // Aplicar highlight.js aos blocos de código
                            messageElement.querySelectorAll('pre code').forEach((block) => {
                                hljs.highlightElement(block);
                            });
                        });
                        
                        conversationList.scrollTop = conversationList.scrollHeight;
                    }
                    
                    // Função para atualizar a lista de conversas
                    function updateConversationsList(conversations, activeId) {
                        const conversationsList = document.getElementById('conversations-list');
                        if (!conversationsList) return;
                        
                        conversationsList.innerHTML = '';
                        
                        if (conversations.length === 0) {
                            const emptyState = document.createElement('div');
                            emptyState.className = 'empty-state';
                            emptyState.textContent = 'Nenhuma conversa ainda';
                            conversationsList.appendChild(emptyState);
                            return;
                        }
                        
                        conversations.forEach(conversation => {
                            const conversationItem = document.createElement('div');
                            conversationItem.className = 'conversation-item';
                            if (conversation.id === activeId) {
                                conversationItem.classList.add('active');
                            }
                            conversationItem.dataset.id = conversation.id;
                            
                            const title = document.createElement('div');
                            title.className = 'conversation-title';
                            title.textContent = conversation.title;
                            
                            const deleteBtn = document.createElement('button');
                            deleteBtn.className = 'delete-conversation';
                            deleteBtn.innerHTML = '&times;';
                            deleteBtn.title = 'Excluir conversa';
                            deleteBtn.onclick = (e) => {
                                e.stopPropagation();
                                if (confirm('Tem certeza que deseja excluir esta conversa?')) {
                                    vscode.postMessage({
                                        command: 'deleteConversation',
                                        conversationId: conversation.id
                                    });
                                }
                            };
                            
                            conversationItem.appendChild(title);
                            conversationItem.appendChild(deleteBtn);
                            
                            conversationItem.addEventListener('click', () => {
                                vscode.postMessage({
                                    command: 'switchConversation',
                                    conversationId: conversation.id
                                });
                            });
                            
                            conversationsList.appendChild(conversationItem);
                        });
                    }
                    
                    // Inicializar a lista de conversas
                    updateConversationsList(${JSON.stringify(this.conversations)}, ${this.activeConversation ? `"${this.activeConversation.id}"` : 'null'});
                    
                    // Renderizar mensagens da conversa ativa
                    if (${this.activeConversation ? 'true' : 'false'}) {
                        renderMessages(${JSON.stringify(this.activeConversation?.messages || [])});
                    }
                    
                    // Toggle sidebar
                    sidebarToggle.addEventListener('click', () => {
                        sidebar.classList.toggle('open');
                        sidebarToggle.classList.toggle('open');
                    });
                    
                    // Botão de nova conversa
                    const newConversationBtn = document.getElementById('new-conversation');
                    if (newConversationBtn) {
                        newConversationBtn.addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'createNewConversation',
                                model: modelSelect.value,
                                provider: providerSelect.value
                            });
                        });
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
                        
                        switch (message.command) {
                            case 'clearLoadingIndicators':
                                // Remover qualquer indicador de carregamento pendente
                                const currentResponseElements = document.querySelectorAll('#current-response');
                                currentResponseElements.forEach(element => {
                                    element.remove();
                                });
                                break;
                                
                            case 'clearConversation':
                                // Limpar a conversa atual
                                conversationList.innerHTML = '';
                                
                                // Também remover qualquer indicador de carregamento
                                const loadingElements = document.querySelectorAll('.loading-indicator');
                                loadingElements.forEach(element => {
                                    const parentMessage = element.closest('.message');
                                    if (parentMessage) {
                                        parentMessage.remove();
                                    }
                                });
                                break;
                                
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
                                
                            case 'conversationCreated':
                            case 'conversationDeleted':
                            case 'conversationsUpdated':
                                // Atualizar a lista de conversas
                                updateConversationsList(
                                    message.conversations, 
                                    message.activeConversation ? message.activeConversation.id : null
                                );
                                break;
                                
                            case 'conversationSwitched':
                                // Atualizar a conversa ativa
                                if (message.activeConversation) {
                                    renderMessages(message.activeConversation.messages);
                                    
                                    // Atualizar a lista de conversas para destacar a ativa
                                    const items = document.querySelectorAll('.conversation-item');
                                    items.forEach(item => {
                                        if (item.dataset.id === message.activeConversation.id) {
                                            item.classList.add('active');
                                        } else {
                                            item.classList.remove('active');
                                        }
                                    });
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
                                
                            case 'requestCurrentModel':
                                // Responder com o modelo e provedor atuais
                                vscode.postMessage({
                                    command: 'createNewConversation',
                                    model: modelSelect.value,
                                    provider: providerSelect.value
                                });
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