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

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  confirmPasswordReset,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from "firebase/auth";

import { auth } from "../firebase";

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FFFCF6";

function extrairCodigo(texto) {
  const valor = texto.trim();

  if (!valor) return "";

  try {
    const url = new URL(valor);
    return (
      url.searchParams.get("oobCode") ||
      url.searchParams.get("oob_code") ||
      ""
    );
  } catch {
    return valor;
  }
}

export default function TelaRecuperarSenha({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const largura = Math.min(width, 460);
  const compacto = height < 750;

  const [etapa, setEtapa] = useState(
    route?.params?.oobCode ? "senha" : "email"
  );
  const [email, setEmail] = useState(route?.params?.email || "");
  const [linkOuCodigo, setLinkOuCodigo] = useState(
    route?.params?.oobCode || ""
  );
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [concluido, setConcluido] = useState(false);

  function voltar() {
    if (etapa === "senha" && !route?.params?.oobCode) {
      setEtapa("email");
      setErro("");
      setAviso("");
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("TelaLogin");
    }
  }

  async function enviarInstrucoes() {
    const emailLimpo = email.trim().toLowerCase();
    setErro("");
    setAviso("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErro("Digite um e-mail válido.");
      return;
    }

    setOcupado(true);

    try {
      await sendPasswordResetEmail(auth, emailLimpo);
      setEnviado(true);
      setAviso(
        "Se o e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha."
      );
    } catch (e) {
      console.error("Erro ao solicitar redefinição de senha:", e);
      setErro(
        e.code === "auth/invalid-email"
          ? "Digite um e-mail válido."
          : "Não foi possível enviar as instruções. Tente novamente."
      );
    } finally {
      setOcupado(false);
    }
  }

  async function redefinirSenha() {
    setErro("");
    setAviso("");

    const codigo = extrairCodigo(linkOuCodigo);

    if (!codigo) {
      setErro("Cole o link completo ou o código recebido por e-mail.");
      return;
    }

    if (senha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setOcupado(true);

    try {
      await verifyPasswordResetCode(auth, codigo);
      await confirmPasswordReset(auth, codigo, senha);
      setConcluido(true);
      setAviso("Sua senha foi alterada. Agora você já pode entrar.");
    } catch (e) {
      console.error("Erro ao redefinir senha:", e);

      const mensagens = {
        "auth/expired-action-code":
          "Este link expirou. Solicite novas instruções.",
        "auth/invalid-action-code":
          "Este link é inválido ou já foi usado. Solicite novas instruções.",
        "auth/weak-password":
          "Escolha uma senha mais forte.",
        "auth/user-disabled":
          "Esta conta está desativada.",
        "auth/user-not-found":
          "Não foi possível localizar a conta deste link.",
      };

      setErro(
        mensagens[e.code] ||
          "Não foi possível redefinir a senha. Confira o link e tente novamente."
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.area}>
      <View style={[styles.painel, { width: largura }]}>
        <Image
          source={require("../assets/images/tabIcons/fundoCadastro.png")}
          resizeMode="cover"
          style={[styles.imagemFundo, { pointerEvents: "none" }]}
        />

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.conteudo,
                {
                  paddingTop: compacto ? 16 : 24,
                  paddingBottom: compacto ? 18 : 26,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.voltar}
                onPress={voltar}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="chevron-back" size={22} color={VERDE} />
              </TouchableOpacity>

              <Image
                source={require("../assets/images/tabIcons/logo.png")}
                resizeMode="contain"
                style={[
                  styles.logo,
                  { height: compacto ? 95 : 116 },
                ]}
                accessibilityLabel="Alimenta+"
              />

              <Text style={styles.titulo}>Esqueci minha senha</Text>

              <Text style={styles.subtitulo}>
                {etapa === "email"
                  ? "Não se preocupe! Informe seu e-mail e enviaremos instruções para redefinir sua senha."
                  : "Informe o link recebido por e-mail e escolha uma nova senha."}
              </Text>

              <Image
                source={require("../assets/images/tabIcons/onboarding4.png")}
                resizeMode="contain"
                style={styles.ilustracao}
                accessibilityLabel="Pessoa usando o celular"
              />

              <View style={styles.formulario}>
                {etapa === "email" ? (
                  <>
                    <Text style={styles.label}>E-mail cadastrado</Text>
                    <View style={styles.campo}>
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={VERDE}
                      />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Digite seu e-mail"
                        placeholderTextColor="#929F92"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                    </View>

                    {!!aviso && (
                      <Text style={styles.aviso}>{aviso}</Text>
                    )}

                    {!enviado && (
                      <TouchableOpacity
                        style={styles.botao}
                        onPress={enviarInstrucoes}
                        disabled={ocupado}
                      >
                        {ocupado ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.botaoTexto}>
                            ENVIAR INSTRUÇÕES
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {enviado && (
                      <TouchableOpacity
                        style={styles.botao}
                        onPress={() => {
                          setEtapa("senha");
                          setErro("");
                          setAviso("");
                        }}
                      >
                        <Text style={styles.botaoTexto}>
                          JÁ TENHO O LINK
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : concluido ? (
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => navigation.navigate("TelaLogin")}
                  >
                    <Text style={styles.botaoTexto}>
                      VOLTAR PARA O LOGIN
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.label}>
                      Link ou código de redefinição
                    </Text>
                    <View style={styles.campo}>
                      <Ionicons
                        name="link-outline"
                        size={18}
                        color={VERDE}
                      />
                      <TextInput
                        style={styles.input}
                        value={linkOuCodigo}
                        onChangeText={setLinkOuCodigo}
                        placeholder="Cole o link recebido por e-mail"
                        placeholderTextColor="#929F92"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <Text style={styles.label}>Nova senha</Text>
                    <View style={styles.campo}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={VERDE}
                      />
                      <TextInput
                        style={styles.input}
                        value={senha}
                        onChangeText={setSenha}
                        placeholder="Digite sua nova senha"
                        placeholderTextColor="#929F92"
                        secureTextEntry={!mostrarSenha}
                        autoCapitalize="none"
                        autoComplete="new-password"
                      />
                      <TouchableOpacity
                        onPress={() => setMostrarSenha(!mostrarSenha)}
                        accessibilityLabel={
                          mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        <Ionicons
                          name={
                            mostrarSenha
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={19}
                          color={VERDE}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.ajudaSenha}>
                      Mínimo de 8 caracteres.
                    </Text>

                    <Text style={styles.label}>Confirmar nova senha</Text>
                    <View style={styles.campo}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={VERDE}
                      />
                      <TextInput
                        style={styles.input}
                        value={confirmacao}
                        onChangeText={setConfirmacao}
                        placeholder="Confirme sua nova senha"
                        placeholderTextColor="#929F92"
                        secureTextEntry={!mostrarSenha}
                        autoCapitalize="none"
                        autoComplete="new-password"
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.botao}
                      onPress={redefinirSenha}
                      disabled={ocupado}
                    >
                      {ocupado ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.botaoTexto}>
                          ALTERAR SENHA
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {!!erro && (
                  <Text style={styles.erro} accessibilityRole="alert">
                    {erro}
                  </Text>
                )}
                {!!aviso && etapa === "senha" && (
                  <Text style={styles.aviso}>{aviso}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.link}
                onPress={() => navigation.navigate("TelaLogin")}
              >
                <Text style={styles.linkTexto}>
                  Lembrou sua senha?{" "}
                  <Text style={styles.linkForte}>
                    Voltar para o login
                  </Text>
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

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
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  voltar: {
    width: 36,
    height: 36,
    borderRadius: 19,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  logo: {
    width: "65%",
    alignSelf: "center",
    marginTop: 1,
  },
  titulo: {
    color: "#174D20",
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 2,
  },
  subtitulo: {
    color: "#666666",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 330,
    marginTop: 4,
  },
  ilustracao: {
    width: "56%",
    height: 132,
    marginTop: 2,
  },
  formulario: {
    width: "100%",
    maxWidth: 390,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,252,246,0.94)",
  },
  label: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 5,
  },
  campo: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#AFC99F",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    color: "#203126",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    paddingVertical: 8,
  },
  ajudaSenha: {
    color: "#777777",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: -7,
    marginBottom: 10,
  },
  botao: {
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: VERDE_BOTAO,
    marginTop: 4,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  erro: {
    color: "#B3261E",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 9,
  },
  aviso: {
    color: VERDE,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  link: {
    paddingVertical: 12,
    marginTop: "auto",
  },
  linkTexto: {
    color: "#667766",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  linkForte: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
});