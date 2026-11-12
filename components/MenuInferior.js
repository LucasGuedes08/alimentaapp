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
  { id: "eventos", titulo: "Eventos", icon: "map-outline" },
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
    } else if (id === "eventos") {
      navigation.navigate("TelaEventos");
    } else if (id === "perfil") {
      navigation.navigate("TelaPerfil");
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
            size={23}
            color="#111111"
          />

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[
              styles.texto,
            ]}
          >
            {aba.id === "inicio" ? "Início" : aba.titulo}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    flexDirection: "row",
    minHeight: 46,
    backgroundColor: "#FFFCF6",
    borderWidth: 1,
    borderColor: "#B7B7B7",
    paddingHorizontal: 0,
  },

  botao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 1,
  },

  texto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#111111",
  },
})