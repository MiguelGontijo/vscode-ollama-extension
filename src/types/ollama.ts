export interface OllamaConnectionConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
}

export interface OllamaOptions {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
    stream?: boolean;
}

export interface OllamaRequest {
    model: string;
    prompt: string;
    options?: OllamaOptions;
}

export interface OllamaResponse {
    model: string;
    response: string;
    created_at: string;
    done?: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_duration?: number;
    eval_duration?: number;
}

export interface BaseModel {
    id: string;
    name: string;
    type: 'local' | 'remote';
    displayName?: string;
    description?: string;
}

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
}

export interface LocalModel extends BaseModel {
    type: 'local';
    modified_at?: string;
    size?: number;
}

export interface RemoteModel extends BaseModel {
    type: 'remote';
    provider: string;
    apiEndpoint: string;
    requiresKey: boolean;
    maxTokens?: number;
}

export type ApiProvider = 'anthropic' | 'openrouter' | 'deepseek';

export interface RemoteModelConfig {
    id: string;
    name: string;
    type: 'remote';
    provider: ApiProvider;
    apiEndpoint: string;
    requiresKey: boolean;
    maxTokens?: number;
    description?: string;
    displayName?: string;
}

export interface ModelGroup {
    type: 'local' | 'remote';
    name: string;
    models: (LocalModel | RemoteModel)[];
    description?: string;
}

export interface ApiKeys {
    anthropic?: string;
    openrouter?: string;
    deepseek?: string;
    [key: string]: string | undefined;
}

// Type guard para verificar se é um modelo remoto
export function isRemoteModel(model: LocalModel | RemoteModel): model is RemoteModel {
    return model.type === 'remote';
}