import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { WebView } from './webview/webview';
import { PromptMessage, ResponseMessage, StatusMessage } from '../src/types/webview';
import * as path from 'path';

export class MigsIAWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private ollamaService: OllamaService;
    private currentResponseId?: string; // Controle de resposta atual

    constructor(private readonly extensionUri: vscode.Uri) {
        this.ollamaService = new OllamaService();
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'styles')
            ]
        };

        const styleUris = {
            styleMainUri: webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'styles', 'index.css')
            ).toString(),
            styleChatUri: webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'styles', 'chat.css')
            ).toString(),
            styleInputUri: webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'styles', 'input.css')
            ).toString(),
            styleConversationUri: webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'styles', 'modelSelector.css')
            ).toString()
        };

        try {
            const modelGroups = await this.ollamaService.getAvailableModels();
            const webview = new WebView(modelGroups, styleUris);
            webviewView.webview.html = webview.render();

            // Configurar receptor de mensagens
            webviewView.webview.onDidReceiveMessage(async (message: PromptMessage) => {
                if (message.type === 'prompt') {
                    await this.handlePromptMessage(webviewView, message, token);
                }
            });

            // Envia status inicial
            this.sendStatus(webviewView, 'ready');

        } catch (error) {
            console.error('Erro ao carregar a webview:', error);
            this.handleError(webviewView, error);
        }
    }

    private async handlePromptMessage(
        webviewView: vscode.WebviewView, 
        message: PromptMessage,
        token: vscode.CancellationToken
    ) {
        // Previne múltiplas requisições simultâneas
        if (this.currentResponseId) {
            return;
        }

        try {
            const conversationId = Date.now().toString();
            this.currentResponseId = conversationId;

            const createMessage = {
                type: 'createConversation',
                text: message.text,
                id: conversationId
            };
            
            await webviewView.webview.postMessage(createMessage);
            this.sendStatus(webviewView, 'loading', 'Processando sua pergunta...');
    
            const responseStream = this.ollamaService.streamResponse({
                model: message.model,
                prompt: message.text
            });
    
            let fullResponse = '';
            for await (const chunk of responseStream) {
                if (token.isCancellationRequested) {
                    this.currentResponseId = undefined;
                    break;
                }
                fullResponse += chunk.response;
    
                await webviewView.webview.postMessage({
                    type: 'response',
                    text: fullResponse,
                    id: conversationId,
                    done: false
                });
            }
    
            await webviewView.webview.postMessage({
                type: 'response',
                text: fullResponse,
                id: conversationId,
                done: true
            });
    
            this.sendStatus(webviewView, 'ready');
        } catch (error) {
            this.handleError(webviewView, error);
        } finally {
            this.currentResponseId = undefined; // Limpa o ID ao finalizar
        }
    }

    private sendStatus(
        webview: vscode.WebviewView, 
        status: 'loading' | 'ready' | 'error', 
        message?: string
    ) {
        const statusMessage: StatusMessage = { 
            type: 'status', 
            status, 
            message 
        };
        webview.webview.postMessage(statusMessage);
    }

    private handleError(webview: vscode.WebviewView, error: any) {
        console.error('Erro:', error);
        
        const errorMessage: ResponseMessage = {
            type: 'response',
            text: 'Erro ao processar sua solicitação. Por favor, tente novamente.',
            error: true,
            id: this.currentResponseId
        };
        webview.webview.postMessage(errorMessage);
        
        this.sendStatus(
            webview, 
            'error', 
            'Ocorreu um erro ao processar sua solicitação'
        );
        
        vscode.window.showErrorMessage(
            'Erro ao se comunicar com o Ollama. Verifique se o serviço está rodando.'
        );

        webview.webview.html = this.getErrorHtml();
    }

    private getErrorHtml(): string {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            padding: 16px;
                            color: var(--vscode-foreground);
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            background: var(--vscode-editor-background);
                        }
                        .error-container {
                            text-align: center;
                            padding: 20px;
                            border-radius: 6px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                        }
                        .error-title {
                            color: var(--vscode-errorForeground);
                            margin-bottom: 12px;
                            font-size: 14px;
                            font-weight: 500;
                        }
                        .error-message {
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                            line-height: 1.4;
                        }
                        .error-actions {
                            margin-top: 16px;
                        }
                        .retry-button {
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        }
                        .retry-button:hover {
                            background: var(--vscode-button-hoverBackground);
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-title">
                            Erro ao carregar o MigsIA
                        </div>
                        <div class="error-message">
                            Não foi possível conectar ao serviço Ollama.<br>
                            Verifique se o serviço está em execução e tente novamente.
                        </div>
                        <div class="error-actions">
                            <button class="retry-button" onclick="window.location.reload()">
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    public dispose() {
        this._view = undefined;
    }
}

