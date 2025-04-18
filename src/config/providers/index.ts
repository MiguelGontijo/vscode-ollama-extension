import { Provider } from '../../types/ollama';
import { anthropicProvider } from './anthropic';
import { openrouterProvider } from './openrouter';
import { deepseekProvider } from './deepseek';
import { abacusProvider } from './abacus';

export const providers: Provider[] = [
    anthropicProvider,
    openrouterProvider,
    deepseekProvider,
    abacusProvider
];

export function getProviderById(id: string): Provider | undefined {
    return providers.find(provider => provider.id === id);
}