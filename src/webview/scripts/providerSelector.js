// Script para gerenciar a seleção de provedores e modelos
(function() {
    const vscode = acquireVsCodeApi();
    let state = vscode.getState() || { selectedProvider: 'local' };
    
    // Elementos DOM
    const providerSelector = document.getElementById('providerSelector');
    const modelSelector = document.getElementById('modelSelector');
    
    // Inicialização
    function init() {
        if (!providerSelector || !modelSelector) {
            console.error('Seletores não encontrados');
            return;
        }
        
        // Restaurar estado
        if (state.selectedProvider) {
            providerSelector.value = state.selectedProvider;
            filterModelsByProvider(state.selectedProvider);
        }
        
        // Adicionar event listeners
        providerSelector.addEventListener('change', onProviderChange);
    }
    
    // Quando o provedor é alterado
    function onProviderChange(event) {
        const providerId = event.target.value;
        state.selectedProvider = providerId;
        vscode.setState(state);
        
        filterModelsByProvider(providerId);
    }
    
    // Filtrar modelos com base no provedor selecionado
    function filterModelsByProvider(providerId) {
        // Esconder todos os modelos
        Array.from(modelSelector.options).forEach(option => {
            const optgroup = option.parentNode;
            if (optgroup.tagName === 'OPTGROUP') {
                const provider = option.getAttribute('data-provider');
                
                if (provider === providerId || (providerId === 'local' && provider === 'local')) {
                    option.style.display = '';
                    optgroup.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            }
        });
        
        // Verificar se há opções visíveis
        const visibleOptions = Array.from(modelSelector.options).filter(
            option => option.style.display !== 'none'
        );
        
        if (visibleOptions.length > 0) {
            modelSelector.value = visibleOptions[0].value;
        }
    }
    
    // Inicializar quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);
    
    // Se o documento já estiver carregado
    if (document.readyState === 'complete') {
        init();
    }
})();