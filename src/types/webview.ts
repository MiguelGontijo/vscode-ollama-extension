export interface WebviewApi<T> {
    getState(): T;
    setState(newState: T): void;
    postMessage(message: any): void;
}

export interface Conversation {
    id: string;
    text: string;
    prompt: string;
    response?: string;
    done?: boolean;
}

export interface ChatState {
    conversations: Array<Conversation>;
    selectedModel?: string;
}

export interface Message {
    type: 'createConversation' | 'response' | 'status';
    id?: string;
    text?: string;
    done?: boolean;
    status?: string;
    message?: string;
}

export interface PromptMessage {
    type: 'prompt';
    text: string;
    model: string;
}

export interface ResponseMessage {
    type: 'response';
    text: string;
    error?: boolean;
    id?: string;
    done?: boolean;
}

export interface StatusMessage {
    type: 'status';
    status: 'loading' | 'ready' | 'error';
    message?: string;
}

export interface CopyAction {
    type: 'copy';
    text: string;
    success: boolean;
}

declare global {
    interface Window {
        DOMUtils: {
            createElement(tag: string, className?: string, content?: string): HTMLElement;
            appendChildren(parent: HTMLElement, ...children: HTMLElement[]): void;
            updateStatus(message: string): void;
            showEmptyState(container: HTMLElement): void;
        };
        vscode: any;
        deleteConversation: (event: Event, id: string) => void;
        toggleConversation: (header: HTMLElement) => void;
    }
}

export type WebviewMessage = PromptMessage | ResponseMessage | StatusMessage;