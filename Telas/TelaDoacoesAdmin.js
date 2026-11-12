import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  onSnapshot,
  query,
  limit,
} from "firebase/firestore";

import { db } from "../firebaseDb";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const FILTROS = [
  "Todas",
  "Em andamento",
  "Concluída",
  "Cancelada",
];

// ========================================
// FORMATAR DATA
// ========================================

function dataBR(valor) {
  const data =
    valor?.toDate?.() ||
    (valor ? new Date(valor) : null);

  return (
    data &&
    !Number.isNaN(data.getTime())
  )
    ? data.toLocaleDateString("pt-BR")
    : "Sem data";
}

// ========================================
// CLASSIFICAR STATUS
// ========================================

function situacao(dado) {
  const valor = String(
    dado || ""
  ).toLowerCase();

  if (
    valor.includes("conclu") ||
    valor.includes("entreg")
  ) {
    return "Concluída";
  }

  if (valor.includes("cancel")) {
    return "Cancelada";
  }

  return "Em andamento";
}

// ========================================
// FORMATAR VALOR
// ========================================

function moeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

// ========================================
// TELA ADMINISTRATIVA DE DOAÇÕES
// ========================================

export default function TelaDoacoesAdmin({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] =
    useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] =
    useState("Todas");

  const [
    abrirFiltros,
    setAbrirFiltros,
  ] = useState(false);

  const [
    selecionada,
    setSelecionada,
  ] = useState(null);

  const [
    mensagemExportacao,
    setMensagemExportacao,
  ] = useState("");

  // ======================================
  // CARREGAR DOAÇÕES DO FIRESTORE
  // ======================================

  useEffect(() => {
    const consulta = query(
      collection(db, "minhasDoacoes"),
      limit(250)
    );

    return onSnapshot(
      consulta,

      (resultado) => {
        const doacoes = resultado.docs
          .map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
          .sort((a, b) => {
            const dataA =
              a.criadoEm?.toMillis?.() || 0;

            const dataB =
              b.criadoEm?.toMillis?.() || 0;

            return dataB - dataA;
          });

        setLista(doacoes);
        setCarregando(false);
        setErro("");
      },

      (e) => {
        setCarregando(false);

        setErro(
          e.code === "permission-denied"
            ? "Acesso negado. Atualize as regras do Firestore para permitir leitura administrativa."
            : "Não foi possível consultar as doações."
        );
      }
    );
  }, []);

  // ======================================
  // FILTRAR DOAÇÕES
  // ======================================

  const filtradas = useMemo(() => {
    return lista.filter((doacao) => {
      const texto = [
        doacao.nome || "",
        doacao.estabelecimento || "",
        doacao.criadoPor || "",
      ]
        .join(" ")
        .toLowerCase();

      const buscaCorreta = texto.includes(
        busca.trim().toLowerCase()
      );

      const statusCorreto =
        filtro === "Todas" ||
        situacao(doacao.status) === filtro;

      return (
        buscaCorreta &&
        statusCorreto
      );
    });
  }, [lista, filtro, busca]);

  // ======================================
  // EXPORTAR RELATÓRIO
  // ======================================

  async function compartilharRelatorio() {
    if (filtradas.length === 0) {
      Alert.alert(
        "Sem registros",
        "Não existem doações para incluir no relatório."
      );

      return;
    }

    const cabecalho =
      "Data;Descrição;Estabelecimento;Situação;Quantidade;Unidade;Valor de referência";

    const linhas = filtradas.map(
      (doacao) => {
        const campos = [
          dataBR(doacao.criadoEm),
          doacao.nome || "Doação",
          doacao.estabelecimento ||
            "Não informado",
          situacao(doacao.status),
          doacao.quantidade ?? "",
          doacao.unidade || "",
          (
            Number.isFinite(
              Number(doacao.total)
            ) &&
            doacao.total != null
          )
            ? Number(doacao.total)
                .toFixed(2)
                .replace(".", ",")
            : "",
        ];

        return campos
          .map((campo) => {
            const texto = String(campo)
              .replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(";");
      }
    );

    const conteudo = [
      cabecalho,
      ...linhas,
    ].join("\n");

    try {
      if (Platform.OS === "web") {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(
            conteudo
          );

          setMensagemExportacao(
            "Relatório copiado para a área de transferência."
          );
        } else {
          setMensagemExportacao(
            "O navegador não permite copiar automaticamente."
          );
        }
      } else {
        await Share.share({
          message: conteudo,
          title:
            "Relatório de doações - Alimenta+",
        });
      }
    } catch (e) {
      setMensagemExportacao(
        "Não foi possível compartilhar o relatório neste dispositivo."
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
                navigation.goBack()
              }
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={VERDE}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Doações
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Acompanhe e gerencie todas as doações
          </Text>

          {/* BUSCA */}

          <View style={styles.ferramentas}>
            <View style={styles.busca}>
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar doação..."
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Ionicons
                name="search-outline"
                size={18}
                color="#888888"
              />
            </View>

            <TouchableOpacity
              style={styles.ordenar}
              onPress={() =>
                setAbrirFiltros(!abrirFiltros)
              }
            >
              <Text style={styles.ordenarTexto}>
                {filtro === "Todas"
                  ? "Ordenar"
                  : filtro}
              </Text>

              <Ionicons
                name="chevron-down"
                size={17}
              />
            </TouchableOpacity>
          </View>

          {/* FILTROS */}

          {abrirFiltros && (
            <View style={styles.menuFiltros}>
              {FILTROS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.itemFiltro}
                  onPress={() => {
                    setFiltro(item);
                    setAbrirFiltros(false);
                  }}
                >
                  <Text
                    style={{
                      color:
                        item === filtro
                          ? VERDE
                          : "#333333",
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CARREGAMENTO */}

          {carregando && (
            <ActivityIndicator
              color={VERDE}
              size="large"
              style={{
                marginTop: 32,
              }}
            />
          )}

          {!!erro && (
            <Text style={styles.erro}>
              {erro}
            </Text>
          )}

          {!carregando &&
            !erro &&
            filtradas.length === 0 && (
              <Text style={styles.vazio}>
                Nenhuma doação encontrada.
              </Text>
            )}

          {/* LISTA DE DOAÇÕES */}

          {filtradas.map((doacao) => {
            const status = situacao(
              doacao.status
            );

            const cor =
              status === "Concluída"
                ? "#15944C"
                : status === "Cancelada"
                ? "#F44336"
                : "#FF8628";

            const tipoEmpresa =
              doacao.estabelecimento
                ?.toLowerCase()
                .includes("empresa");

            return (
              <TouchableOpacity
                key={doacao.id}
                style={styles.card}
                onPress={() =>
                  setSelecionada(doacao)
                }
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        tipoEmpresa
                          ? "#D8FFDC"
                          : "#D6E9FF",
                      borderColor:
                        tipoEmpresa
                          ? "#4AC85E"
                          : "#319DFF",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      tipoEmpresa
                        ? "business-outline"
                        : "person-outline"
                    }
                    size={26}
                    color={
                      tipoEmpresa
                        ? "#3EBE52"
                        : "#2391F3"
                    }
                  />
                </View>

                <View style={styles.info}>
                  <Text
                    numberOfLines={1}
                    style={styles.nome}
                  >
                    {doacao.estabelecimento ||
                      doacao.nome ||
                      "Doador não informado"}
                  </Text>

                  <Text style={styles.data}>
                    {dataBR(doacao.criadoEm)}
                    {" · "}
                    {doacao.quantidade ?? 1}
                    {" "}
                    {doacao.unidade ||
                      "item(ns)"}
                  </Text>
                </View>

                <View style={styles.direita}>
                  {doacao.total != null &&
                  Number(doacao.total) > 0 ? (
                    <Text
                      style={[
                        styles.valor,
                        { color: cor },
                      ]}
                    >
                      {moeda(doacao.total)}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.valor,
                        { color: VERDE },
                      ]}
                    >
                      Gratuita
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.status,
                      {
                        color: cor,
                        backgroundColor:
                          status === "Concluída"
                            ? "#DAF5DC"
                            : status === "Cancelada"
                            ? "#FFE2E2"
                            : "#FFF0DC",
                      },
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* EXPORTAR */}

          <TouchableOpacity
            style={styles.exportar}
            onPress={compartilharRelatorio}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={VERDE}
            />

            <Text style={styles.exportarTexto}>
              Exportar relatório
            </Text>
          </TouchableOpacity>

          {!!mensagemExportacao && (
            <Text style={styles.aviso}>
              {mensagemExportacao}
            </Text>
          )}

          <Text style={styles.aviso}>
            Valores exibidos são referências
            do pedido, não comprovantes de
            pagamento. As doações vêm do
            Firestore.
          </Text>
        </ScrollView>

        {/* DETALHES DA DOAÇÃO */}

        <Modal
          visible={!!selecionada}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setSelecionada(null)
          }
        >
          <View style={styles.modalFundo}>
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() =>
                setSelecionada(null)
              }
            />

            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>
                Detalhes da doação
              </Text>

              <Text style={styles.modalTexto}>
                Nome:{" "}
                {selecionada?.nome ||
                  "Não informado"}
                {"\n"}
                Estabelecimento:{" "}
                {selecionada?.estabelecimento ||
                  "Não informado"}
                {"\n"}
                Situação:{" "}
                {situacao(selecionada?.status)}
                {"\n"}
                Data:{" "}
                {dataBR(selecionada?.criadoEm)}
                {"\n"}
                Quantidade:{" "}
                {selecionada?.quantidade ?? "—"}
                {" "}
                {selecionada?.unidade || ""}
              </Text>

              <TouchableOpacity
                style={styles.fechar}
                onPress={() =>
                  setSelecionada(null)
                }
              >
                <Text style={styles.fecharTexto}>
                  Fechar
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
    backgroundColor: FUNDO,
    alignItems: "center",
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
    gap: 10,
  },

  voltar: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: "#E8EEE0",
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: VERDE,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    color: "#6D6D6D",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 12,
  },

  ferramentas: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  busca: {
    flex: 1,
    height: 43,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  ordenar: {
    maxWidth: "35%",
    minWidth: 88,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#DDDDDD",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },

  ordenarTexto: {
    fontSize: 11,
    color: "#333333",
    flexShrink: 1,
  },

  menuFiltros: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
  },

  itemFiltro: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
  },

  card: {
    minHeight: 78,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    marginBottom: 10,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    height: 46,
    width: 46,
    borderWidth: 1,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  nome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#202020",
  },

  data: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#787878",
  },

  direita: {
    alignItems: "flex-end",
    gap: 5,
  },

  valor: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },

  status: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },

  exportar: {
    height: 47,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: VERDE,
    borderRadius: 7,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },

  exportarTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: VERDE,
  },

  erro: {
    textAlign: "center",
    fontSize: 12,
    color: "#CC2222",
    marginVertical: 20,
  },

  vazio: {
    textAlign: "center",
    color: "#777777",
    marginVertical: 28,
  },

  aviso: {
    fontSize: 10,
    color: "#7A7A7A",
    marginTop: 12,
    lineHeight: 16,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 25,
  },

  modal: {
    backgroundColor: FUNDO,
    borderRadius: 14,
    padding: 20,
  },

  modalTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: VERDE,
  },

  modalTexto: {
    fontSize: 13,
    color: "#333333",
    lineHeight: 24,
    marginTop: 10,
  },

  fechar: {
    backgroundColor: VERDE,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 15,
  },

  fecharTexto: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },
});