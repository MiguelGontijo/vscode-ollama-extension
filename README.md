# MigsIA - Extensão VS Code para Ollama

Extensão para Visual Studio Code que integra modelos de IA locais (via Ollama) e remotos (Claude, OpenRouter, DeepSeek).

## Recursos

- 🤖 Integração com Ollama para modelos locais
- 🌐 Suporte para modelos remotos:
  - Claude 3 (Anthropic)
  - Mixtral (via OpenRouter)
  - DeepSeek Coder
- 💬 Interface de chat integrada
- 🔄 Streaming de respostas em tempo real
- ⚙️ Configurações flexíveis

## Pré-requisitos

- Visual Studio Code 1.75.0 ou superior
- [Ollama](https://ollama.ai/) instalado para modelos locais
- Chaves de API configuradas para modelos remotos

## Instalação

1. Instale a extensão através do VS Code Marketplace
2. Configure as chaves de API necessárias
3. Configure o Ollama se desejar usar modelos locais

## Configuração

A extensão oferece várias opções de configuração:

- `migsIA.models.connectionType`: Tipo de conexão (local/remote/both)
- `migsIA.models.remote.*.apiKey`: Chaves de API para serviços remotos
- `migsIA.ollama.*`: Configurações do Ollama (URL, timeout, etc)

## Uso

1. Abra a sidebar da extensão
2. Selecione um modelo
3. Digite sua pergunta
4. Receba respostas em tempo real

## Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/vscode-ollama-extension.git

# Instale as dependências
npm install

# Compile a extensão
npm run compile

# Execute em modo de desenvolvimento
F5 no VS Code
```

## Licença

MIT