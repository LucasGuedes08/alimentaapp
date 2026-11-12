import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const EMAIL_SUPORTE =
  "alimentamais-suporte@gmail.com";

// ========================================
// PERGUNTAS FREQUENTES
// ========================================

const PERGUNTAS = [
  {
    titulo:
      "Para onde vão os alimentos doados?",

    resposta:
      "O Alimenta+ conecta pessoas e estabelecimentos que desejam doar alimentos a quem precisa. A entrega ou retirada depende das informações e combinações feitas entre os envolvidos.",
  },
  {
    titulo:
      "Quais formas de pagamento são aceitas?",

    resposta:
      "As doações de alimentos disponíveis no Alimenta+ são gratuitas. As telas de pagamento presentes no protótipo não representam uma cobrança real.",
  },
  {
    titulo:
      "Posso fazer uma doação mensal automática?",

    resposta:
      "Atualmente, o aplicativo não possui agendamento automático de doações. Para contribuir novamente, é necessário realizar outro cadastro ou pedido.",
  },
  {
    titulo:
      "Como sei que o alimento realmente foi entregue?",

    resposta:
      "Você pode consultar os registros de suas contribuições no aplicativo. A confirmação definitiva da entrega dependerá da implementação e validação do acompanhamento de retiradas.",
  },
];

// ========================================
// TELA DOS CLIENTES
// ========================================

export default function TelaPerguntasFrequentes({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [abertas, setAbertas] =
    useState([]);

  const [mensagem, setMensagem] =
    useState("");

  // ======================================
  // ABRIR E FECHAR PERGUNTAS
  // ======================================

  function alternarPergunta(indice) {
    setAbertas((anteriores) =>
      anteriores.includes(indice)
        ? anteriores.filter(
            (item) => item !== indice
          )
        : [...anteriores, indice]
    );
  }

  // ======================================
  // ENVIAR E-MAIL
  // ======================================

  async function abrirEmail() {
    const assunto = encodeURIComponent(
      "Dúvida sobre o Alimenta+"
    );

    const corpo = encodeURIComponent(
      mensagem.trim()
    );

    const destino =
      `mailto:${EMAIL_SUPORTE}` +
      `?subject=${assunto}` +
      `&body=${corpo}`;

    try {
      await Linking.openURL(destino);
    } catch (erro) {
      console.error(
        "Erro ao abrir e-mail:",
        erro
      );

      Alert.alert(
        "Não foi possível abrir o e-mail",
        `Entre em contato pelo endereço ${EMAIL_SUPORTE}.`
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
            width: Math.min(width, 460),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}

          <View style={styles.topo}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate(
                      "TelaAjudaSuporte"
                    )
              }
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons
                name="chevron-back"
                size={25}
                color={VERDE}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Perguntas Frequentes
            </Text>
          </View>

          {/* PERGUNTAS */}

          <View style={styles.perguntas}>
            {PERGUNTAS.map(
              (pergunta, indice) => {
                const aberta =
                  abertas.includes(indice);

                return (
                  <View
                    key={indice}
                    style={styles.caixaPergunta}
                  >
                    <TouchableOpacity
                      style={styles.pergunta}
                      onPress={() =>
                        alternarPergunta(indice)
                      }
                      accessibilityRole="button"
                      accessibilityState={{
                        expanded: aberta,
                      }}
                    >
                      <Text
                        style={
                          styles.perguntaTexto
                        }
                      >
                        {pergunta.titulo}
                      </Text>

                      <Ionicons
                        name={
                          aberta
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={24}
                        color="#777777"
                      />
                    </TouchableOpacity>

                    {aberta && (
                      <Text style={styles.resposta}>
                        {pergunta.resposta}
                      </Text>
                    )}
                  </View>
                );
              }
            )}
          </View>

          {/* CENTRAL DE ATENDIMENTO */}

          <View style={styles.central}>
            <View style={styles.centralCabecalho}>
              <View style={styles.iconeCentral}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={42}
                  color={VERDE}
                />
              </View>

              <Text style={styles.centralTitulo}>
                Central de
                {"\n"}
                Atendimento
              </Text>
            </View>

            <Text style={styles.centralSubtitulo}>
              Como podemos te ajudar?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Escreva sua dúvida..."
              placeholderTextColor="#999999"
              value={mensagem}
              onChangeText={setMensagem}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            {/* CONTATO */}

            <TouchableOpacity
              style={styles.contato}
              onPress={abrirEmail}
              accessibilityRole="button"
              accessibilityLabel="Entrar em contato por e-mail"
            >
              <Ionicons
                name="mail-outline"
                size={31}
                color="#3F9D2C"
              />

              <Text style={styles.contatoTitulo}>
                Email
              </Text>

              <Text style={styles.contatoDesc}>
                {EMAIL_SUPORTE}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.rodape}>
            Alimenta+ — Estamos aqui para ajudar!
          </Text>
        </ScrollView>
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
    backgroundColor: FUNDO,
    alignItems: "center",
  },

  painel: {
    flex: 1,
    maxWidth: 460,
  },

  conteudo: {
    padding: 18,
    paddingBottom: 38,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  voltar: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: "#E8EEE0",
    justifyContent: "center",
    alignItems: "center",
  },

  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    flexShrink: 1,
  },

  perguntas: {
    marginTop: 25,
    marginHorizontal: 16,
    gap: 17,
  },

  caixaPergunta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 2,
  },

  pergunta: {
    minHeight: 59,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  perguntaTexto: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#626262",
  },

  resposta: {
    borderTopWidth: 1,
    borderColor: "#EEEEEE",
    padding: 13,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#505050",
  },

  central: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 25,
    padding: 17,
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 3,
  },

  centralCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  iconeCentral: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EDF5E7",
    alignItems: "center",
    justifyContent: "center",
  },

  centralTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: "#151515",
    lineHeight: 26,
  },

  centralSubtitulo: {
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    color: "#777777",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 10,
  },

  input: {
    minHeight: 50,
    maxHeight: 110,
    backgroundColor: "#FFFFFF",
    borderColor: "#DDDDDD",
    borderWidth: 1,
    borderRadius: 7,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  contato: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    gap: 4,
  },

  contatoTitulo: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#222222",
  },

  contatoDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#777777",
    textAlign: "center",
  },

  rodape: {
    marginTop: 30,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    color: "#389622",
    fontSize: 13,
  },
});