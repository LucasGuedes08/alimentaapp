import React from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const VERDE = "#006838";
const LARANJA = "#FF7827";
const FUNDO = "#FFFCF6";

export default function TelaDetalheCampanha({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();
  const campanha = route?.params?.campanha;
  const ativa = campanha?.status === "Ativa";
  const percentual = campanha?.percentual;

  function contribuir() {
    Alert.alert(
      "Campanha demonstrativa",
      "Esta prévia não recebe contribuições reais. Você pode cadastrar uma doação de alimento separadamente.",
      [
        { text: "Agora não", style: "cancel" },
        {
          text: "Cadastrar alimento",
          onPress: () => navigation.navigate("TelaCadastrarDoacao"),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
        <ScrollView
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          {campanha?.imagem ? (
            <Image
              source={campanha.imagem}
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

                {!!campanha.metaTexto && (
                  <View style={styles.meta}>
                    <View style={styles.metaTopo}>
                      <Text style={styles.metaTitulo}>
                        Meta da campanha
                      </Text>
                      <Text style={styles.percentual}>
                        {percentual}%
                      </Text>
                    </View>
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: percentual,
                      }}
                      style={styles.trilho}
                    >
                      <View
                        style={[
                          styles.progresso,
                          { width: `${percentual}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.metaTexto}>
                      {campanha.metaTexto}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          <Text style={styles.aviso}>
            Prévia para demonstração. As informações de campanha não
            estão conectadas a uma arrecadação real.
          </Text>

          {campanha && (
            <TouchableOpacity
              style={[styles.botao, !ativa && styles.botaoDesativado]}
              onPress={contribuir}
              disabled={!ativa}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTexto}>
                {ativa ? "Quero contribuir" : "Campanha indisponível"}
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
    paddingBottom: 30,
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
  meta: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFD8C6",
    backgroundColor: "#EEF4E5",
  },
  metaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaTitulo: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  percentual: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  trilho: {
    height: 15,
    borderRadius: 10,
    backgroundColor: "#D8D8D8",
    overflow: "hidden",
    marginTop: 3,
  },
  progresso: {
    width: "70%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: LARANJA,
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
    marginTop: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LARANJA,
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