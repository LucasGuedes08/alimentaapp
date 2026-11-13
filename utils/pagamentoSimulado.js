const JUROS_POR_PARCELA = [0, 0, 2, 3, 4, 5, 6, 7, 8];

function converterParaCentavos(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? Math.round((numero + Number.EPSILON) * 100)
    : 0;
}

export function formatarValidadeCartao(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2
    ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
    : digitos;
}

export function validadeCartaoFutura(valor, agora = new Date()) {
  const correspondencia = /^(\d{2})\/(\d{2})$/.exec(String(valor ?? ""));
  if (!correspondencia) return false;

  const mes = Number(correspondencia[1]);
  const ano = 2000 + Number(correspondencia[2]);
  if (mes < 1 || mes > 12) return false;

  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;
  return ano > anoAtual || (ano === anoAtual && mes >= mesAtual);
}

export function obterLimiteParcelas(subtotal) {
  const subtotalCentavos = converterParaCentavos(subtotal);

  if (subtotalCentavos < 5000) return 1;
  if (subtotalCentavos < 10000) return 2;
  if (subtotalCentavos <= 15000) return 4;
  return 8;
}

export function validarFormularioPagamento({
  pagamento,
  dadosCartao,
  confirmouSimulacao,
  bandeiraSelecionada,
  parcelas,
  limiteParcelas,
  parcelasCalculadas,
  agora = new Date(),
}) {
  const erros = [];

  if (!confirmouSimulacao) {
    erros.push("Você precisa aceitar os termos para continuar.");
  }

  if (pagamento === "pix") return erros;

  const titular = String(dadosCartao?.titular ?? "").trim();
  if (!titular) {
    erros.push("Informe o nome do titular.");
  } else if (
    titular.length < 2 ||
    !/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(titular)
  ) {
    erros.push("Informe um nome válido, usando apenas letras e espaços.");
  }

  if (String(dadosCartao?.numero ?? "").replace(/\D/g, "").length !== 16) {
    erros.push("Digite um número de cartão válido para a simulação.");
  }

  const validade = String(dadosCartao?.validade ?? "");
  const validadeCorrespondencia = /^(\d{2})\/(\d{2})$/.exec(validade);
  if (
    !validadeCorrespondencia ||
    Number(validadeCorrespondencia[1]) < 1 ||
    Number(validadeCorrespondencia[1]) > 12
  ) {
    erros.push("Informe a validade no formato MM/AA.");
  } else if (!validadeCartaoFutura(validade, agora)) {
    erros.push("A validade informada está vencida.");
  }

  if (!/^\d{3}$/.test(String(dadosCartao?.cvv ?? ""))) {
    erros.push("Preencha corretamente o CVV fictício com 3 dígitos.");
  }

  if (
    pagamento !== "pix" &&
    !["elo", "mastercard", "visa"].includes(bandeiraSelecionada)
  ) {
    erros.push("Selecione a bandeira do cartão.");
  }

  if (
    pagamento === "credito" &&
    (!Number.isInteger(parcelas) ||
      parcelas < 1 ||
      parcelas > limiteParcelas ||
      parcelasCalculadas !== parcelas)
  ) {
    erros.push("Selecione uma opção de parcelamento válida.");
  }

  return erros;
}

export function calcularParcelamento(subtotal, parcelas) {
  const limiteParcelas = obterLimiteParcelas(subtotal);
  const quantidade = Math.min(
    limiteParcelas,
    Math.max(1, Math.floor(Number(parcelas) || 1))
  );
  const jurosPercentual = JUROS_POR_PARCELA[quantidade];
  const subtotalCentavos = converterParaCentavos(subtotal);
  const totalCentavos = Math.round(
    (subtotalCentavos * (100 + jurosPercentual)) / 100
  );
  const valorParcelaCentavos = Math.round(totalCentavos / quantidade);
  const ultimaParcelaCentavos =
    totalCentavos - valorParcelaCentavos * (quantidade - 1);

  return {
    parcelas: quantidade,
    jurosPercentual,
    subtotalCentavos,
    totalCentavos,
    valorParcelaCentavos,
    ultimaParcelaCentavos,
  };
}

export function formatarReaisCentavos(valorCentavos) {
  const centavos = Math.max(0, Math.round(Number(valorCentavos) || 0));
  const reais = Math.floor(centavos / 100);
  const fracao = String(centavos % 100).padStart(2, "0");
  const reaisFormatados = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${reaisFormatados},${fracao}`;
}
