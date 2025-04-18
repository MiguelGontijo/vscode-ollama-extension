// src/services/ProviderService.ts
import { Provider, ProviderAuthentication, ProviderSettings } from '../types/ollama';
import { abacusProvider } from '../config/providers/abacus';
import { anthropicProvider } from '../config/providers/anthropic';
import { deepseekProvider } from '../config/providers/deepseek';
import { openrouterProvider } from '../config/providers/openrouter';

export class ProviderService {
    private static instance: ProviderService;
    private providers: Map<string, Provider>;
    private authentication: Map<string, ProviderAuthentication>;
    private settings: Map<string, ProviderSettings>;

    private constructor() {
        this.providers = new Map();
        this.authentication = new Map();
        this.settings = new Map();
        
        // Registrar providers padrão
        this.registerDefaultProviders();
    }

    public static getInstance(): ProviderService {
        if (!ProviderService.instance) {
            ProviderService.instance = new ProviderService();
        }
        return ProviderService.instance;
    }

    private registerDefaultProviders() {
        const ollama: Provider = {
            id: 'ollama',
            name: 'Ollama',
            description: 'Local LLM runtime',
            isEnabled: true,
            baseUrl: 'http://localhost:11434'
        };

        this.registerProvider(ollama);
        this.registerProvider(abacusProvider);
        this.registerProvider(anthropicProvider);
        this.registerProvider(deepseekProvider);
        this.registerProvider(openrouterProvider);
    }

    public registerProvider(provider: Provider): void {
        if (this.providers.has(provider.id)) {
            throw new Error(`Provider ${provider.id} already registered`);
        }
        
        this.providers.set(provider.id, provider);
        this.settings.set(provider.id, {
            timeout: 30000,
            retries: 3,
            cacheDuration: 3600000
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
    }

    public updateSettings(
        providerId: string, 
        settings: Partial<ProviderSettings>
    ): void {
        const currentSettings = this.settings.get(providerId) || {
            timeout: 30000,
            retries: 3,
            cacheDuration: 3600000
        };
        
        this.settings.set(providerId, {
            ...currentSettings,
            ...settings
        });
    }
}