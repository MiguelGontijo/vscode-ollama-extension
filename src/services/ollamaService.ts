import { 
    OllamaModel, 
    ModelGroup, 
    OllamaConnectionConfig, 
    OllamaOptions,
    OllamaRequest,
    OllamaResponse,
    ApiKeys,
    ApiProvider
} from '../types/ollama';
import { WorkspaceContext } from '../types/workspace';
import { workspace } from 'vscode';
import { remoteModels } from '../config/remoteModels';

export class OllamaService {
    private config: OllamaConnectionConfig;
    private defaultOptions: OllamaOptions;
    private readonly DEFAULT_TIMEOUT = 30000;
    private readonly DEFAULT_RETRY_ATTEMPTS = 3;

    constructor() {
        this.config = this.loadConfiguration();
        this.defaultOptions = {
            temperature: 0.7,
            top_p: 0.9,
            stream: true
        };
    }

    private loadConfiguration(): OllamaConnectionConfig {
        const config = workspace.getConfiguration('migsIA.ollama');
        return {
            baseUrl: config.get<string>('remoteUrl') || 'http://localhost:11434',
            apiKey: config.get<string>('apiKey'),
            timeout: config.get<number>('timeout') ?? this.DEFAULT_TIMEOUT,
            retryAttempts: config.get<number>('retryAttempts') ?? this.DEFAULT_RETRY_ATTEMPTS
        };
    }

    private async fetchWithRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(this.config.timeout ?? this.DEFAULT_TIMEOUT)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            const maxRetries = this.config.retryAttempts ?? this.DEFAULT_RETRY_ATTEMPTS;
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            throw error;
        }
    }

    private async checkOllamaService(): Promise<boolean> {
        try {
            console.log('[OllamaService] Verificando serviço Ollama em:', this.config.baseUrl);
            const response = await fetch(`${this.config.baseUrl}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            const isRunning = response.ok;
            console.log('[OllamaService] Serviço Ollama está rodando:', isRunning);
            return isRunning;
        } catch (error) {
            console.error('[OllamaService] Erro ao verificar serviço Ollama:', error);
            return false;
        }
    }

    async getModels(): Promise<OllamaModel[]> {
        try {
            const isServiceRunning = await this.checkOllamaService();
            if (!isServiceRunning) {
                console.warn('[OllamaService] Serviço Ollama não está rodando');
                return [];
            }

            console.log('[OllamaService] Buscando modelos em:', this.config.baseUrl);
            
            const response = await this.fetchWithRetry(`${this.config.baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                }
            });

            const data = await response.json();
            console.log('Resposta do Ollama:', data);
            
            if (!data.models || !Array.isArray(data.models)) {
                console.warn('Resposta do Ollama não contém array de modelos:', data);
                return [];
            }

            return data.models;
        } catch (error) {
            console.error('[OllamaService] Erro ao buscar modelos:', error);
            throw error;
        }
    }

    private getApiKeys(): ApiKeys {
        try {
            const config = workspace.getConfiguration('migsIA');
            const keys = {
                anthropic: config.get<string>('models.remote.anthropic.apiKey'),
                openrouter: config.get<string>('models.remote.openrouter.apiKey'),
                deepseek: config.get<string>('models.remote.deepseek.apiKey')
            };

            console.log('[OllamaService] Chaves configuradas:', 
                Object.entries(keys)
                    .filter(([_, key]) => !!key)
                    .map(([provider]) => provider)
            );

            return keys;
        } catch (error) {
            console.error('[OllamaService] Erro ao ler chaves:', error);
            return {};
        }
    }

    async getAvailableModels(): Promise<ModelGroup[]> {
        try {
            const debug = workspace.getConfiguration('migsIA').get<boolean>('debug') || false;
            const modelConnectionType = workspace.getConfiguration('migsIA.models')
                .get<string>('connectionType') || 'both';
            const groups: ModelGroup[] = [];

            if (debug) {
                console.log('[OllamaService] Tipo de conexão:', modelConnectionType);
            }

            // Busca modelos locais
            if (modelConnectionType === 'local' || modelConnectionType === 'both') {
                try {
                    const isServiceRunning = await this.checkOllamaService();
                    if (!isServiceRunning) {
                        console.warn('[OllamaService] Serviço Ollama não está rodando');
                    } else {
                        const localModels = await this.getModels();
                        if (localModels && localModels.length > 0) {
                            if (debug) console.log('[OllamaService] Modelos locais:', localModels);
                            groups.push({
                                type: 'local',
                                name: 'Modelos Locais',
                                description: 'Modelos instalados localmente',
                                models: localModels.map(m => ({
                                    type: 'local' as const,
                                    id: m.name,
                                    name: m.name,
                                    displayName: m.name,
                                    description: `Modelo local: ${m.name}`
                                }))
                            });
                        }
                    }
                } catch (error) {
                    console.warn('[OllamaService] Erro ao buscar modelos locais:', error);
                }
            }

            // Busca modelos remotos
            if (modelConnectionType === 'remote' || modelConnectionType === 'both') {
                const apiKeys = this.getApiKeys();
                
                const availableModels = remoteModels.filter(model => {
                    const hasKey = !!apiKeys[model.provider];
                    if (debug) {
                        console.log(`[OllamaService] Modelo ${model.name}: ${hasKey ? 'disponível' : 'indisponível'}`);
                    }
                    return hasKey;
                });

                if (availableModels.length > 0) {
                    groups.push({
                        type: 'remote',
                        name: 'Modelos Remotos',
                        description: 'Modelos via API remota',
                        models: availableModels
                    });
                }
            }

            if (debug) {
                console.log('[OllamaService] Grupos finais:', JSON.stringify(groups, null, 2));
            }

            return groups;
        } catch (error) {
            console.error('[OllamaService] Erro ao buscar modelos:', error);
            return [];
        }
    }

    async generateResponse(request: OllamaRequest): Promise<OllamaResponse> {
        try {
            const response = await this.fetchWithRetry(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                },
                body: JSON.stringify({
                    ...request,
                    options: {
                        ...this.defaultOptions,
                        ...request.options
                    }
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async *streamResponse(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
        try {
            const model = remoteModels.find(m => m.id === request.model);
            
            if (model?.type === 'remote') {
                switch (model.provider.toLowerCase() as ApiProvider) {
                    case 'anthropic':
                        yield* this.streamClaudeResponse(request);
                        return;
                    case 'openrouter':
                        yield* this.streamOpenRouterResponse(request);
                        return;
                    case 'deepseek':
                        yield* this.streamDeepSeekResponse(request);
                        return;
                    default:
                        console.warn(`[OllamaService] Provedor não implementado: ${model.provider}`);
                }
            }

            // Fallback para modelos Ollama locais
            yield* this.streamOllamaResponse(request);
        } catch (error) {
            console.error('[OllamaService] Erro no stream:', error);
            throw error;
        }
    }

    private async *streamClaudeResponse(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
        const anthropicKey = workspace.getConfiguration('migsIA.models.remote.anthropic')
            .get<string>('apiKey');

        if (!anthropicKey) {
            throw new Error('Chave API Anthropic não configurada');
        }

        try {
            // Implementar chamada à API do Claude
            // Esta é uma implementação básica, você pode expandir conforme necessário
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': anthropicKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: [{ role: 'user', content: request.prompt }],
                    stream: true
                })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        yield {
                            model: request.model,
                            response: data.content,
                            created_at: new Date().toISOString(),
                            done: data.done
                        };
                    }
                }
            }
        } catch (error) {
            console.error('[OllamaService] Erro ao chamar Claude API:', error);
            throw error;
        }
    }

    private async *streamOpenRouterResponse(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
        const openrouterKey = workspace.getConfiguration('migsIA.models.remote.openrouter')
            .get<string>('apiKey');

        if (!openrouterKey) {
            throw new Error('Chave API OpenRouter não configurada');
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openrouterKey}`
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: [{ role: 'user', content: request.prompt }],
                    stream: true
                })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        yield {
                            model: request.model,
                            response: data.choices?.[0]?.delta?.content || '',
                            created_at: new Date().toISOString(),
                            done: data.choices?.[0]?.finish_reason === 'stop'
                        };
                    }
                }
            }
        } catch (error) {
            console.error('[OllamaService] Erro ao chamar OpenRouter API:', error);
            throw error;
        }
    }

    private async *streamDeepSeekResponse(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
        const deepseekKey = workspace.getConfiguration('migsIA.models.remote.deepseek')
            .get<string>('apiKey');

        if (!deepseekKey) {
            throw new Error('Chave API DeepSeek não configurada');
        }

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekKey}`
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: [{ role: 'user', content: request.prompt }],
                    stream: true
                })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        yield {
                            model: request.model,
                            response: data.choices?.[0]?.delta?.content || '',
                            created_at: new Date().toISOString(),
                            done: data.choices?.[0]?.finish_reason === 'stop'
                        };
                    }
                }
            }
        } catch (error) {
            console.error('[OllamaService] Erro ao chamar DeepSeek API:', error);
            throw error;
        }
    }

    private async *streamOllamaResponse(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
        try {
            const response = await this.fetchWithRetry(
                `${this.config.baseUrl}/api/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                    },
                    body: JSON.stringify({
                        ...request,
                        options: {
                            ...this.defaultOptions,
                            ...request.options
                        }
                    })
                }
            );

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');

            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const parsedResponse = JSON.parse(line) as OllamaResponse;
                        yield parsedResponse;
                    } catch (e) {
                        console.error('[OllamaService] Erro ao parsear resposta:', e);
                    }
                }
            }
        } catch (error) {
            console.error('[OllamaService] Erro no stream:', error);
            throw error;
        }
    }

    private buildDevelopmentPrompt(query: string, context: WorkspaceContext): string {
        return `
        Contexto do Projeto:
        - Linguagem: ${context.language}
        - Framework: ${context.framework}
        - Arquivo atual: ${context.currentFile}
        - Estrutura relevante:
        ${context.relevantFiles}
        
        Código atual:
        \`\`\`${context.language}
        ${context.selectedCode || context.currentFileContent}
        \`\`\`
        
        Pergunta: ${query}
        
        Por favor, considere:
        1. Boas práticas da linguagem/framework
        2. Padrões de projeto existentes no código
        3. Performance e escalabilidade
        4. Testes e manutenibilidade
        5. Documentação clara
        
        Formate a resposta usando markdown e destaque exemplos de código em blocos.
        `;
    }
}
