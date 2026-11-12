import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../firebase";
import { db } from "../firebaseDb";
import { obterPrecoAtual } from "./precosProdutos";
import {
  atualizarQuantidadeLocal,
  limparCarrinhoLocal,
  lerCarrinhoLocal,
  removerDoCarrinhoLocal,
  salvarNoCarrinhoLocal,
  usarCarrinhoLocal,
} from "./carrinhoLocal";
import {
  criarDadosDoacaoAgrupada,
  validarQuantidadeCarrinho,
} from "./carrinhoCalculos";

const LIMITE_ITENS_CARRINHO = 50;

function usuarioAutenticado(uid) {
  const usuario = auth.currentUser;

  if (!usuario || (uid && usuario.uid !== uid)) {
    throw new Error("Faça login novamente para usar o carrinho.");
  }

  return usuario.uid;
}

function obterPrecoProduto(produto) {
  return Math.max(0, obterPrecoAtual(produto) ?? 0);
}

function criarItemCarrinho(produtoId, produto, quantidade) {
  return {
    produtoId,
    quantidade,
    nome: produto.nome || "Alimento",
    unidade: produto.unidade || "unidades",
    precoUnitario: obterPrecoProduto(produto),
    precoUnidade: produto.precoUnidade || produto.unidade || "unidade",
    categoria: produto.categoria || "Outros",
    cidade: produto.cidade || "A combinar",
    imagemChave: produto.imagemChave || "",
    estabelecimento: produto.estabelecimento || "Doador",
    descricao: produto.descricao || "",
    demonstracao: produto.demonstracao === true,
    disponibilidade: lerEstoque(produto),
  };
}

function podeUsarCarrinhoLocal(erro) {
  return ["permission-denied", "unavailable"].includes(erro?.code);
}

function lerEstoque(produto) {
  const estoque = Number(produto.quantidade);

  return Number.isFinite(estoque) && estoque >= 0 ? estoque : 0;
}

function normalizarAssinatura(itens = []) {
  return [...itens]
    .map((item) => ({
      produtoId: String(item.produtoId || item.id || ""),
      quantidade: Number(item.quantidade),
      precoUnitario:
        Math.round(Number(item.precoUnitario || 0) * 100) / 100,
    }))
    .sort((a, b) => a.produtoId.localeCompare(b.produtoId));
}

export async function adicionarProdutoAoCarrinho(
  produtoId,
  quantidade,
  uid,
  produtoConhecido
) {
  const dono = usuarioAutenticado(uid);
  const id = String(produtoId || "");

  if (!id || !Number.isInteger(Number(quantidade)) || Number(quantidade) < 1) {
    throw new Error("Escolha uma quantidade válida.");
  }

  const carrinhoRef = doc(db, "carrinhos", dono);
  const alimentoRef = doc(db, "alimentos", id);

  if (await usarCarrinhoLocal(dono)) {
    if (!produtoConhecido) {
      throw new Error("Não foi possível validar o alimento para o carrinho.");
    }

    await salvarNoCarrinhoLocal(
      dono,
      criarItemCarrinho(id, produtoConhecido, 0),
      quantidade
    );
    return "local";
  }

  try {
    await runTransaction(db, async (transacao) => {
      const [alimentoSnapshot, carrinhoSnapshot] = await Promise.all([
        transacao.get(alimentoRef),
        transacao.get(carrinhoRef),
      ]);

      if (!alimentoSnapshot.exists()) {
        throw new Error("Este alimento não está mais disponível.");
      }

      const produto = alimentoSnapshot.data();
      const estoque = lerEstoque(produto);
      const itensAtuais = Array.isArray(carrinhoSnapshot.data()?.itens)
        ? carrinhoSnapshot.data().itens
        : [];
      const itemAtual = itensAtuais.find((item) => item.produtoId === id);
      const quantidadeFinal =
        Number(quantidade) + Number(itemAtual?.quantidade || 0);

      if (
        produto.status !== "disponivel" ||
        !validarQuantidadeCarrinho(quantidadeFinal, estoque)
      ) {
        throw new Error(
          `Disponibilidade insuficiente. Restam ${estoque} ${produto.unidade || "unidades"}.`
        );
      }

      if (!itemAtual && itensAtuais.length >= LIMITE_ITENS_CARRINHO) {
        throw new Error(
          `O carrinho aceita no máximo ${LIMITE_ITENS_CARRINHO} produtos diferentes.`
        );
      }

      const novoItem = criarItemCarrinho(id, produto, quantidadeFinal);
      const itens = [
        ...itensAtuais.filter((item) => item.produtoId !== id),
        novoItem,
      ];

      transacao.set(carrinhoRef, {
        criadoPor: dono,
        criadoEm: carrinhoSnapshot.exists()
          ? carrinhoSnapshot.data().criadoEm || serverTimestamp()
          : serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        itens,
      });
    });
    return "firestore";
  } catch (erro) {
    if (!podeUsarCarrinhoLocal(erro) || !produtoConhecido) throw erro;

    await salvarNoCarrinhoLocal(
      dono,
      criarItemCarrinho(id, produtoConhecido, 0),
      quantidade
    );
    return "local";
  }
}

export async function alterarQuantidadeNoCarrinho(
  produtoId,
  quantidade,
  uid
) {
  const dono = usuarioAutenticado(uid);
  const id = String(produtoId || "");
  const novaQuantidade = Number(quantidade);

  if (!id || !Number.isInteger(novaQuantidade) || novaQuantidade < 1) {
    throw new Error("A quantidade deve ser pelo menos 1.");
  }

  const carrinhoRef = doc(db, "carrinhos", dono);
  const alimentoRef = doc(db, "alimentos", id);

  if (await usarCarrinhoLocal(dono)) {
    await atualizarQuantidadeLocal(dono, id, novaQuantidade);
    return "local";
  }

  try {
    await runTransaction(db, async (transacao) => {
      const [alimentoSnapshot, carrinhoSnapshot] = await Promise.all([
        transacao.get(alimentoRef),
        transacao.get(carrinhoRef),
      ]);

      if (!carrinhoSnapshot.exists() || !alimentoSnapshot.exists()) {
        throw new Error("O alimento não está mais disponível.");
      }

      const produto = alimentoSnapshot.data();
      const estoque = lerEstoque(produto);
      const itensAtuais = Array.isArray(carrinhoSnapshot.data().itens)
        ? carrinhoSnapshot.data().itens
        : [];

      if (
        produto.status !== "disponivel" ||
        !validarQuantidadeCarrinho(novaQuantidade, estoque)
      ) {
        throw new Error(
          `Quantidade acima do estoque atual. Restam ${estoque} ${produto.unidade || "unidades"}.`
        );
      }

      if (!itensAtuais.some((item) => item.produtoId === id)) {
        throw new Error("Este alimento não está no carrinho.");
      }

      const itens = itensAtuais.map((item) =>
        item.produtoId === id
          ? criarItemCarrinho(id, produto, novaQuantidade)
          : item
      );

      transacao.update(carrinhoRef, {
        itens,
        atualizadoEm: serverTimestamp(),
      });
    });
    return "firestore";
  } catch (erro) {
    if (!podeUsarCarrinhoLocal(erro)) throw erro;
    await atualizarQuantidadeLocal(dono, id, novaQuantidade);
    return "local";
  }
}

export async function removerProdutoDoCarrinho(produtoId, uid) {
  const dono = usuarioAutenticado(uid);
  const carrinhoRef = doc(db, "carrinhos", dono);

  if (await usarCarrinhoLocal(dono)) {
    await removerDoCarrinhoLocal(dono, String(produtoId));
    return "local";
  }

  try {
    await runTransaction(db, async (transacao) => {
      const carrinhoSnapshot = await transacao.get(carrinhoRef);

      if (!carrinhoSnapshot.exists()) return;

      const itensAtuais = Array.isArray(carrinhoSnapshot.data().itens)
        ? carrinhoSnapshot.data().itens
        : [];

      transacao.update(carrinhoRef, {
        itens: itensAtuais.filter(
          (item) => item.produtoId !== String(produtoId)
        ),
        atualizadoEm: serverTimestamp(),
      });
    });
    return "firestore";
  } catch (erro) {
    if (!podeUsarCarrinhoLocal(erro)) throw erro;
    await removerDoCarrinhoLocal(dono, String(produtoId));
    return "local";
  }
}

export async function sincronizarCarrinhoLocal(uid) {
  const dono = usuarioAutenticado(uid);
  if (!(await usarCarrinhoLocal(dono))) return null;

  const itensLocais = await lerCarrinhoLocal(dono);
  const carrinhoRef = doc(db, "carrinhos", dono);

  try {
    const itensSincronizados = await runTransaction(
      db,
      async (transacao) => {
        const carrinhoSnapshot = await transacao.get(carrinhoRef);
        const itensRemotos = Array.isArray(carrinhoSnapshot.data()?.itens)
          ? carrinhoSnapshot.data().itens
          : [];
        const mapaItens = new Map(
          itensRemotos.map((item) => [item.produtoId, item])
        );

        itensLocais.forEach((item) => {
          const itemRemoto = mapaItens.get(item.produtoId);
          mapaItens.set(item.produtoId, {
            ...item,
            quantidade:
              Number(item.quantidade) + Number(itemRemoto?.quantidade || 0),
          });
        });

        const itensParaSincronizar = [...mapaItens.values()];
        if (itensParaSincronizar.length > LIMITE_ITENS_CARRINHO) {
          throw new Error(
            `O carrinho aceita no máximo ${LIMITE_ITENS_CARRINHO} produtos diferentes.`
          );
        }

        const referencias = itensParaSincronizar.map((item) =>
          doc(db, "alimentos", item.produtoId)
        );
        const snapshots = await Promise.all(
          referencias.map((referencia) => transacao.get(referencia))
        );
        const itensAtualizados = snapshots.map((snapshot, index) => {
          const item = itensParaSincronizar[index];
          if (!snapshot.exists()) {
            throw new Error(`${item.nome} não está mais disponível.`);
          }

          const produto = snapshot.data();
          if (
            produto.status !== "disponivel" ||
            !validarQuantidadeCarrinho(
              item.quantidade,
              lerEstoque(produto)
            )
          ) {
            throw new Error(
              `Estoque insuficiente para ${produto.nome || item.nome}. Revise a quantidade do carrinho.`
            );
          }

          return criarItemCarrinho(
            item.produtoId,
            produto,
            item.quantidade
          );
        });

        transacao.set(carrinhoRef, {
          criadoPor: dono,
          criadoEm: carrinhoSnapshot.exists()
            ? carrinhoSnapshot.data().criadoEm || serverTimestamp()
            : serverTimestamp(),
          atualizadoEm: serverTimestamp(),
          itens: itensAtualizados,
        });

        return itensAtualizados;
      }
    );

    await limparCarrinhoLocal(dono);
    return itensSincronizados;
  } catch (erro) {
    if (podeUsarCarrinhoLocal(erro)) return false;
    throw erro;
  }
}

export async function concluirDoacaoCarrinho(itensEsperados, uid) {
  const dono = usuarioAutenticado(uid);
  if (await usarCarrinhoLocal(dono)) {
    throw new Error(
      "Seu carrinho está salvo neste dispositivo. Publique as regras atualizadas do Firestore e reabra o carrinho para sincronizar antes de concluir."
    );
  }

  const carrinhoRef = doc(db, "carrinhos", dono);
  const doacaoRef = doc(collection(db, "minhasDoacoes"));

  return runTransaction(db, async (transacao) => {
    const carrinhoSnapshot = await transacao.get(carrinhoRef);

    if (!carrinhoSnapshot.exists()) {
      throw new Error("O carrinho está vazio.");
    }

    const itensAtuais = Array.isArray(carrinhoSnapshot.data().itens)
      ? carrinhoSnapshot.data().itens
      : [];

    if (itensAtuais.length === 0) {
      throw new Error("Adicione pelo menos um alimento ao carrinho.");
    }

    if (
      itensAtuais.length > LIMITE_ITENS_CARRINHO ||
      itensAtuais.some(
        (item) =>
          typeof item.produtoId !== "string" ||
          !item.produtoId ||
          !Number.isInteger(Number(item.quantidade)) ||
          Number(item.quantidade) < 1
      ) ||
      new Set(itensAtuais.map((item) => item.produtoId)).size !==
        itensAtuais.length
    ) {
      throw new Error("O carrinho contém itens inválidos. Revise-o e tente novamente.");
    }

    const referencias = itensAtuais.map((item) =>
      doc(db, "alimentos", item.produtoId)
    );
    const snapshots = await Promise.all(
      referencias.map((referencia) => transacao.get(referencia))
    );

    const itensAtualizados = snapshots.map((snapshot, index) => {
      const itemCarrinho = itensAtuais[index];

      if (!snapshot.exists()) {
        throw new Error(`${itemCarrinho.nome} não está mais disponível.`);
      }

      const produto = snapshot.data();
      const estoque = lerEstoque(produto);

      if (
        produto.status !== "disponivel" ||
        !validarQuantidadeCarrinho(itemCarrinho.quantidade, estoque)
      ) {
        throw new Error(
          `Estoque insuficiente para ${produto.nome || itemCarrinho.nome}. Restam ${estoque} ${produto.unidade || "unidades"}.`
        );
      }

      return {
        produtoId: itemCarrinho.produtoId,
        ...criarItemCarrinho(
          itemCarrinho.produtoId,
          produto,
          itemCarrinho.quantidade
        ),
      };
    });

    if (
      JSON.stringify(normalizarAssinatura(itensEsperados)) !==
      JSON.stringify(normalizarAssinatura(itensAtualizados))
    ) {
      throw new Error(
        "O carrinho ou os preços mudaram. Revise os itens antes de concluir."
      );
    }

    const dadosDoacao = criarDadosDoacaoAgrupada(itensAtualizados, dono);

    transacao.set(doacaoRef, {
      ...dadosDoacao,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    itensAtualizados.forEach((item, index) => {
      const estoqueAtual = lerEstoque(snapshots[index].data());
      const estoqueRestante = estoqueAtual - item.quantidade;

      transacao.update(referencias[index], {
        quantidade: estoqueRestante,
        status: estoqueRestante === 0 ? "esgotado" : "disponivel",
        atualizadoEm: serverTimestamp(),
        ultimaDoacaoId: doacaoRef.id,
      });
    });

    transacao.update(carrinhoRef, {
      itens: [],
      atualizadoEm: serverTimestamp(),
    });

    return { doacaoId: doacaoRef.id, total: dadosDoacao.total };
  });
}

export { LIMITE_ITENS_CARRINHO };