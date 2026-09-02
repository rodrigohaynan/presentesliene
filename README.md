# Liene 31 anos — convite + RSVP + lista de presentes

Projeto em Next.js preparado para publicação no Netlify.

## O que mudou

- página pública funcionando como convite da festa;
- data, horário, local, endereço, link do mapa e textos editáveis pelo admin;
- confirmação de presença com várias pessoas na mesma resposta;
- classificação individual de cada convidado como **adulto** ou **criança**;
- lista de presentes com reserva única;
- painel privado em `/organizador`;
- painel mostra total de confirmados, adultos, crianças e presentes reservados;
- admin pode adicionar, editar e excluir presentes;
- admin pode liberar uma reserva feita por engano;
- dados persistidos no **Netlify Blobs**, sem banco externo;
- surpresa de quem escolheu cada presente continua bloqueada até 11/09/2026.

## Antes de publicar

No Netlify, crie a variável de ambiente:

```text
ADMIN_PASSWORD=sua-senha-forte
```

Use pelo menos 8 caracteres. Não coloque a senha diretamente no código nem no GitHub.

O Netlify fornece automaticamente o contexto necessário para o Netlify Blobs em produção. Não é necessário criar banco, tabela ou conta em outro serviço.

## Publicação no Netlify

O projeto usa:

```text
Build command: npm run build
Publish directory: .next
Node: 22
```

O arquivo `netlify.toml` já contém essas configurações.

Para desenvolvimento local com os recursos da Netlify:

```bash
npm install
npx netlify dev
```

## Armazenamento

Os dados são gravados em um store do Netlify Blobs chamado `liene-31-party` e permanecem disponíveis entre novos deploys do mesmo projeto.
