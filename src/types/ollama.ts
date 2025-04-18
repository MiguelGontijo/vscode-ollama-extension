// src/types/ollama.ts
export interface Provider {
    id: string;
    name: string;
    description?: string;
    isEnabled?: boolean;
    baseUrl?: string;
}

export interface ModelGroup {
    name: string;
    provider: string;
}

export interface Model {
    id: string;
    name: string;
    provider: string;
}

export interface ProviderAuthentication {
    apiKey?: string;
    bearerToken?: string;
    customHeaders?: Record<string, string>;
}

export interface ProviderSettings {
    timeout?: number;
    retries?: number;
    cacheDuration?: number;
}