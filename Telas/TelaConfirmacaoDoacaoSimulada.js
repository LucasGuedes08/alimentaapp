import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatarReaisCentavos } from "../utils/pagamentoSimulado";

const VERDE = "#006838";
const VERDE_BOTAO = "#348F20";
const FUNDO = "#FFFCF6";

const FORMAS_PAGAMENTO = {
  credito: "Cartão de Crédito",
  debito: "Cartão de Débito",
  pix: "Pix",
};

export default function TelaConfirmacaoDoacaoSimulada({
  navigation,
  route,
}) {
  const {
    subtotalCentavos = 0,
    totalCentavos = 0,
    pagamento = "pix",
    parcelas,
    valorParcelaCentavos,
    ultimaParcelaCentavos,
    jurosPercentual = 0,
    status,
  } = route?.params || {};
  const parcelado = pagamento === "credito" && Number(parcelas) > 1;

  function voltarAoInicio() {
    const rotas = navigation.getState()?.routeNames || [];
    if (rotas.includes("Home")) {
      navigation.navigate("Home");
      return;
    }

    navigation.popToTop();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.icone}>
          <Ionicons name="checkmark-circle" size={88} color={VERDE_BOTAO} />
        </View>

        <Text style={styles.titulo}>Doação simulada concluída!</Text>
        <Text style={styles.mensagem}>
          {pagamento === "pix"
            ? "Sua simulação foi realizada com sucesso. Nenhuma transferência bancária foi realizada."
            : "Sua simulação foi realizada com sucesso. Nenhuma cobrança foi efetuada."}
        </Text>

        <View style={styles.resumo}>
          <View style={styles.linha}>
            <Text style={styles.rotulo}>Valor original</Text>
            <Text style={styles.valor}>
              {formatarReaisCentavos(subtotalCentavos)}
            </Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.rotulo}>Forma de pagamento</Text>
            <Text style={styles.valor}>
              {FORMAS_PAGAMENTO[pagamento] || "Não informado"}
            </Text>
          </View>
          {pagamento === "pix" && (
            <View style={styles.linha}>
              <Text style={styles.rotulo}>Status</Text>
              <Text style={styles.valor}>
                {status || "Simulação concluída"}
              </Text>
            </View>
          )}
          {pagamento === "credito" && (
            <View style={styles.linha}>
              <Text style={styles.rotulo}>Parcelamento</Text>
              <Text style={styles.valor}>
                {parcelas}x · juros de {jurosPercentual}%
              </Text>
            </View>
          )}
          {pagamento === "credito" &&
            Number.isFinite(valorParcelaCentavos) && (
              <View style={styles.linha}>
                <Text style={styles.rotulo}>Valor das parcelas</Text>
                <Text style={styles.valor}>
                  {parcelas}x de{" "}
                  {formatarReaisCentavos(valorParcelaCentavos)}
                </Text>
              </View>
            )}
          {parcelado &&
            Number.isFinite(ultimaParcelaCentavos) &&
            ultimaParcelaCentavos !== valorParcelaCentavos && (
            <View style={styles.linha}>
              <Text style={styles.rotulo}>Última parcela</Text>
              <Text style={styles.valor}>
                {formatarReaisCentavos(ultimaParcelaCentavos)}
              </Text>
            </View>
          )}
          <View style={[styles.linha, styles.linhaTotal]}>
            <Text style={styles.rotuloTotal}>Total simulado</Text>
            <Text style={styles.valorTotal}>
              {formatarReaisCentavos(totalCentavos)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.botao}
          onPress={voltarAoInicio}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.textoBotao}>Voltar ao início</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FUNDO,
  },
  conteudo: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  icone: {
    alignItems: "center",
    marginBottom: 18,
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 23,
    lineHeight: 31,
    textAlign: "center",
  },
  mensagem: {
    color: "#505850",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 26,
  },
  resumo: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 9,
  },
  rotulo: {
    flex: 1,
    color: "#596159",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  valor: {
    flex: 1,
    color: "#252B25",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    textAlign: "right",
  },
  linhaTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E8E2",
    marginTop: 6,
    paddingTop: 14,
  },
  rotuloTotal: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  valorTotal: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  botao: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderRadius: 25,
    backgroundColor: VERDE_BOTAO,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
});
