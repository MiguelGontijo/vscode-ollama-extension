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
            const providers = this.providerService.listProviders();
            console.log(`Modelos obtidos: ${modelGroups.length}, Providers: ${providers.length}`);
    
            // Criar os URIs para os estilos - Verificar se os caminhos estão corretos
            console.log('Criando URIs para estilos...');
            const mediaPath = vscode.Uri.joinPath(this._extensionUri, 'media');
            console.log(`Media path: ${mediaPath.fsPath}`);
            
            const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
            const styleChatUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.css'));
            const styleInputUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'input.css'));
            const styleConversationUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'conversation.css'));
            
            console.log(`Style URIs: ${styleMainUri}, ${styleChatUri}, ${styleInputUri}, ${styleConversationUri}`);
    
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

        console.log(`Enviando mensagem para modelo ${model}: ${text}`);

        // Enviar mensagem para a webview
        this._view.webview.postMessage({
            command: 'addMessage',
            message: {
                role: 'user',
                content: text
            }
        });

        try {
            // Gerar resposta
            const response = await this.ollamaService.generateCompletion(model, text);

            // Enviar resposta para a webview
            this._view.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: response
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