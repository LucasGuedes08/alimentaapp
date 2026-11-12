// Exemplos visuais do painel administrativo.
// Esses exemplos não estão cadastrados no Firebase.

export const CAMPANHAS_DEMONSTRACAO = [
  {
    id: "modelo-cesta",
    nome: "Cesta Básica Solidária",
    descricao:
      "Doação de cestas básicas para famílias em situação de vulnerabilidade social.",
    categoria: "Alimentos",
    inicio: "28/08/2026",
    termino: "31/12/2026",
    meta: 50000,
    status: "Ativa",
    imagemChave: "cesta",
    exemplo: true,
  },
  {
    id: "modelo-escola",
    nome: "Alimenta+ Escola",
    descricao:
      "Alimentos para crianças da rede pública.",
    categoria: "Escolas",
    inicio: "01/09/2026",
    termino: "15/12/2026",
    meta: 0,
    status: "Ativa",
    imagemChave: "leite",
    exemplo: true,
  },
  {
    id: "modelo-inverno",
    nome: "Inverno sem Fome",
    descricao:
      "Arrecadação de alimentos para o inverno.",
    categoria: "Alimentos",
    inicio: "01/06/2026",
    termino: "31/08/2026",
    meta: 0,
    status: "Pausada",
    imagemChave: "arroz",
    exemplo: true,
  },
  {
    id: "modelo-rede",
    nome: "Rede de Alimentos",
    descricao:
      "Combate ao desperdício e redistribuição.",
    categoria: "Alimentos",
    inicio: "01/01/2026",
    termino: "31/12/2026",
    meta: 0,
    status: "Ativa",
    imagemChave: "alface",
    exemplo: true,
  },
  {
    id: "modelo-cafe",
    nome: "Café da manhã Solidário",
    descricao:
      "Doação de cestas básicas para famílias de baixa renda.",
    categoria: "Alimentos",
    inicio: "01/01/2026",
    termino: "30/06/2026",
    meta: 0,
    status: "Encerrada",
    imagemChave: "cafe",
    exemplo: true,
  },
];

const IMAGENS = {
  cesta: require("../assets/images/tabIcons/cesta-basica.png"),
  arroz: require("../assets/images/tabIcons/arroz.png"),
  leite: require("../assets/images/tabIcons/leite.webp"),
  alface: require("../assets/images/tabIcons/alface.png"),
  cafe: require("../assets/images/tabIcons/cafe.png"),
};

export const CATEGORIAS_CAMPANHA = [
  "Alimentos",
  "Cestas básicas",
  "Escolas",
  "Institucional",
  "Emergencial",
];

export function imagemCampanha(campanha) {
  return (
    IMAGENS[campanha?.imagemChave] ||
    IMAGENS.cesta
  );
}

export function formatarMoedaBR(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export function textoNormalizado(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function dataBRValida(valor) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    return null;
  }

  const [dia, mes, ano] = valor
    .split("/")
    .map(Number);

  const data = new Date(
    ano,
    mes - 1,
    dia
  );

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  )
    ? data
    : null;
}

export function moedaParaNumero(texto) {
  const limpo = String(texto || "")
    .replace(/[^0-9,\.]/g, "");

  if (!limpo) {
    return 0;
  }

  const numero = Number(
    limpo
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return (
    Number.isFinite(numero) &&
    numero >= 0
  )
    ? numero
    : NaN;
}