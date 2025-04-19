// src/extension.ts
import * as vscode from 'vscode';
import { OllamaWebviewProvider } from './webviewProvider';
import { ProviderService } from './services/ProviderService';
import { SecretStorageService } from './services/SecretStorageService';
import { ConversationService } from './services/ConversationService';
import { apiKeyCommands } from './config/apiKeys';

export function activate(context: vscode.ExtensionContext) {
    console.log('Ativando extensão MigsIA...');
    
    // Inicializar o SecretStorageService
    const secretStorage = SecretStorageService.getInstance(context);
    
    // Inicializar o ProviderService e configurar o SecretStorageService
    const providerService = ProviderService.getInstance();
    providerService.setSecretStorage(secretStorage);
    
    // Inicializar o ConversationService
    const conversationService = ConversationService.getInstance();
    conversationService.setContext(context);
    
    // Registrar o provedor de webview
    const provider = new OllamaWebviewProvider(context.extensionUri);
    
    const view = vscode.window.registerWebviewViewProvider(
        'migsIA.chatView',
        provider
    );
    
    context.subscriptions.push(view);
    
    // Registrar comandos para gerenciar chaves de API
    apiKeyCommands.forEach(cmd => {
        const command = vscode.commands.registerCommand(cmd.command, async () => {
            const providerId = cmd.command.split('.')[1].replace('set', '').replace('ApiKey', '').toLowerCase();
            
            const apiKey = await vscode.window.showInputBox({
                prompt: `Enter your ${providerId} API key`,
                password: true
            });
            
            if (apiKey) {
                await providerService.saveApiKey(providerId, apiKey);
                vscode.window.showInformationMessage(`${providerId} API key saved successfully`);
            }
        });
        
        context.subscriptions.push(command);
    });
    
    // Registrar comandos para gerenciar conversas
    const newConversationCommand = vscode.commands.registerCommand('migsIA.newConversation', () => {
        provider.createNewConversation();
    });
    
    const clearConversationsCommand = vscode.commands.registerCommand('migsIA.clearConversations', async () => {
        const confirmed = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all conversations? This cannot be undone.',
            { modal: true },
            'Yes'
        );
        
        if (confirmed === 'Yes') {
            conversationService.clearAllConversations();
            provider.refreshWebview();
            vscode.window.showInformationMessage('All conversations cleared');
        }
    });
    
    context.subscriptions.push(newConversationCommand, clearConversationsCommand);
    
    console.log('Extensão MigsIA ativada com sucesso!');
}

export function deactivate() {
    console.log('Extensão MigsIA desativada.');
}