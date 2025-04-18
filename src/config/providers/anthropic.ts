// src/config/providers/anthropic.ts
import { Provider } from '../../types/ollama';

export const anthropicProvider: Provider = {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude AI models by Anthropic',
    isEnabled: false,
    baseUrl: 'https://api.anthropic.com'
};