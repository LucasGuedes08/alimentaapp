# Carrinho e doações agrupadas no Firestore

## Modelo de dados

O aplicativo usa Firestore, que armazena documentos em coleções em vez de tabelas SQL:

- `carrinhos/{uid}`: um documento por usuário autenticado. `itens` é uma lista de `{ produtoId, quantidade, ...snapshotDoProduto }`. Ela mantém o carrinho entre sessões e limita a 50 produtos diferentes por documento.
- `alimentos/{produtoId}`: estoque disponível em `quantidade`, preço atual nos campos de preço existentes e `status`.
- `minhasDoacoes/{doacaoId}`: um registro por finalização. Doações novas usam `tipoDoacao: "agrupada"`, `status: "Em andamento"`, `itens`, `quantidadeItens`, `total` e `quantidadesPorProduto`.

Não há chaves estrangeiras no Firestore: `produtoId` referencia `alimentos/{produtoId}` e as regras validam a referência ao baixar estoque. Os itens ficam incorporados aos documentos do carrinho e da doação para que uma leitura já retorne a revisão completa; com o limite de 50 itens, isso evita leituras adicionais e mantém a transação abaixo dos limites do Firestore. Os campos legados (`nome`, `quantidade`, `unidade`, `preco`, `criadoPor`, entre outros) continuam preenchidos.

## Fluxo e estoque

1. Ao adicionar, uma transação lê o alimento e o carrinho, soma a quantidade ao item existente e rejeita quantidade menor que 1 ou acima do estoque atual.
2. Na revisão, o app carrega os dados atuais dos alimentos para mostrar preços promocionais, subtotais e total.
3. Na confirmação da simulação, uma única transação relê carrinho e estoques, verifica que quantidade/preço ainda correspondem à revisão, cria `minhasDoacoes/{doacaoId}`, reduz cada estoque e limpa `carrinhos/{uid}`.
4. Se outro usuário consumir o estoque primeiro, a transação falha sem criar doação nem alterar parcialmente os produtos. Estoque zero recebe status `esgotado`, que já é excluído do catálogo.

O pagamento continua sendo uma demonstração: não há cobrança real. O registro de doação e a baixa de estoque ocorrem ao confirmar a tela final da simulação.

Quando a coleção `carrinhos` não estiver autorizada ou o Firestore estiver temporariamente indisponível, o app mantém o carrinho no AsyncStorage separado pelo UID. A tela informa que ele está apenas neste dispositivo; a finalização fica bloqueada até as regras permitirem sincronizar. Ao reabrir o carrinho depois de publicar as regras, o app tenta mesclar e sincronizar os itens, validando novamente os estoques.

## Minhas doações e migração

A consulta permanece `minhasDoacoes` filtrada por `criadoPor == auth.currentUser.uid`; a tela aplica o filtro de status localmente:

```js
const minhasDoacoes = query(
  collection(db, "minhasDoacoes"),
  where("criadoPor", "==", auth.currentUser.uid)
);
```

A conversão reconhece `itens` agrupados e mantém a leitura do formato legado de produto único. Não é necessário mover registros existentes. Se for preciso uniformizar o histórico antigo, faça uma migração administrativa com Admin SDK/Cloud Function (as regras do cliente bloqueiam edição do histórico): envolva cada item legado num array `itens`, calcule `total`, `quantidadeItens` e `quantidadesPorProduto`, e preserve `status`, `criadoPor` e `criadoEm`.

Para produção com inventário de alto valor, mova a finalização para uma Cloud Function autenticada e deixe o cliente sem permissão para atualizar estoque. O fluxo neste app usa transações do SDK cliente e regras que vinculam cada baixa a uma doação criada na mesma transação.

## Publicação das regras

1. Revise `firestore.rules` neste projeto Firebase.
2. Publique o arquivo pelo Firebase Console (Firestore Database → Regras). A CLI também pode ser usada com `firebase deploy --only firestore:rules` quando o projeto tiver `firebase.json` configurado.
3. Teste com duas sessões: esgote o mesmo produto simultaneamente e confirme que apenas uma finalização vence; confira a doação agrupada em “Minhas doações” e a lista vazia do carrinho.

Os registros agrupados começam com status `Em andamento`. A atualização posterior para `Concluída` deve ser feita por uma rotina administrativa confiável; o cliente não recebe permissão para editar status ou histórico.