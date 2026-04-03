# Security Guidance

Hook de segurança que detecta padrões perigosos ao editar arquivos:

## Padrões detectados
- **GitHub Actions Workflow Injection** — command injection via inputs não sanitizados
- **child_process.exec** — preferir execFile para evitar shell injection
- **new Function / eval()** — code injection via código dinâmico
- **dangerouslySetInnerHTML** — XSS via conteúdo não sanitizado
- **document.write / innerHTML** — XSS via manipulação DOM insegura
- **pickle (Python)** — deserialização arbitrária
- **os.system (Python)** — command injection

## Quando usar
Ao editar arquivos que contenham qualquer um dos padrões acima, alertar o desenvolvedor sobre riscos e sugerir alternativas seguras.
