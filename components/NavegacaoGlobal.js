import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const ATALHOS = [
  {
    id: "minhas",
    titulo: "Minhas doações",
    descricao: "Acompanhe o histórico e o andamento",
    icone: "gift-outline",
  },
  {
    id: "doar",
    titulo: "Cadastrar doação",
    descricao: "Disponibilize alimentos para doação",
    icone: "add-circle-outline",
  },
  {
    id: "buscar",
    titulo: "Buscar alimentos",
    descricao: "Explore o catálogo do Alimenta+",
    icone: "search-outline",
  },
  {
    id: "eventos",
    titulo: "Eventos e campanhas",
    descricao: "Acompanhe as ações do projeto",
    icone: "calendar-outline",
  },
  {
    id: "conquistas",
    titulo: "Minhas conquistas",
    descricao: "Veja o progresso das suas contribuições",
    icone: "trophy-outline",
  },
  {
    id: "perfil",
    titulo: "Meu perfil",
    descricao: "Veja suas informações e sua conta",
    icone: "person-outline",
  },
];

const ABAS = [
  {
    id: "inicio",
    nome: "Início",
    icone: "home-outline",
  },
  {
    id: "eventos",
    nome: "Eventos",
    icone: "map-outline",
  },
  {
    id: "doar",
    nome: "Doe Agora",
    icone: "heart-outline",
  },
  {
    id: "perfil",
    nome: "Perfil",
    icone: "person-outline",
  },
];

export default function NavegacaoGlobal({
  navigationRef,
  rotaAtual,
}) {
  const insets = useSafeAreaInsets();

  const [menuAberto, setMenuAberto] =
    useState(false);

  const [abaAtiva, setAbaAtiva] =
    useState("inicio");

  const [tecladoAberto, setTecladoAberto] =
    useState(false);

  // OCULTAR MENU INFERIOR COM O TECLADO
  useEffect(() => {
    const mostrar = Keyboard.addListener(
      "keyboardDidShow",
      () => setTecladoAberto(true)
    );

    const ocultar = Keyboard.addListener(
      "keyboardDidHide",
      () => setTecladoAberto(false)
    );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  // ROTAS INTERNAS
  function navegar(destino) {
    setMenuAberto(false);

    const nav = navigationRef.current;

    if (!nav?.isReady?.()) {
      return;
    }

    const rotas = {
      minhas: "TelaMinhasDoacoes",
      doar: "TelaCadastrarDoacao",
      eventos: "TelaCampanhas",
      perfil: "TelaPerfil",
      conquistas: "TelaConquistas",
    };

    if (rotas[destino]) {
      setAbaAtiva(destino);
      nav.navigate(rotas[destino]);
    } else {
      setAbaAtiva(destino);

      nav.navigate("Home", {
        abrirAba: destino,
      });
    }
  }

  // IDENTIFICAR A ABA ATIVA
  const abaSelecionada =
    rotaAtual === "TelaPerfil" ||
    rotaAtual === "TelaEditarPerfil" ||
    rotaAtual === "TelaConquistas"
      ? "perfil"
      : rotaAtual === "TelaCampanhas"
      ? "eventos"
      : rotaAtual === "TelaCadastrarDoacao"
      ? "doar"
      : rotaAtual === "Home"
      ? abaAtiva
      : "inicio";

  if (
    rotaAtual === "TelaDetalhesProduto" ||
    rotaAtual === "TelaConquistas" ||
    rotaAtual === "DetalhesCobranca" ||
    rotaAtual === "TelaSeuPedido"
  ) {
    return null;
  }

  return (
    <>
      <View
        pointerEvents="box-none"
        style={styles.camada}
      >
        {/* ÍCONE DE TRÊS LINHAS */}
        <Pressable
          onPress={() => setMenuAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu de atalhos"
          style={[
            styles.botaoHamburguer,
            {
              top: insets.top + 15,
            },
          ]}
        >
          <View style={styles.barraHamburguer} />
          <View style={styles.barraHamburguer} />
          <View style={styles.barraHamburguer} />
        </Pressable>

        {/* MENU INFERIOR GLOBAL */}
        {!tecladoAberto && (
          <View
            style={[
              styles.barraInferior,
              {
                paddingBottom: insets.bottom,
                minHeight: 46 + insets.bottom,
              },
            ]}
          >
            {ABAS.map((aba) => (
              <Pressable
                key={aba.id}
                onPress={() => navegar(aba.id)}
                accessibilityRole="button"
                accessibilityLabel={aba.nome}
                style={styles.aba}
              >
                <Ionicons
                  name={aba.icone}
                  size={23}
                  color="#111111"
                />

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={styles.textoAba}
                >
                  {aba.id === "inicio" ? "Início" : aba.nome}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* MODAL LATERAL DE ATALHOS */}
      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setMenuAberto(false)
        }
      >
        <View style={styles.fundoModal}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() =>
              setMenuAberto(false)
            }
          />

          <View
            style={[
              styles.painelModal,
              {
                paddingTop: insets.top + 15,
              },
            ]}
          >
            <View style={styles.cabecalho}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo}>
                  Atalhos
                </Text>

                <Text style={styles.subtitulo}>
                  Acesse outras áreas do Alimenta+
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                onPress={() =>
                  setMenuAberto(false)
                }
                style={styles.fechar}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={VERDE}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.lista}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {ATALHOS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navegar(item.id)}
                  style={styles.atalho}
                  accessibilityRole="button"
                >
                  <View style={styles.iconeAtalho}>
                    <Ionicons
                      name={item.icone}
                      size={24}
                      color={VERDE}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.tituloAtalho}>
                      {item.titulo}
                    </Text>

                    <Text style={styles.descricaoAtalho}>
                      {item.descricao}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#819283"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  camada: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },

  botaoHamburguer: {
    position: "absolute",
    right: 15,
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: FUNDO,
    borderWidth: 1,
    borderColor: "#DDE6D8",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    elevation: 3,
  },

  barraHamburguer: {
    width: 22,
    height: 3,
    borderRadius: 4,
    backgroundColor: VERDE,
  },

  barraInferior: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FUNDO,
    borderWidth: 1,
    borderColor: "#B7B7B7",
    flexDirection: "row",
    minHeight: 46,
  },

  aba: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },

  textoAba: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#111111",
  },

  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  painelModal: {
    width: "86%",
    maxWidth: 370,
    backgroundColor: FUNDO,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    paddingHorizontal: 17,
    paddingBottom: 25,
    elevation: 12,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 10,
  },

  titulo: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 25,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    color: "#657364",
    fontSize: 12,
    lineHeight: 19,
  },

  fechar: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#E9F5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  lista: {
    gap: 10,
    paddingBottom: 25,
  },

  atalho: {
    minHeight: 74,
    padding: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6E0",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  iconeAtalho: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#E9F5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  tituloAtalho: {
    fontSize: 14,
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
  },

  descricaoAtalho: {
    fontSize: 11,
    lineHeight: 17,
    color: "#6B746B",
  },
})