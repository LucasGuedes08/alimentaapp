const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const { transformSync } = require("@babel/core");

const caminho = path.resolve(__dirname, "..", "utils", "pagamentoSimulado.js");
const fonte = fs.readFileSync(caminho, "utf8");
const compilado = transformSync(fonte, {
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
}).code;
const modulo = new Module(caminho, module);
modulo.filename = caminho;
modulo.paths = Module._nodeModulePaths(path.dirname(caminho));
modulo._compile(compilado, caminho);

const {
  calcularParcelamento,
  formatarReaisCentavos,
  formatarValidadeCartao,
  obterLimiteParcelas,
  validarFormularioPagamento,
  validadeCartaoFutura,
} = modulo.exports;

test("calcula juros fictícios em centavos e ajusta a última parcela", () => {
  const resultado = calcularParcelamento(100.01, 3);

  assert.equal(resultado.jurosPercentual, 3);
  assert.equal(resultado.totalCentavos, 10301);
  assert.equal(resultado.valorParcelaCentavos, 3434);
  assert.equal(resultado.ultimaParcelaCentavos, 3433);
  assert.equal(
    resultado.valorParcelaCentavos * 2 + resultado.ultimaParcelaCentavos,
    resultado.totalCentavos
  );
});

test("mantém o subtotal sem juros em uma parcela e limita a oito", () => {
  assert.equal(calcularParcelamento(39.54, 1).totalCentavos, 3954);
  assert.equal(calcularParcelamento(200, 0).parcelas, 1);
  assert.equal(calcularParcelamento(200, 12).parcelas, 8);

  for (let parcelas = 1; parcelas <= 8; parcelas += 1) {
    const resultado = calcularParcelamento(200, parcelas);
    const soma =
      resultado.valorParcelaCentavos * (parcelas - 1) +
      resultado.ultimaParcelaCentavos;
    assert.equal(soma, resultado.totalCentavos);
  }
});

test("define o limite conforme o subtotal original, antes dos juros", () => {
  assert.equal(obterLimiteParcelas(49.99), 1);
  assert.equal(obterLimiteParcelas(50), 2);
  assert.equal(obterLimiteParcelas(99.99), 2);
  assert.equal(obterLimiteParcelas(100), 4);
  assert.equal(obterLimiteParcelas(120), 4);
  assert.equal(obterLimiteParcelas(150), 4);
  assert.equal(obterLimiteParcelas(150.01), 8);
  assert.equal(obterLimiteParcelas(200), 8);
});

test("limita seleção de parcelas quando ultrapassa a faixa do subtotal", () => {
  assert.equal(calcularParcelamento(80, 8).parcelas, 2);
  assert.equal(calcularParcelamento(120, 8).parcelas, 4);
  assert.equal(calcularParcelamento(39.54, 8).parcelas, 1);
  assert.equal(calcularParcelamento(80, 2).totalCentavos, 8160);
});

test("formata validade MM/AA e valida somente datas futuras", () => {
  assert.equal(formatarValidadeCartao("1228"), "12/28");
  assert.equal(formatarValidadeCartao("1a2/28"), "12/28");
  assert.equal(validadeCartaoFutura("12/28", new Date(2026, 0, 1)), true);
  assert.equal(validadeCartaoFutura("01/26", new Date(2026, 0, 1)), true);
  assert.equal(validadeCartaoFutura("12/25", new Date(2026, 0, 1)), false);
  assert.equal(validadeCartaoFutura("13/28", new Date(2026, 0, 1)), false);
});

test("retorna avisos específicos para cartão incompleto, validade vencida e CVV inválido", () => {
  const dadosCartaoValido = {
    titular: "Pessoa Exemplo",
    numero: "0000 0000 0000 0000",
    validade: "12/28",
    cvv: "123",
  };
  const opcoes = {
    pagamento: "debito",
    dadosCartao: dadosCartaoValido,
    confirmouSimulacao: true,
    bandeiraSelecionada: "mastercard",
    parcelas: 1,
    limiteParcelas: 1,
    agora: new Date(2026, 0, 1),
  };

  assert.deepEqual(
    validarFormularioPagamento({
      ...opcoes,
      dadosCartao: { ...dadosCartaoValido, numero: "0000 0000" },
    }),
    ["Digite um número de cartão válido para a simulação."]
  );
  assert.deepEqual(
    validarFormularioPagamento({
      ...opcoes,
      dadosCartao: { ...dadosCartaoValido, validade: "12/25" },
    }),
    ["A validade informada está vencida."]
  );
  assert.deepEqual(
    validarFormularioPagamento({
      ...opcoes,
      dadosCartao: { ...dadosCartaoValido, cvv: "12" },
    }),
    ["Preencha corretamente o CVV fictício com 3 dígitos."]
  );
});

test("exige titular, bandeira, parcelamento e aceite para crédito", () => {
  const erros = validarFormularioPagamento({
    pagamento: "credito",
    dadosCartao: {
      titular: "   ",
      numero: "0000 0000 0000 0000",
      validade: "12/28",
      cvv: "123",
    },
    confirmouSimulacao: false,
    bandeiraSelecionada: "",
    parcelas: 3,
    limiteParcelas: 2,
    parcelasCalculadas: 2,
    agora: new Date(2026, 0, 1),
  });

  assert.deepEqual(erros, [
    "Você precisa aceitar os termos para continuar.",
    "Informe o nome do titular.",
    "Selecione a bandeira do cartão.",
    "Selecione uma opção de parcelamento válida.",
  ]);
});

test("aceita dados válidos no débito e no crédito dentro do limite", () => {
  const dadosCartao = {
    titular: "Pessoa Exemplo",
    numero: "0000 0000 0000 0000",
    validade: "12/28",
    cvv: "123",
  };
  const comum = {
    dadosCartao,
    confirmouSimulacao: true,
    bandeiraSelecionada: "mastercard",
    agora: new Date(2026, 0, 1),
  };

  assert.deepEqual(
    validarFormularioPagamento({
      ...comum,
      pagamento: "debito",
      parcelas: 1,
      limiteParcelas: 1,
    }),
    []
  );
  assert.deepEqual(
    validarFormularioPagamento({
      ...comum,
      pagamento: "credito",
      parcelas: 2,
      parcelasCalculadas: 2,
      limiteParcelas: 2,
    }),
    []
  );
});

test("exige uma bandeira válida no débito, sem exigir parcelamento", () => {
  const dadosCartao = {
    titular: "Pessoa Exemplo",
    numero: "0000 0000 0000 0000",
    validade: "12/28",
    cvv: "123",
  };
  const comum = {
    pagamento: "debito",
    dadosCartao,
    confirmouSimulacao: true,
    parcelas: 1,
    limiteParcelas: 1,
    agora: new Date(2026, 0, 1),
  };

  assert.deepEqual(validarFormularioPagamento(comum), [
    "Selecione a bandeira do cartão.",
  ]);
  assert.deepEqual(
    validarFormularioPagamento({
      ...comum,
      bandeiraSelecionada: "visa",
    }),
    []
  );
});

test("formata valores de confirmação a partir de centavos", () => {
  assert.equal(formatarReaisCentavos(4073), "R$ 40,73");
  assert.equal(formatarReaisCentavos(123456), "R$ 1.234,56");
});
