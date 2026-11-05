
import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

const ABAS = [
  { id: "inicio", titulo: "Início", icon: "home-outline" },
  { id: "buscar", titulo: "Buscar", icon: "search-outline" },
  { id: "eventos", titulo: "Eventos", icon: "calendar-outline" },
  { id: "doar", titulo: "Doe Agora", icon: "heart-outline" },
  { id: "perfil", titulo: "Perfil", icon: "person-outline" },
];

export default function MenuInferior({
  navigation,
  ativo = "inicio",
  onSelecionar,
}) {
  const selecionar = (id) => {
    if (onSelecionar) {
      onSelecionar(id);
      return;
    }

    if (id === "doar") {
      navigation.navigate("TelaCadastrarDoacao");
    } else {
      navigation.navigate("Home", { abrirAba: id });
    }
  };

  return (
    <View style={styles.menu}>
      {ABAS.map((aba) => (
        <TouchableOpacity
          key={aba.id}
          accessibilityRole="button"
          accessibilityLabel={aba.titulo}
          onPress={() => selecionar(aba.id)}
          style={styles.botao}
        >
          <Ionicons
            name={aba.icon}
            size={21}
            color={
              ativo === aba.id
                ? "#006838"
                : "#626262"
            }
          />

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.texto,
              ativo === aba.id && styles.selecionado,
            ]}
          >
            {aba.titulo}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    flexDirection: "row",
    minHeight: 58,
    backgroundColor: "#FFFCF6",
    borderTopWidth: 1,
    borderTopColor: "#DADBD5",
    paddingHorizontal: 5,
  },

  botao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    gap: 2,
  },

  texto: {
    fontSize: 9,
    color: "#626262",
  },

  selecionado: {
    color: "#006838",
    fontWeight: "700",
  },
});
