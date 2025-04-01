export const webviewScript = `
    // Definição do InputHandler
    class InputHandler {
        constructor(vscode) {
            this.vscode = vscode;
            this.isProcessing = false;
            // console.log('[InputHandler] Inicializado');
        }

        initialize() {
            // console.log('[InputHandler] Iniciando setup dos elementos');
            
            const promptInput = document.getElementById('prompt');
            const sendButton = document.getElementById('send');
            const modelSelector = document.getElementById('modelSelector');

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

        handleSend(text, model) {
            text = text.trim();
            if (!text) {
                // console.log('[InputHandler] Texto vazio, ignorando envio');
                return;
            }

            // console.log('[InputHandler] Processando envio:', { text, model });
            this.isProcessing = true;
            
            const sendButton = document.getElementById('send');
            const promptInput = document.getElementById('prompt');
            
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
    }

    // Inicialização da aplicação
    (function() {
        try {
            if (!window.vscode) {
                window.vscode = acquireVsCodeApi();
            }
            
            const stateHandler = new StateHandler(window.vscode);
            const inputHandler = new InputHandler(window.vscode);
            const conversationManager = new ConversationManager(stateHandler, inputHandler);

            window.DOMUtils = DOMUtils;
            
            inputHandler.initialize();

            window.addEventListener('message', event => {
                if (event.data) {
                    try {
                        // console.log('[WebView] Mensagem recebida:', event.data);
                        conversationManager.handleMessage(event.data);
                    } catch (error) {
                        console.error('[WebView] Erro ao processar mensagem:', error);
                    }
                }
            });

            window.deleteConversation = (event, id) => {
                event.stopPropagation();
                conversationManager.deleteConversation(id);
            };

            window.toggleConversation = (header) => {
                const conversation = header.parentElement;
                conversation.classList.toggle('expanded');
                const arrow = header.querySelector('.toggle');
                arrow.textContent = conversation.classList.contains('expanded') ? '▼' : '▶';
            };

            // console.log('[WebView] Setup completo');
        } catch (error) {
            console.error('[WebView] Erro durante inicialização:', error);
        }
    })();
`;