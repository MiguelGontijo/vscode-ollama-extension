export class ChatInput {
    public render(): string {
        return `
            <div class="textarea-container">
                <textarea 
                    id="prompt" 
                    placeholder="Digite sua pergunta aqui..."
                    rows="1"
                ></textarea>
            </div>
        `;
    }
}