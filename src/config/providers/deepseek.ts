// src/config/providers/deepseek.ts
import { Provider } from '../../types/ollama';

export const deepseekProvider: Provider = {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek AI models',
    isEnabled: false,
    baseUrl: 'https://api.deepseek.com'
};