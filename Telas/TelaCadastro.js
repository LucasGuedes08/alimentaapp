
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

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "../firebase";

// ========================================
// CORES DO ALIMENTA+
// ========================================

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FEFEF8";

// ========================================
// CAMPO DO FORMULÁRIO
// ========================================

function Campo({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  reveal = false,
  onReveal,
  keyboardType = "default",
  autoCapitalize = "none",
  maxLength = 100,
}) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#899589"
          secureTextEntry={secure && !reveal}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
        />

        {secure && (
          <TouchableOpacity
            onPress={onReveal}
            accessibilityLabel={
              reveal
                ? "Ocultar senha"
                : "Mostrar senha"
            }
          >
            <Ionicons
              name={
                reveal
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={20}
              color={VERDE}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ========================================
// TELA DE CADASTRO
// ========================================

export default function TelaCadastro({
  navigation,
}) {
  const { width, height } =
    useWindowDimensions();

  const largura = Math.min(width, 460);
  const compacto = height < 750;

  // DADOS DO CADASTRO
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");

  // CONTROLE DA INTERFACE
  const [mostrar, setMostrar] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  // ======================================
  // CADASTRAR USUÁRIO NO FIREBASE
  // ======================================

  async function cadastrar() {
    if (ocupado) return;

    setErro("");

    const nomeLimpo = nome.trim();
    const emailLimpo =
      email.trim().toLowerCase();

    if (
      !nomeLimpo ||
      !emailLimpo ||
      !senha ||
      !confirmar
    ) {
      setErro(
        "Preencha nome, e-mail e as duas senhas."
      );
      return;
    }

    if (nomeLimpo.length < 2) {
      setErro("Informe um nome válido.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailLimpo
      )
    ) {
      setErro("Digite um e-mail válido.");
      return;
    }

    if (
      cpf.trim() &&
      cpf.replace(/\D/g, "").length !== 11
    ) {
      setErro(
        "Se informar CPF, digite 11 números."
      );
      return;
    }

    if (senha.length < 6) {
      setErro(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (!aceitou) {
      setErro(
        "Aceite os termos para continuar."
      );
      return;
    }

    setOcupado(true);

    try {
      // CRIAR CONTA
      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          emailLimpo,
          senha
        );

      // SALVAR NOME NO FIREBASE AUTH
      await updateProfile(credencial.user, {
        displayName: nomeLimpo,
      });

      // APP.JS RECONHECE A AUTENTICAÇÃO
      // E DIRECIONA PARA A HOME.
    } catch (e) {
      console.error(
        "Erro ao cadastrar:",
        e
      );

      const mensagens = {
        "auth/email-already-in-use":
          "Este e-mail já está cadastrado.",

        "auth/invalid-email":
          "Digite um e-mail válido.",

        "auth/weak-password":
          "Escolha uma senha mais forte.",

        "auth/network-request-failed":
          "Verifique sua conexão com a internet.",

        "auth/invalid-api-key":
          "Confira a configuração do Firebase.",
      };

      setErro(
        mensagens[e.code] ||
          "Não foi possível criar sua conta."
      );
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
          { width: largura },
        ]}
      >
        {/* FUNDO ORIGINAL, SEM DEFORMAÇÃO */}
        <Image
          pointerEvents="none"
          source={require(
            "../assets/images/tabIcons/fundoCadastro.png"
          )}
          resizeMode="cover"
          style={styles.imagemFundo}
        />

        {/* CONTEÚDO POR CIMA DO FUNDO */}
        <SafeAreaView
          style={styles.areaSegura}
          edges={["top", "bottom"]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[
                styles.rolagem,
                {
                  paddingTop: compacto ? 18 : 28,
                  paddingBottom: compacto ? 16 : 28,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formulario}>
                {/* VOLTAR */}
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

                {/* LOGO ORIGINAL */}
                <Image
                  source={require(
                    "../assets/images/tabIcons/logo.png"
                  )}
                  resizeMode="contain"
                  style={[
                    styles.logo,
                    {
                      height: compacto ? 95 : 125,
                    },
                  ]}
                  accessibilityLabel="Alimenta+"
                />

                {/* TÍTULO */}
                <Text style={styles.titulo}>
                  Crie sua conta
                </Text>

                <Text style={styles.subtitulo}>
                  Preencha os dados abaixo para
                  {"\n"}
                  começar a fazer a diferença.
                </Text>

                {/* NOME */}
                <Campo
                  label="Nome completo"
                  value={nome}
                  onChange={setNome}
                  placeholder="Digite seu nome completo"
                  autoCapitalize="words"
                />

                {/* E-MAIL */}
                <Campo
                  label="E-mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                />

                {/* CPF */}
                <Campo
                  label="CPF (opcional)"
                  value={cpf}
                  onChange={setCpf}
                  placeholder="Digite seu CPF"
                  keyboardType="number-pad"
                  maxLength={14}
                />

                {/* SENHA */}
                <Campo
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  placeholder="Crie uma senha"
                  secure
                  reveal={mostrar}
                  onReveal={() =>
                    setMostrar(!mostrar)
                  }
                />

                {/* CONFIRMAR SENHA */}
                <Campo
                  label="Confirmar senha"
                  value={confirmar}
                  onChange={setConfirmar}
                  placeholder="Confirme sua senha"
                  secure
                  reveal={mostrar}
                  onReveal={() =>
                    setMostrar(!mostrar)
                  }
                />

                {/* ACEITE DOS TERMOS */}
                <TouchableOpacity
                  style={styles.termos}
                  onPress={() =>
                    setAceitou(!aceitou)
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: aceitou,
                  }}
                >
                  <Ionicons
                    name={
                      aceitou
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={21}
                    color={VERDE_BOTAO}
                  />

                  <Text style={styles.termosTexto}>
                    Li e concordo com os Termos de Uso
                    e a Política de Privacidade.
                  </Text>
                </TouchableOpacity>

                {/* ERROS */}
                {!!erro && (
                  <Text style={styles.erro}>
                    {erro}
                  </Text>
                )}

                {/* CRIAR CONTA */}
                <TouchableOpacity
                  style={styles.botao}
                  onPress={cadastrar}
                  disabled={ocupado}
                >
                  {ocupado ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.botaoTexto}>
                      CRIAR CONTA
                    </Text>
                  )}
                </TouchableOpacity>

                {/* IR PARA LOGIN */}
                <TouchableOpacity
                  style={styles.link}
                  onPress={() =>
                    navigation.navigate(
                      "TelaLogin"
                    )
                  }
                >
                  <Text style={styles.linkTexto}>
                    Já possui uma conta?{" "}
                    <Text style={styles.linkForte}>
                      Fazer login ›
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
    padding: 18,
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
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  logo: {
    width: "85%",
    alignSelf: "center",
    backgroundColor: "transparent",
  },

  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    fontSize: 23,
    marginTop: 6,
  },

  subtitulo: {
    color: "#647264",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 18,
  },

  grupo: {
    marginBottom: 12,
  },

  label: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 5,
  },

  campo: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3E0CF",
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    color: "#192C1F",
    fontSize: 13,
  },

  termos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 15,
  },

  termosTexto: {
    flex: 1,
    color: "#3E5441",
    fontSize: 11,
    lineHeight: 17,
  },

  botao: {
    minHeight: 47,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },

  link: {
    alignSelf: "center",
    paddingVertical: 13,
  },

  linkTexto: {
    color: "#536755",
    fontSize: 11,
  },

  linkForte: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
  },

  erro: {
    color: "#B3261E",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 12,
  },
});
