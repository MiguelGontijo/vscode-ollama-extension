// src/webviewProvider.ts
import * as vscode from 'vscode';
import { WebView } from './webview/webview';
import { OllamaService } from './services/ollamaService';
import { ProviderService } from './services/ProviderService';
import { ModelGroup, Provider } from './types/ollama';

export class OllamaWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private ollamaService: OllamaService;
    private providerService: ProviderService;

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) {
        console.log('Inicializando OllamaWebviewProvider...');
        // Use o padrão singleton para obter a instância
        this.ollamaService = OllamaService.getInstance();
        this.providerService = ProviderService.getInstance();
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

    private async _initializeWebview(webview: vscode.Webview) {
        try {
            // Obter os modelos disponíveis
            console.log('Obtendo modelos...');
            const modelGroups = await this.ollamaService.getModels();
            console.log('Modelos obtidos:', JSON.stringify(modelGroups));
            
            const providers = this.providerService.listProviders();
            console.log('Providers obtidos:', JSON.stringify(providers));
    
            // Criar os URIs para os estilos
            const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
            const styleChatUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.css'));
            const styleInputUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'input.css'));
            const styleConversationUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'conversation.css'));
    
            // Criar a webview
            const webviewInstance = new WebView(
                modelGroups,
                providers,
                {
                    styleMainUri: styleMainUri.toString(),
                    styleChatUri: styleChatUri.toString(),
                    styleInputUri: styleInputUri.toString(),
                    styleConversationUri: styleConversationUri.toString()
                }
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
                    await this._handleSendMessage(message.text, message.model);
                    break;
            }
        });
    }

    private async _handleSendMessage(text: string, model: string) {
        if (!this._view) {
            return;
        }
    
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
            // Usar streaming para mostrar a resposta gradualmente
            await this.ollamaService.streamResponse({
                model,
                prompt: text,
                onUpdate: (response: string) => {
                    this._view?.webview.postMessage({
                        command: 'updateResponse',
                        content: response
                    });
                }
            });
        } catch (error) {
            console.error('Error generating response:', error);
            
            // Enviar erro para a webview
            this._view.webview.postMessage({
                command: 'error',
                message: 'Failed to generate response. Please try again.'
            });
        }
    }
}