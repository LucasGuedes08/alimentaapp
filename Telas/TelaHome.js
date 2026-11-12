
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text as TextoNativo,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { IMAGENS_CATALOGO } from "../assets/images/catalogo/mapa";
import {
  calcularPrecoPromocional,
  obterPrecoAtual,
  obterPrecoOriginal,
} from "../utils/precosProdutos";

import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { auth } from "../firebase";
import { db } from "../firebaseDb";

// ========================================
// CORES DO ALIMENTA+
// ========================================

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FFFCF6";

function Text({ style, ...props }) {
  const estiloOriginal = StyleSheet.flatten(style) || {};
  const pesoFonte = String(estiloOriginal.fontWeight || "400");
  const estiloSemPeso = { ...estiloOriginal };
  delete estiloSemPeso.fontWeight;

  const familiaFonte =
    estiloOriginal.fontFamily ||
    (pesoFonte === "500"
      ? "Poppins_500Medium"
      : pesoFonte === "600"
      ? "Poppins_600SemiBold"
      : ["700", "800", "bold"].includes(pesoFonte)
      ? "Poppins_700Bold"
      : "Poppins_400Regular");

  return (
    <TextoNativo
      {...props}
      style={[estiloSemPeso, { fontFamily: familiaFonte }]}
    />
  );
}

// ========================================
// IMAGENS DO CATÁLOGO DE ALIMENTOS
// ========================================

const IMAGENS = {
  cesta: require("../assets/images/tabIcons/cesta-basica.png"),
  arroz: require("../assets/images/tabIcons/arroz.png"),
  feijao: require("../assets/images/tabIcons/feijao.webp"),
  macarrao: require("../assets/images/tabIcons/macarrao.png"),
  oleo: require("../assets/images/tabIcons/oleo.png"),
  acucar: require("../assets/images/tabIcons/acucar.png"),
  sal: require("../assets/images/tabIcons/sal.png"),
  farinha: require("../assets/images/tabIcons/farinhadetrigo.webp"),
  cafe: require("../assets/images/tabIcons/cafe.png"),
  biscoito: require("../assets/images/tabIcons/bolacha.png"),
  leite: require("../assets/images/tabIcons/leite.webp"),
  agua: require("../assets/images/tabIcons/agua.jpg"),
  tomate: require("../assets/images/tabIcons/tomate.png"),
  cenoura: require("../assets/images/tabIcons/cenoura.png"),
  alface: require("../assets/images/tabIcons/alface.png"),
  ...IMAGENS_CATALOGO,
};

// ========================================
// CATEGORIAS
// ========================================

const CATEGORIAS = [
  "Todas",
  "Mercearia",
  "Hortifruti",
  "Bebidas",
];

// ========================================
// MENU INFERIOR
// ========================================

const ABAS = [
  {
    id: "inicio",
    nome: "Início",
    icone: "home-outline",
  },
  {
    id: "buscar",
    nome: "Buscar",
    icone: "search-outline",
  },
  {
    id: "eventos",
    nome: "Eventos",
    icone: "map-outline",
  },
  {
    id: "doar",
    nome: "Doe Agora",
    icone: "heart-outline",
  },
  {
    id: "perfil",
    nome: "Perfil",
    icone: "person-outline",
  },
];

// ========================================
// 35 ALIMENTOS DE DEMONSTRAÇÃO
// ========================================

// Valores ilustrativos para demonstração do TCC.
// O preço atual aplica 10% de desconto sobre o preço original.

const EXEMPLOS = [
  {
    id: "cesta",
    nome: "Cesta Básica",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 1,
    unidade: "cestas",
    precoReferencia: 124.99,
    precoUnidade: "cesta",
    imagemChave: "cesta",
    descricao:
      "Cesta básica completa com alimentos essenciais, incluindo arroz, feijão, macarrão, óleo, açúcar, sal, farinha e café.",
  },
  {
    id: "arroz",
    nome: "Arroz 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 20,
    unidade: "pacotes",
    precoReferencia: 4.99,
    precoUnidade: "pacote",
    imagemChave: "arroz",
    descricao:
      "Arroz de 1 kg em embalagem original, fechada e dentro da validade.",
  },
  {
    id: "feijao",
    nome: "Feijão 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 15,
    unidade: "pacotes",
    precoReferencia: 8.79,
    precoUnidade: "pacote",
    imagemChave: "feijao",
    descricao:
      "Feijão de 1 kg em embalagem íntegra e lacrada.",
  },
  {
    id: "macarrao",
    nome: "Macarrão 500 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 25,
    unidade: "pacotes",
    precoReferencia: 4.79,
    precoUnidade: "pacote",
    imagemChave: "macarrao",
    descricao:
      "Macarrão seco de 500 g em embalagem original e fechada.",
  },
  {
    id: "oleo",
    nome: "Óleo de soja 900 ml",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 12,
    unidade: "unidades",
    precoReferencia: 8.99,
    precoUnidade: "garrafa",
    imagemChave: "oleo",
    descricao:
      "Óleo de soja de 900 ml em garrafa lacrada.",
  },
  {
    id: "acucar",
    nome: "Açúcar 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 14,
    unidade: "pacotes",
    precoReferencia: 4.69,
    precoUnidade: "pacote",
    imagemChave: "acucar",
    descricao:
      "Açúcar de 1 kg em embalagem original e fechada.",
  },
  {
    id: "sal",
    nome: "Sal refinado 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 18,
    unidade: "pacotes",
    precoReferencia: 2.99,
    precoUnidade: "pacote",
    imagemChave: "sal",
    descricao:
      "Sal refinado de 1 kg em embalagem lacrada.",
  },
  {
    id: "farinha",
    nome: "Farinha de trigo 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 14,
    unidade: "pacotes",
    precoReferencia: 5.49,
    precoUnidade: "pacote",
    imagemChave: "farinha",
    descricao:
      "Farinha de trigo de 1 kg em embalagem fechada, armazenada em ambiente seco.",
  },
  {
    id: "cafe",
    nome: "Café 500 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 11,
    unidade: "pacotes",
    precoReferencia: 24.90,
    precoUnidade: "pacote",
    imagemChave: "cafe",
    descricao:
      "Café torrado e moído de 500 g, em embalagem original fechada.",
  },
  {
    id: "biscoito",
    nome: "Biscoito água e sal 350 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 20,
    unidade: "pacotes",
    precoReferencia: 5.49,
    precoUnidade: "pacote",
    imagemChave: "biscoito",
    descricao:
      "Biscoito tipo água e sal em pacote lacrado de 350 g.",
  },
  {
    id: "leite",
    nome: "Leite UHT integral 1 L",
    estabelecimento: "Mercado Solidário",
    categoria: "Bebidas",
    quantidade: 24,
    unidade: "litros",
    precoReferencia: 5.79,
    precoUnidade: "litro",
    imagemChave: "leite",
    descricao:
      "Leite longa vida UHT de 1 litro em embalagem fechada. Refrigerar após abrir.",
  },
  {
    id: "agua",
    nome: "Água mineral 1,5 L",
    estabelecimento: "Mercado Solidário",
    categoria: "Bebidas",
    quantidade: 24,
    unidade: "unidades",
    precoReferencia: 3.49,
    precoUnidade: "garrafa",
    imagemChave: "agua",
    descricao:
      "Água mineral sem gás em garrafa lacrada de 1,5 litro.",
  },
  {
    id: "tomates",
    nome: "Tomates",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 10,
    unidade: "kg",
    precoReferencia: 17.98,
    precoUnidade: "kg",
    imagemChave: "tomate",
    descricao:
      "Tomates frescos para saladas e preparo de refeições.",
  },
  {
    id: "cenouras",
    nome: "Cenouras",
    estabelecimento: "Hortifruti Esperança",
    categoria: "Hortifruti",
    quantidade: 6,
    unidade: "kg",
    precoReferencia: 11.98,
    precoUnidade: "kg",
    imagemChave: "cenoura",
    descricao:
      "Cenouras frescas para saladas, sopas e refogados.",
  },
  {
    id: "alface",
    nome: "Alface fresca",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 20,
    unidade: "unidades",
    precoReferencia: 7.99,
    precoUnidade: "unidade",
    imagemChave: "alface",
    descricao:
      "Alface fresca para saladas, conservada adequadamente.",
  },
  {
    id: "batatas",
    nome: "Batatas",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 12,
    unidade: "kg",
    precoReferencia: 6.99,
    precoUnidade: "kg",
    imagemChave: "batatas",
    descricao:
      "Batatas para o preparo de acompanhamentos, sopas e refeições.",
  },
  {
    id: "cebolas",
    nome: "Cebolas",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 8,
    unidade: "kg",
    precoReferencia: 7.49,
    precoUnidade: "kg",
    imagemChave: "cebolas",
    descricao:
      "Cebolas para temperar e preparar refeições do dia a dia.",
  },
  {
    id: "abobrinhas",
    nome: "Abobrinhas",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 6,
    unidade: "kg",
    precoReferencia: 8.99,
    precoUnidade: "kg",
    imagemChave: "abobrinhas",
    descricao:
      "Abobrinhas frescas para refogados e outros preparos.",
  },
  {
    id: "repolhos",
    nome: "Repolhos",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 10,
    unidade: "unidades",
    precoReferencia: 5.99,
    precoUnidade: "unidade",
    imagemChave: "repolhos",
    descricao:
      "Repolhos frescos para saladas, refogados e acompanhamentos.",
  },
  {
    id: "couve",
    nome: "Maços de couve",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 15,
    unidade: "unidades",
    precoReferencia: 4.99,
    precoUnidade: "maço",
    imagemChave: "couve",
    descricao:
      "Couve fresca para saladas, refogados e acompanhamentos.",
  },
  {
    id: "brocolis",
    nome: "Brócolis",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 8,
    unidade: "kg",
    precoReferencia: 12.99,
    precoUnidade: "kg",
    imagemChave: "brocolis",
    descricao:
      "Brócolis frescos para acompanhar refeições e preparar receitas.",
  },
  {
    id: "pepinos",
    nome: "Pepinos",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 5,
    unidade: "kg",
    precoReferencia: 6.49,
    precoUnidade: "kg",
    imagemChave: "pepinos",
    descricao:
      "Pepinos frescos para saladas e acompanhamentos.",
  },
  {
    id: "beterrabas",
    nome: "Beterrabas",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 7,
    unidade: "kg",
    precoReferencia: 7.99,
    precoUnidade: "kg",
    imagemChave: "beterrabas",
    descricao:
      "Beterrabas para saladas, sopas e outros preparos.",
  },
  {
    id: "aboboras",
    nome: "Abóboras",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 9,
    unidade: "kg",
    precoReferencia: 6.99,
    precoUnidade: "kg",
    imagemChave: "aboboras",
    descricao:
      "Abóboras para sopas, purês e acompanhamentos.",
  },
  {
    id: "mandiocas",
    nome: "Mandiocas",
    estabelecimento: "Feira Solidária",
    categoria: "Hortifruti",
    quantidade: 10,
    unidade: "kg",
    precoReferencia: 7.99,
    precoUnidade: "kg",
    imagemChave: "mandiocas",
    descricao:
      "Mandiocas para cozidos, sopas e acompanhamentos.",
  },
  {
    id: "pimentoes",
    nome: "Pimentões",
    estabelecimento: "Horta Comunitária",
    categoria: "Hortifruti",
    quantidade: 5,
    unidade: "kg",
    precoReferencia: 10.99,
    precoUnidade: "kg",
    imagemChave: "pimentoes",
    descricao:
      "Pimentões para saladas, refogados e preparo de refeições.",
  },
  {
    id: "aveia",
    nome: "Aveia em flocos 500 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 18,
    unidade: "pacotes",
    precoReferencia: 7.49,
    precoUnidade: "pacote",
    imagemChave: "aveia",
    descricao:
      "Aveia em flocos em embalagem fechada de 500 g.",
  },
  {
    id: "fuba",
    nome: "Fubá 1 kg",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 14,
    unidade: "pacotes",
    precoReferencia: 4.49,
    precoUnidade: "pacote",
    imagemChave: "fuba",
    descricao:
      "Fubá em pacote fechado de 1 kg para receitas e acompanhamentos.",
  },
  {
    id: "milho",
    nome: "Milho em conserva 170 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 20,
    unidade: "unidades",
    precoReferencia: 4.29,
    precoUnidade: "lata",
    imagemChave: "milho",
    descricao:
      "Milho em conserva em lata fechada de 170 g.",
  },
  {
    id: "lentilha",
    nome: "Lentilha 500 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 16,
    unidade: "pacotes",
    precoReferencia: 8.49,
    precoUnidade: "pacote",
    imagemChave: "lentilha",
    descricao:
      "Lentilha em pacote fechado de 500 g para compor refeições.",
  },
  {
    id: "grao-de-bico",
    nome: "Grão de bico 500 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 12,
    unidade: "pacotes",
    precoReferencia: 9.49,
    precoUnidade: "pacote",
    imagemChave: "grao-de-bico",
    descricao:
      "Grão de bico em pacote fechado de 500 g.",
  },
  {
    id: "sardinha",
    nome: "Sardinha em conserva 125 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 16,
    unidade: "unidades",
    precoReferencia: 6.49,
    precoUnidade: "lata",
    imagemChave: "sardinha",
    descricao:
      "Sardinha em conserva em lata fechada de 125 g.",
  },
  {
    id: "atum",
    nome: "Atum em conserva 170 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 14,
    unidade: "unidades",
    precoReferencia: 8.99,
    precoUnidade: "lata",
    imagemChave: "atum",
    descricao:
      "Atum em conserva em lata fechada de 170 g.",
  },
  {
    id: "extrato-de-tomate",
    nome: "Extrato de tomate 300 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 18,
    unidade: "unidades",
    precoReferencia: 4.49,
    precoUnidade: "embalagem",
    imagemChave: "extrato-de-tomate",
    descricao:
      "Extrato de tomate em embalagem fechada de 300 g.",
  },
  {
    id: "molho-de-tomate",
    nome: "Molho de tomate 300 g",
    estabelecimento: "Mercado Comunitário",
    categoria: "Mercearia",
    quantidade: 18,
    unidade: "unidades",
    precoReferencia: 3.99,
    precoUnidade: "embalagem",
    imagemChave: "molho-de-tomate",
    descricao:
      "Molho de tomate em embalagem fechada de 300 g.",
  },
];

// ========================================
// PRODUTOS ANTIGOS REMOVIDOS DA HOME
// ========================================

const IDS_ANTIGOS = new Set([
  "paes",
  "macas",
  "bananas",
  "suco",
  "marmitas",
  "sanduiches",
  "bolos",
]);

// ========================================
// VERDURAS E LEGUMES PERMITIDOS
// ========================================

const VERDURAS = [
  "alface",
  "cenoura",
  "tomate",
  "batata",
  "cebola",
  "abobrinha",
  "repolho",
  "couve",
  "brocolis",
  "pepino",
  "beterraba",
  "abobora",
  "chuchu",
  "vagem",
  "espinafre",
  "rucula",
  "mandioca",
  "pimentao",
];

// ========================================
// ITENS DE MERCEARIA PERMITIDOS
// ========================================

const MERCEARIA = [
  "cesta basica",
  "arroz",
  "feijao",
  "macarrao",
  "oleo",
  "acucar",
  "sal",
  "farinha",
  "cafe",
  "biscoito",
  "bolacha",
  "aveia",
  "fuba",
  "milho",
  "lentilha",
  "grao de bico",
  "sardinha em conserva",
  "atum em conserva",
  "extrato de tomate",
  "molho de tomate",
];

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterData(item) {
  return item.criadoEm?.toMillis?.() || 0;
}

function moeda(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "";
  }

  return `R$ ${numero
    .toFixed(2)
    .replace(".", ",")}`;
}

function obterExemplo(produto) {
  return EXEMPLOS.find(
    (exemplo) =>
      produto.id === `demo-${exemplo.id}` ||
      normalizar(produto.nome) ===
        normalizar(exemplo.nome)
  );
}

function correspondeInicio(nome, termos) {
  return termos.some(
    (termo) =>
      nome === termo ||
      nome.startsWith(termo + " ") ||
      nome.startsWith(termo + "-")
  );
}

function chaveTipoProduto(produto) {
  const imagemChave = produto.imagemChave;

  if (imagemChave && IMAGENS[imagemChave]) {
    return imagemChave === "biscoito" ? "bolacha" : imagemChave;
  }

  const nome = normalizar(produto.nome);
  const catalogo = [...MERCEARIA, ...VERDURAS].sort(
    (a, b) => b.length - a.length
  );
  const produtoCatalogo = catalogo.find(
    (termo) =>
      nome === termo ||
      nome.startsWith(`${termo} `) ||
      nome.startsWith(`${termo}-`)
  );

  if (produtoCatalogo) {
    return produtoCatalogo === "biscoito"
      ? "bolacha"
      : produtoCatalogo;
  }

  const nomeImagem = Object.keys(IMAGENS).find(
    (chave) =>
      nome === chave ||
      nome.startsWith(`${chave} `) ||
      nome.startsWith(`${chave}-`)
  );

  return nomeImagem || nome;
}

// ========================================
// FILTRAGEM DOS ALIMENTOS
// ========================================

function produtoPermitido(produto) {
  if (produto.status !== "disponivel") {
    return false;
  }

  const id = String(produto.id || "").replace(/^demo-/, "");

  if (IDS_ANTIGOS.has(id)) {
    return false;
  }

  if (
    produto.demonstracao === true &&
    String(produto.id || "").startsWith("demo-")
  ) {
    return EXEMPLOS.some(
      (exemplo) => exemplo.id === id
    );
  }

  const nome = normalizar(produto.nome);

  const retirados =
    /\b(suco|banana|bananas|maca|macas|pao|paes|bolo|bolos|marmita|marmitas|sanduiche|sanduiches|iogurte|queijo|carne|frango|peixe)\b/;

  if (retirados.test(nome)) {
    return false;
  }

  if (produto.categoria === "Hortifruti") {
    return VERDURAS.some(
      (item) => nome.includes(item)
    );
  }

  if (produto.categoria === "Bebidas") {
    return (
      nome.includes("agua mineral") ||
      nome.includes("agua potavel") ||
      nome.includes("leite uht") ||
      nome.includes("leite longa vida") ||
      nome === "leite integral"
    );
  }

  if (produto.categoria === "Mercearia") {
    return correspondeInicio(nome, MERCEARIA);
  }

  return false;
}

// ========================================
// IMAGENS DOS ALIMENTOS
// ========================================

function resolverImagem(produto) {
  const imagemCadastrada =
    produto.imagemUrl ||
    produto.imageUrl ||
    produto.fotoUrl ||
    produto.foto ||
    produto.imagem;

  if (
    typeof imagemCadastrada === "string" &&
    /^(https?:\/\/|data:image\/|file:\/\/|content:\/\/)/i.test(
      imagemCadastrada.trim()
    )
  ) {
    return { uri: imagemCadastrada.trim() };
  }

  if (typeof imagemCadastrada === "string" && IMAGENS[imagemCadastrada]) {
    return IMAGENS[imagemCadastrada];
  }

  if (imagemCadastrada?.uri) {
    return imagemCadastrada;
  }

  if (
    produto.imagemChave &&
    IMAGENS[produto.imagemChave]
  ) {
    return IMAGENS[produto.imagemChave];
  }

  const exemplo = obterExemplo(produto);

  if (
    exemplo?.imagemChave &&
    IMAGENS[exemplo.imagemChave]
  ) {
    return IMAGENS[exemplo.imagemChave];
  }

  const nome = normalizar(produto.nome);

  if (nome.includes("cesta")) return IMAGENS.cesta;
  if (nome.includes("arroz")) return IMAGENS.arroz;
  if (nome.includes("feijao")) return IMAGENS.feijao;
  if (nome.includes("macarrao")) return IMAGENS.macarrao;
  if (nome.includes("oleo")) return IMAGENS.oleo;
  if (nome.includes("acucar")) return IMAGENS.acucar;

  if (nome === "sal" || nome.startsWith("sal ")) {
    return IMAGENS.sal;
  }

  if (nome.includes("farinha")) return IMAGENS.farinha;
  if (nome.includes("cafe")) return IMAGENS.cafe;

  if (
    nome.includes("biscoito") ||
    nome.includes("bolacha")
  ) {
    return IMAGENS.biscoito;
  }

  if (nome.includes("leite")) return IMAGENS.leite;
  if (nome.includes("agua")) return IMAGENS.agua;
  if (nome.includes("tomate")) return IMAGENS.tomate;
  if (nome.includes("cenoura")) return IMAGENS.cenoura;
  if (nome.includes("alface")) return IMAGENS.alface;

  return null;
}

// ========================================
// PREÇOS DOS ALIMENTOS
// ========================================

function obterPrecosExibidos(produto) {
  const exemplo = obterExemplo(produto);
  const precoOriginal =
    obterPrecoOriginal(produto) ??
    (produto.demonstracao === true
      ? exemplo?.precoReferencia
      : null);
  const precoAtual =
    obterPrecoAtual(produto) ??
    (produto.demonstracao === true
      ? calcularPrecoPromocional(precoOriginal)
      : null);

  return {
    precoAtual: moeda(precoAtual),
    precoOriginal: moeda(precoOriginal),
  };
}

// ========================================
// COMPONENTE PRINCIPAL DA HOME
// ========================================

export default function TelaHome({ navigation, route }) {
  const { width } = useWindowDimensions();

  const buscaRef = useRef(null);
  const scrollRef = useRef(null);

  // DADOS DO FIRESTORE
  const [alimentos, setAlimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");

  // EXEMPLOS E AVISOS
  const [
    processandoExemplos,
    setProcessandoExemplos,
  ] = useState(false);

  const [aviso, setAviso] = useState("");

  // PESQUISA
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");

  // NAVEGAÇÃO E MODAIS
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [modal, setModal] = useState(null);

  const [
    produtoSelecionado,
    setProdutoSelecionado,
  ] = useState(null);

  // LOGOUT
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  // USUÁRIO
  const usuario = auth.currentUser;
  const nomeCompleto = usuario?.displayName?.trim() || "";

  const primeiroNome =
    nomeCompleto.split(/\s+/)[0] ||
    usuario?.email?.split("@")[0] ||
    "Usuário";

  // RESPONSIVIDADE
  const larguraPainel = Math.min(width, 460);
  const margem = larguraPainel < 375 ? 15 : 20;
  const tamanhoImagem = larguraPainel < 375 ? 90 : 108;

  // ========================================
  // CONSULTAR ALIMENTOS NO FIRESTORE
  // ========================================

  useEffect(() => {
    const consulta = query(
      collection(db, "alimentos"),
      limit(200)
    );

    const cancelar = onSnapshot(
      consulta,
      (resultado) => {
        const lista = resultado.docs
          .map((documento) => ({
            ...documento.data(),
            id: documento.id,
          }))
          .filter(produtoPermitido)
          .sort(
            (a, b) =>
              obterData(b) - obterData(a)
          );

        setAlimentos(lista);
        setErroLista("");
        setCarregando(false);
      },
      (erro) => {
        console.error(
          "Erro ao consultar o Firestore:",
          erro
        );

        setCarregando(false);

        setErroLista(
          erro.code === "permission-denied"
            ? "Não foi possível carregar os alimentos. Verifique a conexão e tente novamente."
            : "Não foi possível carregar os alimentos."
        );
      }
    );

    return () => cancelar();
  }, []);

  // ========================================
  // VERIFICAR EXEMPLOS CADASTRADOS
  // ========================================

  const exemplosExistentes = alimentos.filter(
    (produto) =>
      produto.demonstracao === true &&
      EXEMPLOS.some(
        (item) => produto.id === `demo-${item.id}`
      )
  );

  const todosExemplosInseridos = EXEMPLOS.every(
    (item) =>
      exemplosExistentes.some(
        (produto) =>
          produto.id === `demo-${item.id}`
      )
  );

  // ========================================
  // VERIFICAR PREÇOS DESATUALIZADOS
  // ========================================

  const temPrecosParaAtualizar =
    exemplosExistentes.some((produto) => {
      if (produto.criadoPor !== usuario?.uid) {
        return false;
      }

      const referencia = EXEMPLOS.find(
        (item) =>
          produto.id === `demo-${item.id}`
      );

      return (
        Boolean(referencia) &&
        (
          produto.precoAtual !==
            calcularPrecoPromocional(referencia.precoReferencia) ||
          produto.preco !==
            moeda(calcularPrecoPromocional(referencia.precoReferencia)) ||
          produto.precoAntigo !==
            moeda(referencia.precoReferencia) ||
          produto.precoReferencia !==
            referencia.precoReferencia ||
          produto.precoUnidade !==
            referencia.precoUnidade
        )
      );
    });

  // ========================================
  // FILTRAR PESQUISA E CATEGORIAS
  // ========================================

  const produtosVisiveis = useMemo(() => {
    const pesquisa = normalizar(busca);

    const filtrados = alimentos.filter((produto) => {
      const categoriaCorreta =
        categoria === "Todas" ||
        produto.categoria === categoria;

      const texto = normalizar(
        [
          produto.nome,
          produto.estabelecimento,
          produto.cidade,
          produto.descricao,
        ].join(" ")
      );

      return (
        categoriaCorreta &&
        texto.includes(pesquisa)
      );
    });

    const unicosPorTipo = new Map();

    filtrados.forEach((produto) => {
      const chave = chaveTipoProduto(produto);
      const existente = unicosPorTipo.get(chave);

      if (
        !existente ||
        (existente.demonstracao === true &&
          produto.demonstracao !== true)
      ) {
        unicosPorTipo.set(chave, produto);
      }
    });

    return Array.from(unicosPorTipo.values());
  }, [alimentos, categoria, busca]);

  // ========================================
  // INSERIR OS EXEMPLOS NO FIRESTORE
  // ========================================

  async function inserirExemplos() {
    if (processandoExemplos) return;

    const atual = auth.currentUser;

    if (!atual) {
      setAviso("Faça login para inserir exemplos.");
      return;
    }

    setProcessandoExemplos(true);
    setAviso("");

    try {
      const verificacoes = await Promise.all(
        EXEMPLOS.map(async (item) => {
          const referencia = doc(
            db,
            "alimentos",
            `demo-${item.id}`
          );

          const documento = await getDoc(referencia);

          return {
            item,
            referencia,
            existe: documento.exists(),
          };
        })
      );

      // NÃO DUPLICAR DOCUMENTOS EXISTENTES
      const pendentes = verificacoes.filter(
        (item) => !item.existe
      );

      if (pendentes.length === 0) {
        setAviso(
          "Todos os alimentos de demonstração já estão cadastrados."
        );
        return;
      }

      const lote = writeBatch(db);

      pendentes.forEach(({ item, referencia }) => {
        const precoAtual = calcularPrecoPromocional(
          item.precoReferencia
        );

        lote.set(referencia, {
          nome: item.nome,
          estabelecimento: item.estabelecimento,
          categoria: item.categoria,

          quantidade: item.quantidade,
          unidade: item.unidade,
          cidade: "Suzano - SP",

          descricao: item.descricao,
          validade: "",

          preco: moeda(precoAtual),
          precoAtual,
          precoAntigo: moeda(item.precoReferencia),

          precoReferencia: item.precoReferencia,
          precoUnidade: item.precoUnidade,

          imagemChave: item.imagemChave,

          status: "disponivel",
          demonstracao: true,

          criadoPor: atual.uid,
          criadoEm: serverTimestamp(),
        });
      });

      await lote.commit();

      setAviso(
        `${pendentes.length} alimento(s) de demonstração cadastrado(s).`
      );
    } catch (erro) {
      console.error(
        "Erro ao inserir exemplos:",
        erro
      );

      setAviso(
        erro.code === "permission-denied"
          ? "Não foi possível cadastrar exemplos. Verifique a conexão e tente novamente."
          : "Não foi possível inserir os exemplos."
      );
    } finally {
      setProcessandoExemplos(false);
    }
  }

  // ========================================
  // ATUALIZAR PREÇOS PROMOCIONAIS
  // ========================================

  async function atualizarPrecos() {
    if (processandoExemplos) return;

    const atual = auth.currentUser;

    if (!atual) {
      setAviso("Faça login novamente.");
      return;
    }

    setProcessandoExemplos(true);
    setAviso("");

    try {
      const verificacoes = await Promise.all(
        EXEMPLOS.map(async (item) => {
          const referencia = doc(
            db,
            "alimentos",
            `demo-${item.id}`
          );

          const documento = await getDoc(referencia);
          const precoAtual = calcularPrecoPromocional(
            item.precoReferencia
          );

          return {
            item,
            referencia,
            precoAtual,
            dados: documento.exists()
              ? documento.data()
              : null,
          };
        })
      );

      const permitidos = verificacoes.filter(
        ({ item, dados, precoAtual }) =>
          dados?.demonstracao === true &&
          dados?.criadoPor === atual.uid &&
          (
            dados?.precoAtual !== precoAtual ||
            dados?.preco !== moeda(precoAtual) ||
            dados?.precoAntigo !==
              moeda(item.precoReferencia) ||
            dados?.precoReferencia !==
              item.precoReferencia ||
            dados?.precoUnidade !==
              item.precoUnidade
          )
      );

      if (permitidos.length === 0) {
        setAviso(
          "Nenhum preço de demonstração da sua conta precisa ser atualizado."
        );
        return;
      }

      const lote = writeBatch(db);

      permitidos.forEach(({ item, referencia, precoAtual }) => {
        lote.update(referencia, {
          preco: moeda(precoAtual),
          precoAtual,
          precoAntigo: moeda(item.precoReferencia),
          precoReferencia: item.precoReferencia,
          precoUnidade: item.precoUnidade,
          atualizadoEm: serverTimestamp(),
        });
      });

      await lote.commit();

      setAviso(
        `${permitidos.length} preço(s) promocional(is) atualizado(s).`
      );
    } catch (erro) {
      console.error(
        "Erro ao atualizar preços:",
        erro
      );

      setAviso(
        erro.code === "permission-denied"
          ? "Não foi possível atualizar. Tente novamente mais tarde."
          : "Não foi possível atualizar os preços."
      );
    } finally {
      setProcessandoExemplos(false);
    }
  }

  // ========================================
  // PESQUISA
  // ========================================

  function abrirBusca() {
    setAbaAtiva("buscar");

    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });

    buscaRef.current?.focus();
  }

  // ========================================
  // CADASTRAR NOVA DOAÇÃO
  // ========================================

  function abrirCadastro() {
    setModal(null);
    setAbaAtiva("inicio");

    navigation.navigate("TelaCadastrarDoacao");
  }

  // ========================================
  // MENU INFERIOR
  // ========================================

  function selecionarAba(id) {
    if (id === "inicio") {
      setAbaAtiva("inicio");
      setBusca("");
      setCategoria("Todas");

      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    } else if (id === "buscar") {
      abrirBusca();
    } else if (id === "doar") {
      abrirCadastro();
    } else if (id === "eventos") {
      setAbaAtiva("eventos");
      navigation.navigate("TelaEventos");
    } else if (id === "perfil") {
      setAbaAtiva("perfil");
      navigation.navigate("TelaPerfil");
    } else {
      setAbaAtiva("inicio");
    }
  }

  // ========================================
  // NOVO: RECEBER COMANDOS DAS OUTRAS TELAS
  // ========================================

  useEffect(() => {
    const abaSolicitada = route?.params?.abrirAba;

    if (!abaSolicitada) return;

    selecionarAba(abaSolicitada);

    navigation.setParams({
      abrirAba: undefined,
    });
  }, [route?.params?.abrirAba, navigation]);

  // ========================================
  // NOVO: ABRIR DETALHES DO PRODUTO
  // ========================================

  function abrirDetalhes(produto) {
    const exemplo =
      produto.demonstracao === true
        ? obterExemplo(produto)
        : null;

    navigation.navigate("TelaDetalhesProduto", {
      produtoId: produto.id,
    precoAtual:
      obterPrecoAtual(produto) ??
      (exemplo
        ? calcularPrecoPromocional(exemplo.precoReferencia)
        : null),
    precoAntigo:
      obterPrecoOriginal(produto) ??
      exemplo?.precoReferencia,
    precoReferencia:
      produto.precoReferencia ??
      exemplo?.precoReferencia,
      precoUnidade:
        produto.precoUnidade ||
        exemplo?.precoUnidade,
    });
  }

  // ========================================
  // FECHAR MODAIS
  // ========================================

  function fecharModal() {
    if (saindo) return;

    setModal(null);
    setProdutoSelecionado(null);
    setAbaAtiva("inicio");
    setErroSair("");
  }

  // ========================================
  // SAIR DA CONTA
  // ========================================

  async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);
    setErroSair("");

    try {
      await signOut(auth);
    } catch (erro) {
      console.error("Erro ao sair:", erro);

      setErroSair(
        "Não foi possível sair da conta."
      );

      setSaindo(false);
    }
  }

  // ========================================
  // INTERFACE PRINCIPAL DA HOME
  // ========================================

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={["top", "bottom"]}
    >
      <View style={styles.tela}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.conteudo,
            {
              paddingHorizontal: margem,
            },
          ]}
        >
          {/* ==================================
              CABEÇALHO
          ================================== */}

          <View style={styles.topo}>
            <View style={{ flex: 1 }}>
              <Text
                style={styles.saudacao}
                numberOfLines={1}
              >
                Olá, {primeiroNome}!
              </Text>

              <Text style={styles.subtitulo}>
                Que bom ter você aqui!
              </Text>
            </View>

            <TouchableOpacity
              onPress={abrirBusca}
              style={styles.iconeTopo}
            >
              <Ionicons
                name="search-outline"
                size={27}
                color="#496A42"
              />
            </TouchableOpacity>
          </View>

          {/* ==================================
              PESQUISA
          ================================== */}

          <View style={styles.caixaBusca}>
            <Ionicons
              name="search-outline"
              size={22}
              color="#496A42"
            />

            <TextInput
              ref={buscaRef}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar alimentos, estabelecimentos..."
              placeholderTextColor="#919191"
              style={styles.inputBusca}
              returnKeyType="search"
            />

            {busca.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusca("")}
                accessibilityLabel="Limpar pesquisa"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#777777"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ==================================
              LOCALIZAÇÃO
          ================================== */}

          <View style={styles.localizacao}>
            <Text style={styles.localizacaoTexto}>
              Suzano - SP
            </Text>
          </View>

          {/* ==================================
              CATEGORIAS
          ================================== */}

          <Text style={styles.tituloSecao}>
            Categorias
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriasRolagem}
            contentContainerStyle={styles.categoriasConteudo}
          >
            {CATEGORIAS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategoria(item)}
                style={[
                  styles.categoria,
                  categoria === item &&
                    styles.categoriaAtiva,
                ]}
              >
                <Text
                  style={[
                    styles.categoriaTexto,
                    categoria === item &&
                      styles.categoriaTextoAtiva,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ==================================
              DOE HOJE
          ================================== */}

          <View style={styles.titulosDoacao}>
            <Text style={styles.tituloDoacao}>
              Doe Hoje
            </Text>

            <TouchableOpacity
              onPress={() => {
                setCategoria("Todas");
                setBusca("");
              }}
            >
              <Text style={styles.verMais}>
                Ver Mais
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              CADASTRAR DOAÇÃO
          ================================== */}

          <TouchableOpacity
            style={styles.cadastrarBotao}
            onPress={abrirCadastro}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={VERDE}
            />

            <Text style={styles.cadastrarTexto}>
              Cadastrar alimento para doação
            </Text>
          </TouchableOpacity>

          {/* ==================================
              NOVO: MINHAS DOAÇÕES
          ================================== */}

          <TouchableOpacity
            style={styles.minhasDoacoesBotao}
            onPress={() =>
              navigation.navigate("TelaMinhasDoacoes")
            }
            accessibilityLabel="Minhas doações"
          >
            <Ionicons
              name="gift-outline"
              size={20}
              color={VERDE}
            />

            <Text style={styles.minhasDoacoesTexto}>
              Minhas doações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.minhasDoacoesBotao}
            onPress={() =>
              navigation.navigate("TelaCarrinhoDoacoes")
            }
            accessibilityLabel="Carrinho de doações"
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color={VERDE}
            />

            <Text style={styles.minhasDoacoesTexto}>
              Carrinho de doações
            </Text>
          </TouchableOpacity>

          {/* ==================================
              INSERIR EXEMPLOS DO TCC
          ================================== */}

          {!carregando &&
            !erroLista &&
            !todosExemplosInseridos && (
              <View style={styles.painelExemplos}>
                <Text style={styles.exemploTitulo}>
          Alimentos do catálogo
                </Text>

                <Text style={styles.exemploInfo}>
          Mercearia, enlatados, bebidas e hortifruti.
          Quantidades e valores são demonstrativos.
                </Text>

                <TouchableOpacity
                  onPress={inserirExemplos}
                  disabled={processandoExemplos}
                  style={styles.botaoVerde}
                >
                  {processandoExemplos ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.botaoVerdeTexto}>
                      Adicionar {EXEMPLOS.length} alimentos ao catálogo
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

          {/* ==================================
              ATUALIZAR PREÇOS
          ================================== */}

          {!carregando &&
            !erroLista &&
            temPrecosParaAtualizar && (
              <TouchableOpacity
                style={styles.botaoAtualizar}
                onPress={atualizarPrecos}
                disabled={processandoExemplos}
              >
                {processandoExemplos ? (
                  <ActivityIndicator color={VERDE} />
                ) : (
                  <Text style={styles.botaoAtualizarTexto}>
                    Atualizar preços do catálogo
                  </Text>
                )}
              </TouchableOpacity>
            )}

          {/* ==================================
              AVISOS E CARREGAMENTO
          ================================== */}

          {!!aviso && (
            <Text style={styles.aviso}>
              {aviso}
            </Text>
          )}

          {carregando && (
            <ActivityIndicator
              size="large"
              color={VERDE}
              style={{
                marginVertical: 28,
              }}
            />
          )}

          {!!erroLista && (
            <Text style={styles.erro}>
              {erroLista}
            </Text>
          )}

          {/* ==================================
              SEM RESULTADOS
          ================================== */}

          {!carregando &&
            !erroLista &&
            produtosVisiveis.length === 0 && (
              <View style={styles.vazio}>
                <Ionicons
                  name="basket-outline"
                  size={31}
                  color={VERDE}
                />

                <Text style={styles.vazioTitulo}>
                  {alimentos.length === 0
                    ? "Nenhum alimento cadastrado"
                    : "Nenhum alimento encontrado"}
                </Text>

                <Text style={styles.vazioTexto}>
                  {alimentos.length === 0
                    ? "Cadastre uma doação ou insira os exemplos de demonstração."
                    : "Experimente outra busca ou categoria."}
                </Text>
              </View>
            )}

          {/* ==================================
              CARDS DOS ALIMENTOS
          ================================== */}

          {!carregando &&
            !erroLista &&
            produtosVisiveis.map((produto) => {
              const imagem = resolverImagem(produto);
              const { precoAtual, precoOriginal } =
                obterPrecosExibidos(produto);

              return (
                <View
                  key={produto.id}
                  style={styles.card}
                >
                  {/* IMAGEM */}
                  {imagem ? (
                    <Image
                      source={imagem}
                      resizeMode="contain"
                      style={[
                        styles.imagemProduto,
                        {
                          width: tamanhoImagem,
                          height: tamanhoImagem,
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.semImagem,
                        {
                          width: tamanhoImagem,
                          height: tamanhoImagem,
                        },
                      ]}
                    >
                      <Ionicons
                        name="basket-outline"
                        size={36}
                        color="#77A06E"
                      />
                    </View>
                  )}

                  {/* INFORMAÇÕES */}
                  <View style={styles.cardInfo}>
                    <Text
                      style={styles.nomeProduto}
                      numberOfLines={2}
                    >
                      {produto.nome}
                    </Text>

                    <Text
                      style={styles.estabelecimento}
                      numberOfLines={2}
                    >
                      de{" "}
                      {produto.estabelecimento || "Doador"}
                    </Text>

                    {precoAtual ? (
                      <Text
                        style={styles.precoAtual}
                      >
                        {precoAtual}
                      </Text>
                    ) : (
                      <Text style={styles.precoGratuito}>
                        Doação gratuita
                      </Text>
                    )}

                    {!!precoAtual && !!precoOriginal && (
                      <Text style={styles.precoReferencia}>
                        De {precoOriginal}
                      </Text>
                    )}

                    <Text style={styles.quantidade}>
                      {produto.quantidade}{" "}
                      {produto.unidade}
                    </Text>

                    {/* ABRIR NOVA TELA */}
                    <TouchableOpacity
                      onPress={() =>
                        abrirDetalhes(produto)
                      }
                      style={styles.verDetalhes}
                    >
                      <Text style={styles.verDetalhesTexto}>
                        Ver detalhes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </ScrollView>

        {/* ==================================
            MENU INFERIOR
        ================================== */}

        <View style={styles.menuInferior}>
          {ABAS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                selecionarAba(item.id)
              }
              style={styles.itemMenu}
              accessibilityLabel={item.nome}
            >
              <Ionicons
                name={item.icone}
                size={23}
                color="#111111"
              />

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={styles.itemMenuTexto}
              >
                {item.id === "inicio" ? "Início" : item.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ==================================
          MODAIS DE PERFIL E EVENTOS
      ================================== */}

      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalFundo}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={fecharModal}
          />

          <View style={styles.modalPainel}>
            {/* CABEÇALHO */}
            <View style={styles.modalTopo}>
              <Text
                style={styles.modalTitulo}
                numberOfLines={2}
              >
                {modal === "perfil"
                  ? "Meu perfil"
                  : modal === "produto"
                  ? produtoSelecionado?.nome
                  : "Eventos e campanhas"}
              </Text>

              <TouchableOpacity onPress={fecharModal}>
                <Ionicons
                  name="close"
                  size={25}
                  color="#333333"
                />
              </TouchableOpacity>
            </View>

            {/* ==================================
                PERFIL
            ================================== */}

            {modal === "perfil" ? (
              <>
                <View style={styles.dadosPerfil}>
                  <Ionicons
                    name="person-circle-outline"
                    size={43}
                    color={VERDE}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.nomePerfil}>
                      {nomeCompleto || primeiroNome}
                    </Text>

                    <Text style={styles.emailPerfil}>
                      {usuario?.email || "Conta conectada"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalDescricao}>
                  Sair da conta não apaga seu cadastro
                  nem suas doações.
                </Text>

                <TouchableOpacity
                  onPress={sairDaConta}
                  disabled={saindo}
                  style={styles.botaoSair}
                >
                  {saindo ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="log-out-outline"
                        color="#FFFFFF"
                        size={19}
                      />

                      <Text style={styles.botaoSairTexto}>
                        Sair da conta
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {!!erroSair && (
                  <Text style={styles.erro}>
                    {erroSair}
                  </Text>
                )}
              </>
            ) : modal === "produto" ? (
              <>
                {/* MODAL ANTIGO PRESERVADO */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalDescricao}>
                    Estabelecimento:{" "}
                    {produtoSelecionado?.estabelecimento ||
                      "Não informado"}
                    {"\n"}
                    Local:{" "}
                    {produtoSelecionado?.cidade ||
                      "Não informado"}
                    {"\n"}
                    Categoria:{" "}
                    {produtoSelecionado?.categoria ||
                      "Não informada"}
                    {"\n"}
                    Quantidade:{" "}
                    {produtoSelecionado?.quantidade}{" "}
                    {produtoSelecionado?.unidade}
                    {"\n\n"}
                    {produtoSelecionado?.descricao ||
                      "Sem descrição."}
                  </Text>

                  {!!obterPrecosExibidos(
                    produtoSelecionado || {}
                  ).precoAtual &&
                    !!obterPrecosExibidos(
                      produtoSelecionado || {}
                    ).precoOriginal && (
                    <View style={styles.modalLinhaPreco}>
                      <Text style={styles.precoAtual}>
                        {
                          obterPrecosExibidos(
                            produtoSelecionado
                          ).precoAtual
                        }
                      </Text>
                      <Text style={styles.precoReferencia}>
                        De{" "}
                        {
                          obterPrecosExibidos(
                            produtoSelecionado
                          ).precoOriginal
                        }
                      </Text>
                    </View>
                  )}

                  <Text style={styles.avisoDetalhes}>
                    Preços ilustrativos; o pagamento é apenas uma simulação.
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  onPress={fecharModal}
                  style={styles.botaoVerde}
                >
                  <Text style={styles.botaoVerdeTexto}>
                    Entendi
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* EVENTOS E CAMPANHAS */}
                <Text style={styles.modalDescricao}>
                  Em breve, você poderá acompanhar
                  os eventos e campanhas do Alimenta+.
                </Text>

                <TouchableOpacity
                  onPress={fecharModal}
                  style={styles.botaoVerde}
                >
                  <Text style={styles.botaoVerdeTexto}>
                    Entendi
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========================================
// ESTILOS DA HOME
// ========================================

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    alignItems: "center",
    backgroundColor: FUNDO,
  },

  tela: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    backgroundColor: FUNDO,
  },

  conteudo: {
    paddingTop: 17,
    paddingBottom: 30,
  },

  // CABEÇALHO
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  saudacao: {
    color: VERDE,
    fontSize: 22,
    fontWeight: "800",
  },

  subtitulo: {
    color: "#8C8C8C",
    fontSize: 14,
    marginTop: 2,
  },

  iconeTopo: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  // PESQUISA
  caixaBusca: {
    marginTop: 15,
    height: 44,
    borderWidth: 1,
    borderColor: "#666666",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
  },

  inputBusca: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#222222",
  },

  // LOCALIZAÇÃO
  localizacao: {
    marginTop: 17,
    width: 139,
    height: 36,
    borderWidth: 1,
    borderColor: "#3F4A3E",
    borderRadius: 19,
    backgroundColor: "#E5F5D8",
    justifyContent: "center",
    alignItems: "center",
  },

  localizacaoTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
  },

  // CATEGORIAS
  tituloSecao: {
    color: "#151515",
    marginTop: 24,
    marginLeft: 6,
    fontSize: 18,
    fontWeight: "600",
  },

  categoriasRolagem: {
    flexGrow: 0,
    marginTop: 23,
  },

  categoriasConteudo: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 1,
  },

  categoria: {
    minWidth: 70,
    minHeight: 45,
    paddingHorizontal: 12,
    borderColor: VERDE,
    borderWidth: 1,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  categoriaAtiva: {
    backgroundColor: "#BBD9AC",
  },

  categoriaTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#252525",
  },

  categoriaTextoAtiva: {
    color: VERDE,
  },

  // DOE HOJE
  titulosDoacao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 12,
  },

  tituloDoacao: {
    color: "#151515",
    fontSize: 18,
    fontWeight: "600",
  },

  verMais: {
    color: "#668458",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // CADASTRAR DOAÇÃO
  cadastrarBotao: {
    minHeight: 42,
    backgroundColor: "#E9F6E2",
    borderRadius: 11,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  cadastrarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: VERDE,
  },

  // NOVO: MINHAS DOAÇÕES
  minhasDoacoesBotao: {
    minHeight: 42,
    backgroundColor: "#E9F6E2",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },

  minhasDoacoesTexto: {
    color: VERDE,
    fontSize: 12,
    fontWeight: "700",
  },

  // EXEMPLOS
  painelExemplos: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderWidth: 1,
    borderColor: "#D1E3C9",
    borderRadius: 13,
    marginBottom: 15,
  },

  exemploTitulo: {
    color: VERDE,
    fontSize: 14,
    fontWeight: "800",
  },

  exemploInfo: {
    color: "#696969",
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 9,
  },

  botaoVerde: {
    minHeight: 43,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginTop: 7,
  },

  botaoVerdeTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  botaoAtualizar: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBD7B6",
    borderRadius: 10,
    marginBottom: 14,
  },

  botaoAtualizarTexto: {
    fontSize: 12,
    color: VERDE,
    textAlign: "center",
    fontWeight: "700",
  },

  aviso: {
    fontSize: 12,
    color: VERDE,
    textAlign: "center",
    marginBottom: 14,
  },

  erro: {
    fontSize: 12,
    color: "#B3261E",
    textAlign: "center",
    marginVertical: 12,
  },

  // SEM RESULTADOS
  vazio: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E4D7",
    padding: 23,
    borderRadius: 16,
    alignItems: "center",
    gap: 10,
  },

  vazioTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: VERDE,
    textAlign: "center",
  },

  vazioTexto: {
    fontSize: 12,
    color: "#777777",
    lineHeight: 18,
    textAlign: "center",
  },

  // CARDS
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 20,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 3,
  },

  imagemProduto: {
    marginRight: 10,
  },

  semImagem: {
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: "#EFF7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  cardInfo: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },

  nomeProduto: {
    color: "#181818",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },

  estabelecimento: {
    color: "#666666",
    fontStyle: "italic",
    fontSize: 10,
    marginTop: 3,
  },

  precoGratuito: {
    color: "#3F7841",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
  },

  precoAtual: {
    color: "#3F7841",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 7,
  },

  precoReferencia: {
    color: "#667966",
    fontSize: 11,
    marginTop: 4,
    textDecorationLine: "line-through",
  },

  modalLinhaPreco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  quantidade: {
    color: "#888888",
    fontSize: 11,
    marginTop: 4,
  },

  verDetalhes: {
    alignSelf: "flex-end",
    backgroundColor: "#E7F5D8",
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 29,
    marginTop: 9,
    justifyContent: "center",
  },

  verDetalhesTexto: {
    color: "#31523B",
    fontSize: 12,
  },

  // MENU INFERIOR
  menuInferior: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#B7B7B7",
    backgroundColor: FUNDO,
    paddingHorizontal: 0,
  },

  itemMenu: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    gap: 1,
  },

  itemMenuTexto: {
    fontFamily: "Poppins_400Regular",
    color: "#111111",
    fontSize: 12,
  },

  // MODAIS
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalPainel: {
    maxWidth: 460,
    maxHeight: "85%",
    width: "100%",
    backgroundColor: FUNDO,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 23,
    paddingBottom: 34,
  },

  modalTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  modalTitulo: {
    fontSize: 21,
    fontWeight: "800",
    color: VERDE,
    flex: 1,
  },

  modalDescricao: {
    color: "#555555",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 17,
  },

  // PERFIL
  dadosPerfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 21,
  },

  nomePerfil: {
    color: "#242424",
    fontSize: 15,
    fontWeight: "700",
  },

  emailPerfil: {
    color: "#777777",
    fontSize: 12,
    marginTop: 4,
  },

  botaoSair: {
    marginTop: 21,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 10,
    minHeight: 45,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoSairTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  avisoDetalhes: {
    marginTop: 14,
    color: "#87633A",
    fontSize: 12,
    lineHeight: 18,
  },
});
