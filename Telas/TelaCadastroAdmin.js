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
  Share,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

import {
  app,
  auth,
} from "../firebase";

// ========================================
// CORES
// ========================================

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FFFCF6";
const BORDA = "#D9DED5";

// ========================================
// CONFIGURAÇÃO DO FIREBASE
// ========================================

// A região precisa ser a mesma
// configurada em functions/index.js.

const functions = getFunctions(
  app,
  "southamerica-east1"
);

const cadastrarAdministrador = httpsCallable(
  functions,
  "cadastrarAdministrador",
  {
    timeout: 25000,
  }
);

// ========================================
// FORMATAR CPF
// ========================================

function formatarCpf(valor) {
  const numeros = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

// ========================================
// VALIDAR CPF
// ========================================

function validarCpf(valor) {
  const cpf = String(valor || "")
    .replace(/\D/g, "");

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    return false;
  }

  for (let pos = 9; pos <= 10; pos++) {
    let soma = 0;

    for (let i = 0; i < pos; i++) {
      soma +=
        Number(cpf[i]) *
        (pos + 1 - i);
    }

    const digito = (soma * 10) % 11;

    if (
      (digito === 10 ? 0 : digito) !==
      Number(cpf[pos])
    ) {
      return false;
    }
  }

  return true;
}

// ========================================
// TRATAR ERROS DO FIREBASE
// ========================================

function mensagemErroFirebase(erro) {
  const codigo = erro?.code || "";

  if (
    codigo === "functions/not-found" ||
    codigo === "functions/unimplemented"
  ) {
    return (
      "A função cadastrarAdministrador não está " +
      "publicada no Firebase. Para cadastrar " +
      "diretamente pelo aplicativo, é necessário " +
      "publicar a Cloud Function no plano Blaze."
    );
  }

  if (
    codigo === "functions/unavailable" ||
    codigo === "functions/deadline-exceeded"
  ) {
    return (
      "Não foi possível acessar o servidor " +
      "administrativo. Verifique a conexão, " +
      "a região da função e se ela foi publicada."
    );
  }

  if (
    codigo === "functions/permission-denied"
  ) {
    return (
      "Sua conta não tem autorização para " +
      "cadastrar novos administradores."
    );
  }

  if (
    codigo === "functions/unauthenticated"
  ) {
    return (
      "Sua sessão expirou. Saia da conta " +
      "administrativa e entre novamente."
    );
  }

  if (
    codigo === "functions/already-exists"
  ) {
    return (
      "Já existe uma conta cadastrada " +
      "com esse e-mail."
    );
  }

  if (
    codigo === "functions/invalid-argument"
  ) {
    return (
      "O servidor recusou os dados. " +
      "Confira nome, e-mail, CPF e cargo."
    );
  }

  if (
    codigo === "functions/internal"
  ) {
    return (
      "O servidor encontrou um erro ao " +
      "processar o cadastro. Confira os " +
      "registros da Cloud Function no Firebase."
    );
  }

  if (
    codigo === "functions/unknown"
  ) {
    return (
      "A função administrativa não respondeu " +
      "corretamente. Confira se ela existe " +
      "e está publicada no Firebase."
    );
  }

  if (codigo === "auth/network-request-failed") {
    return (
      "Falha na conexão com o Firebase. " +
      "Confira sua internet."
    );
  }

  return (
    "Não foi possível cadastrar o administrador. " +
    "Confira a configuração do Firebase Functions."
  );
}

// ========================================
// COMPONENTE DE CAMPO
// ========================================

function Campo({
  titulo,
  valor,
  alterar,
  placeholder,
  teclado = "default",
  maxLength,
  editable = true,
  autoCapitalize = "words",
}) {
  return (
    <View style={styles.grupoCampo}>
      <Text style={styles.label}>
        {titulo}
      </Text>

      <TextInput
        style={styles.campo}
        value={valor}
        onChangeText={alterar}
        placeholder={placeholder}
        placeholderTextColor="#929292"
        keyboardType={teclado}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        editable={editable}
      />
    </View>
  );
}

// ========================================
// TELA DE CADASTRO ADMINISTRATIVO
// ========================================

export default function TelaCadastroAdmin({
  navigation,
}) {
  const { width, height } =
    useWindowDimensions();

  const largura = Math.min(width, 460);
  const compacto = height < 720;

  // ======================================
  // ESTADOS
  // ======================================

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [codigoErro, setCodigoErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [linkAtivacao, setLinkAtivacao] =
    useState("");

  // ======================================
  // LIMPAR MENSAGENS AO EDITAR
  // ======================================

  useEffect(() => {
    setErro("");
    setCodigoErro("");
    setSucesso("");
    setLinkAtivacao("");
  }, [nome, email, cpf, cargo]);

  // ======================================
  // CADASTRAR ADMINISTRADOR
  // ======================================

  async function cadastrar() {
    if (carregando) {
      return;
    }

    setErro("");
    setCodigoErro("");
    setSucesso("");
    setLinkAtivacao("");

    const dados = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      cpf: cpf.replace(/\D/g, ""),
      cargo: cargo.trim(),
    };

    // ====================================
    // VALIDAÇÃO
    // ====================================

    if (dados.nome.length < 3) {
      setErro(
        "Informe o nome completo do administrador."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        dados.email
      )
    ) {
      setErro(
        "Informe um e-mail válido."
      );
      return;
    }

    if (!validarCpf(dados.cpf)) {
      setErro(
        "Informe um CPF válido."
      );
      return;
    }

    if (dados.cargo.length < 2) {
      setErro(
        "Informe o cargo do administrador."
      );
      return;
    }

    // ====================================
    // CONSULTAR AUTENTICAÇÃO
    // ====================================

    setCarregando(true);

    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error(
          "Entre novamente na conta administrativa."
        );
      }

      const token =
        await usuario.getIdTokenResult(true);

      if (token.claims.admin !== true) {
        throw new Error(
          "Sua conta não possui a permissão admin no Firebase."
        );
      }

      // ==================================
      // CHAMAR CLOUD FUNCTION
      // ==================================

      // A criação de usuários e permissões
      // acontece no servidor.
      //
      // O aplicativo nunca atribui
      // permissões administrativas sozinho.

      const resultado =
        await cadastrarAdministrador(dados);

      if (
        resultado.data?.sucesso !== true
      ) {
        throw new Error(
          "O servidor não confirmou o cadastro."
        );
      }

      const link =
        resultado.data.linkAtivacao || "";

      // ==================================
      // CADASTRO CONFIRMADO
      // ==================================

      setSucesso(
        "Administrador cadastrado com sucesso! " +
        "Compartilhe o link de ativação " +
        "para que ele defina sua senha."
      );

      setLinkAtivacao(link);

      setNome("");
      setEmail("");
      setCpf("");
      setCargo("");
    } catch (e) {
      console.error(
        "Erro ao cadastrar administrador:",
        e.code || "",
        e.message || ""
      );

      setCodigoErro(e.code || "");

      if (e.code) {
        setErro(
          mensagemErroFirebase(e)
        );
      } else {
        setErro(
          e.message ||
            "Erro desconhecido ao cadastrar."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  // ======================================
  // COMPARTILHAR CONVITE
  // ======================================

  async function compartilharConvite() {
    if (!linkAtivacao) {
      return;
    }

    try {
      await Share.share({
        message:
          "Você recebeu um convite para " +
          "acessar a área administrativa " +
          "do Alimenta+.\n\n" +
          "Defina sua senha pelo link:\n" +
          linkAtivacao +
          "\n\nNão compartilhe este convite.",
      });
    } catch (e) {
      setErro(
        "Não foi possível abrir o compartilhamento. " +
        "Você pode selecionar e copiar o link abaixo."
      );
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
          source={require(
            "../assets/images/tabIcons/fundoCadastro.png"
          )}
          resizeMode="stretch"
          style={styles.imagemFundo}
          pointerEvents="none"
        />

        {/* ==================================
            CONTEÚDO ROLÁVEL
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
              compacto && {
                paddingTop: 4,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* VOLTAR */}

            <TouchableOpacity
              style={styles.voltar}
              onPress={() =>
                navigation.goBack()
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar ao painel"
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color={VERDE}
              />

              <Text style={styles.voltarTexto}>
                Painel
              </Text>
            </TouchableOpacity>

            {/* ==================================
                LOGO ALIMENTA+
            ================================== */}

            <View style={styles.areaLogo}>
              <Image
                source={require(
                  "../assets/images/tabIcons/logo.png"
                )}
                resizeMode="contain"
                style={styles.logo}
                accessibilityLabel="Logo Alimenta+"
              />

              <Text style={styles.subtitulo}>
                Cadastro de administradores
              </Text>
            </View>

            {/* ==================================
                FORMULÁRIO PROTEGIDO DO FUNDO
            ================================== */}

            <View style={styles.formulario}>
              <Text style={styles.tituloFormulario}>
                Novo administrador
              </Text>

              <Text style={styles.textoFormulario}>
                Preencha os dados para
                cadastrar um novo integrante
                da equipe.
              </Text>

              <Campo
                titulo="Nome completo"
                valor={nome}
                alterar={setNome}
                placeholder="Digite o nome completo"
                maxLength={100}
                editable={!carregando}
              />

              <Campo
                titulo="E-mail"
                valor={email}
                alterar={setEmail}
                placeholder="Digite seu e-mail"
                teclado="email-address"
                autoCapitalize="none"
                maxLength={150}
                editable={!carregando}
              />

              <Campo
                titulo="CPF"
                valor={cpf}
                alterar={(valor) =>
                  setCpf(
                    formatarCpf(valor)
                  )
                }
                placeholder="000.000.000-00"
                teclado="numeric"
                maxLength={14}
                editable={!carregando}
              />

              <Campo
                titulo="Cargo"
                valor={cargo}
                alterar={setCargo}
                placeholder="Digite o cargo"
                maxLength={80}
                editable={!carregando}
              />

              {/* ==================================
                  ERROS
              ================================== */}

              {!!erro && (
                <View style={styles.caixaErro}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#B3261E"
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.erroTexto}>
                      {erro}
                    </Text>

                    {!!codigoErro && (
                      <Text
                        style={styles.codigoErro}
                      >
                        Código: {codigoErro}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* ==================================
                  SUCESSO
              ================================== */}

              {!!sucesso && (
                <View style={styles.caixaSucesso}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color={VERDE}
                  />

                  <Text
                    style={styles.sucessoTexto}
                  >
                    {sucesso}
                  </Text>
                </View>
              )}

              {/* ==================================
                  BOTÃO CADASTRAR
              ================================== */}

              <TouchableOpacity
                style={[
                  styles.botaoCadastrar,
                  carregando &&
                    styles.botaoDesabilitado,
                ]}
                onPress={cadastrar}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.botaoCadastrarTexto
                    }
                  >
                    Cadastrar
                  </Text>
                )}
              </TouchableOpacity>

              {/* ==================================
                  LINK DE ATIVAÇÃO
              ================================== */}

              {!!linkAtivacao && (
                <View
                  style={styles.areaConvite}
                >
                  <Text
                    style={styles.conviteTitulo}
                  >
                    Link de ativação
                  </Text>

                  <Text
                    selectable
                    style={styles.conviteLink}
                  >
                    {linkAtivacao}
                  </Text>

                  {Platform.OS !== "web" && (
                    <TouchableOpacity
                      style={
                        styles.botaoCompartilhar
                      }
                      onPress={
                        compartilharConvite
                      }
                    >
                      <Ionicons
                        name="share-outline"
                        size={19}
                        color={VERDE}
                      />

                      <Text
                        style={
                          styles.compartilharTexto
                        }
                      >
                        Compartilhar convite
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ==================================
                RODAPÉ
            ================================== */}

            <Text style={styles.rodape}>
              Acesso exclusivo para
              administradores autorizados.
            </Text>
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
  // IMAGEM FIXA
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
    paddingHorizontal: 24,
    paddingBottom: 55,
  },

  // ======================================
  // VOLTAR
  // ======================================

  voltar: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    marginTop: 8,
    zIndex: 2,
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
    marginTop: 16,
    marginBottom: 18,
  },

  logo: {
    width: 245,
    height: 170,
  },

  subtitulo: {
    marginTop: -13,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#777777",
  },

  // ======================================
  // FORMULÁRIO
  // ======================================

  formulario: {
    backgroundColor: "rgba(255,252,246,0.97)",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(221,226,214,0.8)",
  },

  tituloFormulario: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 17,
  },

  textoFormulario: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#777777",
    marginTop: 3,
    marginBottom: 12,
  },

  grupoCampo: {
    marginBottom: 14,
  },

  label: {
    fontFamily: "Poppins_700Bold",
    color: "#222222",
    fontSize: 13,
    marginBottom: 7,
  },

  campo: {
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#222222",
  },

  // ======================================
  // BOTÃO
  // ======================================

  botaoCadastrar: {
    minHeight: 49,
    backgroundColor: VERDE_BOTAO,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  botaoDesabilitado: {
    opacity: 0.7,
  },

  botaoCadastrarTexto: {
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    fontSize: 15,
  },

  // ======================================
  // MENSAGENS
  // ======================================

  caixaErro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF0EE",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#F4D0CC",
    padding: 11,
    marginTop: 8,
  },

  erroTexto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#B3261E",
  },

  codigoErro: {
    fontSize: 10,
    color: "#8C5550",
    marginTop: 5,
  },

  caixaSucesso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#EAF4E6",
    borderRadius: 9,
    padding: 12,
    marginTop: 8,
  },

  sucessoTexto: {
    flex: 1,
    color: VERDE,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 19,
  },

  // ======================================
  // CONVITE
  // ======================================

  areaConvite: {
    marginTop: 16,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#EEF5EA",
  },

  conviteTitulo: {
    fontFamily: "Poppins_600SemiBold",
    color: VERDE,
    fontSize: 13,
  },

  conviteLink: {
    fontSize: 11,
    lineHeight: 18,
    color: "#365C3B",
    marginTop: 7,
  },

  botaoCompartilhar: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: VERDE,
    borderRadius: 8,
    minHeight: 43,
  },

  compartilharTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: VERDE,
  },

  rodape: {
    fontFamily: "Poppins_400Regular",
    color: "#777777",
    fontSize: 11,
    textAlign: "center",
    marginTop: 18,
  },
});