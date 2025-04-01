export interface WorkspaceContext {
    language: string;
    framework?: string;
    currentFile: string;
    selectedCode?: string;
    currentFileContent: string;
    relevantFiles: string;
}