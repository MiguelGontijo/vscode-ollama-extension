// src/webview/components/ModelSelector.ts
import { ModelGroup, Provider } from '../../types/ollama';

export class ModelSelector {
    constructor(
        private modelGroups: ModelGroup[] = [],
        private providers: Provider[] = []
    ) {
        console.log('ModelSelector constructor - modelGroups:', modelGroups);
        console.log('ModelSelector constructor - providers:', providers);
    }

    public render(): string {
        // Extrair nomes de modelos por provider
        const modelsByProvider: Record<string, string[]> = {
            'ollama': [],
            'anthropic': [],
            'openrouter': []
        };
        
        // Agrupar modelos por provider
        for (const group of this.modelGroups) {
            if (!modelsByProvider[group.provider]) {
                modelsByProvider[group.provider] = [];
            }
            modelsByProvider[group.provider].push(group.name);
        }
        
        // Se não houver modelos para um provider, adicionar mensagem de placeholder
        Object.keys(modelsByProvider).forEach(provider => {
            if (modelsByProvider[provider].length === 0) {
                if (provider === 'anthropic') {
                    modelsByProvider[provider] = ['Set Anthropic API Key (Ctrl+Shift+P > MigsIA: Set Anthropic API Key)'];
                } else if (provider === 'openrouter') {
                    modelsByProvider[provider] = ['Set OpenRouter API Key (Ctrl+Shift+P > MigsIA: Set OpenRouter API Key)'];
                } else if (provider === 'ollama' && modelsByProvider[provider].length === 0) {
                    modelsByProvider[provider] = ['No models found'];
                }
            }
        });
        
        console.log('ModelSelector render - modelsByProvider:', modelsByProvider);
        
        // Converter para JSON para usar no script
        const modelsByProviderJson = JSON.stringify(modelsByProvider);

        return `
        <div class="model-selector-container">
            <select class="provider-select" id="provider-select">
                <option value="ollama">Ollama Local</option>
                <option value="anthropic">Anthropic</option>
                <option value="openrouter">OpenRouter</option>
            </select>
            <select class="model-select" id="model-select">
                <!-- Modelos serão carregados dinamicamente -->
            </select>
            <script>
            (function() {
                // Usar os modelos reais do backend
                const modelsByProvider = ${modelsByProviderJson};
                console.log('ModelSelector script - modelsByProvider:', modelsByProvider);
                
                const providerSelect = document.getElementById('provider-select');
                const modelSelect = document.getElementById('model-select');
                
                // Função para atualizar os modelos com base no provedor selecionado
                function updateModels() {
                    const selectedProvider = providerSelect.value;
                    const models = modelsByProvider[selectedProvider] || [];
                    
                    // Limpar select atual
                    modelSelect.innerHTML = '';
                    
                    // Adicionar novos modelos
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        option.dataset.provider = selectedProvider;
                        modelSelect.appendChild(option);
                    });
                    
                    // Desabilitar o botão de envio se for uma mensagem de API key
                    const sendButton = document.getElementById('send');
                    if (sendButton) {
                        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
                        const isApiKeyMessage = selectedOption && selectedOption.textContent.includes('API Key');
                        sendButton.disabled = isApiKeyMessage;
                    }
                }
                
                // Atualizar modelos quando o provedor mudar
                providerSelect.addEventListener('change', updateModels);
                
                // Inicializar com o primeiro provedor
                updateModels();
            })();
            </script>
        </div>`;
    }
}