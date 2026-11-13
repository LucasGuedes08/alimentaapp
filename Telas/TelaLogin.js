import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Svg, { Path } from "react-native-svg";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../firebase";

// ========================================
// CORES DO ALIMENTA+
// ========================================

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FEFEF8";

// ========================================
// LOGOTIPO OFICIAL DO GOOGLE
// ========================================

function LogoGoogle({ size = 22 }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
    >
      {/* VERMELHO */}

      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />

      {/* AZUL */}

      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.79 7.18l7.73 6C44.39 38.03 46.98 31.88 46.98 24.55z"
      />

      {/* AMARELO */}

      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />

      {/* VERDE */}

      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.88-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.15 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

// ========================================
// TELA DE LOGIN
// ========================================

export default function TelaLogin({
  navigation,
}) {
  const { width, height } =
    useWindowDimensions();

  const largura = Math.min(width, 460);
  const compacto = height < 750;

  // ======================================
  // CAMPOS
  // ======================================

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // ======================================
  // INTERFACE
  // ======================================

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [ocupado, setOcupado] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [aviso, setAviso] =
    useState("");

  // ======================================
  // ENTRAR COM E-MAIL E SENHA
  // ======================================

  async function entrar() {
    if (ocupado) return;

    setErro("");
    setAviso("");

    const emailLimpo =
      email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      setErro(
        "Digite seu e-mail e sua senha."
      );

      return;
    }

    setOcupado(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

      // O App.js detecta o login
      // e direciona para a Home.
    } catch (e) {
      console.error(
        "Erro no login:",
        e
      );

      const mensagens = {
        "auth/invalid-credential":
          "E-mail ou senha incorretos.",

        "auth/invalid-email":
          "Digite um e-mail válido.",

        "auth/user-disabled":
          "Esta conta está desativada.",

        "auth/network-request-failed":
          "Verifique sua conexão com a internet.",

        "auth/invalid-api-key":
          "Não foi possível conectar. Tente novamente mais tarde.",
      };

      setErro(
        mensagens[e.code] ||
          "Não foi possível entrar. Verifique seus dados."
      );
    } finally {
      setOcupado(false);
    }
  }

  // ======================================
  // LOGIN COM GOOGLE NA WEB
  // ======================================

  async function entrarGoogle() {
    setErro("");
    setAviso("");

    if (Platform.OS !== "web") {
      setAviso(
        "O login com Google ainda não está configurado no Android."
      );

      return;
    }

    if (ocupado) return;

    setOcupado(true);

    try {
      const provedor =
        new GoogleAuthProvider();

      await signInWithPopup(
        auth,
        provedor
      );
    } catch (e) {
      console.error(
        "Erro no login Google:",
        e
      );

      if (
        e.code !==
        "auth/popup-closed-by-user"
      ) {
        setErro(
          "Não foi possível entrar com o Google."
        );
      }
    } finally {
      setOcupado(false);
    }
  }

  // ======================================
  // VOLTAR
  // ======================================

  function voltar() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Onboarding");
    }
  }

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <View style={styles.area}>
      <View
        style={[
          styles.painel,
          {
            width: largura,
          },
        ]}
      >
        {/* FUNDO DECORATIVO ORIGINAL */}

        <Image
          source={require(
            "../assets/images/tabIcons/fundoCadastro.png"
          )}
          resizeMode="cover"
          style={styles.imagemFundo}
          pointerEvents="none"
        />

        {/* CONTEÚDO POR CIMA DO FUNDO */}

        <SafeAreaView
          style={styles.areaSegura}
          edges={["top", "bottom"]}
        >
          <KeyboardAvoidingView
            style={{
              flex: 1,
            }}
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
          >
            <ScrollView
              style={{
                flex: 1,
              }}
              contentContainerStyle={[
                styles.rolagem,
                {
                  paddingTop:
                    compacto ? 20 : 30,

                  paddingBottom:
                    compacto ? 20 : 30,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formulario}>
                {/* ==================================
                    VOLTAR
                ================================== */}

                <TouchableOpacity
                  style={styles.voltar}
                  onPress={voltar}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={VERDE}
                  />

                  <Text style={styles.voltarTexto}>
                    Voltar
                  </Text>
                </TouchableOpacity>

                {/* ==================================
                    LOGO ALIMENTA+
                ================================== */}

                <Image
                  source={require(
                    "../assets/images/tabIcons/logo.png"
                  )}
                  resizeMode="contain"
                  style={[
                    styles.logo,
                    {
                      height:
                        compacto ? 125 : 160,
                    },
                  ]}
                  accessibilityLabel="Alimenta+"
                />

                {/* ==================================
                    TÍTULO
                ================================== */}

                <Text style={styles.titulo}>
                  Bem-vindo de volta!
                </Text>

                <Text style={styles.subtitulo}>
                  Entre para encontrar alimentos
                  {"\n"}
                  e fazer a diferença.
                </Text>

                {/* ==================================
                    E-MAIL
                ================================== */}

                <Text style={styles.label}>
                  E-mail
                </Text>

                <View style={styles.campo}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={VERDE}
                  />

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Seu e-mail"
                    placeholderTextColor="#929F92"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>

                {/* ==================================
                    SENHA
                ================================== */}

                <Text style={styles.label}>
                  Senha
                </Text>

                <View style={styles.campo}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={VERDE}
                  />

                  <TextInput
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    placeholder="Sua senha"
                    placeholderTextColor="#929F92"
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
                      size={20}
                      color={VERDE}
                    />
                  </TouchableOpacity>
                </View>

                {/* ==================================
                    RECUPERAR SENHA
                ================================== */}

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "TelaRecuperarSenha",
                      {
                        email:
                          email
                            .trim()
                            .toLowerCase(),
                      }
                    )
                  }
                  style={styles.esqueci}
                >
                  <Text style={styles.esqueciTexto}>
                    Esqueceu a senha?
                  </Text>
                </TouchableOpacity>

                {/* ==================================
                    MENSAGENS DE ERRO
                ================================== */}

                {!!erro && (
                  <Text style={styles.erro}>
                    {erro}
                  </Text>
                )}

                {/* ==================================
                    AVISOS
                ================================== */}

                {!!aviso && (
                  <Text style={styles.aviso}>
                    {aviso}
                  </Text>
                )}

                {/* ==================================
                    BOTÃO ENTRAR
                ================================== */}

                <TouchableOpacity
                  style={styles.botao}
                  onPress={entrar}
                  disabled={ocupado}
                >
                  {ocupado ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.botaoTexto}>
                      ENTRAR
                    </Text>
                  )}
                </TouchableOpacity>

                {/* ==================================
                    BOTÃO OFICIAL DO GOOGLE
                ================================== */}

                {Platform.OS === "web" && (
                  <TouchableOpacity
                    style={styles.google}
                    onPress={entrarGoogle}
                    disabled={ocupado}
                    accessibilityRole="button"
                    accessibilityLabel="Entrar com Google"
                  >
                    <LogoGoogle size={22} />

                    <Text style={styles.googleTexto}>
                      Entrar com Google
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ==================================
                    CRIAR CONTA
                ================================== */}

                <TouchableOpacity
                  style={styles.link}
                  onPress={() =>
                    navigation.navigate(
                      "TelaCadastro"
                    )
                  }
                >
                  <Text style={styles.linkTexto}>
                    Não possui conta?{" "}
                    <Text style={styles.linkForte}>
                      Criar nova conta ›
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({
  area: {
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

  imagemFundo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  areaSegura: {
    flex: 1,
    backgroundColor: "transparent",
  },

  rolagem: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  formulario: {
    width: "100%",
    maxWidth: 420,
    padding: 21,
    borderRadius: 18,
    backgroundColor: "transparent",
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    paddingVertical: 6,
  },

  voltarTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  logo: {
    width: "85%",
    alignSelf: "center",
    backgroundColor: "transparent",
  },

  titulo: {
    color: VERDE,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 23,
    marginTop: 6,
  },

  subtitulo: {
    color: "#667766",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 22,
  },

  label: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 6,
  },

  campo: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFDEC9",
    borderRadius: 10,
    marginBottom: 17,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    color: "#203126",
    fontSize: 13,
  },

  esqueci: {
    alignSelf: "flex-end",
    paddingBottom: 18,
  },

  esqueciTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
    fontSize: 12,
  },

  botao: {
    height: 48,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },

  // ======================================
  // BOTÃO GOOGLE
  // ======================================

  google: {
    marginTop: 12,
    height: 47,
    borderWidth: 1,
    borderColor: "#BED3BA",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  googleTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  link: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 8,
  },

  linkTexto: {
    color: "#546B57",
    fontSize: 12,
  },

  linkForte: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
  },

  erro: {
    color: "#B3261E",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 11,
  },

  aviso: {
    color: VERDE,
    textAlign: "center",
    fontSize: 12,
    marginBottom: 11,
  },
});