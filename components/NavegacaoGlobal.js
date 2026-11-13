import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const ABAS = [
  { id: "inicio", nome: "Início", icone: "home-outline" },
  { id: "buscar", nome: "Buscar", icone: "search-outline" },
  { id: "eventos", nome: "Eventos", icone: "map-outline" },
  { id: "doar", nome: "Doe Agora", icone: "heart-outline" },
  { id: "perfil", nome: "Perfil", icone: "person-outline" },
];

const OPCOES_MENU = [
  { id: "inicio", nome: "Início", icone: "home-outline" },
  { id: "buscar", nome: "Buscar alimentos", icone: "search-outline" },
  { id: "campanhas", nome: "Campanhas", icone: "heart-outline" },
  { id: "minhas", nome: "Minhas doações", icone: "gift-outline" },
  { id: "carrinho", nome: "Carrinho de doações", icone: "cart-outline" },
  { id: "perfil", nome: "Meu perfil", icone: "person-outline" },
];

const ROTAS_SEM_ABA = new Set([
  "TelaDetalhesProduto",
  "TelaDetalheCampanha",
  "TelaCarrinhoDoacoes",
  "DetalhesCobranca",
  "TelaSeuPedido",
  "TelaConfirmacaoDoacaoSimulada",
]);

export default function NavegacaoGlobal({
  navigationRef,
  rotaAtual,
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progresso = useRef(new Animated.Value(0)).current;
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  const larguraMenu = Math.min(width * 0.86, 370);
  const usuario = auth.currentUser;
  const nome =
    usuario?.displayName?.trim() ||
    usuario?.email?.split("@")[0] ||
    "Usuário";

  useEffect(() => {
    const mostrar = Keyboard.addListener("keyboardDidShow", () =>
      setTecladoAberto(true)
    );
    const ocultar = Keyboard.addListener("keyboardDidHide", () =>
      setTecladoAberto(false)
    );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  useEffect(() => {
    if (menuAberto) {
      setModalVisivel(true);
    }

    Animated.timing(progresso, {
      toValue: menuAberto ? 1 : 0,
      duration: 230,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished && !menuAberto) {
        setModalVisivel(false);
      }
    });
  }, [menuAberto, progresso]);

  function fecharMenu() {
    setMenuAberto(false);
  }

  function navegar(destino) {
    fecharMenu();
    setErroSair("");

    const nav = navigationRef.current;
    if (!nav?.isReady?.()) return;

    if (destino === "inicio" || destino === "buscar") {
      setAbaAtiva(destino);
      nav.navigate("Home", { abrirAba: destino });
      return;
    }

    const rotas = {
      campanhas: ["TelaCampanhas", "doar"],
      minhas: ["TelaMinhasDoacoes", "inicio"],
      carrinho: ["TelaCarrinhoDoacoes", "inicio"],
      perfil: ["TelaPerfil", "perfil"],
      eventos: ["TelaEventos", "eventos"],
      doar: ["TelaCampanhas", "doar"],
    };
    const destinoConfigurado = rotas[destino];

    if (destinoConfigurado) {
      setAbaAtiva(destinoConfigurado[1]);
      nav.navigate(destinoConfigurado[0]);
    }
  }

  async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);
    setErroSair("");

    try {
      await signOut(auth);
      fecharMenu();
    } catch (erro) {
      console.error("Erro ao sair da conta pelo menu:", erro);
      setErroSair("Não foi possível sair da conta. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  }

  const abaSelecionada =
    rotaAtual === "TelaPerfil" ||
    rotaAtual === "TelaEditarPerfil" ||
    rotaAtual === "TelaConquistas"
      ? "perfil"
      : rotaAtual === "TelaCampanhas" ||
        rotaAtual === "TelaDetalheCampanha"
      ? "doar"
      : rotaAtual === "TelaEventos"
      ? "eventos"
      : rotaAtual === "TelaMinhasDoacoes" ||
        rotaAtual === "TelaDetalhesDoacao"
      ? "inicio"
      : rotaAtual === "Home"
      ? abaAtiva
      : "inicio";

  const mostrarAbas =
    !tecladoAberto && !ROTAS_SEM_ABA.has(rotaAtual);

  const opacidadeFundo = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const deslocamentoMenu = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [-larguraMenu, 0],
  });

  return (
    <>
      <View pointerEvents="box-none" style={styles.camada}>
        {rotaAtual === "Home" && (
          <Pressable
            onPress={() => setMenuAberto(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            style={[
              styles.botaoMenu,
              {
                top: insets.top + 13,
                left: Math.max(18, (width - 460) / 2 + 18),
              },
            ]}
          >
            <View style={styles.linhaMenu} />
            <View style={styles.linhaMenu} />
            <View style={styles.linhaMenu} />
          </Pressable>
        )}

        {mostrarAbas && (
          <View
            style={[
              styles.barraInferior,
              {
                left: Math.max(0, (width - 460) / 2),
                right: Math.max(0, (width - 460) / 2),
                paddingBottom: insets.bottom,
                minHeight: 52 + insets.bottom,
              },
            ]}
          >
            {ABAS.map((aba) => (
              <Pressable
                key={aba.id}
                onPress={() => navegar(aba.id)}
                accessibilityRole="button"
                accessibilityLabel={aba.nome}
                accessibilityState={{
                  selected: abaSelecionada === aba.id,
                }}
                style={styles.aba}
              >
                <Ionicons
                  name={aba.icone}
                  size={23}
                  color={abaSelecionada === aba.id ? VERDE : "#111111"}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={[
                    styles.textoAba,
                    abaSelecionada === aba.id && styles.textoAbaAtiva,
                  ]}
                >
                  {aba.nome}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={fecharMenu}
      >
        <View style={styles.fundoModal}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.sombraModal,
              { opacity: opacidadeFundo },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={fecharMenu}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.painelMenu,
              {
                width: larguraMenu,
                paddingTop: insets.top + 14,
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateX: deslocamentoMenu }],
              },
            ]}
          >
            <View style={styles.cabecalhoMenu}>
              <View style={styles.avatar}>
                {usuario?.photoURL ? (
                  <Image
                    source={{ uri: usuario.photoURL }}
                    style={styles.fotoPerfil}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={30}
                    color={VERDE}
                  />
                )}
              </View>

              <View style={styles.dadosUsuario}>
                <Text numberOfLines={1} style={styles.nomeUsuario}>
                  Olá, {nome}
                </Text>
                <Text style={styles.boasVindas}>
                  Bem-vindo(a) ao Alimenta+
                </Text>
              </View>

              <Pressable
                onPress={fecharMenu}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                style={styles.botaoFechar}
              >
                <Ionicons name="close" size={23} color={VERDE} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.listaMenu}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {OPCOES_MENU.map((opcao) => (
                <Pressable
                  key={opcao.id}
                  onPress={() => navegar(opcao.id)}
                  accessibilityRole="button"
                  style={styles.opcaoMenu}
                >
                  <Ionicons
                    name={opcao.icone}
                    size={22}
                    color={VERDE}
                  />
                  <Text style={styles.textoOpcao}>{opcao.nome}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#879487"
                  />
                </Pressable>
              ))}

              <View style={styles.divisor} />

              <Pressable
                onPress={sairDaConta}
                disabled={saindo}
                accessibilityRole="button"
                style={styles.opcaoMenu}
              >
                {saindo ? (
                  <ActivityIndicator size="small" color={VERDE} />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={VERDE}
                  />
                )}
                <Text style={styles.textoOpcao}>Sair da conta</Text>
              </Pressable>

              {!!erroSair && (
                <Text accessibilityRole="alert" style={styles.erroSair}>
                  {erroSair}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
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
  botaoMenu: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#E9F2E3",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  linhaMenu: {
    width: 19,
    height: 2.5,
    borderRadius: 3,
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
  },
  aba: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  textoAba: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#111111",
  },
  textoAbaAtiva: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
  },
  fundoModal: {
    flex: 1,
    flexDirection: "row",
  },
  sombraModal: {
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  painelMenu: {
    height: "100%",
    backgroundColor: FUNDO,
    paddingHorizontal: 17,
    elevation: 12,
  },
  cabecalhoMenu: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: "#E9F2E3",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fotoPerfil: {
    width: "100%",
    height: "100%",
  },
  dadosUsuario: {
    flex: 1,
    minWidth: 0,
  },
  nomeUsuario: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 15,
  },
  boasVindas: {
    fontFamily: "Poppins_400Regular",
    color: "#647260",
    fontSize: 11,
    marginTop: 1,
  },
  botaoFechar: {
    width: 34,
    height: 34,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  listaMenu: {
    paddingBottom: 18,
    gap: 5,
  },
  opcaoMenu: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  textoOpcao: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    color: "#29352B",
    fontSize: 13,
  },
  divisor: {
    height: 1,
    backgroundColor: "#D8E0D4",
    marginVertical: 10,
    marginHorizontal: 10,
  },
  erroSair: {
    color: "#B3261E",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginHorizontal: 12,
    marginTop: 4,
  },
});
