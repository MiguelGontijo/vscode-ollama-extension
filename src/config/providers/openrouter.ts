// src/config/providers/openrouter.ts
import { Provider } from '../../types/ollama';

export const openrouterProvider: Provider = {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models through one API',
    isEnabled: false,
    baseUrl: 'https://openrouter.ai/api'
};