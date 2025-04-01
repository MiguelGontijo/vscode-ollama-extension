import { ChatInput } from './components/ChatInput';
import { ModelSelector } from './components/ModelSelector';
import { ConversationList } from './components/conversation/ConversationList';
import { ModelGroup } from '../types/ollama';

interface StyleUris {
    styleMainUri: string;
    styleChatUri: string;
    styleInputUri: string;
    styleConversationUri: string;
}

export class WebView {
    private chatInput: ChatInput;
    private modelSelector: ModelSelector;
    private conversationList: ConversationList;

    constructor(
        modelGroups: ModelGroup[],
        private readonly styleUris: StyleUris
    ) {
        this.chatInput = new ChatInput();
        this.modelSelector = new ModelSelector(modelGroups);
        this.conversationList = new ConversationList();
    }

    public render(): string {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>MigsIA Chat</title>
                    <link rel="stylesheet" href="${this.styleUris.styleMainUri}">
                    <link rel="stylesheet" href="${this.styleUris.styleChatUri}">
                    <link rel="stylesheet" href="${this.styleUris.styleInputUri}">
                    <link rel="stylesheet" href="${this.styleUris.styleConversationUri}">
                </head>
                <body>
                    <div class="container">
                        <div class="input-section">
                            ${this.chatInput.render()}
                            <div class="controls-container">
                                ${this.modelSelector.render()}
                                <button class="send-button" id="send" title="Enviar">
                                    <div class="play-icon"></div>
                                </button>
                            </div>
                        </div>
                        ${this.conversationList.render()}
                    </div>
                </body>
            </html>
        `;
    }
}