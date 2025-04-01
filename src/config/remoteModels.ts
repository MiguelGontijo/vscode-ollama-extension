import { RemoteModelConfig } from '../types/ollama';

export const remoteModels: RemoteModelConfig[] = [
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        type: 'remote',
        provider: 'anthropic',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        requiresKey: true,
        maxTokens: 200000,
        description: 'Claude 3 Sonnet - Modelo avançado da Anthropic'
    },
    {
        id: 'mixtral-8x7b',
        name: 'Mixtral 8x7B',
        type: 'remote',
        provider: 'openrouter',
        apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        requiresKey: true,
        maxTokens: 32000,
        description: 'Mixtral 8x7B via OpenRouter - Excelente para programação'
    },
    {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        type: 'remote',
        provider: 'deepseek',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        requiresKey: true,
        maxTokens: 16000,
        description: 'DeepSeek Coder - Especialista em código'
    }
];