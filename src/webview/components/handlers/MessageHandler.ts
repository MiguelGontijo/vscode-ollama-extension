import { Message } from '../conversation/ConversationTypes';
import { StateHandler } from './StateHandler';
import { ConversationManager } from '../conversation/ConversationManager';

export class MessageHandler {
    constructor(
        private readonly stateHandler: StateHandler,
        private readonly conversationManager: ConversationManager
    ) {}

    public handleMessage(message: Message): void {
        if (!message || !message.type) return;

        switch (message.type) {
            case 'createConversation':
                if (!message.id || !message.text) return;
                this.conversationManager.createConversation(message.text, message.id);
                break;

            case 'response':
                if (!message.id || !message.text) return;
                this.conversationManager.updateResponse(message.id, message.text, message.done || false);
                break;

            case 'status':
                if (message.message) {
                    this.conversationManager.updateStatus(message.message);
                }
                break;
        }
    }
}