// src/services/providers/OpenRouterClient.ts
import { ProviderAuth, ProviderClient, ProviderModelResponse } from '../../types/providers';
import * as vscode from 'vscode';

export class OpenRouterClient implements ProviderClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(auth: ProviderAuth) {
        this.apiKey = auth.apiKey || '';
        this.baseUrl = auth.baseUrl || 'https://openrouter.ai/api';
    }

    public async getModels(): Promise<ProviderModelResponse[]> {
        if (!this.apiKey) {
            vscode.window.showWarningMessage('OpenRouter API key not configured. Please add your API key in settings.');
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://vscode-extension.local'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('OpenRouter models:', data);

            if (data && Array.isArray(data.data)) {
                return data.data.map((model: any) => ({
                    id: model.id,
                    name: model.name || model.id,
                    description: model.description || '',
                    contextLength: model.context_length || 0,
                    provider: 'openrouter'
                }));
            }

            return [];
        } catch (error) {
            console.error('Error fetching OpenRouter models:', error);
            return [];
        }
    }

    public async generateCompletion(model: string, prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://vscode-extension.local'
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate completion: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error generating OpenRouter completion:', error);
            throw error;
        }
    }

    public async streamCompletion(params: {
        model: string;
        prompt: string;
        onUpdate: (text: string) => void;
    }): Promise<void> {
        const { model, prompt, onUpdate } = params;

        if (!this.apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://vscode-extension.local'
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to stream completion: ${response.statusText}`);
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
                const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        if (line === 'data: [DONE]') continue;
                        
                        const data = JSON.parse(line.substring(6));
                        if (data.choices && data.choices[0]?.delta?.content) {
                            fullResponse += data.choices[0].delta.content;
                            onUpdate(fullResponse);
                        }
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error streaming OpenRouter completion:', error);
            throw error;
        }
    }
}