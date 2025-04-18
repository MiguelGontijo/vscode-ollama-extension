// src/services/ollamaService.ts
import * as vscode from 'vscode';
import { ModelGroup } from '../types/ollama';

interface OllamaListResponse {
    models: OllamaModel[];
}

interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

interface StreamParams {
    model: string;
    prompt: string;
    onUpdate: (text: string) => void;
}

export class OllamaService {
    private static instance: OllamaService;
    private baseUrl: string;
    private isOllamaAvailable: boolean = false;

    private constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.checkOllamaAvailability();
    }

    public static getInstance(): OllamaService {
        if (!OllamaService.instance) {
            OllamaService.instance = new OllamaService();
        }
        return OllamaService.instance;
    }

    private async checkOllamaAvailability(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            this.isOllamaAvailable = response.ok;
            console.log(`Ollama availability: ${this.isOllamaAvailable}`);
        } catch (error) {
            console.error('Failed to connect to Ollama:', error);
            this.isOllamaAvailable = false;
        }
    }

    public async getModels(): Promise<ModelGroup[]> {
        try {
            console.log('Fetching models from Ollama...');
            const response = await fetch(`${this.baseUrl}/api/tags`);
            
            if (!response.ok) {
                console.error(`Failed to fetch models: ${response.statusText}`);
                return this.getFallbackModels();
            }
            
            const data = await response.json();
            console.log('Received data from Ollama:', data);
            
            if (data && Array.isArray(data.models)) {
                const models = data.models.map((model: any) => ({
                    name: model.name,
                    provider: 'ollama'
                }));
                console.log('Parsed models:', models);
                return models;
            } else {
                console.error('Invalid response format from Ollama:', data);
                return this.getFallbackModels();
            }
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return this.getFallbackModels();
        }
    }
    
    private getFallbackModels(): ModelGroup[] {
        console.log('Using fallback models');
        return [
            { name: 'llama2', provider: 'ollama' },
            { name: 'mistral', provider: 'ollama' },
            { name: 'codellama', provider: 'ollama' }
        ];
    }

    public async generateCompletion(model: string, prompt: string): Promise<string> {
        if (!this.isOllamaAvailable) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            return `This is a simulated response because Ollama is not available.\n\nYour prompt was: ${prompt}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to generate completion: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.response || '';
        } catch (error) {
            console.error('Failed to generate completion:', error);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }

    public async streamResponse(params: StreamParams): Promise<void> {
        const { model, prompt, onUpdate } = params;
        
        if (!this.isOllamaAvailable) {
            // Simulate streaming for testing
            const words = `This is a simulated streaming response because Ollama is not available.\n\nYour prompt was: ${prompt}`.split(' ');
            let response = '';
            
            for (const word of words) {
                await new Promise(resolve => setTimeout(resolve, 100));
                response += word + ' ';
                onUpdate(response);
            }
            
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to stream response: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line) as OllamaResponse;
                        fullResponse += data.response;
                        onUpdate(fullResponse);
                        
                        if (data.done) {
                            return;
                        }
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to stream response:', error);
            throw new Error(`Failed to stream response: ${error}`);
        }
    }
}