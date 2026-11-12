import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MenuInferior from "../components/MenuInferior";
import { IMAGENS_CATALOGO } from "../assets/images/catalogo/mapa";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth } from "../firebase";
import { db } from "../firebaseDb";

const VERDE = "#006838";
const VERDE_CLARO = "#E9F4E2";
const FUNDO = "#F7F5EF";
const BRANCO = "#FFFFFF";
const TEXTO = "#1D2A1F";
const CINZA = "#6F766F";
const BORDA = "#D9DDD4";
const AMARELO_STATUS = "#EFE7B4";
const SOMBRA = "#000000";

const IMAGENS = {
  oleo: require("../assets/images/tabIcons/oleo.png"),
  cestaBasica: require("../assets/images/tabIcons/cesta-basica.png"),
  arroz: require("../assets/images/tabIcons/arroz.png"),
  feijao: require("../assets/images/tabIcons/feijao.webp"),
  macarrao: require("../assets/images/tabIcons/macarrao.png"),
  farinha: require("../assets/images/tabIcons/farinhadetrigo.webp"),
  cafe: require("../assets/images/tabIcons/cafe.png"),
  acucar: require("../assets/images/tabIcons/acucar.png"),
  sal: require("../assets/images/tabIcons/sal.png"),
  bolacha: require("../assets/images/tabIcons/bolacha.png"),
  agua: require("../assets/images/tabIcons/agua.jpg"),
  leite: require("../assets/images/tabIcons/leite.webp"),
  tomate: require("../assets/images/tabIcons/tomate.png"),
  cenoura: require("../assets/images/tabIcons/cenoura.png"),
  alface: require("../assets/images/tabIcons/alface.png"),
  ...IMAGENS_CATALOGO,
};

const DOACOES_EXEMPLO = [
  {
    id: "1",
    nome: "Óleo",
    instituicao: "Mercado comunitário",
    data: "29/10/2026",
    quantidade: 2,
    unidade: "unidades",
    status: "Em andamento",
    tipoImagem: "oleo",
    itens: ["Óleo — 2 unidades"],
    localRetirada: "Suzano - SP",
    descricao: "Esta doação ainda está em andamento.",
    instituicaoBeneficiada: {
      nome: "Não informada",
      cidade: "Suzano - SP",
      descricao:
        "A instituição beneficiada ainda não foi registrada nesta doação.",
    },
  },
  {
    id: "2",
    nome: "Cesta básica",
    instituicao: "Mercado comunitário",
    data: "29/10/2026",
    quantidade: 1,
    unidade: "unidade",
    status: "Em andamento",
    tipoImagem: "cestaBasica",
    itens: ["Cesta básica — 1 unidade"],
    localRetirada: "Suzano - SP",
    descricao: "Esta doação ainda está em andamento.",
    instituicaoBeneficiada: {
      nome: "Não informada",
      cidade: "Suzano - SP",
      descricao:
        "A instituição beneficiada ainda não foi registrada nesta doação.",
    },
  },
  {
    id: "3",
    nome: "Cesta básica",
    instituicao: "Mercado Comunitário",
    data: "23/10/2026",
    quantidade: 5,
    unidade: "unidades",
    status: "Em andamento",
    tipoImagem: "cestaBasica",
    itens: ["Cesta básica — 5 unidades"],
    localRetirada: "Suzano - SP",
    descricao: "Esta doação ainda está em andamento.",
    instituicaoBeneficiada: {
      nome: "Não informada",
      cidade: "Suzano - SP",
      descricao:
        "A instituição beneficiada ainda não foi registrada nesta doação.",
    },
  },
];

const IMAGEM_POR_ALIMENTO = {
  "cesta basica": "cestaBasica",
  macarrao: "macarrao",
  feijao: "feijao",
  oleo: "oleo",
  acucar: "acucar",
  biscoito: "bolacha",
  bolacha: "bolacha",
  farinha: "farinha",
  cenoura: "cenoura",
  tomate: "tomate",
  alface: "alface",
  arroz: "arroz",
  cafe: "cafe",
  leite: "leite",
  sal: "sal",
  agua: "agua",
};

const TIPO_CARD_POR_IMAGEM = {
  cesta: "cestaBasica",
  arroz: "arroz",
  feijao: "feijao",
  macarrao: "macarrao",
  oleo: "oleo",
  acucar: "acucar",
  sal: "sal",
  farinha: "farinha",
  cafe: "cafe",
  biscoito: "bolacha",
  leite: "leite",
  agua: "agua",
  tomate: "tomate",
  cenoura: "cenoura",
  alface: "alface",
};

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterTipoImagem(nome) {
  const nomeNormalizado = normalizar(nome);
  const alimento = Object.keys(IMAGEM_POR_ALIMENTO).find(
    (chave) =>
      nomeNormalizado === chave ||
      nomeNormalizado.startsWith(`${chave} `) ||
      nomeNormalizado.startsWith(`${chave}-`)
  );

  return alimento ? IMAGEM_POR_ALIMENTO[alimento] : null;
}

function formatarData(valor) {
  const data = valor?.toDate
    ? valor.toDate()
    : valor
    ? new Date(valor)
    : new Date();

  if (Number.isNaN(data.getTime())) {
    return "Data indisponível";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? `R$ ${numero.toFixed(2).replace(".", ",")}`
    : null;
}

function converterDoacao(documento) {
  const dados = documento.data();
  const itensAgrupados =
    dados.tipoDoacao === "agrupada" && Array.isArray(dados.itens)
      ? dados.itens
      : null;
  const primeiroItem = itensAgrupados?.[0];
  const imagemChave = primeiroItem?.imagemChave || dados.imagemChave;
  const tipoImagem =
    (IMAGENS[imagemChave] ? imagemChave : null) ||
    TIPO_CARD_POR_IMAGEM[imagemChave] ||
    obterTipoImagem(dados.nome);
  const itens = itensAgrupados
    ? itensAgrupados.map((item) => {
        const subtotal = formatarMoeda(item.subtotal);
        return `${item.nome} — ${item.quantidade} ${item.unidade}${
          subtotal ? ` · ${subtotal}` : ""
        }`;
      })
    : [`${dados.nome} — ${dados.quantidade} ${dados.unidade}`];
  const agrupada = dados.tipoDoacao === "agrupada";

  return {
    id: `firestore-${documento.id}`,
    nome: dados.nome,
    instituicao: dados.estabelecimento || "Mercado comunitário",
    data: formatarData(dados.criadoEm),
    quantidade: agrupada
      ? dados.quantidadeItens || itens.length
      : dados.quantidade,
    unidade: agrupada ? "itens" : dados.unidade,
    status: dados.status,
    tipoImagem,
    itens,
    localRetirada: dados.cidade,
    descricao: dados.descricao || "Esta doação ainda está em andamento.",
    total: agrupada ? dados.total : null,
    tipoDoacao: dados.tipoDoacao || "item",
    instituicaoBeneficiada: {
      nome: "Não informada",
      cidade: dados.cidade,
      descricao:
        "A instituição beneficiada ainda não foi registrada nesta doação.",
    },
  };
}

export default function TelaMinhasDoacoes({ navigation }) {
  const [filtro, setFiltro] = useState("Todas");
  const [doacoesFirestore, setDoacoesFirestore] = useState([]);
  const [erroFirestore, setErroFirestore] = useState("");

  useEffect(() => {
    const usuario = auth.currentUser;

    if (!usuario) {
      setErroFirestore("Faça login para consultar suas doações.");
      return undefined;
    }

    const consulta = query(
      collection(db, "minhasDoacoes"),
      where("criadoPor", "==", usuario.uid)
    );

    return onSnapshot(
      consulta,
      (resultado) => {
        setDoacoesFirestore(
          resultado.docs.map(converterDoacao)
        );
        setErroFirestore("");
      },
      (erro) => {
        console.error(
          "Erro ao consultar Minhas doações:",
          erro
        );
        setErroFirestore(
          erro.code === "permission-denied"
            ? "Não foi possível acessar suas doações. Tente novamente mais tarde."
            : "Não foi possível carregar suas doações."
        );
      }
    );
  }, []);

  const doacoesFiltradas = useMemo(() => {
    const doacoes = [
      ...doacoesFirestore,
      ...DOACOES_EXEMPLO,
    ];

    if (filtro === "Todas") return doacoes;
    if (filtro === "Concluídas") {
      return doacoes.filter(
        (item) => item.status === "Concluída"
      );
    }
    if (filtro === "Em andamento") {
      return doacoes.filter(
        (item) => item.status === "Em andamento"
      );
    }
    return doacoes;
  }, [filtro, doacoesFirestore]);

  function renderBotaoFiltro(label) {
    const ativo = filtro === label;

    return (
      <TouchableOpacity
        style={[styles.botaoFiltro, ativo && styles.botaoFiltroAtivo]}
        onPress={() => setFiltro(label)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.textoFiltro,
            ativo && styles.textoFiltroAtivo,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={VERDE} />
          </TouchableOpacity>

          <Text style={styles.titulo}>Minhas doações</Text>
        </View>

        <View style={styles.linhaFiltros}>
          {renderBotaoFiltro("Todas")}
          {renderBotaoFiltro("Concluídas")}
          {renderBotaoFiltro("Em andamento")}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!!erroFirestore && (
            <Text style={styles.erroFirestore}>
              {erroFirestore}
            </Text>
          )}

          {doacoesFiltradas.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("TelaDetalhesDoacao", {
                  doacao: item,
                })
              }
            >
              <View style={styles.cardEsquerda}>
                {item.tipoImagem ? (
                  <Image
                    source={IMAGENS[item.tipoImagem]}
                    style={styles.imagemProduto}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="nutrition-outline"
                    size={42}
                    color={VERDE}
                  />
                )}
              </View>

              <View style={styles.cardCentro}>
                <Text style={styles.nomeProduto}>{item.nome}</Text>
                <Text style={styles.instituicao}>{item.instituicao}</Text>
                <Text style={styles.meta}>
                  {item.data} • {item.quantidade} {item.unidade}
                </Text>

                <View style={styles.statusWrap}>
                  <Text style={styles.statusTexto}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.cardDireita}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9AA09A"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <MenuInferior navigation={navigation} ativo="doacoes" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  container: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },

  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VERDE_CLARO,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  titulo: {
    fontSize: 21,
    color: VERDE,
    fontFamily: "Poppins_700Bold",
  },

  linhaFiltros: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  botaoFiltro: {
    minWidth: 84,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: BRANCO,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoFiltroAtivo: {
    backgroundColor: VERDE,
    borderColor: VERDE,
  },

  textoFiltro: {
    fontSize: 11,
    color: "#6E716E",
    fontFamily: "Poppins_500Medium",
  },

  textoFiltroAtivo: {
    color: BRANCO,
    fontFamily: "Poppins_600SemiBold",
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 18,
  },

  erroFirestore: {
    color: "#A12A2A",
    fontSize: 13,
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRANCO,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    padding: 14,
    marginBottom: 16,
    shadowColor: SOMBRA,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  cardEsquerda: {
    marginRight: 12,
  },

  imagemProduto: {
    width: 74,
    height: 74,
  },

  cardCentro: {
    flex: 1,
  },

  nomeProduto: {
    fontSize: 18,
    lineHeight: 24,
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    marginBottom: 1,
  },

  instituicao: {
    fontSize: 13,
    color: CINZA,
    fontFamily: "Poppins_400Regular",
    marginBottom: 3,
  },

  meta: {
    fontSize: 14,
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },

  statusWrap: {
    alignSelf: "flex-start",
    backgroundColor: AMARELO_STATUS,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },

  statusTexto: {
    fontSize: 11,
    color: "#5B6A35",
    fontFamily: "Poppins_600SemiBold",
  },

  cardDireita: {
    marginLeft: 8,
  },

})