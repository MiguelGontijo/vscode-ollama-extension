// src/services/providers/AnthropicClient.ts
import { ProviderAuth, ProviderClient, ProviderModelResponse } from '../../types/providers';
import * as vscode from 'vscode';

export class AnthropicClient implements ProviderClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(auth: ProviderAuth) {
        this.apiKey = auth.apiKey || '';
        this.baseUrl = auth.baseUrl || 'https://api.anthropic.com';
    }

    public async getModels(): Promise<ProviderModelResponse[]> {
        if (!this.apiKey) {
            vscode.window.showWarningMessage('Anthropic API key not configured. Please add your API key in settings.');
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Anthropic models:', data);

            if (data && Array.isArray(data.data)) {
                return data.data.map((model: any) => ({
                    id: model.id,
                    name: model.id,
                    description: model.description || '',
                    contextLength: model.context_window || 0,
                    provider: 'anthropic'
                }));
            }

            return [];
        } catch (error) {
            console.error('Error fetching Anthropic models:', error);
            return [];
        }
    }

    public async generateCompletion(model: string, prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate completion: ${response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text || '';
        } catch (error) {
            console.error('Error generating Anthropic completion:', error);
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
            throw new Error('Anthropic API key not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1024,
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
                        const data = JSON.parse(line.substring(6));
                        if (data.type === 'content_block_delta' && data.delta.text) {
                            fullResponse += data.delta.text;
                            onUpdate(fullResponse);
                        }
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error streaming Anthropic completion:', error);
            throw error;
        }
    }
}