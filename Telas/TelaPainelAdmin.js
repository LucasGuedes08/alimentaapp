import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { auth } from "../firebase";
import { db } from "../firebaseDb";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

// ========================================
// IDENTIFICAR STATUS DA DOAÇÃO
// ========================================

function estadoDoacao(valor) {
  const status = String(
    valor || ""
  ).toLowerCase();

  if (
    status.includes("conclu") ||
    status.includes("entreg")
  ) {
    return "Concluída";
  }

  if (status.includes("cancel")) {
    return "Cancelada";
  }

  return "Em andamento";
}

// ========================================
// MENU ADMINISTRATIVO
// ========================================

const OPCOES_MENU = [
  {
    titulo: "Dashboard",
    descricao: "Visão geral do Alimenta+",
    icone: "grid-outline",
    rota: null,
  },
  {
    titulo: "Campanhas",
    descricao: "Gerenciar campanhas",
    icone: "megaphone-outline",
    rota: "TelaCampanhasAdmin",
  },
  {
    titulo: "Criar campanha",
    descricao: "Cadastrar nova campanha",
    icone: "add-circle-outline",
    rota: "TelaCriarCampanhaAdmin",
  },
  {
    titulo: "Doações",
    descricao: "Acompanhar as contribuições",
    icone: "gift-outline",
    rota: "TelaDoacoesAdmin",
  },
  {
    titulo: "Cadastrar administrador",
    descricao: "Gerenciar acessos",
    icone: "person-add-outline",
    rota: "TelaCadastroAdmin",
  },
];

// ========================================
// DASHBOARD ADMINISTRATIVO
// ========================================

export default function TelaPainelAdmin({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false);

  const [campanhas, setCampanhas] =
    useState(null);

  const [doacoes, setDoacoes] =
    useState(null);

  const [
    erroCampanhas,
    setErroCampanhas,
  ] = useState("");

  const [
    erroDoacoes,
    setErroDoacoes,
  ] = useState("");

  const [saindo, setSaindo] =
    useState(false);

  // ======================================
  // CONSULTAR CAMPANHAS
  // ======================================

  useEffect(() => {
    const cancelarCampanhas = onSnapshot(
      collection(db, "campanhas"),

      (resultado) => {
        const lista = resultado.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        );

        setCampanhas(lista);
        setErroCampanhas("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar campanhas:",
          erro
        );

        setErroCampanhas(
          erro.code === "permission-denied"
            ? "Sem permissão para consultar campanhas. Verifique as regras publicadas."
            : "Não foi possível carregar as campanhas."
        );
      }
    );

    const cancelarDoacoes = onSnapshot(
      collection(db, "minhasDoacoes"),

      (resultado) => {
        const lista = resultado.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        );

        setDoacoes(lista);
        setErroDoacoes("");
      },

      (erro) => {
        console.error(
          "Erro ao consultar doações:",
          erro
        );

        setErroDoacoes(
          erro.code === "permission-denied"
            ? "Sem permissão para consultar doações. Verifique as regras publicadas e a permissão admin."
            : "Não foi possível carregar as doações."
        );
      }
    );

    return () => {
      cancelarCampanhas();
      cancelarDoacoes();
    };
  }, []);

  // ======================================
  // ESTATÍSTICAS REAIS
  // ======================================

  const estatisticas = useMemo(() => {
    const listaCampanhas = campanhas || [];
    const listaDoacoes = doacoes || [];

    const campanhasAtivas =
      listaCampanhas.filter(
        (item) =>
          item.status === "Ativa" &&
          item.exemplo !== true
      ).length;

    const concluidas =
      listaDoacoes.filter(
        (item) =>
          estadoDoacao(item.status) ===
          "Concluída"
      ).length;

    const emAndamento =
      listaDoacoes.filter(
        (item) =>
          estadoDoacao(item.status) ===
          "Em andamento"
      ).length;

    return {
      campanhas:
        campanhas === null
          ? "—"
          : campanhasAtivas,

      doacoes:
        doacoes === null
          ? "—"
          : listaDoacoes.length,

      concluidas:
        doacoes === null
          ? "—"
          : concluidas,

      emAndamento:
        doacoes === null
          ? "—"
          : emAndamento,
    };
  }, [campanhas, doacoes]);

  // ======================================
  // NAVEGAÇÃO DO MENU
  // ======================================

  function abrirTela(rota) {
    setMenuAberto(false);

    if (rota) {
      navigation.navigate(rota);
    }
  }

  // ======================================
  // SAIR DA CONTA
  // ======================================

  async function sair() {
    if (saindo) return;

    setMenuAberto(false);
    setSaindo(true);

    try {
      await signOut(auth);
    } catch (erro) {
      console.error(
        "Erro ao sair do painel:",
        erro
      );

      setSaindo(false);

      Alert.alert(
        "Erro",
        "Não foi possível sair da conta."
      );
    }
  }

  // ======================================
  // ATALHOS PRINCIPAIS
  // ======================================

  const atalhos = [
    {
      titulo: "Campanhas",
      descricao:
        "Gerencie as campanhas cadastradas",
      icone: "megaphone-outline",
      rota: "TelaCampanhasAdmin",
    },
    {
      titulo: "Doações",
      descricao:
        "Consulte as doações registradas",
      icone: "gift-outline",
      rota: "TelaDoacoesAdmin",
    },
    {
      titulo: "Cadastrar administrador",
      descricao:
        "Convide integrantes autorizados",
      icone: "person-add-outline",
      rota: "TelaCadastroAdmin",
    },
  ];

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
          contentContainerStyle={
            styles.conteudo
          }
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}

          <View style={styles.topo}>
            <TouchableOpacity
              style={styles.botaoTopo}
              onPress={sair}
              disabled={saindo}
              accessibilityLabel="Sair do painel"
            >
              {saindo ? (
                <ActivityIndicator
                  size="small"
                  color={VERDE}
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={23}
                  color={VERDE}
                />
              )}
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Dashboard
            </Text>

            {/* MENU HAMBÚRGUER CORRIGIDO */}

            <TouchableOpacity
              style={styles.botaoTopo}
              onPress={() =>
                setMenuAberto(true)
              }
              accessibilityRole="button"
              accessibilityLabel="Abrir menu administrativo"
            >
              <Ionicons
                name="menu"
                size={25}
                color={VERDE}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>
            Bem-vindo(a) de volta,
            Administrador!
          </Text>

          {/* INDICADORES */}

          <View style={styles.metricas}>
            <View style={styles.metrica}>
              <Text
                style={styles.metricaLabel}
              >
                Campanhas
                {"\n"}
                ativas
              </Text>

              <Text
                style={styles.metricaNumero}
              >
                {estatisticas.campanhas}
              </Text>
            </View>

            <View style={styles.metrica}>
              <Text
                style={styles.metricaLabel}
              >
                Doações
                {"\n"}
                registradas
              </Text>

              <Text
                style={styles.metricaNumero}
              >
                {estatisticas.doacoes}
              </Text>
            </View>

            <View style={styles.metrica}>
              <Text
                style={styles.metricaLabel}
              >
                Doações
                {"\n"}
                concluídas
              </Text>

              <Text
                style={styles.metricaNumero}
              >
                {estatisticas.concluidas}
              </Text>
            </View>
          </View>

          {/* ACOMPANHAMENTO */}

          <View style={styles.impacto}>
            <Text
              style={styles.impactoTitulo}
            >
              Acompanhamento de entregas
            </Text>

            <Text
              style={styles.impactoNumero}
            >
              {estatisticas.emAndamento}
            </Text>

            <Text
              style={styles.impactoDesc}
            >
              Doações em andamento nos
              registros do aplicativo
            </Text>
          </View>

          {/* AÇÕES RÁPIDAS */}

          <Text style={styles.secao}>
            Ações rápidas
          </Text>

          <TouchableOpacity
            style={styles.criarCampanha}
            onPress={() =>
              abrirTela(
                "TelaCriarCampanhaAdmin"
              )
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={35}
              color="#FFFFFF"
            />

            <Text style={styles.criarTexto}>
              Criar campanha
            </Text>
          </TouchableOpacity>

          {/* ATALHOS */}

          {atalhos.map((item) => (
            <TouchableOpacity
              key={item.rota}
              style={styles.atalho}
              onPress={() =>
                abrirTela(item.rota)
              }
            >
              <View style={styles.icone}>
                <Ionicons
                  name={item.icone}
                  size={23}
                  color={VERDE}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={styles.atalhoTitulo}
                >
                  {item.titulo}
                </Text>

                <Text
                  style={styles.atalhoDesc}
                >
                  {item.descricao}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={VERDE}
              />
            </TouchableOpacity>
          ))}

          {/* ERROS */}

          {!!erroCampanhas && (
            <Text style={styles.erro}>
              {erroCampanhas}
            </Text>
          )}

          {!!erroDoacoes && (
            <Text style={styles.erro}>
              {erroDoacoes}
            </Text>
          )}

          <Text style={styles.nota}>
            Os indicadores usam dados reais
            do Firestore. Exemplos visuais
            não são contabilizados.
          </Text>
        </ScrollView>

        {/* ==================================
            MODAL DO MENU ADMINISTRATIVO
        ================================== */}

        <Modal
          visible={menuAberto}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setMenuAberto(false)
          }
        >
          <View style={styles.modalFundo}>
            {/* FECHAR TOCANDO FORA */}

            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() =>
                setMenuAberto(false)
              }
            />

            <View style={styles.modalConteudo}>
              {/* TÍTULO */}

              <View style={styles.modalTopo}>
                <View>
                  <Text
                    style={styles.modalTitulo}
                  >
                    Alimenta+
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitulo
                    }
                  >
                    Menu administrativo
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalFechar}
                  onPress={() =>
                    setMenuAberto(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={VERDE}
                  />
                </TouchableOpacity>
              </View>

              {/* OPÇÕES */}

              {OPCOES_MENU.map((item) => (
                <TouchableOpacity
                  key={item.titulo}
                  style={styles.modalOpcao}
                  onPress={() =>
                    abrirTela(item.rota)
                  }
                >
                  <View
                    style={
                      styles.modalIcone
                    }
                  >
                    <Ionicons
                      name={item.icone}
                      size={23}
                      color={VERDE}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={
                        styles.modalOpcaoTitulo
                      }
                    >
                      {item.titulo}
                    </Text>

                    <Text
                      style={
                        styles.modalOpcaoDesc
                      }
                    >
                      {item.descricao}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#888888"
                  />
                </TouchableOpacity>
              ))}

              {/* SAIR */}

              <TouchableOpacity
                style={styles.modalSair}
                onPress={sair}
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#C92E2E"
                />

                <Text
                  style={
                    styles.modalSairTexto
                  }
                >
                  Sair da conta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  },

  conteudo: {
    padding: 17,
    paddingBottom: 40,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  botaoTopo: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: "#E7EEE0",
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: VERDE,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#777777",
    marginTop: 10,
    marginBottom: 20,
  },

  // ======================================
  // INDICADORES
  // ======================================

  metricas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 9,
  },

  metrica: {
    flex: 1,
    minHeight: 92,
    padding: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  metricaLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    color: "#666666",
  },

  metricaNumero: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: VERDE,
    marginTop: 6,
  },

  // ======================================
  // ACOMPANHAMENTO
  // ======================================

  impacto: {
    marginTop: 15,
    backgroundColor: "#D5E4C3",
    padding: 13,
    borderRadius: 10,
  },

  impactoTitulo: {
    fontFamily: "Poppins_700Bold",
    color: "#161616",
    fontSize: 13,
  },

  impactoNumero: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: "#1B1B1B",
  },

  impactoDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#454545",
  },

  // ======================================
  // AÇÕES
  // ======================================

  secao: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#222222",
    marginTop: 22,
    marginBottom: 11,
  },

  criarCampanha: {
    backgroundColor: VERDE,
    minHeight: 76,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
  },

  criarTexto: {
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    fontSize: 16,
  },

  atalho: {
    minHeight: 77,
    padding: 11,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  icone: {
    height: 45,
    width: 45,
    borderRadius: 12,
    backgroundColor: "#EAF4E5",
    alignItems: "center",
    justifyContent: "center",
  },

  atalhoTitulo: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: VERDE,
  },

  atalhoDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: "#777777",
    marginTop: 2,
  },

  erro: {
    fontSize: 12,
    color: "#B3261E",
    marginTop: 12,
    textAlign: "center",
  },

  nota: {
    fontSize: 10,
    color: "#777777",
    lineHeight: 16,
    marginTop: 12,
    textAlign: "center",
  },

  // ======================================
  // MODAL ADMINISTRATIVO
  // ======================================

  modalFundo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000088",
    padding: 20,
  },

  modalConteudo: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: FUNDO,
    borderRadius: 18,
    padding: 17,
    elevation: 9,
  },

  modalTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  modalTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: VERDE,
  },

  modalSubtitulo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#777777",
  },

  modalFechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E7EEE0",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOpcao: {
    minHeight: 63,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  modalIcone: {
    height: 41,
    width: 41,
    borderRadius: 10,
    backgroundColor: "#EAF4E5",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOpcaoTitulo: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: VERDE,
  },

  modalOpcaoDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#777777",
  },

  modalSair: {
    minHeight: 48,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 10,
    backgroundColor: "#FDEBE9",
  },

  modalSairTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#C92E2E",
  },
});