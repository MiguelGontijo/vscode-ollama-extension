// src/types/providers.ts
export interface ProviderAuth {
    apiKey?: string;
    organizationId?: string;
    baseUrl?: string;
}

export interface ProviderModelResponse {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
    provider: string;
}

export interface ProviderClient {
    getModels(): Promise<ProviderModelResponse[]>;
    generateCompletion(model: string, prompt: string): Promise<string>;
    streamCompletion(params: {
        model: string;
        prompt: string;
        onUpdate: (text: string) => void;
    }): Promise<void>;
}