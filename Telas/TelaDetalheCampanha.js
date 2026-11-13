import React from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { imagemCampanha } from "../utils/campanhasAdmin";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

function formatarMeta(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return "";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function TelaDetalheCampanha({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();
  const campanha = route?.params?.campanha;
  const ativa = campanha?.status === "Ativa";
  const meta = formatarMeta(campanha?.meta);
  const responsavel =
    campanha?.responsavel ||
    campanha?.organizacao ||
    campanha?.estabelecimento;

  function contribuir() {
    navigation.navigate("Home", { abrirAba: "buscar" });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
        <ScrollView
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          {campanha?.imagemChave ? (
            <Image
              source={imagemCampanha(campanha)}
              resizeMode="cover"
              style={styles.imagem}
            />
          ) : (
            <View style={[styles.imagem, styles.imagemVazia]}>
              <Ionicons name="basket-outline" size={76} color={VERDE} />
            </View>
          )}

          <TouchableOpacity
            style={styles.voltar}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("TelaCampanhas")
            }
            accessibilityRole="button"
            accessibilityLabel="Voltar para campanhas"
          >
            <Ionicons name="chevron-back" size={23} color={VERDE} />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.titulo}>
              {campanha?.nome || "Campanha não encontrada"}
            </Text>
            <Text style={styles.descricao}>
              {campanha?.descricao ||
                "Volte para a lista e selecione uma campanha disponível."}
            </Text>

            {!!campanha && (
              <>
                {!!campanha.prazo && (
                  <Text style={styles.prazo}>{campanha.prazo}</Text>
                )}

                {!!campanha.categoria && (
                  <Text style={styles.informacao}>
                    Categoria: {campanha.categoria}
                  </Text>
                )}

                {!!campanha.inicio && (
                  <Text style={styles.informacao}>
                    Início: {campanha.inicio}
                  </Text>
                )}

                {!!campanha.termino && (
                  <Text style={styles.informacao}>
                    Término: {campanha.termino}
                  </Text>
                )}

                {!!responsavel && (
                  <Text style={styles.informacao}>
                    Responsável: {responsavel}
                  </Text>
                )}

                {!!meta && (
                  <View style={styles.meta}>
                    <Text style={styles.metaTitulo}>
                      Meta da campanha
                    </Text>
                    <Text style={styles.metaTexto}>
                      {meta}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          <Text style={styles.aviso}>
            Escolha alimentos do catálogo para adicionar ao seu carrinho
            de doações.
          </Text>

          {campanha && (
            <TouchableOpacity
              style={[styles.botao, !ativa && styles.botaoDesativado]}
              onPress={contribuir}
              disabled={!ativa}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTexto}>
                {ativa ? "Escolher alimentos" : "Campanha indisponível"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: "center",
    backgroundColor: FUNDO,
  },
  tela: {
    flex: 1,
    maxWidth: 460,
  },
  conteudo: {
    flexGrow: 1,
    paddingBottom: 92,
  },
  imagem: {
    width: "100%",
    height: 250,
    backgroundColor: "#E6EADD",
  },
  imagemVazia: {
    alignItems: "center",
    justifyContent: "center",
  },
  voltar: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 21,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginTop: -24,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    lineHeight: 27,
  },
  descricao: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 3,
  },
  prazo: {
    color: VERDE,
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    marginTop: 9,
  },
  informacao: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginTop: 6,
  },
  meta: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFD8C6",
    backgroundColor: "#EEF4E5",
  },
  metaTitulo: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  metaTexto: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  aviso: {
    color: "#7A7A72",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginHorizontal: 24,
    marginTop: 12,
  },
  botao: {
    minHeight: 46,
    marginHorizontal: 28,
    marginTop: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VERDE,
    elevation: 3,
  },
  botaoDesativado: {
    backgroundColor: "#AEB5AA",
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});