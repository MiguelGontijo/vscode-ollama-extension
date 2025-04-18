// src/services/ollamaService.ts
import { ModelGroup } from '../types/ollama';

export class OllamaService {
    private static instance: OllamaService;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = 'http://localhost:11434';
    }

    public static getInstance(): OllamaService {
        if (!OllamaService.instance) {
            OllamaService.instance = new OllamaService();
        }
        return OllamaService.instance;
    }

    public async getModels(): Promise<ModelGroup[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            
            if (data && data.models) {
                return data.models.map((model: any) => ({
                    name: model.name,
                    provider: 'ollama'
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return [];
        }
    }

    public async generateCompletion(model: string, prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    prompt
                })
            });
            
            const data = await response.json();
            return data.response || '';
        } catch (error) {
            console.error('Failed to generate completion:', error);
            return '';
        }
    }
}