import { CopyAction } from '../../../types/webview';

export class InputHandler {
    private isProcessing: boolean = false;
    private vscode: any;

    constructor(vscode: any) {
        this.vscode = vscode;
        // console.log('[InputHandler] Inicializado');
    }

    public initialize(): void {
        // console.log('[InputHandler] Iniciando setup dos elementos');
        
        const promptInput = document.getElementById('prompt') as HTMLTextAreaElement;
        const sendButton = document.getElementById('send') as HTMLButtonElement;
        const modelSelector = document.getElementById('modelSelector') as HTMLSelectElement;

        if (!promptInput || !sendButton || !modelSelector) {
            console.error('[InputHandler] Elementos não encontrados:', {
                promptInput: !!promptInput,
                sendButton: !!sendButton,
                modelSelector: !!modelSelector
            });
            return;
        }

        // console.log('[InputHandler] Elementos encontrados, configurando listeners');

        // Auto-ajuste do textarea
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(200, promptInput.scrollHeight) + 'px';
        });

        // Evento de envio
        sendButton.addEventListener('click', (e) => {
            // console.log('[InputHandler] Botão enviar clicado');
            e.preventDefault();
            if (!this.isProcessing) {
                this.handleSend(promptInput.value, modelSelector.value);
            }
        });

        // Atalho Enter
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.isProcessing) {
                // console.log('[InputHandler] Enter pressionado');
                e.preventDefault();
                this.handleSend(promptInput.value, modelSelector.value);
            }
        });

        // Listener para resetar o estado
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'status' && message.status === 'ready') {
                // console.log('[InputHandler] Recebido status ready, resetando estado');
                this.isProcessing = false;
                sendButton.disabled = false;
            }
        });

        // console.log('[InputHandler] Setup completo');
    }

    private handleSend(text: string, model: string): void {
        text = text.trim();
        if (!text) {
            // console.log('[InputHandler] Texto vazio, ignorando envio');
            return;
        }

        // console.log('[InputHandler] Processando envio:', { text, model });
        this.isProcessing = true;
        
        const sendButton = document.getElementById('send') as HTMLButtonElement;
        const promptInput = document.getElementById('prompt') as HTMLTextAreaElement;
        
        if (sendButton) sendButton.disabled = true;

        try {
            this.vscode.postMessage({
                type: 'prompt',
                text: text,
                model: model
            });
            // console.log('[InputHandler] Mensagem enviada com sucesso');

            if (promptInput) {
                promptInput.value = '';
                promptInput.style.height = 'auto';
            }
        } catch (error) {
            console.error('[InputHandler] Erro ao enviar mensagem:', error);
            this.isProcessing = false;
            if (sendButton) sendButton.disabled = false;
        }
    }

    public copyToClipboard(text: string, button: HTMLButtonElement): void {
        try {
            navigator.clipboard.writeText(text).then(() => {
                button.classList.add('copied');
                button.textContent = '✓ Copiado!';
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = 'Copiar';
                }, 2000);

                // Notificar VSCode
                this.vscode.postMessage({
                    type: 'copy',
                    text: text,
                    success: true
                });
            }).catch(error => {
                console.error('[InputHandler] Erro ao copiar:', error);
                button.classList.add('error');
                button.textContent = '✗ Erro';
                
                setTimeout(() => {
                    button.classList.remove('error');
                    button.textContent = 'Copiar';
                }, 2000);
            });
        } catch (error) {
            console.error('[InputHandler] Erro ao acessar clipboard:', error);
        }
    }
}