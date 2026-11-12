import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  Image,
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
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";

import {
  lerPerfilLocal,
} from "../utils/perfilLocal";

import {
  useEstatisticasUsuario,
} from "../utils/estatisticasUsuario";

// ========================================
// CORES DO ALIMENTA+
// ========================================

const VERDE = "#006838";
const FUNDO = "#FFFCF6";
const VERMELHO = "#E33D3D";

// ========================================
// OPÇÕES DO PERFIL
// ========================================

const OPCOES = [
  {
    nome: "Editar perfil",
    icone: "person-outline",
    destino: "TelaEditarPerfil",
  },
  {
    nome: "Minhas conquistas",
    icone: "trophy-outline",
    destino: "TelaConquistas",
  },
  {
    nome: "Minhas doações",
    icone: "gift-outline",
    destino: "TelaMinhasDoacoes",
  },
  {
    nome: "Notificações",
    icone: "notifications-outline",
    destino: "TelaNotificacoes",
  },
  {
    nome: "Ajuda e suporte",
    icone: "help-circle-outline",
    destino: "TelaAjudaSuporte",
  },
  {
    nome: "Sobre o Alimenta+",
    icone: "information-circle-outline",
    destino: "TelaSobreAlimenta",
  },
  {
    nome: "Sair da conta",
    icone: "log-out-outline",
    destino: "sair",
  },
];

// ========================================
// TELA PRINCIPAL DE PERFIL
// ========================================

export default function TelaPerfil({ navigation }) {
  const { width } = useWindowDimensions();

  const largura = Math.min(width, 460);

  const [fotoUri, setFotoUri] = useState(null);

  const [nome, setNome] = useState(
    auth.currentUser?.displayName || "Usuário"
  );

  // MODAL
  const [modal, setModal] = useState(null);

  // CONTROLE DE LOGOUT
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  // ESTATÍSTICAS
  const {
    total,
    conquistas,
    carregando,
    erro,
  } = useEstatisticasUsuario();

  const email =
    auth.currentUser?.email ||
    "E-mail não informado";

  // ======================================
  // ATUALIZAR PERFIL AO VOLTAR
  // ======================================

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const usuario = auth.currentUser;

      setNome(
        usuario?.displayName?.trim() ||
        usuario?.email?.split("@")[0] ||
        "Usuário"
      );

      lerPerfilLocal(usuario?.uid)
        .then((dados) => {
          if (ativo) {
            setFotoUri(dados.fotoUri || null);
          }
        })
        .catch((e) => {
          console.error(
            "Erro ao carregar foto:",
            e
          );
        });

      return () => {
        ativo = false;
      };
    }, [])
  );

  // ======================================
  // ABRIR OPÇÕES
  // ======================================

  function acionar(destino) {
    if (saindo) return;

    setErroSair("");

    // SAIR DA CONTA
    if (destino === "sair") {
      setModal("sair");
      return;
    }

    navigation.navigate(destino);
  }

  // ======================================
  // REALIZAR LOGOUT NO FIREBASE
  // ======================================

  async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);
    setErroSair("");

    try {
      await signOut(auth);

      // O App.js já possui onAuthStateChanged.
      // Ele detectará que o usuário saiu
      // e abrirá a tela de Login.

      setModal(null);
    } catch (e) {
      console.error(
        "Erro ao sair da conta:",
        e
      );

      setErroSair(
        "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  }

  // ======================================
  // CONTEÚDO DO MODAL
  // ======================================

  const informacoes = {
    titulo: "Sair da conta?",
    descricao:
      "Tem certeza de que deseja sair do Alimenta+? Seus dados e suas doações continuarão salvos.",
    icone: "log-out-outline",
  };

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
        <ScrollView
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}
          <View style={styles.topo}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Home");
                }
              }}
            >
              <Ionicons
                name="chevron-back"
                size={25}
                color={VERDE}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Meu perfil
            </Text>

            <TouchableOpacity
              style={styles.configuracoes}
              onPress={() =>
                navigation.navigate("TelaConfiguracoes")
              }
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
            >
              <Ionicons
                name="settings-outline"
                size={21}
                color={VERDE}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>
            Gerencie suas informações
          </Text>

          {/* FOTO E DADOS */}
          <View style={styles.usuario}>
            {fotoUri ? (
              <Image
                source={{ uri: fotoUri }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarVazio}>
                <Ionicons
                  name="person"
                  size={74}
                  color="#FFFFFF"
                />
              </View>
            )}

            <Text style={styles.nome}>
              {nome}
            </Text>

            <Text style={styles.email}>
              {email}
            </Text>
          </View>

          {/* INDICADORES */}
          <View style={styles.indicadores}>
            <View style={styles.indicador}>
              {carregando ? (
                <ActivityIndicator
                  color={VERDE}
                />
              ) : (
                <Text style={styles.numero}>
                  {total}
                </Text>
              )}

              <Text style={styles.rotulo}>
                Doações
              </Text>
            </View>

            <View style={styles.indicador}>
              <Text style={styles.numero}>
                —
              </Text>

              <Text style={styles.rotulo}>
                Pontos
              </Text>
            </View>

            <TouchableOpacity
              style={styles.indicador}
              onPress={() =>
                acionar("TelaConquistas")
              }
            >
              <Text style={styles.numero}>
                {conquistas}
              </Text>

              <Text style={styles.rotulo}>
                Conquistas
              </Text>
            </TouchableOpacity>
          </View>

          {!!erro && (
            <Text style={styles.aviso}>
              {erro}
            </Text>
          )}

          {/* OPÇÕES DO PERFIL */}
          <View style={styles.acoes}>
            {OPCOES.map((item) => {
              const ehSair =
                item.destino === "sair";

              return (
                <TouchableOpacity
                  key={item.nome}
                  style={styles.acao}
                  onPress={() =>
                    acionar(item.destino)
                  }
                  disabled={saindo}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icone}
                    size={24}
                    color={
                      ehSair
                        ? VERMELHO
                        : "#535A53"
                    }
                  />

                  <Text
                    style={[
                      styles.acaoTexto,
                      ehSair && {
                        color: VERMELHO,
                      },
                    ]}
                  >
                    {item.nome}
                  </Text>

                  {!ehSair && (
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color="#929892"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.nota}>
            As doações e conquistas são calculadas
            a partir dos registros da sua conta.
          </Text>
        </ScrollView>
      </View>

      {/* ==================================
          MODAL DE CONFIRMAÇÃO
      ================================== */}

      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saindo) {
            setModal(null);
          }
        }}
      >
        <View style={styles.modalFundo}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              if (!saindo) {
                setModal(null);
              }
            }}
          />

          <View style={styles.modalCaixa}>
            {/* ÍCONE */}
            <View style={styles.modalIcone}>
              <Ionicons
                name={informacoes.icone}
                size={29}
                color={VERDE}
              />
            </View>

            {/* TÍTULO */}
            <Text style={styles.modalTitulo}>
              {informacoes.titulo}
            </Text>

            {/* DESCRIÇÃO */}
            <Text style={styles.modalDescricao}>
              {informacoes.descricao}
            </Text>

            {/* ERRO NO LOGOUT */}
            {!!erroSair && (
              <Text style={styles.modalErro}>
                {erroSair}
              </Text>
            )}

            {modal === "sair" ? (
              <View style={styles.modalAcoes}>
                {/* CANCELAR */}
                <TouchableOpacity
                  style={styles.botaoCancelar}
                  onPress={() =>
                    setModal(null)
                  }
                  disabled={saindo}
                >
                  <Text style={styles.textoCancelar}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                {/* CONFIRMAR LOGOUT */}
                <TouchableOpacity
                  style={styles.botaoConfirmar}
                  onPress={sairDaConta}
                  disabled={saindo}
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
            ) : (
              <TouchableOpacity
                style={styles.botaoEntendi}
                onPress={() =>
                  setModal(null)
                }
              >
                <Text style={styles.textoEntendi}>
                  Entendi
                </Text>
              </TouchableOpacity>
            )}
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
    padding: 19,
    paddingBottom: 30,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 0,
  },

  voltar: {
    width: 40,
    height: 40,
    borderRadius: 21,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },

  configuracoes: {
    width: 40,
    height: 40,
    borderRadius: 21,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },

  titulo: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 22,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    color: "#666666",
    fontSize: 17,
    marginTop: 7,
    marginLeft: 5,
  },

  usuario: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },

  avatarVazio: {
    width: 118,
    height: 118,
    borderRadius: 65,
    backgroundColor: "#CECECE",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatar: {
    width: 118,
    height: 118,
    borderRadius: 65,
  },

  nome: {
    fontFamily: "Poppins_700Bold",
    color: "#131313",
    fontSize: 21,
    marginTop: 8,
  },

  email: {
    fontFamily: "Poppins_400Regular",
    color: "#222222",
    fontSize: 14,
    marginTop: -4,
  },

  indicadores: {
    flexDirection: "row",
    gap: 11,
    marginTop: 4,
  },

  indicador: {
    flex: 1,
    height: 93,
    borderWidth: 1,
    borderColor: "#C6D2C0",
    borderRadius: 14,
    backgroundColor: "#F4FBF1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  numero: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 25,
  },

  rotulo: {
    fontFamily: "Poppins_400Regular",
    color: "#555555",
    fontSize: 13,
  },

  acoes: {
    marginTop: 19,
    gap: 10,
  },

  acao: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 49,
    paddingHorizontal: 14,
    gap: 13,
    borderColor: "#D7D7D7",
    borderWidth: 1,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  acaoTexto: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    color: "#666666",
    fontSize: 16,
  },

  aviso: {
    color: "#BC3434",
    textAlign: "center",
    marginTop: 9,
  },

  nota: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    color: "#818181",
    marginTop: 17,
  },

  // MODAL
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
    padding: 23,
    backgroundColor: FUNDO,
    borderRadius: 19,
    alignItems: "center",
    elevation: 8,
  },

  modalIcone: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: "#E6F0DF",
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
    color: VERMELHO,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },

  modalAcoes: {
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  textoCancelar: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },

  botaoConfirmar: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: VERMELHO,
    alignItems: "center",
    justifyContent: "center",
  },

  textoConfirmar: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },

  botaoEntendi: {
    width: "100%",
    minHeight: 45,
    marginTop: 21,
    backgroundColor: VERDE,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  textoEntendi: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
})