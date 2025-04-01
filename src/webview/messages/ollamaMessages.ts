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

export type WebviewMessage = PromptMessage | ResponseMessage | StatusMessage;