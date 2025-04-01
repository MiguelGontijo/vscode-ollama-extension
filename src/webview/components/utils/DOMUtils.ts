export class DOMUtils {
    static createElement(tag: string, className?: string, content?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static appendChildren(parent: HTMLElement, ...children: HTMLElement[]): void {
        children.forEach(child => parent.appendChild(child));
    }

    static updateStatus(message: string): void {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    static showEmptyState(container: HTMLElement): void {
        const emptyState = this.createElement('div', 'empty-state', 'Nenhuma conversa iniciada');
        container.appendChild(emptyState);
    }
}