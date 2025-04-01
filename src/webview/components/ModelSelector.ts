import { ModelGroup, LocalModel, RemoteModel, isRemoteModel } from '../../types/ollama';

export class ModelSelector {
    constructor(private modelGroups: ModelGroup[]) {
        console.log('[ModelSelector] Inicializado com:', 
            JSON.stringify(modelGroups, null, 2));
    }

    public render(): string {
        const hasModels = this.modelGroups.some(group => 
            group.models && group.models.length > 0);

        if (!hasModels) {
            console.warn('[ModelSelector] Nenhum modelo disponível');
            return `
                <div class="model-selector-container">
                    <select class="model-selector" id="modelSelector" disabled>
                        <option>Nenhum modelo disponível</option>
                    </select>
                    <div class="model-selector-message">
                        Verifique se:
                        - O Ollama está rodando (para modelos locais)
                        - As chaves de API estão configuradas (para modelos remotos)
                    </div>
                </div>
            `;
        }

        return `
            <select class="model-selector" id="modelSelector">
                ${this.modelGroups
                    .filter(group => group.models && group.models.length > 0)
                    .map(group => this.renderGroup(group))
                    .join('')}
            </select>
        `;
    }

    private renderGroup(group: ModelGroup): string {
        return `
            <optgroup label="${group.name}" title="${group.description || ''}">
                ${group.models
                    .sort((a, b) => (a.displayName || a.name)
                        .localeCompare(b.displayName || b.name))
                    .map(model => this.renderOption(model))
                    .join('')}
            </optgroup>
        `;
    }

    private renderOption(model: LocalModel | RemoteModel): string {
        return `
            <option 
                value="${model.id}" 
                data-type="${model.type}"
                data-provider="${isRemoteModel(model) ? model.provider : 'local'}"
                title="${model.description || ''}"
            >
                ${model.displayName || model.name}
                ${isRemoteModel(model) ? ` (${model.provider})` : ''}
            </option>
        `;
    }
}