// src/extension.ts
import * as vscode from 'vscode';
import { OllamaWebviewProvider } from './webviewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Ativando extensão MigsIA...');
    
    // Registrar o provedor de webview
    const provider = new OllamaWebviewProvider(context.extensionUri);
    
    const view = vscode.window.registerWebviewViewProvider(
        'migsIA.chatView',
        provider
    );
    
    context.subscriptions.push(view);
    
    // Registrar comando para iniciar a extensão
    const startCommand = vscode.commands.registerCommand('migsIA.start', () => {
        vscode.window.showInformationMessage('MigsIA iniciado!');
    });
    
    context.subscriptions.push(startCommand);
    
    console.log('Extensão MigsIA ativada com sucesso!');
}

export function deactivate() {
    console.log('Extensão MigsIA desativada.');
}