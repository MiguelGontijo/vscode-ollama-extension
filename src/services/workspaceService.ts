import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceContext } from '../types/workspace';

export class WorkspaceService {
    public async getWorkspaceContext(): Promise<WorkspaceContext> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('Nenhum editor ativo');
        }

        const document = editor.document;
        const selection = editor.selection;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

        return {
            language: document.languageId,
            framework: await this.detectFramework(workspaceFolder?.uri),
            currentFile: document.fileName,
            selectedCode: document.getText(selection),
            currentFileContent: document.getText(),
            relevantFiles: await this.getRelevantFiles(document.uri)
        };
    }

    private async detectFramework(workspaceUri?: vscode.Uri): Promise<string | undefined> {
        if (!workspaceUri) return undefined;
        
        // Detecta framework baseado em arquivos de configuração
        const packageJson = path.join(workspaceUri.fsPath, 'package.json');
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(packageJson));
            const pkg = JSON.parse(content.toString());
            return this.inferFramework(pkg.dependencies, pkg.devDependencies);
        } catch {
            return undefined;
        }
    }

    private async getRelevantFiles(currentFile: vscode.Uri): Promise<string> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);
        if (!workspaceFolder) return '';

        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,tsx,jsx}'),
            '**/node_modules/**'
        );

        return files
            .map(f => path.relative(workspaceFolder.uri.fsPath, f.fsPath))
            .join('\n');
    }

    private inferFramework(dependencies: any = {}, devDependencies: any = {}): string | undefined {
        const allDeps = { ...dependencies, ...devDependencies };
        
        if (allDeps.react) return 'React';
        if (allDeps.vue) return 'Vue';
        if (allDeps.angular) return 'Angular';
        if (allDeps.next) return 'Next.js';
        return undefined;
    }
}