# Lista de presentes da Liene — 31 anos

Lista de presentes de aniversário construída com Next.js e preparada para publicação no Netlify.

## Funcionalidades

- catálogo com 11 sugestões de presentes;
- reserva com nome e e-mail;
- atualização atômica no banco de reservas para impedir duas escolhas do mesmo item;
- item reservado removido das próximas consultas;
- área do organizador protegida por código;
- surpresa bloqueada no servidor até 11/09/2026 às 00:00 em Campo Grande;
- e-mails nunca exibidos na página pública da surpresa.

## Publicação

O Netlify detecta o Next.js automaticamente. As rotas do servidor encaminham as reservas para o serviço seguro já existente, sem exigir Netlify Database ou plano pago.

## Desenvolvimento

```bash
npm install
npx netlify dev
```

Para validar a compilação:

```bash
npm run build
```
