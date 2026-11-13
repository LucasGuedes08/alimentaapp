import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  SafeAreaProvider,
} from "react-native-safe-area-context";

import {
  onIdTokenChanged,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";
import { ResponsiveProvider } from "./utils/responsive";
import NavegacaoGlobal from "./components/NavegacaoGlobal";

// ========================================
// TELAS DOS USUÁRIOS
// ========================================

import TelaSplash from "./Telas/TelaSplash";
import Onboarding from "./Telas/Onboarding";
import TelaCadastro from "./Telas/TelaCadastro";
import TelaLogin from "./Telas/TelaLogin";
import TelaHome from "./Telas/TelaHome";

import TelaMinhasDoacoes from "./Telas/TelaMinhasDoacoes";
import TelaDetalhesDoacao from "./Telas/TelaDetalhesDoacao";
import TelaDetalhesProduto from "./Telas/TelaDetalhesProduto";

import TelaCarrinhoDoacoes from "./Telas/TelaCarrinhoDoacoes";
import TelaSeuPedido from "./Telas/TelaSeuPedido";
import TelaConfirmacaoDoacaoSimulada from "./Telas/TelaConfirmacaoDoacaoSimulada";
import TelaDetalhesCobranca from "./Telas/TelaDetalhesCobranca";

import TelaPerfil from "./Telas/TelaPerfil";
import TelaEditarPerfil from "./Telas/TelaEditarPerfil";
import TelaConquistas from "./Telas/TelaConquistas";
import TelaCampanhas from "./Telas/TelaCampanhas";
import TelaEventos from "./Telas/TelaEventos";
import TelaDetalheCampanha from "./Telas/TelaDetalheCampanha";

import TelaNotificacoes from "./Telas/TelaNotificacoes";
import TelaAjudaSuporte from "./Telas/TelaAjudaSuporte";
import TelaSobreAlimenta from "./Telas/TelaSobreAlimenta";
import TelaConfiguracoes from "./Telas/TelaConfiguracoes";
import TelaRecuperarSenha from "./Telas/TelaRecuperarSenha";

// NOVA ROTA DOS CLIENTES
import TelaPerguntasFrequentes from "./Telas/TelaPerguntasFrequentes";

// ========================================
// TELAS ADMINISTRATIVAS
// ========================================

import TelaLoginAdmin from "./Telas/TelaLoginAdmin";
import TelaPainelAdmin from "./Telas/TelaPainelAdmin";
import TelaCadastroAdmin from "./Telas/TelaCadastroAdmin";

import TelaCampanhasAdmin from "./Telas/TelaCampanhasAdmin";
import TelaCriarCampanhaAdmin from "./Telas/TelaCriarCampanhaAdmin";
import TelaEditarCampanhaAdmin from "./Telas/TelaEditarCampanhaAdmin";
import TelaDoacoesAdmin from "./Telas/TelaDoacoesAdmin";

// ========================================
// CONFIGURAÇÃO
// ========================================

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const Stack = createNativeStackNavigator();

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: VERDE,
    background: FUNDO,
    card: FUNDO,
    text: "#253226",
    border: "transparent",
    notification: "#FF7827",
  },
};

// ========================================
// TRATAMENTO DE ERROS
// ========================================

class CapturarErroDeTela extends React.Component {
  state = {
    mensagem: "",
    detalhes: "",
  };

  static getDerivedStateFromError(error) {
    return {
      mensagem: error?.message || String(error),
    };
  }

  componentDidCatch(error, info) {
    console.error(
      "Erro ao renderizar o Alimenta+",
      error,
      info?.componentStack
    );

    this.setState({
      detalhes: info?.componentStack || "",
    });
  }

  render() {
    if (!this.state.mensagem) {
      return this.props.children;
    }

    return (
      <View style={styles.erroTela}>
        <Text style={styles.erroTitulo}>
          Não foi possível abrir esta tela
        </Text>

        <Text style={styles.erroTexto}>
          Fotografe esta mensagem para
          identificarmos o erro.
        </Text>

        <ScrollView style={styles.erroPainel}>
          <Text
            selectable
            style={styles.erroDetalhes}
          >
            {this.state.mensagem}
            {"\n\n"}
            {this.state.detalhes}
          </Text>
        </ScrollView>

        <Pressable
          style={styles.botao}
          onPress={() =>
            this.setState({
              mensagem: "",
              detalhes: "",
            })
          }
        >
          <Text style={styles.botaoTexto}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }
}

// ========================================
// APP PRINCIPAL
// ========================================

export default function App() {
  const [
    fontesCarregadas,
    erroFontes,
  ] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [sessao, setSessao] = useState({
    carregando: true,
    usuario: null,
    admin: false,
  });

  const [
    abrirLoginDireto,
    setAbrirLoginDireto,
  ] = useState(false);

  const [rotaAtual, setRotaAtual] =
    useState("Splash");

  const refNavegacao = useRef(null);
  const estavaLogado = useRef(false);
  const tentativaAdmin = useRef(false);

  // ======================================
  // AUTENTICAÇÃO FIREBASE
  // ======================================

  useEffect(() => {
    let ativo = true;
    let sequencia = 0;

    const cancelar = onIdTokenChanged(
      auth,

      async (conta) => {
        const chamada = ++sequencia;

        if (!conta) {
          if (estavaLogado.current) {
            setAbrirLoginDireto(true);
          }

          estavaLogado.current = false;
          tentativaAdmin.current = false;

          if (ativo && chamada === sequencia) {
            setSessao({
              carregando: false,
              usuario: null,
              admin: false,
            });
          }

          return;
        }

        try {
          const token =
            await conta.getIdTokenResult();

          if (!ativo || chamada !== sequencia) {
            return;
          }

          const ehAdmin =
            token.claims.admin === true;

          if (
            tentativaAdmin.current &&
            !ehAdmin
          ) {
            await signOut(auth);
            return;
          }

          estavaLogado.current = true;

          setSessao({
            carregando: false,
            usuario: conta,
            admin: ehAdmin,
          });
        } catch (erro) {
          console.error(
            "Falha ao verificar acesso:",
            erro
          );

          if (ativo && chamada === sequencia) {
            setSessao({
              carregando: false,
              usuario: null,
              admin: false,
            });
          }
        }
      },

      (erro) => {
        console.error(
          "Erro no Firebase Auth:",
          erro
        );

        if (ativo) {
          setSessao({
            carregando: false,
            usuario: null,
            admin: false,
          });
        }
      }
    );

    return () => {
      ativo = false;
      sequencia++;
      cancelar();
    };
  }, []);

  useEffect(() => {
    if (erroFontes) {
      console.error(
        "Erro ao carregar fontes:",
        erroFontes
      );
    }
  }, [erroFontes]);

  // ======================================
  // NAVEGAÇÃO
  // ======================================

  function atualizarRota() {
    const rota =
      refNavegacao.current
        ?.getCurrentRoute?.()?.name;

    if (rota) {
      setRotaAtual(rota);
    }
  }

  function abrirAreaAdmin() {
    if (!refNavegacao.current?.isReady?.()) {
      return;
    }

    tentativaAdmin.current = true;

    refNavegacao.current.navigate(
      "TelaLoginAdmin"
    );
  }

  function voltarLoginComum() {
    tentativaAdmin.current = false;

    if (refNavegacao.current?.isReady?.()) {
      refNavegacao.current.navigate(
        "TelaLogin"
      );
    }
  }

  // ======================================
  // CARREGAMENTO
  // ======================================

  if (
    sessao.carregando ||
    (!fontesCarregadas && !erroFontes)
  ) {
    return (
      <SafeAreaProvider>
        <View style={styles.carregando}>
          <ActivityIndicator
            size="large"
            color={VERDE}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  const autenticado = Boolean(sessao.usuario);

  const ehAdmin =
    autenticado && sessao.admin === true;

  const inicio = ehAdmin
    ? "TelaPainelAdmin"
    : autenticado
    ? "Home"
    : abrirLoginDireto
    ? "TelaLogin"
    : "Splash";

  const chaveStack = ehAdmin
    ? "admin"
    : autenticado
    ? "usuario"
    : abrirLoginDireto
    ? "login"
    : "entrada";

  const mostrarAreaAdmin =
    !autenticado &&
    rotaAtual === "TelaLogin";

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <StatusBar
          style="dark"
          backgroundColor={FUNDO}
        />

        <CapturarErroDeTela>
          <View style={styles.aplicativo}>
            <NavigationContainer
              ref={refNavegacao}
              theme={tema}
              onReady={atualizarRota}
              onStateChange={atualizarRota}
            >
              <Stack.Navigator
                key={chaveStack}
                initialRouteName={inicio}
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  contentStyle: {
                    backgroundColor: FUNDO,
                  },
                }}
              >
                {ehAdmin ? (
                  <>
                    {/* ÁREA ADMINISTRATIVA */}

                    <Stack.Screen
                      name="TelaPainelAdmin"
                      component={TelaPainelAdmin}
                    />

                    <Stack.Screen
                      name="TelaCadastroAdmin"
                      component={TelaCadastroAdmin}
                    />

                    <Stack.Screen
                      name="TelaCampanhasAdmin"
                      component={TelaCampanhasAdmin}
                    />

                    <Stack.Screen
                      name="TelaCriarCampanhaAdmin"
                      component={TelaCriarCampanhaAdmin}
                    />

                    <Stack.Screen
                      name="TelaEditarCampanhaAdmin"
                      component={TelaEditarCampanhaAdmin}
                    />

                    <Stack.Screen
                      name="TelaDoacoesAdmin"
                      component={TelaDoacoesAdmin}
                    />
                  </>
                ) : autenticado ? (
                  <>
                    {/* ÁREA DOS CLIENTES */}

                    <Stack.Screen
                      name="Home"
                      component={TelaHome}
                    />

                    <Stack.Screen
                      name="DetalhesCobranca"
                      component={TelaDetalhesCobranca}
                    />

                    <Stack.Screen
                      name="TelaSeuPedido"
                      component={TelaSeuPedido}
                    />
                    <Stack.Screen
                      name="TelaConfirmacaoDoacaoSimulada"
                      component={TelaConfirmacaoDoacaoSimulada}
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="TelaMinhasDoacoes"
                      component={TelaMinhasDoacoes}
                    />

                    <Stack.Screen
                      name="TelaDetalhesDoacao"
                      component={TelaDetalhesDoacao}
                    />

                    <Stack.Screen
                      name="TelaDetalhesProduto"
                      component={TelaDetalhesProduto}
                    />

                    <Stack.Screen
                      name="TelaCarrinhoDoacoes"
                      component={TelaCarrinhoDoacoes}
                    />

                    <Stack.Screen
                      name="TelaPerfil"
                      component={TelaPerfil}
                    />

                    <Stack.Screen
                      name="TelaEditarPerfil"
                      component={TelaEditarPerfil}
                    />

                    <Stack.Screen
                      name="TelaConquistas"
                      component={TelaConquistas}
                    />

                    <Stack.Screen
                      name="TelaCampanhas"
                      component={TelaCampanhas}
                    />

                    <Stack.Screen
                      name="TelaEventos"
                      component={TelaEventos}
                    />

                    <Stack.Screen
                      name="TelaDetalheCampanha"
                      component={TelaDetalheCampanha}
                    />

                    <Stack.Screen
                      name="TelaNotificacoes"
                      component={TelaNotificacoes}
                    />

                    <Stack.Screen
                      name="TelaAjudaSuporte"
                      component={TelaAjudaSuporte}
                    />

                    <Stack.Screen
                      name="TelaPerguntasFrequentes"
                      component={TelaPerguntasFrequentes}
                    />

                    <Stack.Screen
                      name="TelaSobreAlimenta"
                      component={TelaSobreAlimenta}
                    />

                    <Stack.Screen
                      name="TelaConfiguracoes"
                      component={TelaConfiguracoes}
                    />
                  </>
                ) : (
                  <>
                    {/* TELAS DE ACESSO */}

                    <Stack.Screen
                      name="Splash"
                      component={TelaSplash}
                      options={{
                        gestureEnabled: false,
                      }}
                    />

                    <Stack.Screen
                      name="Onboarding"
                      component={Onboarding}
                    />

                    <Stack.Screen
                      name="TelaCadastro"
                      component={TelaCadastro}
                    />

                    <Stack.Screen
                      name="TelaLogin"
                      component={TelaLogin}
                    />

                    <Stack.Screen
                      name="TelaRecuperarSenha"
                      component={TelaRecuperarSenha}
                    />

                    <Stack.Screen
                      name="DetalhesCobranca"
                      component={TelaDetalhesCobranca}
                    />

                    <Stack.Screen
                      name="TelaSeuPedido"
                      component={TelaSeuPedido}
                    />
                    <Stack.Screen
                      name="TelaConfirmacaoDoacaoSimulada"
                      component={TelaConfirmacaoDoacaoSimulada}
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen name="TelaLoginAdmin">
                      {(props) => (
                        <TelaLoginAdmin
                          {...props}
                          onVoltar={voltarLoginComum}
                        />
                      )}
                    </Stack.Screen>
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>

            {autenticado && !ehAdmin && (
              <NavegacaoGlobal
                navigationRef={refNavegacao}
                rotaAtual={rotaAtual}
              />
            )}

            {mostrarAreaAdmin && (
              <Pressable
                onPress={abrirAreaAdmin}
                style={styles.atalhoAdmin}
                accessibilityRole="button"
                accessibilityLabel="Abrir área administrativa"
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={VERDE}
                />

                <Text style={styles.atalhoTexto}>
                  Área administrativa
                </Text>
              </Pressable>
            )}
          </View>
        </CapturarErroDeTela>
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
}

// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({
  aplicativo: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  carregando: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: FUNDO,
  },

  atalhoAdmin: {
    position: "absolute",
    right: 14,
    bottom: 16,
    zIndex: 100,
    elevation: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#E9F5E4",
    borderWidth: 1,
    borderColor: "#C9E1C1",
    borderRadius: 22,
  },

  atalhoTexto: {
    fontFamily: "Poppins_600SemiBold",
    color: VERDE,
    fontSize: 12,
  },

  erroTela: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    backgroundColor: FUNDO,
  },

  erroTitulo: {
    fontWeight: "700",
    fontSize: 20,
    color: VERDE,
  },

  erroTexto: {
    fontSize: 13,
    marginVertical: 12,
    color: "#465A48",
  },

  erroPainel: {
    flexGrow: 0,
    maxHeight: 230,
    backgroundColor: "#FAE9E7",
    padding: 14,
    borderRadius: 12,
  },

  erroDetalhes: {
    color: "#8F2727",
    fontSize: 12,
    lineHeight: 19,
  },

  botao: {
    marginTop: 18,
    padding: 13,
    backgroundColor: VERDE,
    borderRadius: 10,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
})