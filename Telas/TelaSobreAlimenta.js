import React from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const CONTEUDO = [
  {
    titulo: "Missão",
    descricao:
      "Conectar alimentos que seriam desperdiçados a pessoas que realmente precisam, promovendo mais dignidade e menos desperdício.",
  },
  {
    titulo: "Visão",
    descricao:
      "Ser referência no combate ao desperdício de alimentos no Alto Tietê, expandindo nosso impacto e construindo comunidades mais solidárias.",
  },
  {
    titulo: "Valores",
    descricao:
      "Solidariedade, respeito, transparência, sustentabilidade e compromisso com as pessoas.",
  },
];

export default function TelaSobreAlimenta({ navigation }) {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
        <ScrollView
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topo}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("TelaConfiguracoes")
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={23} color={VERDE} />
            </TouchableOpacity>
            <Text style={styles.titulo}>Sobre o Alimenta+</Text>
          </View>

          <Text style={styles.subtitulo}>
            Conectando alimentos para um futuro melhor.
          </Text>

          {CONTEUDO.map((item) => (
            <View key={item.titulo} style={styles.card}>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardTexto}>{item.descricao}</Text>
            </View>
          ))}
        </ScrollView>
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
  },
  conteudo: {
    padding: 20,
    paddingBottom: 28,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voltar: {
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
  },
  subtitulo: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 7,
    marginBottom: 15,
  },
  card: {
    minHeight: 136,
    padding: 14,
    marginBottom: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFD8C6",
    backgroundColor: "#EEF4E5",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitulo: {
    color: "#161616",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    marginBottom: 3,
  },
  cardTexto: {
    color: "#696969",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
});