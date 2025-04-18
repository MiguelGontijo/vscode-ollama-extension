// src/services/SecretStorageService.ts
import * as vscode from 'vscode';

export class SecretStorageService {
    private static instance: SecretStorageService;
    private secretStorage: vscode.SecretStorage;

    private constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    public static getInstance(context: vscode.ExtensionContext): SecretStorageService {
        if (!SecretStorageService.instance) {
            SecretStorageService.instance = new SecretStorageService(context);
        }
        return SecretStorageService.instance;
    }

    public async storeApiKey(provider: string, apiKey: string): Promise<void> {
        const key = `migsIA.${provider}.apiKey`;
        await this.secretStorage.store(key, apiKey);
        console.log(`API key for ${provider} stored securely`);
    }

    public async getApiKey(provider: string): Promise<string | undefined> {
        const key = `migsIA.${provider}.apiKey`;
        return await this.secretStorage.get(key);
    }

    public async deleteApiKey(provider: string): Promise<void> {
        const key = `migsIA.${provider}.apiKey`;
        await this.secretStorage.delete(key);
        console.log(`API key for ${provider} deleted`);
    }
}