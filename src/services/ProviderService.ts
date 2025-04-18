// src/services/ProviderService.ts
import { Provider, ProviderAuthentication, ProviderSettings } from '../types/ollama';
import { ProviderAuth, ProviderClient } from '../types/providers';
import { AnthropicClient } from './providers/AnthropicClient';
import { OpenRouterClient } from './providers/OpenRouterClient';
import * as vscode from 'vscode';
import { SecretStorageService } from './SecretStorageService';

export class ProviderService {
    private static instance: ProviderService;
    private providers: Map<string, Provider>;
    private authentication: Map<string, ProviderAuthentication>;
    private settings: Map<string, ProviderSettings>;
    private clients: Map<string, ProviderClient>;
    private secretStorage?: SecretStorageService;

    private constructor() {
        this.providers = new Map();
        this.authentication = new Map();
        this.settings = new Map();
        this.clients = new Map();
        
        // Registrar providers padrão
        this.registerDefaultProviders();
        this.loadAuthFromSettings();
    }

    public static getInstance(): ProviderService {
        if (!ProviderService.instance) {
            ProviderService.instance = new ProviderService();
        }
        return ProviderService.instance;
    }

    public setSecretStorage(secretStorage: SecretStorageService): void {
        this.secretStorage = secretStorage;
        this.loadAuthFromSecretStorage();
    }

    private registerDefaultProviders() {
        const ollama: Provider = {
            id: 'ollama',
            name: 'Ollama Local',
            description: 'Local LLM runtime',
            isEnabled: true,
            baseUrl: 'http://localhost:11434'
        };

        const anthropic: Provider = {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Claude AI models by Anthropic',
            isEnabled: true,
            baseUrl: 'https://api.anthropic.com'
        };

        const openrouter: Provider = {
            id: 'openrouter',
            name: 'OpenRouter',
            description: 'Access to multiple AI models through one API',
            isEnabled: true,
            baseUrl: 'https://openrouter.ai/api'
        };

        this.registerProvider(ollama);
        this.registerProvider(anthropic);
        this.registerProvider(openrouter);
    }

    private loadAuthFromSettings() {
        const config = vscode.workspace.getConfiguration('migsIA');
        
        // Load Anthropic API key
        const anthropicApiKey = config.get<string>('anthropic.apiKey');
        if (anthropicApiKey) {
            this.setAuthentication('anthropic', { apiKey: anthropicApiKey });
            this.initializeClient('anthropic');
        }
        
        // Load OpenRouter API key
        const openrouterApiKey = config.get<string>('openrouter.apiKey');
        if (openrouterApiKey) {
            this.setAuthentication('openrouter', { apiKey: openrouterApiKey });
            this.initializeClient('openrouter');
        }
    }

    private async loadAuthFromSecretStorage() {
        if (!this.secretStorage) {
            console.log('Secret storage not initialized');
            return;
        }

        try {
            // Load Anthropic API key
            const anthropicApiKey = await this.secretStorage.getApiKey('anthropic');
            if (anthropicApiKey) {
                this.setAuthentication('anthropic', { apiKey: anthropicApiKey });
                this.initializeClient('anthropic');
            }
            
            // Load OpenRouter API key
            const openrouterApiKey = await this.secretStorage.getApiKey('openrouter');
            if (openrouterApiKey) {
                this.setAuthentication('openrouter', { apiKey: openrouterApiKey });
                this.initializeClient('openrouter');
            }
        } catch (error) {
            console.error('Error loading API keys from secret storage:', error);
        }
    }

    private initializeClient(providerId: string) {
        const provider = this.getProvider(providerId);
        const auth = this.authentication.get(providerId);
        
        if (!provider || !auth) {
            return;
        }
        
        const providerAuth: ProviderAuth = {
            apiKey: auth.apiKey,
            baseUrl: provider.baseUrl
        };
        
        switch (providerId) {
            case 'anthropic':
                this.clients.set(providerId, new AnthropicClient(providerAuth));
                break;
            case 'openrouter':
                this.clients.set(providerId, new OpenRouterClient(providerAuth));
                break;
        }
    }

    public registerProvider(provider: Provider): void {
        if (this.providers.has(provider.id)) {
            throw new Error(`Provider ${provider.id} already registered`);
        }
        
        this.providers.set(provider.id, provider);
        this.settings.set(provider.id, {
            timeout: 30000,
            retries: 3,
            cacheDuration: 360000
        });
    }

    public getProvider(id: string): Provider | undefined {
        return this.providers.get(id);
    }

    public listProviders(): Provider[] {
        return Array.from(this.providers.values());
    }

    public setAuthentication(
        providerId: string, 
        auth: ProviderAuthentication
    ): void {
        this.authentication.set(providerId, auth);
        this.initializeClient(providerId);
    }

    public async saveApiKey(providerId: string, apiKey: string): Promise<void> {
        if (!this.secretStorage) {
            throw new Error('Secret storage not initialized');
        }
        
        await this.secretStorage.storeApiKey(providerId, apiKey);
        this.setAuthentication(providerId, { apiKey });
    }

    public updateSettings(
        providerId: string, 
        settings: Partial<ProviderSettings>
    ): void {
        const currentSettings = this.settings.get(providerId) || {
            timeout: 30000,
            retries: 3,
            cacheDuration: 360000
        };
        
        this.settings.set(providerId, {
            ...currentSettings,
            ...settings
        });
    }

    public getClient(providerId: string): ProviderClient | undefined {
        return this.clients.get(providerId);
    }

    public async getModelsForProvider(providerId: string): Promise<any[]> {
        const client = this.getClient(providerId);
        if (!client) {
            return [];
        }
        
        try {
            return await client.getModels();
        } catch (error) {
            console.error(`Error fetching models for provider ${providerId}:`, error);
            return [];
        }
    }
}