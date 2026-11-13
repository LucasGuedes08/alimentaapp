const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const { transformSync } = require("@babel/core");

function carregarModulo(relativo) {
  const caminho = path.resolve(__dirname, "..", relativo);
  const fonte = fs.readFileSync(caminho, "utf8");
  const compilado = transformSync(fonte, {
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  }).code;
  const modulo = new Module(caminho, module);

  modulo.filename = caminho;
  modulo.paths = Module._nodeModulePaths(path.dirname(caminho));
  modulo._compile(compilado, caminho);

  return modulo.exports;
}

const {
  calcularSubtotalItem,
  calcularTotalCarrinho,
  criarDadosDoacaoAgrupada,
  validarQuantidadeCarrinho,
} = carregarModulo("utils/carrinhoCalculos.js");

test("soma subtotal e total de vários produtos com preço por unidade", () => {
  const itens = [
    { precoUnitario: 6.29, quantidade: 2 },
    { precoUnitario: 4.5, quantidade: 3 },
  ];

  assert.equal(calcularSubtotalItem(itens[0]), 12.58);
  assert.equal(calcularTotalCarrinho(itens), 26.08);
});

test("aceita quantidade de 1 até o estoque e rejeita limites inválidos", () => {
  assert.equal(validarQuantidadeCarrinho(1, 9), true);
  assert.equal(validarQuantidadeCarrinho(9, 9), true);
  assert.equal(validarQuantidadeCarrinho(0, 9), false);
  assert.equal(validarQuantidadeCarrinho(10, 9), false);
  assert.equal(validarQuantidadeCarrinho(1.5, 9), false);
});

test("monta uma doação agrupada em andamento com itens e total", () => {
  const doacao = criarDadosDoacaoAgrupada(
    [
      {
        produtoId: "abobora",
        nome: "Abóboras",
        quantidade: 2,
        unidade: "kg",
        precoUnitario: 6.29,
        cidade: "Suzano - SP",
        demonstracao: true,
      },
      {
        produtoId: "arroz",
        nome: "Arroz 1 kg",
        quantidade: 1,
        unidade: "pacotes",
        precoUnitario: 5.5,
        cidade: "Suzano - SP",
        demonstracao: true,
      },
    ],
    "usuario-1"
  );

  assert.equal(doacao.status, "Em andamento");
  assert.equal(doacao.tipoDoacao, "agrupada");
  assert.equal(doacao.criadoPor, "usuario-1");
  assert.equal(doacao.quantidadeItens, 2);
  assert.equal(doacao.itens.length, 2);
  assert.equal(doacao.total, 18.08);
  assert.deepEqual(doacao.quantidadesPorProduto, {
    abobora: 2,
    arroz: 1,
  });
});

test("persiste carrinhos locais isolados por usuário", async () => {
  const memoria = new Map();
  const armazenamento = {
    async getItem(chave) {
      return memoria.get(chave) ?? null;
    },
    async multiSet(pares) {
      pares.forEach(([chave, valor]) => memoria.set(chave, valor));
    },
    async multiRemove(chaves) {
      chaves.forEach((chave) => memoria.delete(chave));
    },
  };
  const carregarOriginal = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "@react-native-async-storage/async-storage") {
      return { __esModule: true, default: armazenamento };
    }

    return carregarOriginal.call(this, request, parent, isMain);
  };

  let local;
  try {
    local = carregarModulo("utils/carrinhoLocal.js");
  } finally {
    Module._load = carregarOriginal;
  }

  const item = {
    produtoId: "demo-abobora",
    nome: "Abóboras",
    disponibilidade: 9,
    unidade: "kg",
  };

  await local.salvarNoCarrinhoLocal("usuario-a", item, 2);

  assert.equal((await local.lerCarrinhoLocal("usuario-a"))[0].quantidade, 2);
  assert.deepEqual(await local.lerCarrinhoLocal("usuario-b"), []);
  assert.equal(await local.usarCarrinhoLocal("usuario-a"), true);
});
