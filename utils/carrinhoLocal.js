import AsyncStorage from "@react-native-async-storage/async-storage";

function chaveCarrinho(uid) {
  return `@alimenta/carrinho/${uid}`;
}

function chaveModoLocal(uid) {
  return `@alimenta/carrinho-local/${uid}`;
}

export async function lerCarrinhoLocal(uid) {
  const conteudo = await AsyncStorage.getItem(chaveCarrinho(uid));

  if (!conteudo) return [];

  const itens = JSON.parse(conteudo);
  return Array.isArray(itens) ? itens : [];
}

export async function gravarCarrinhoLocal(uid, itens) {
  await AsyncStorage.multiSet([
    [chaveCarrinho(uid), JSON.stringify(itens)],
    [chaveModoLocal(uid), "true"],
  ]);
}

export async function usarCarrinhoLocal(uid) {
  return (await AsyncStorage.getItem(chaveModoLocal(uid))) === "true";
}

export async function limparCarrinhoLocal(uid) {
  await AsyncStorage.setItem(chaveModoLocal(uid), "false");
  await AsyncStorage.removeItem(chaveCarrinho(uid));
}

export async function salvarNoCarrinhoLocal(uid, item, quantidadeAdicional) {
  const itens = await lerCarrinhoLocal(uid);
  const existente = itens.find(
    (atual) => atual.produtoId === item.produtoId
  );
  const quantidade = Number(existente?.quantidade || 0) +
    Number(quantidadeAdicional);
  const disponibilidade = Number(item.disponibilidade);

  if (
    !Number.isInteger(quantidade) ||
    quantidade < 1 ||
    !Number.isFinite(disponibilidade) ||
    quantidade > disponibilidade
  ) {
    throw new Error(
      `Disponibilidade insuficiente. Restam ${disponibilidade} ${item.unidade || "unidades"}.`
    );
  }

  const atualizados = [
    ...itens.filter((atual) => atual.produtoId !== item.produtoId),
    { ...item, quantidade },
  ];

  if (!existente && atualizados.length > 50) {
    throw new Error("O carrinho aceita no máximo 50 produtos diferentes.");
  }

  await gravarCarrinhoLocal(uid, atualizados);
  return atualizados;
}

export async function atualizarQuantidadeLocal(uid, produtoId, quantidade) {
  const itens = await lerCarrinhoLocal(uid);
  const atual = itens.find((item) => item.produtoId === produtoId);

  if (!atual) {
    throw new Error("Este alimento não está no carrinho.");
  }

  const valor = Number(quantidade);
  const estoque = Number(atual.disponibilidade);

  if (
    !Number.isInteger(valor) ||
    valor < 1 ||
    !Number.isFinite(estoque) ||
    valor > estoque
  ) {
    throw new Error(
      `Quantidade acima do estoque atual. Restam ${estoque} ${atual.unidade || "unidades"}.`
    );
  }

  const atualizados = itens.map((item) =>
    item.produtoId === produtoId ? { ...item, quantidade: valor } : item
  );

  await gravarCarrinhoLocal(uid, atualizados);
  return atualizados;
}

export async function removerDoCarrinhoLocal(uid, produtoId) {
  const itens = await lerCarrinhoLocal(uid);
  const atualizados = itens.filter((item) => item.produtoId !== produtoId);

  await gravarCarrinhoLocal(uid, atualizados);
  return atualizados;
}