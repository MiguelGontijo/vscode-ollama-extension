// src/webview/components/ModelSelector.ts
import { ModelGroup, Provider } from '../../types/ollama';

export class ModelSelector {
    constructor(
        private modelGroups: ModelGroup[] = [],
        private providers: Provider[] = []
    ) {}

    public render(): string {
        return `
        <div class="model-selector-container">
            <select class="provider-select" id="provider-select">
                <option value="ollama">Local Models</option>
                <option value="anthropic">Anthropic</option>
                <option value="openrouter">OpenRouter</option>
                <option value="deepseek">DeepSeek</option>
                <option value="abacus">Abacus</option>
            </select>
            <select class="model-select" id="model-select">
                <!-- Modelos serão carregados dinamicamente -->
            </select>
            <script>
            (function() {
                // Dados de exemplo para modelos por provedor
                const modelsByProvider = {
                    ollama: ['llama2', 'mistral', 'codellama', 'phi', 'gemma'],
                    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                    openrouter: ['gpt-4-turbo', 'claude-2', 'palm-2'],
                    deepseek: ['deepseek-coder', 'deepseek-chat'],
                    abacus: ['abacus-gpt4', 'abacus-claude']
                };
                
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
                        modelSelect.appendChild(option);
                    });
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