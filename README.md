# Lista de presentes da Liene — 31 anos

Lista de presentes de aniversário construída com Next.js e preparada para publicação no Netlify.

## Funcionalidades

- catálogo com 11 sugestões de presentes;
- reserva com nome e e-mail;
- atualização atômica no PostgreSQL para impedir duas reservas do mesmo item;
- item reservado removido das próximas consultas;
- área do organizador protegida por código;
- surpresa bloqueada no servidor até 11/09/2026 às 00:00 em Campo Grande;
- e-mails nunca exibidos na página pública da surpresa.

## Publicação

O Netlify detecta o Next.js automaticamente, provisiona o Netlify Database e aplica a migração localizada em `netlify/database/migrations/` durante a publicação.

Configure a variável secreta `ORGANIZER_CODE` no projeto. Ela não deve ser armazenada no repositório.

## Desenvolvimento

```bash
npm install
npx netlify dev
```

Para validar a compilação:

```bash
npm run build
```
