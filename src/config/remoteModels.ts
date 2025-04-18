// src/config/remoteModels.ts
import { ModelGroup } from '../types/ollama';

export const remoteModels: ModelGroup[] = [
    {
        name: 'claude-3-opus',
        provider: 'anthropic'
    },
    {
        name: 'claude-3-sonnet',
        provider: 'anthropic'
    },
    {
        name: 'gpt-4-turbo',
        provider: 'openrouter'
    },
    {
        name: 'deepseek-coder',
        provider: 'deepseek'
    },
    {
        name: 'abacus-gpt4',
        provider: 'abacus'
    }
];