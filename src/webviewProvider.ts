// src/webviewProvider.ts
import * as vscode from 'vscode';
import { WebView } from './webview/webview';
import { OllamaService } from './services/ollamaService';
import { ProviderService } from './services/ProviderService';
import { ConversationService } from './services/ConversationService';
import { ModelGroup, Provider } from './types/ollama';
import { Conversation } from './types/conversation';

export class OllamaWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private ollamaService: OllamaService;
    private providerService: ProviderService;
    private conversationService: ConversationService;

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) {
        console.log('Inicializando OllamaWebviewProvider...');
        this.ollamaService = OllamaService.getInstance();
        this.providerService = ProviderService.getInstance();
        this.conversationService = ConversationService.getInstance();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        console.log('Resolvendo webview...');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        try {
            this._initializeWebview(webviewView.webview);
            console.log('Webview inicializada com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar webview:', error);
            vscode.window.showErrorMessage(`Erro ao inicializar MigsIA: ${error}`);
        }
    }

    public refreshWebview(): void {
        if (this._view) {
            this._initializeWebview(this._view.webview);
        }
    }

    public createNewConversation(): void {
        if (!this._view) {
            return;
        }
        
        // Limpar a conversa atual na UI
        this._view.webview.postMessage({
            command: 'clearConversation'
        });
        
        // Limpar indicadores de carregamento
        this._view.webview.postMessage({
            command: 'clearLoadingIndicators'
        });
        
        // Criar nova conversa com o modelo e provedor atualmente selecionados
        this._view.webview.postMessage({
            command: 'requestCurrentModel'
        });
    }

    private async _initializeWebview(webview: vscode.Webview) {
        try {
            // Obter os modelos disponíveis
            console.log('Obtendo modelos...');
            const modelGroups = await this.ollamaService.getModels();
            console.log('Modelos obtidos:', JSON.stringify(modelGroups));
            
            const providers = this.providerService.listProviders();
            console.log('Providers obtidos:', JSON.stringify(providers));

            // Obter conversas
            const conversations = this.conversationService.getAllConversations();
            const activeConversation = this.conversationService.getActiveConversation();

            // Criar os URIs para os estilos
            const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
            const styleChatUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.css'));
            const styleInputUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'input.css'));
            const styleConversationUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'conversation.css'));
            const styleSidebarUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css'));

            // Criar a webview
            const webviewInstance = new WebView(
                modelGroups,
                providers,
                {
                    styleMainUri: styleMainUri.toString(),
                    styleChatUri: styleChatUri.toString(),
                    styleInputUri: styleInputUri.toString(),
                    styleConversationUri: styleConversationUri.toString(),
                    styleSidebarUri: styleSidebarUri.toString()
                },
                conversations,
                activeConversation
            );

            // Renderizar a webview
            webview.html = webviewInstance.render();

            // Configurar os event listeners
            this._setupEventListeners(webview);
        } catch (error) {
            console.error('Erro ao inicializar webview:', error);
            throw error;
        }
    }

    private _setupEventListeners(webview: vscode.Webview) {
        webview.onDidReceiveMessage(async (message) => {
            console.log('Mensagem recebida:', message);
            switch (message.command) {
                case 'sendMessage':
                    await this._handleSendMessage(message.text, message.model, message.provider);
                    break;
                    
                case 'createNewConversation':
                    const conversationId = this.conversationService.createNewConversation(
                        message.model,
                        message.provider
                    );
                    webview.postMessage({
                        command: 'conversationCreated',
                        conversationId,
                        conversations: this.conversationService.getAllConversations(),
                        activeConversation: this.conversationService.getActiveConversation()
                    });
                    break;
                    
                case 'switchConversation':
                    if (this.conversationService.setActiveConversation(message.conversationId)) {
                        // Limpar a conversa atual na UI
                        webview.postMessage({
                            command: 'clearConversation'
                        });
                        
                        // Limpar qualquer indicador de carregamento pendente
                        webview.postMessage({
                            command: 'clearLoadingIndicators'
                        });
                        
                        webview.postMessage({
                            command: 'conversationSwitched',
                            activeConversation: this.conversationService.getActiveConversation()
                        });
                    }
                    break;
                    
                case 'deleteConversation':
                    if (this.conversationService.deleteConversation(message.conversationId)) {
                        webview.postMessage({
                            command: 'conversationDeleted',
                            conversations: this.conversationService.getAllConversations(),
                            activeConversation: this.conversationService.getActiveConversation()
                        });
                    }
                    break;
                    
                case 'updateConversationTitle':
                    if (this.conversationService.updateActiveConversationTitle(message.title)) {
                        webview.postMessage({
                            command: 'conversationUpdated',
                            conversations: this.conversationService.getAllConversations(),
                            activeConversation: this.conversationService.getActiveConversation()
                        });
                    }
                    break;
            }
        });
    }

    private async _handleSendMessage(text: string, model: string, provider: string = 'ollama') {
        if (!this._view) {
            return;
        }
        
        console.log(`Sending message to ${provider} model ${model}: ${text}`);
        
        // Verificar se há uma conversa ativa, caso contrário criar uma nova
        let activeConversation = this.conversationService.getActiveConversation();
        if (!activeConversation) {
            // Limpar a conversa anterior na UI
            this._view.webview.postMessage({
                command: 'clearConversation'
            });
            
            // Limpar indicadores de carregamento
            this._view.webview.postMessage({
                command: 'clearLoadingIndicators'
            });
            
            const conversationId = this.conversationService.createNewConversation(model, provider);
            activeConversation = this.conversationService.getActiveConversation();
            
            this._view.webview.postMessage({
                command: 'conversationCreated',
                conversationId,
                conversations: this.conversationService.getAllConversations(),
                activeConversation
            });
        }
        
        // Limpar indicadores de carregamento pendentes
        this._view.webview.postMessage({
            command: 'clearLoadingIndicators'
        });
        
        // Adicionar mensagem do usuário à conversa
        this.conversationService.addMessageToActiveConversation({
            role: 'user',
            content: text
        });
        
        // Enviar mensagem para a webview
        this._view.webview.postMessage({
            command: 'addMessage',
            message: {
                role: 'user',
                content: text
            }
        });
        
        // Iniciar resposta vazia
        this._view.webview.postMessage({
            command: 'startResponse'
        });
        
        try {
            let responseContent = '';
            
            if (provider === 'ollama') {
                // Usar o OllamaService para modelos locais
                await this.ollamaService.streamResponse({
                    model,
                    prompt: text,
                    onUpdate: (response: string) => {
                        responseContent = response;
                        // Formatar a resposta para Markdown
                        this._view?.webview.postMessage({
                            command: 'updateResponse',
                            content: this.formatResponseForMarkdown(response)
                        });
                    }
                });
            } else {
                // Usar o ProviderService para modelos remotos
                const client = this.providerService.getClient(provider);
                if (!client) {
                    throw new Error(`Provider ${provider} not configured`);
                }
                
                await client.streamCompletion({
                    model,
                    prompt: text,
                    onUpdate: (response: string) => {
                        responseContent = response;
                        // Formatar a resposta para Markdown
                        this._view?.webview.postMessage({
                            command: 'updateResponse',
                            content: this.formatResponseForMarkdown(response)
                        });
                    }
                });
            }
            
            // Adicionar resposta do assistente à conversa
            this.conversationService.addMessageToActiveConversation({
                role: 'assistant',
                content: responseContent
            });
            
            // Atualizar a lista de conversas na UI
            this._view.webview.postMessage({
                command: 'conversationsUpdated',
                conversations: this.conversationService.getAllConversations(),
                activeConversation: this.conversationService.getActiveConversation()
            });
            
            // Notificar que a resposta está completa
            this._view.webview.postMessage({
                command: 'responseComplete'
            });
        } catch (error) {
            console.error('Error generating response:', error);
            
            // Enviar erro para a webview
            this._view.webview.postMessage({
                command: 'error',
                message: `Failed to generate response: ${error}`
            });
        }
    }

    // Método auxiliar para formatar a resposta para Markdown
    private formatResponseForMarkdown(text: string): string {
        // Detectar blocos de código e adicionar syntax highlighting
        return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `\`\`\`${lang || ''}\n${code}\`\`\``;
        });
    }
}