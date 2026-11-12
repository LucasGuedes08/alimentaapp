const DESCONTO_DEMONSTRACAO = 0.1;

function valorNumerico(valor) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor !== "string") {
    return null;
  }

  const normalizado = valor
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");

  if (!normalizado || !/\d/.test(normalizado)) {
    return null;
  }

  const numero = Number(
    normalizado.includes(",")
      ? normalizado.replace(/\./g, "").replace(",", ".")
      : normalizado
  );

  return Number.isFinite(numero) ? numero : null;
}

export function calcularPrecoPromocional(precoOriginal) {
  const valor = valorNumerico(precoOriginal);

  if (valor === null) {
    return null;
  }

  return (
    Math.round(
      (valor * (1 - DESCONTO_DEMONSTRACAO) + Number.EPSILON) * 100
    ) / 100
  );
}

export function obterPrecoOriginal(produto) {
  return (
    valorNumerico(produto?.precoAntigo) ??
    valorNumerico(produto?.precoReferencia)
  );
}

export function obterPrecoAtual(produto) {
  const precoAtual =
    valorNumerico(produto?.precoAtual) ??
    valorNumerico(produto?.preco);

  if (precoAtual !== null) {
    return precoAtual;
  }

  if (produto?.demonstracao === true) {
    return calcularPrecoPromocional(obterPrecoOriginal(produto));
  }

  return null;
}