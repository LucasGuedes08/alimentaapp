import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { obterPrecoAtual } from "../utils/precosProdutos";

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FFFCF6";

function moeda(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? `R$ ${numero.toFixed(2).replace(".", ",")}`
    : "R$ 0,00";
}

export default function TelaDetalhesCobranca({ navigation, route }) {
  const { width } = useWindowDimensions();
  const doacao = route?.params?.doacao;
  const quantidade = Math.max(1, Number(doacao?.quantidade) || 1);
  const precoUnitario = obterPrecoAtual(doacao) ?? 0;
  const subtotal = precoUnitario * quantidade;
  const podeContinuar = Boolean(doacao?.nome);

  function continuar() {
    if (!podeContinuar) return;

    navigation.navigate("TelaSeuPedido", {
      pedido: {
        demonstracao: true,
        itens: [
          {
            id: doacao.id || doacao.nome,
            nome: doacao.nome,
            preco: precoUnitario,
            precoUnidade: doacao.precoUnidade || doacao.unidade,
            quantidade,
            unidade: doacao.unidade || "unidades",
            descricao: doacao.descricao || "",
          },
        ],
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
        <ScrollView
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("Home")
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={23} color={VERDE} />
            </TouchableOpacity>
            <Text style={styles.titulo}>DETALHES DE COBRANÇA</Text>
          </View>

          <View style={styles.aviso}>
            <Ionicons name="information-circle-outline" size={22} color={VERDE} />
            <Text style={styles.avisoTexto}>
              Esta é uma simulação. Nenhum pagamento será cobrado.
            </Text>
          </View>

          <Text style={styles.secaoTitulo}>Resumo do alimento</Text>
          <View style={styles.card}>
            <Text style={styles.nome}>{doacao?.nome || "Alimento"}</Text>
            <Text style={styles.detalhe}>
              Quantidade: {quantidade} {doacao?.unidade || "unidades"}
            </Text>
            {!!doacao?.estabelecimento && (
              <Text style={styles.detalhe}>
                Disponibilizado por {doacao.estabelecimento}
              </Text>
            )}
            {!!doacao?.descricao && (
              <Text style={styles.descricao}>{doacao.descricao}</Text>
            )}
          </View>

          <Text style={styles.secaoTitulo}>Preço promocional</Text>
          <View style={styles.card}>
            <View style={styles.linha}>
              <Text style={styles.rotulo}>Por {doacao?.precoUnidade || doacao?.unidade || "unidade"}</Text>
              <Text style={styles.valor}>{moeda(precoUnitario)}</Text>
            </View>
            <View style={[styles.linha, styles.linhaTotal]}>
              <Text style={styles.totalRotulo}>Total demonstrativo</Text>
              <Text style={styles.totalValor}>{moeda(subtotal)}</Text>
            </View>
            <Text style={styles.doacaoGratis}>
              Preços e pagamento são demonstrativos. Nenhum valor será cobrado.
            </Text>
          </View>

          {!podeContinuar && (
            <Text style={styles.erro}>
              Não foi possível carregar o alimento. Volte e tente novamente.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.botao,
              !podeContinuar && styles.botaoDesabilitado,
            ]}
            onPress={continuar}
            disabled={!podeContinuar}
            accessibilityRole="button"
          >
            <Text style={styles.botaoTexto}>Continuar</Text>
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginBottom: 22,
  },
  voltar: {
    position: "absolute",
    left: 0,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#EAF2E5",
    marginBottom: 22,
  },
  avisoTexto: {
    flex: 1,
    color: VERDE,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },
  secaoTitulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    marginBottom: 9,
  },
  card: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
  },
  nome: {
    color: "#222222",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  detalhe: {
    color: "#656B65",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  descricao: {
    color: "#656B65",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rotulo: {
    color: "#555D55",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
  valor: {
    color: "#333333",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  linhaTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E8E2",
    marginTop: 13,
    paddingTop: 13,
  },
  totalRotulo: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  totalValor: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  doacaoGratis: {
    color: "#737973",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  erro: {
    color: "#B3261E",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginBottom: 12,
  },
  botao: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: VERDE_BOTAO,
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
