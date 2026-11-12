function centavos(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? Math.round((numero + Number.EPSILON) * 100)
    : 0;
}

export function validarQuantidadeCarrinho(quantidade, disponibilidade) {
  const quantidadeNumerica = Number(quantidade);
  const estoque = Number(disponibilidade);

  return (
    Number.isInteger(quantidadeNumerica) &&
    quantidadeNumerica >= 1 &&
    Number.isFinite(estoque) &&
    estoque >= 0 &&
    quantidadeNumerica <= estoque
  );
}

export function calcularSubtotalItem(item) {
  const quantidade = Number(item?.quantidade);

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    return 0;
  }

  return (centavos(item?.precoUnitario ?? item?.preco) * quantidade) / 100;
}

export function calcularTotalCarrinho(itens) {
  return Math.round(
    (Array.isArray(itens) ? itens : []).reduce(
      (total, item) => total + centavos(calcularSubtotalItem(item)),
      0
    )
  ) / 100;
}

export function criarDadosDoacaoAgrupada(itens, uid) {
  const itensDoacao = itens.map((item) => {
    const produtoId = String(item.produtoId || item.id || "");
    const quantidade = Number(item.quantidade);
    const precoUnitario = centavos(item.precoUnitario) / 100;

    return {
      produtoId,
      nome: String(item.nome || "Alimento"),
      quantidade,
      unidade: String(item.unidade || "unidades"),
      precoUnitario,
      subtotal: (centavos(precoUnitario) * quantidade) / 100,
      precoUnidade: String(item.precoUnidade || item.unidade || "unidade"),
      categoria: String(item.categoria || "Outros"),
      cidade: String(item.cidade || "A combinar"),
      imagemChave: String(item.imagemChave || ""),
      estabelecimento: String(item.estabelecimento || "Doador"),
      descricao: String(item.descricao || ""),
      demonstracao: item.demonstracao === true,
    };
  });
  const total = calcularTotalCarrinho(
    itensDoacao.map((item) => ({
      precoUnitario: item.precoUnitario,
      quantidade: item.quantidade,
    }))
  );
  const categorias = [...new Set(itensDoacao.map((item) => item.categoria))];
  const cidades = [...new Set(itensDoacao.map((item) => item.cidade))];
  const estabelecimentos = [
    ...new Set(itensDoacao.map((item) => item.estabelecimento)),
  ];

  return {
    nome:
      itensDoacao.length === 1
        ? itensDoacao[0].nome
        : `Doação com ${itensDoacao.length} alimentos`,
    estabelecimento:
      estabelecimentos.length === 1
        ? estabelecimentos[0]
        : "Vários parceiros",
    categoria: categorias.length === 1 ? categorias[0] : "Outros",
    quantidade: itensDoacao.length,
    unidade: "itens",
    cidade: cidades.length === 1 ? cidades[0] : "Múltiplos locais",
    descricao: `Doação agrupada com ${itensDoacao.length} itens.`,
    validade: "",
    preco: `R$ ${total.toFixed(2).replace(".", ",")}`,
    precoAtual: total,
    precoAntigo: `R$ ${total.toFixed(2).replace(".", ",")}`,
    precoReferencia: total,
    precoUnidade: "total demonstrativo",
    imagemChave: itensDoacao[0]?.imagemChave || "",
    status: "Em andamento",
    demonstracao: itensDoacao.every((item) => item.demonstracao !== false),
    criadoPor: uid,
    tipoDoacao: "agrupada",
    quantidadeItens: itensDoacao.length,
    itens: itensDoacao,
    quantidadesPorProduto: Object.fromEntries(
      itensDoacao.map((item) => [item.produtoId, item.quantidade])
    ),
    total,
  };
}