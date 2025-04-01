import * as vscode from 'vscode';
import { MigsIAWebviewProvider } from './webviewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new MigsIAWebviewProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('migs-ia.chatView', provider)
    );
}

export function deactivate() {}