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
            'anthropic': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            'openrouter': ['gpt-4-turbo', 'claude-2', 'palm-2'],
            'deepseek': ['deepseek-coder', 'deepseek-chat'],
            'abacus': ['abacus-gpt4', 'abacus-claude']
        };
        
        // Agrupar modelos por provider
        for (const group of this.modelGroups) {
            if (group.provider === 'ollama') {
                modelsByProvider['ollama'].push(group.name);
            }
        }
        
        // Se não houver modelos para Ollama, adicionar mensagem de placeholder
        if (modelsByProvider['ollama'].length === 0) {
            modelsByProvider['ollama'] = ['Nenhum modelo encontrado'];
        }
        
        console.log('ModelSelector render - modelsByProvider:', modelsByProvider);
        
        // Converter para JSON para usar no script
        const modelsByProviderJson = JSON.stringify(modelsByProvider);

        return `
        <div class="model-selector-container">
            <select class="provider-select" id="provider-select">
                <option value="ollama">Ollama Local</option>
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