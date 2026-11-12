import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../firebase";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

function chavePreferencia(uid) {
  return `alimenta-notificacoes:${uid || "anonimo"}`;
}

export default function TelaNotificacoes({ navigation }) {
  const { width } = useWindowDimensions();
  const [ativadas, setAtivadas] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    AsyncStorage.getItem(chavePreferencia(auth.currentUser?.uid))
      .then((valor) => {
        if (ativo && valor !== null) {
          setAtivadas(valor === "true");
        }
      })
      .catch((e) => {
        console.error("Erro ao carregar preferência de notificações:", e);
        if (ativo) {
          setErro("Não foi possível carregar sua preferência.");
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function alterarPreferencia(valor) {
    setErro("");

    try {
      await AsyncStorage.setItem(
        chavePreferencia(auth.currentUser?.uid),
        String(valor)
      );
      setAtivadas(valor);
    } catch (e) {
      console.error("Erro ao salvar preferência de notificações:", e);
      setErro("Não foi possível salvar sua preferência. Tente novamente.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.tela, { width: Math.min(width, 460) }]}>
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
          <Text style={styles.titulo}>Notificações</Text>
        </View>

        <Text style={styles.subtitulo}>
          Escolha se deseja receber notificações do Alimenta+
        </Text>

        <View style={styles.card}>
          <View style={styles.iconeFundo}>
            <Ionicons name="notifications-outline" size={34} color="#222222" />
          </View>

          <View style={styles.textos}>
            <Text style={styles.cardTitulo}>Receber notificações</Text>
            <Text style={styles.descricao}>
              Avisos sobre doações, campanhas, conquistas e novidades.
            </Text>
          </View>

          {carregando ? (
            <ActivityIndicator color={VERDE} />
          ) : (
            <Switch
              value={ativadas}
              onValueChange={alterarPreferencia}
              trackColor={{ false: "#D5D5D5", true: VERDE }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Receber notificações"
            />
          )}
        </View>

        {!!erro && (
          <Text style={styles.erro} accessibilityRole="alert">
            {erro}
          </Text>
        )}

        <Text style={styles.nota}>
          Sua preferência fica salva neste aparelho. Notificações
          automáticas ainda não estão habilitadas nesta versão.
        </Text>
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
    padding: 20,
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
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  iconeFundo: {
    width: 56,
    height: 56,
    borderRadius: 30,
    backgroundColor: "#EEF4E5",
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
  },
  cardTitulo: {
    color: "#151515",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  descricao: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  erro: {
    color: "#B3261E",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 10,
  },
  nota: {
    color: "#78786F",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
});