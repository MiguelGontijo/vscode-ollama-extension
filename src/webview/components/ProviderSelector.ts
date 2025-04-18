import { Provider } from '../../types/ollama';

export class ProviderSelector {
    constructor(private providers: Provider[]) {}

    public render(): string {
        if (!this.providers || this.providers.length === 0) {
            return `
                <div class="provider-selector empty">
                    <div class="empty-message">Nenhum provedor disponível</div>
                </div>
            `;
        }

        const options = this.providers.map(provider => {
            return `
                <option value="${provider.id}">
                    ${provider.name}
                </option>
            `;
        }).join('');

        return `
            <div class="provider-selector">
                <label for="provider-select">Provedor:</label>
                <select id="provider-select" class="provider-select">
                    ${options}
                </select>
            </div>
        `;
    }
}