import React, { useMemo, useState } from "react";
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
  cafe: require("../assets/images/tabIcons/cafe.png"),
  acucar: require("../assets/images/tabIcons/acucar.png"),
  sal: require("../assets/images/tabIcons/sal.png"),
  bolacha: require("../assets/images/tabIcons/bolacha.png"),
  agua: require("../assets/images/tabIcons/agua.jpg"),
  leite: require("../assets/images/tabIcons/leite.webp"),
  tomate: require("../assets/images/tabIcons/tomate.png"),
  cenoura: require("../assets/images/tabIcons/cenoura.png"),
  alface: require("../assets/images/tabIcons/alface.png"),
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

export default function TelaMinhasDoacoes({ navigation }) {
  const [filtro, setFiltro] = useState("Todas");

  const doacoesFiltradas = useMemo(() => {
    if (filtro === "Todas") return DOACOES_EXEMPLO;
    if (filtro === "Concluídas") {
      return DOACOES_EXEMPLO.filter(
        (item) => item.status === "Concluída"
      );
    }
    if (filtro === "Em andamento") {
      return DOACOES_EXEMPLO.filter(
        (item) => item.status === "Em andamento"
      );
    }
    return DOACOES_EXEMPLO;
  }, [filtro]);

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
                <Image
                  source={IMAGENS[item.tipoImagem]}
                  style={styles.imagemProduto}
                  resizeMode="contain"
                />
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

        <View style={styles.tabBar}>
          <ItemTab icone="home-outline" texto="Início" />
          <ItemTab icone="search-outline" texto="Buscar" />
          <ItemTab icone="calendar-outline" texto="Eventos" />
          <ItemTab icone="heart-outline" texto="Doe Agora" />
          <ItemTab icone="person-outline" texto="Perfil" ativo />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ItemTab({ icone, texto, ativo = false }) {
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
      <Ionicons
        name={icone}
        size={21}
        color={ativo ? VERDE : "#666"}
      />
      <Text style={[styles.tabTexto, ativo && styles.tabTextoAtivo]}>
        {texto}
      </Text>
    </TouchableOpacity>
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
    paddingBottom: 110,
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

  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FAF9F5",
    borderTopWidth: 1,
    borderTopColor: "#D8DDD6",
    paddingTop: 10,
    paddingBottom: 14,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  tabTexto: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
    fontFamily: "Poppins_400Regular",
  },

  tabTextoAtivo: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
  },
});