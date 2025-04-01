import { webviewScript } from '../../webviewScript';
import { DOMUtils } from '../utils/DOMUtils';
import { StateHandler } from '../handlers/StateHandler';
import { ConversationManager } from '../conversation/ConversationManager';

export class ConversationList {
    public render(): string {
        return `
            <div class="conversations" id="conversationsList">
                <div class="empty-state">
                    Nenhuma conversa iniciada
                </div>
            </div>
            <script>
                ${DOMUtils.toString()}
                ${StateHandler.toString()}
                ${ConversationManager.toString()}
                ${webviewScript}
            </script>
        `;
    }
}