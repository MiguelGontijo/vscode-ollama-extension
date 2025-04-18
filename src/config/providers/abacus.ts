// src/config/providers/abacus.ts
import { Provider } from '../../types/ollama';

export const abacusProvider: Provider = {
    id: 'abacus',
    name: 'Abacus AI',
    description: 'Abacus AI Services',
    isEnabled: false,
    baseUrl: 'https://api.abacus.ai'
};