import { ChatState } from '../../../types/webview';

export class StateHandler {
    private vscode: any;
    private state: ChatState;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.state = this.vscode.getState() || { conversations: [] };
    }

    public getState(): ChatState {
        return this.state;
    }

    public updateConversation(id: string, text: string, done: boolean): void {
        const conversation = this.state.conversations.find(c => c.id === id);
        if (conversation) {
            conversation.response = text;
            conversation.done = done;
        }
        this.setState();
    }

    public deleteConversation(id: string): void {
        this.state.conversations = this.state.conversations.filter(c => c.id !== id);
        this.setState();
    }

    private setState(): void {
        this.vscode.setState(this.state);
    }
}