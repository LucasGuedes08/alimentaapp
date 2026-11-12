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

const INFORMACOES = [
  {
    titulo: "Data",
    valor: "15 de novembro de 2026",
    icone: "calendar-outline",
  },
  {
    titulo: "Horário",
    valor: "A partir das 18h",
    icone: "time-outline",
  },
  {
    titulo: "Local",
    valor: "Parque Max Feffer, Suzano - SP",
    icone: "location-outline",
  },
  {
    titulo: "Doação sugerida",
    valor: "1 kg de alimento não perecível",
    icone: "heart-outline",
  },
];

export default function TelaEventos({ navigation }) {
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
                  : navigation.navigate("Home")
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={23} color={VERDE} />
            </TouchableOpacity>

            <Text style={styles.titulo}>Eventos</Text>
          </View>

          <Text style={styles.subtitulo}>
            Participe e ajude a transformar vidas através da música!
          </Text>

          <View style={styles.banner}>
            <View style={styles.eventoTag}>
              <Text style={styles.eventoTagTexto}>EVENTO SOLIDÁRIO</Text>
            </View>

            <View style={styles.iconeEvento}>
              <Ionicons name="musical-notes" size={58} color="#FFFFFF" />
            </View>

            <Text style={styles.artista}>LUAN SANTANA</Text>
          </View>

          <View style={styles.card}>
            {INFORMACOES.map((item, index) => (
              <View
                key={item.titulo}
                style={[
                  styles.linha,
                  index === INFORMACOES.length - 1 && styles.ultimaLinha,
                ]}
              >
                <Ionicons
                  name={item.icone}
                  size={21}
                  color={VERDE}
                  style={styles.iconeLinha}
                />
                <View style={styles.dadosLinha}>
                  <Text style={styles.rotulo}>{item.titulo}</Text>
                  <Text style={styles.valor}>{item.valor}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.descricao}>
            O Show Comunitário do Alimenta+ une música e solidariedade
            para arrecadar alimentos e apoiar pessoas em situação de
            vulnerabilidade no Alto Tietê.
          </Text>

          <TouchableOpacity
            style={styles.linkCampanhas}
            onPress={() => navigation.navigate("TelaCampanhas")}
            accessibilityRole="button"
          >
            <Text style={styles.linkCampanhasTexto}>
              Conheça as campanhas
            </Text>
            <Ionicons name="chevron-forward" size={18} color={VERDE} />
          </TouchableOpacity>

          <Text style={styles.aviso}>
            Evento ilustrativo para demonstração. Confirme data, local e
            condições com a organização antes de se deslocar.
          </Text>
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
    paddingBottom: 32,
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
    fontSize: 22,
  },
  subtitulo: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6,
  },
  banner: {
    height: 192,
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: "#B8D7D1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  eventoTag: {
    position: "absolute",
    top: 12,
    left: 13,
    backgroundColor: "#E8F1D9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  eventoTagTexto: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },
  iconeEvento: {
    width: 104,
    height: 104,
    borderRadius: 55,
    backgroundColor: "#448D77",
    alignItems: "center",
    justifyContent: "center",
  },
  artista: {
    position: "absolute",
    bottom: 11,
    left: 13,
    color: VERDE,
    backgroundColor: "#E8F1D9",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 20,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 16,
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  linha: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D9D9D9",
  },
  ultimaLinha: {
    borderBottomWidth: 0,
  },
  iconeLinha: {
    marginRight: 10,
  },
  dadosLinha: {
    flex: 1,
  },
  rotulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  valor: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  descricao: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
  },
  linkCampanhas: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  linkCampanhasTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  aviso: {
    color: "#7B7B72",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
});