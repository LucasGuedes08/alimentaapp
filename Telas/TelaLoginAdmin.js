import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

// ========================================
// CORES
// ========================================

const FUNDO = "#FFFCF6";
const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const CINZA = "#777777";

const CHAVE_EMAIL =
  "alimentamais:emailAdmin";

// ========================================
// LOGIN ADMINISTRATIVO
// ========================================

export default function TelaLoginAdmin({
  navigation,
  onVoltar,
}) {
  const { width, height } =
    useWindowDimensions();

  const largura = Math.min(width, 460);

  const compacto = height < 700;

  // ======================================
  // ESTADOS
  // ======================================

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    lembrar,
    setLembrar,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  // ======================================
  // CARREGAR E-MAIL
  // ======================================

  useEffect(() => {
    let ativo = true;

    async function carregarEmail() {
      try {
        const salvo =
          await AsyncStorage.getItem(
            CHAVE_EMAIL
          );

        if (ativo && salvo) {
          setEmail(salvo);
          setLembrar(true);
        }
      } catch (e) {
        console.warn(
          "Erro ao recuperar e-mail:",
          e
        );
      }
    }

    carregarEmail();

    return () => {
      ativo = false;
    };
  }, []);

  // ======================================
  // VOLTAR
  // ======================================

  function voltar() {
    if (typeof onVoltar === "function") {
      onVoltar();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("TelaLogin");
  }

  // ======================================
  // REALIZAR LOGIN
  // ======================================

  async function entrar() {
    if (carregando) return;

    setErro("");
    setAviso("");

    const endereco =
      email.trim().toLowerCase();

    if (!endereco || !senha) {
      setErro(
        "Informe seu e-mail e sua senha."
      );
      return;
    }

    setCarregando(true);

    try {
      const credencial =
        await signInWithEmailAndPassword(
          auth,
          endereco,
          senha
        );

      // CONSULTAR PERMISSÃO ADMINISTRATIVA

      const resultado =
        await credencial.user.getIdTokenResult(
          true
        );

      const ehAdmin =
        resultado.claims.admin === true;

      if (!ehAdmin) {
        await signOut(auth);

        setErro(
          "Esta conta não possui permissão de administrador."
        );

        return;
      }

      // SALVAR SOMENTE E-MAIL

      try {
        if (lembrar) {
          await AsyncStorage.setItem(
            CHAVE_EMAIL,
            endereco
          );
        } else {
          await AsyncStorage.removeItem(
            CHAVE_EMAIL
          );
        }
      } catch (e) {
        console.warn(
          "Erro ao salvar preferência:",
          e
        );
      }

      // O App.js detecta a conta admin
      // e abre TelaPainelAdmin.

    } catch (e) {
      console.error(
        "Erro no login administrativo:",
        e
      );

      const mensagens = {
        "auth/invalid-credential":
          "E-mail ou senha incorretos.",

        "auth/invalid-email":
          "Digite um e-mail válido.",

        "auth/user-disabled":
          "Esta conta está desativada.",

        "auth/too-many-requests":
          "Muitas tentativas. Tente novamente mais tarde.",

        "auth/network-request-failed":
          "Verifique sua conexão com a internet.",
      };

      setErro(
        mensagens[e.code] ||
          "Não foi possível entrar no painel."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ======================================
  // RECUPERAR SENHA
  // ======================================

  async function recuperarSenha() {
    if (carregando) return;

    setErro("");
    setAviso("");

    const endereco =
      email.trim().toLowerCase();

    if (!endereco) {
      setErro(
        "Digite seu e-mail para recuperar a senha."
      );
      return;
    }

    setCarregando(true);

    try {
      await sendPasswordResetEmail(
        auth,
        endereco
      );

      setAviso(
        "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação."
      );
    } catch (e) {
      console.error(
        "Erro ao recuperar senha:",
        e
      );

      setErro(
        "Não foi possível solicitar a recuperação."
      );
    } finally {
      setCarregando(false);
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
          styles.painel,
          {
            width: largura,
          },
        ]}
      >
        {/* ==================================
            FUNDO FIXO
        ================================== */}

        <Image
          pointerEvents="none"
          source={require(
            "../assets/images/tabIcons/fundoCadastro.png"
          )}
          resizeMode="stretch"
          style={styles.imagemFundo}
        />

        {/* ==================================
            CONTEÚDO
        ================================== */}

        <KeyboardAvoidingView
          style={styles.areaConteudo}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.conteudo,
              compacto &&
                styles.conteudoCompacto,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ==================================
                BOTÃO VOLTAR
            ================================== */}

            <TouchableOpacity
              style={styles.voltar}
              onPress={voltar}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color={VERDE}
              />

              <Text style={styles.voltarTexto}>
                Voltar
              </Text>
            </TouchableOpacity>

            {/* ==================================
                LOGO
            ================================== */}

            <View
              style={[
                styles.areaLogo,
                compacto &&
                  styles.areaLogoCompacta,
              ]}
            >
              <Image
                source={require(
                  "../assets/images/tabIcons/logo.png"
                )}
                resizeMode="contain"
                style={styles.logo}
                accessibilityLabel="Logo Alimenta+"
              />

              <Text style={styles.subtituloLogo}>
                Painel do administrador
              </Text>
            </View>

            {/* ==================================
                FORMULÁRIO
            ================================== */}

            <View style={styles.formulario}>
              {/* E-MAIL */}

              <Text style={styles.label}>
                E-mail
              </Text>

              <View style={styles.campo}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={VERDE}
                />

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!carregando}
                />
              </View>

              {/* SENHA */}

              <Text style={styles.labelSenha}>
                Senha
              </Text>

              <View style={styles.campo}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={VERDE}
                />

                <TextInput
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#999999"
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!carregando}
                />

                <TouchableOpacity
                  onPress={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                  accessibilityLabel={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  <Ionicons
                    name={
                      mostrarSenha
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={21}
                    color={VERDE}
                  />
                </TouchableOpacity>
              </View>

              {/* ==================================
                  LEMBRAR E RECUPERAR
              ================================== */}

              <View style={styles.linhaOpcoes}>
                <TouchableOpacity
                  style={styles.lembrar}
                  onPress={() =>
                    setLembrar(!lembrar)
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: lembrar,
                  }}
                >
                  <Ionicons
                    name={
                      lembrar
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={19}
                    color={VERDE_BOTAO}
                  />

                  <Text style={styles.lembrarTexto}>
                    Lembrar de mim
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={recuperarSenha}
                  disabled={carregando}
                >
                  <Text style={styles.esqueciTexto}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ==================================
                  MENSAGENS
              ================================== */}

              {!!erro && (
                <Text style={styles.erro}>
                  {erro}
                </Text>
              )}

              {!!aviso && (
                <Text style={styles.aviso}>
                  {aviso}
                </Text>
              )}

              {/* ==================================
                  BOTÃO ENTRAR
              ================================== */}

              <TouchableOpacity
                style={styles.botaoEntrar}
                onPress={entrar}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.entrarTexto}>
                    Entrar
                  </Text>
                )}
              </TouchableOpacity>

              {/* ==================================
                  RODAPÉ
              ================================== */}

              <Text style={styles.rodape}>
                Acesso exclusivo para administradores.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: "center",
    backgroundColor: FUNDO,
  },

  painel: {
    flex: 1,
    maxWidth: 460,
    overflow: "hidden",
    backgroundColor: FUNDO,
  },

  // ======================================
  // FUNDO FIXO AO TAMANHO DA TELA
  // ======================================

  imagemFundo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  areaConteudo: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 95,
  },

  conteudoCompacto: {
    paddingHorizontal: 25,
    paddingBottom: 70,
  },

  // ======================================
  // BOTÃO VOLTAR
  // ======================================

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    marginTop: 8,
    paddingVertical: 7,
    paddingRight: 12,
    minHeight: 39,
  },

  voltarTexto: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: VERDE,
  },

  // ======================================
  // LOGO
  // ======================================

  areaLogo: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 23,
  },

  areaLogoCompacta: {
    marginTop: 12,
    marginBottom: 15,
  },

  logo: {
    width: 235,
    height: 155,
  },

  subtituloLogo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#707070",
    textAlign: "center",
    marginTop: -10,
  },

  // ======================================
  // FORMULÁRIO
  // ======================================

  formulario: {
    marginTop: 2,
    width: "100%",
  },

  label: {
    fontFamily: "Poppins_700Bold",
    color: "#111111",
    fontSize: 14,
    marginBottom: 8,
  },

  labelSenha: {
    fontFamily: "Poppins_700Bold",
    color: "#111111",
    fontSize: 14,
    marginTop: 21,
    marginBottom: 8,
  },

  // ======================================
  // CAMPOS
  // ======================================

  campo: {
    height: 49,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7DED5",
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },

  // ======================================
  // LEMBRAR E ESQUECI SENHA
  // ======================================

  linhaOpcoes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 8,
  },

  lembrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  lembrarTexto: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#222222",
  },

  esqueciTexto: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: VERDE,
    textDecorationLine: "underline",
  },

  // ======================================
  // BOTÃO ENTRAR
  // ======================================

  botaoEntrar: {
    height: 49,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  entrarTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },

  // ======================================
  // RODAPÉ
  // ======================================

  rodape: {
    fontFamily: "Poppins_400Regular",
    color: CINZA,
    fontSize: 11,
    textAlign: "center",
    marginTop: 18,
  },

  erro: {
    color: "#BE2F2F",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 19,
  },

  aviso: {
    color: VERDE,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 19,
  },
});