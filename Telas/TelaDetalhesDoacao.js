import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MenuInferior from "../components/MenuInferior";
import { IMAGENS_CATALOGO } from "../assets/images/catalogo/mapa";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";
const BORDA = "#D8DDD6";

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
  ...IMAGENS_CATALOGO,
};

const DOACAO_PADRAO = {
  nome: "Doação de alimentos",
  instituicao: "Instituição beneficiada",
  data: "Data não informada",
  quantidade: 0,
  unidade: "itens",
  status: "Em andamento",
  tipoImagem: null,
  itens: [],
  localRetirada: "A combinar",
  descricao: "Acompanhe aqui as informações desta doação.",
  instituicaoBeneficiada: {
    nome: "Não informada",
    cidade: "Suzano - SP",
    descricao:
      "A instituição beneficiada ainda não foi registrada nesta doação.",
  },
};

export default function TelaDetalhesDoacao({ navigation, route }) {
  const { width } = useWindowDimensions();
  const [mostrarItens, setMostrarItens] = useState(true);

  const doacao = useMemo(
    () => ({
      ...DOACAO_PADRAO,
      ...(route?.params?.doacao || {}),
      instituicaoBeneficiada: {
        ...DOACAO_PADRAO.instituicaoBeneficiada,
        ...(route?.params?.doacao?.instituicaoBeneficiada || {}),
      },
    }),
    [route?.params?.doacao]
  );

  const imagem = IMAGENS[doacao.tipoImagem];
  const itens = Array.isArray(doacao.itens) ? doacao.itens : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conteudo}
        >
          <View style={styles.topo}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("TelaMinhasDoacoes")
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar para minhas doações"
            >
              <Ionicons name="chevron-back" size={22} color={VERDE} />
            </TouchableOpacity>

            <Text style={styles.titulo}>Detalhes da doação</Text>
          </View>

          <Text style={styles.subtitulo}>
            Acompanhe todas as informações
          </Text>

          <View style={styles.cardDoacao}>
            {imagem ? (
              <Image
                source={imagem}
                style={styles.imagem}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagem, styles.imagemVazia]}>
                <Ionicons
                  name="nutrition-outline"
                  size={39}
                  color={VERDE}
                />
              </View>
            )}

            <View style={styles.dadosDoacao}>
              <Text style={styles.nomeDoacao} numberOfLines={2}>
                {doacao.nome}
              </Text>
              <Text style={styles.instituicao} numberOfLines={1}>
                {doacao.instituicao}
              </Text>
              <Text style={styles.meta}>
                {doacao.data} • {doacao.quantidade} {doacao.unidade}
              </Text>
              <View style={styles.status}>
                <Text style={styles.statusTexto}>{doacao.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.resumo}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoTitulo}>Data da doação</Text>
              <Text style={styles.resumoValor}>{doacao.data}</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoTitulo}>Itens doados</Text>
              <Text style={styles.resumoValor}>
                {doacao.quantidade} {doacao.unidade}
              </Text>
            </View>
            <View style={[styles.resumoItem, styles.resumoUltimo]}>
              <Text style={styles.resumoTitulo}>Local de retirada</Text>
              <Text style={styles.resumoValor} numberOfLines={2}>
                {doacao.localRetirada}
              </Text>
            </View>
          </View>

          {doacao.tipoDoacao === "agrupada" && (
            <View style={styles.totalDoacao}>
              <Text style={styles.totalDoacaoRotulo}>
                Total demonstrativo
              </Text>
              <Text style={styles.totalDoacaoValor}>
                R$ {Number(doacao.total || 0).toFixed(2).replace(".", ",")}
              </Text>
            </View>
          )}

          <Text style={styles.secao}>Instituição beneficiada</Text>
          <Text style={styles.secaoDescricao}>
            Conheça mais sobre a instituição que recebeu sua doação.
          </Text>

          <View style={styles.cardInstituicao}>
            <View style={styles.iconeInstituicao}>
              <Ionicons name="business-outline" size={31} color={VERDE} />
            </View>
            <View style={styles.dadosInstituicao}>
              <Text style={styles.nomeInstituicao}>
                {doacao.instituicaoBeneficiada.nome}
              </Text>
              <Text style={styles.cidade}>
                {doacao.instituicaoBeneficiada.cidade}
              </Text>
              <Text style={styles.descricaoInstituicao}>
                {doacao.instituicaoBeneficiada.descricao}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botaoItens}
            onPress={() => setMostrarItens(!mostrarItens)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ expanded: mostrarItens }}
          >
            <Text style={styles.botaoItensTexto}>Itens doados</Text>
            <Ionicons
              name={mostrarItens ? "chevron-up" : "chevron-down"}
              size={20}
              color={VERDE}
            />
          </TouchableOpacity>

          {mostrarItens && (
            <View style={styles.listaItens}>
              {itens.length > 0 ? (
                itens.map((item, index) => (
                  <Text key={`${index}-${item}`} style={styles.itemTexto}>
                    • {item}
                  </Text>
                ))
              ) : (
                <Text style={styles.itemTexto}>
                  Os itens desta doação ainda não foram informados.
                </Text>
              )}
            </View>
          )}

          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              {doacao.descricao}
            </Text>
          </View>
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
    alignItems: "center",
  },
  tela: {
    flex: 1,
    maxWidth: 460,
    backgroundColor: FUNDO,
  },
  conteudo: {
    padding: 14,
    paddingBottom: 18,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voltar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
  },
  subtitulo: {
    color: "#686868",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  cardDoacao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  imagem: {
    width: 91,
    height: 83,
    borderRadius: 11,
    backgroundColor: "#F1F1EC",
  },
  imagemVazia: {
    alignItems: "center",
    justifyContent: "center",
  },
  dadosDoacao: {
    flex: 1,
    minWidth: 0,
  },
  nomeDoacao: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 18,
  },
  instituicao: {
    color: "#5B5B5B",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 1,
  },
  meta: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    marginTop: 2,
  },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "#BFD9AF",
    marginTop: 5,
  },
  statusTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },
  resumo: {
    flexDirection: "row",
    marginTop: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: BORDA,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  totalDoacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EAF2E5",
  },
  totalDoacaoRotulo: {
    color: "#4D5C4D",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  totalDoacaoValor: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  resumoItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  resumoUltimo: {
    borderRightWidth: 0,
  },
  resumoTitulo: {
    color: "#606060",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    textAlign: "center",
  },
  resumoValor: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  secao: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    marginTop: 16,
  },
  secaoDescricao: {
    color: "#777777",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 1,
  },
  cardInstituicao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconeInstituicao: {
    width: 58,
    height: 58,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4E5",
  },
  dadosInstituicao: {
    flex: 1,
  },
  nomeInstituicao: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
  },
  cidade: {
    color: "#303030",
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    marginTop: 1,
  },
  descricaoInstituicao: {
    color: "#6A6A6A",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  botaoItens: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C9D8BF",
    backgroundColor: "#E8EFDF",
    elevation: 2,
  },
  botaoItensTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  listaItens: {
    padding: 11,
    marginTop: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#FFFFFF",
  },
  itemTexto: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
  },
  aviso: {
    padding: 10,
    marginTop: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#FFFFFF",
  },
  avisoTexto: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },
});