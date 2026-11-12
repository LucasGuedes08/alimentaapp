import React, { useState } from "react";

import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";

// ========================================
// CORES DO ALIMENTA+
// ========================================

const VERDE = "#006838";
const FUNDO = "#FFFCF6";
const VERDE_CLARO = "#E8F1E0";
const VERMELHO = "#FF4141";

// ========================================
// OPÇÕES DE CONFIGURAÇÕES
// ========================================

const OPCOES = [
  {
    titulo: "Minha conta",
    icone: "person-outline",
    destino: "TelaPerfil",
  },
  {
    titulo: "Notificações",
    icone: "notifications-outline",
    destino: "TelaNotificacoes",
  },
  {
    titulo: "Ajuda e suporte",
    icone: "help-circle-outline",
    destino: "TelaAjudaSuporte",
  },
  {
    titulo: "Sobre o Alimenta+",
    icone: "information-circle-outline",
    destino: "TelaSobreAlimenta",
  },
  {
    titulo: "Sair da conta",
    icone: "log-out-outline",
    destino: "sair",
  },
];

// ========================================
// TELA DE CONFIGURAÇÕES
// ========================================

export default function TelaConfiguracoes({
  navigation,
}) {
  const { width, height } = useWindowDimensions();

  const largura = Math.min(width, 460);
  const compacto = height < 700;

  const [modalSair, setModalSair] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  // ======================================
  // NAVEGAÇÃO
  // ======================================

  function voltar() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  }

  function abrirOpcao(destino) {
    if (saindo) return;

    if (destino === "sair") {
      setErroSair("");
      setModalSair(true);
      return;
    }

    navigation.navigate(destino);
  }

  // ======================================
  // SAIR DA CONTA
  // ======================================

  async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);
    setErroSair("");

    try {
      await signOut(auth);

      // O App.js identifica a saída
      // através do onAuthStateChanged.

      setModalSair(false);
    } catch (erro) {
      console.error(
        "Erro ao sair da conta:",
        erro
      );

      setErroSair(
        "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  }

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.tela,
          { width: largura },
        ]}
      >
        {/* FUNDO DECORATIVO */}

        <ImageBackground
          source={require(
            "../assets/images/tabIcons/fundoConfig.png"
          )}
          resizeMode="stretch"
          style={styles.fundo}
        >
          <ScrollView
            contentContainerStyle={styles.conteudo}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ==================================
                CABEÇALHO
            ================================== */}

            <View style={styles.cabecalho}>
              <TouchableOpacity
                style={styles.botaoVoltar}
                onPress={voltar}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons
                  name="chevron-back"
                  size={27}
                  color={VERDE}
                />
              </TouchableOpacity>
            </View>

            {/* ==================================
                LOGO AMPLIADA E CENTRALIZADA
            ================================== */}

            <View
              style={[
                styles.areaLogo,
                compacto && styles.areaLogoCompacta,
              ]}
            >
              <Image
                source={require(
                  "../assets/images/tabIcons/logo.png"
                )}
                resizeMode="contain"
                style={[
                  styles.logo,
                  {
                    width: Math.min(
                      largura * 0.88,
                      345
                    ),
                  },
                  compacto && styles.logoCompacta,
                ]}
                accessibilityLabel="Logo Alimenta+"
              />
            </View>

            {/* ==================================
                BOTÕES MAIORES E CENTRALIZADOS
            ================================== */}

            <View style={styles.listaOpcoes}>
              {OPCOES.map((opcao) => {
                const ehSair =
                  opcao.destino === "sair";

                return (
                  <TouchableOpacity
                    key={opcao.destino}
                    style={styles.botaoOpcao}
                    onPress={() =>
                      abrirOpcao(opcao.destino)
                    }
                    disabled={saindo}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={opcao.titulo}
                  >
                    {/* ÍCONE */}

                    <View style={styles.areaIcone}>
                      <Ionicons
                        name={opcao.icone}
                        size={23}
                        color={
                          ehSair
                            ? VERMELHO
                            : "#777777"
                        }
                      />
                    </View>

                    {/* TEXTO */}

                    <Text
                      style={[
                        styles.textoOpcao,
                        ehSair && styles.textoSair,
                      ]}
                    >
                      {opcao.titulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </ImageBackground>
      </View>

      {/* ==================================
          CONFIRMAÇÃO DE LOGOUT
      ================================== */}

      <Modal
        visible={modalSair}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saindo) {
            setModalSair(false);
          }
        }}
      >
        <View style={styles.modalFundo}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              if (!saindo) {
                setModalSair(false);
              }
            }}
          />

          <View style={styles.modalCaixa}>
            {/* ÍCONE */}

            <View style={styles.modalIcone}>
              <Ionicons
                name="log-out-outline"
                size={30}
                color={VERDE}
              />
            </View>

            {/* TÍTULO */}

            <Text style={styles.modalTitulo}>
              Sair da conta?
            </Text>

            {/* DESCRIÇÃO */}

            <Text style={styles.modalDescricao}>
              Tem certeza de que deseja sair do
              Alimenta+? Seus dados e suas
              doações continuarão salvos.
            </Text>

            {/* ERRO */}

            {!!erroSair && (
              <Text style={styles.modalErro}>
                {erroSair}
              </Text>
            )}

            {/* BOTÕES DO MODAL */}

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={() =>
                  setModalSair(false)
                }
                disabled={saindo}
                activeOpacity={0.8}
              >
                <Text style={styles.textoCancelar}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoConfirmar}
                onPress={sairDaConta}
                disabled={saindo}
                activeOpacity={0.8}
              >
                {saindo ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.textoConfirmar}>
                    Sim, sair
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({
  // ======================================
  // ESTRUTURA PRINCIPAL
  // ======================================

  safe: {
    flex: 1,
    backgroundColor: FUNDO,
    alignItems: "center",
  },

  tela: {
    flex: 1,
    maxWidth: 460,
    overflow: "hidden",
    backgroundColor: FUNDO,
  },

  fundo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  conteudo: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 45,
  },

  // ======================================
  // CABEÇALHO
  // ======================================

  cabecalho: {
    width: "100%",
    height: 53,
    paddingHorizontal: 17,
    paddingTop: 8,
    justifyContent: "center",
  },

  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: VERDE_CLARO,
    alignItems: "center",
    justifyContent: "center",
  },

  // ======================================
  // LOGO MAIOR
  // ======================================

  areaLogo: {
    width: "100%",
    height: 205,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -5,
  },

  areaLogoCompacta: {
    height: 180,
  },

  logo: {
    height: 220,
    alignSelf: "center",
  },

  logoCompacta: {
    height: 195,
  },

  // ======================================
  // LISTA DE BOTÕES CENTRALIZADA
  // ======================================

  listaOpcoes: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 10,
  },

  // ======================================
  // BOTÕES MAIS GROSSOS
  // ======================================

  botaoOpcao: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.23,
    shadowRadius: 3,
    elevation: 4,
  },

  areaIcone: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  textoOpcao: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#555555",
  },

  textoSair: {
    color: VERMELHO,
  },

  // ======================================
  // MODAL DE LOGOUT
  // ======================================

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCaixa: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: FUNDO,
    borderRadius: 19,
    padding: 23,
    alignItems: "center",
    elevation: 8,
  },

  modalIcone: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: VERDE_CLARO,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  modalTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: VERDE,
    textAlign: "center",
  },

  modalDescricao: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#666666",
    textAlign: "center",
    marginTop: 9,
  },

  modalErro: {
    color: "#E33D3D",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },

  // ======================================
  // BOTÕES DO MODAL
  // ======================================

  modalBotoes: {
    width: "100%",
    flexDirection: "row",
    gap: 11,
    marginTop: 23,
  },

  botaoCancelar: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBD1B4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  textoCancelar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: VERDE,
  },

  botaoConfirmar: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#E33D3D",
    alignItems: "center",
    justifyContent: "center",
  },

  textoConfirmar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});