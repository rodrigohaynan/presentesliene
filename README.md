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

## Atualização — convidados, duplicidade e fotos dos presentes

- O nome para contato é apenas o responsável pela confirmação. Somente os nomes cadastrados em **Pessoas confirmadas** entram na contagem de adultos/crianças.
- O painel privado mostra os nomes confirmados e a categoria de cada pessoa no resumo.
- Nomes de convidados repetidos geram um aviso informando quem fez a confirmação anterior; é possível prosseguir apenas quando realmente forem pessoas diferentes com o mesmo nome.
- O administrador pode editar o responsável, WhatsApp, nomes e categoria adulto/criança, remover uma pessoa da confirmação ou excluir a confirmação inteira.
- Cada presente pode ter uma foto de referência enviada pelo administrador. A imagem é otimizada no navegador e persistida separadamente no Netlify Blobs.
