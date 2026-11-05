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
const VERDE_CHIP = "#BFD9AF";
const FUNDO = "#F7F5EF";
const BRANCO = "#FFFFFF";
const CINZA = "#666C66";
const BORDA = "#D8DDD6";
const SOMBRA = "#000000";
const AMARELO_STATUS = "#EFE7B4";

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

export default function TelaDetalhesDoacao({ navigation, route }) {
  const [mostrarItens, setMostrarItens] = useState(true);

  const doacao = useMemo(() => {
    if (route?.params?.doacao) return route.params.doacao;

    return {
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
    };
  }, [route]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.topoImagem}>
            <Image
              source={IMAGENS[doacao.tipoImagem]}
              style={styles.imagemTopo}
              resizeMode="cover"
            />

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={22} color={VERDE} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardPrincipal}>
            <View style={styles.chipCategoria}>
              <Text style={styles.chipCategoriaTexto}>DOAÇÃO</Text>
            </View>

            <Text style={styles.titulo}>{doacao.nome}</Text>
            <Text style={styles.subtitulo}>{doacao.instituicao}</Text>

            <View style={styles.linhaPreco}>
              <Text style={styles.textoDestaque}>
                {doacao.data} • {doacao.quantidade} {doacao.unidade}
              </Text>
            </View>

            <View style={styles.statusWrap}>
              <Text style={styles.statusTexto}>{doacao.status}</Text>
            </View>

            <View style={styles.divisor} />

            <Text style={styles.retirada}>
              Local de retirada: {doacao.localRetirada}
            </Text>
          </View>

          <Text style={styles.secaoTitulo}>Sobre a doação</Text>
          <Text style={styles.secaoTexto}>{doacao.descricao}</Text>

          <Text style={styles.secaoTitulo}>Instituição beneficiada</Text>

          <View style={styles.cardInstituicao}>
            <View style={styles.iconeInstituicao}>
              <Ionicons name="business-outline" size={28} color={VERDE} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.nomeInstituicao}>
                {doacao.instituicaoBeneficiada?.nome || "Não informada"}
              </Text>
              <Text style={styles.cidadeInstituicao}>
                {doacao.instituicaoBeneficiada?.cidade || "Suzano - SP"}
              </Text>
              <Text style={styles.descInstituicao}>
                {doacao.instituicaoBeneficiada?.descricao ||
                  "A instituição beneficiada ainda não foi registrada nesta doação."}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botaoItens}
            onPress={() => setMostrarItens(!mostrarItens)}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoItensTexto}>Itens da doação</Text>
            <Ionicons
              name={mostrarItens ? "chevron-up" : "chevron-down"}
              size={20}
              color={VERDE}
            />
          </TouchableOpacity>

          {mostrarItens && (
            <View style={styles.listaItens}>
              {doacao.itens?.map((item, index) => (
                <Text key={index} style={styles.itemTexto}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.cardInformacao}>
            <Text style={styles.infoTexto}>
              Acompanhe o andamento desta doação. A entrega só será
              considerada concluída após atualização do status.
            </Text>
          </View>
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

  scroll: {
    paddingBottom: 110,
  },

  topoImagem: {
    height: 250,
    backgroundColor: "#EDE6DB",
    position: "relative",
  },

  imagemTopo: {
    width: "100%",
    height: "100%",
  },

  botaoVoltar: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(247,245,239,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardPrincipal: {
    marginTop: -28,
    marginHorizontal: 18,
    backgroundColor: BRANCO,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4D8D1",
    padding: 16,
    shadowColor: SOMBRA,
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  chipCategoria: {
    alignSelf: "flex-start",
    backgroundColor: VERDE_CHIP,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 12,
  },

  chipCategoriaTexto: {
    color: VERDE,
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },

  titulo: {
    color: "#20261F",
    fontSize: 31,
    lineHeight: 38,
    fontFamily: "Poppins_700Bold",
  },

  subtitulo: {
    color: CINZA,
    fontSize: 20,
    marginTop: 2,
    fontFamily: "Poppins_500Medium",
  },

  linhaPreco: {
    marginTop: 10,
    marginBottom: 8,
  },

  textoDestaque: {
    color: VERDE,
    fontSize: 23,
    fontFamily: "Poppins_700Bold",
  },

  statusWrap: {
    alignSelf: "flex-start",
    backgroundColor: AMARELO_STATUS,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginTop: 4,
  },

  statusTexto: {
    color: "#5B6A35",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  divisor: {
    height: 1,
    backgroundColor: "#D9D9D9",
    marginVertical: 14,
  },

  retirada: {
    color: "#5C615C",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },

  secaoTitulo: {
    marginTop: 18,
    marginHorizontal: 18,
    color: "#1A1F19",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: "Poppins_700Bold",
  },

  secaoTexto: {
    marginTop: 6,
    marginHorizontal: 18,
    color: "#555D55",
    fontSize: 19,
    lineHeight: 29,
    fontFamily: "Poppins_400Regular",
  },

  cardInstituicao: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    marginHorizontal: 18,
    backgroundColor: BRANCO,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDA,
    padding: 16,
  },

  iconeInstituicao: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#EEF6E8",
    alignItems: "center",
    justifyContent: "center",
  },

  nomeInstituicao: {
    color: VERDE,
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
  },

  cidadeInstituicao: {
    color: "#404840",
    fontSize: 16,
    marginTop: 1,
    fontFamily: "Poppins_500Medium",
  },

  descInstituicao: {
    color: "#666E66",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 6,
    fontFamily: "Poppins_400Regular",
  },

  botaoItens: {
    marginTop: 18,
    marginHorizontal: 18,
    backgroundColor: "#D9E9CE",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B9D1AA",
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  botaoItensTexto: {
    color: VERDE,
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },

  listaItens: {
    marginTop: 10,
    marginHorizontal: 18,
    backgroundColor: BRANCO,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    padding: 16,
  },

  itemTexto: {
    color: "#444B44",
    fontSize: 17,
    lineHeight: 27,
    fontFamily: "Poppins_500Medium",
  },

  cardInformacao: {
    marginTop: 16,
    marginHorizontal: 18,
    backgroundColor: "#F7F7F4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    padding: 16,
  },

  infoTexto: {
    textAlign: "center",
    color: "#666B66",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Poppins_400Regular",
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