
import React, {
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

// EXEMPLOS VISUAIS PARA O TCC.
// NÃO ESTÃO CADASTRADOS NO FIRESTORE.
// UTILIZAM IMAGENS EXISTENTES NO PROJETO.
const CAMPANHAS = [
  {
    id: "cesta",
    nome: "Cesta Básica Solidária",
    descricao:
      "Doação de cestas básicas para famílias de baixa renda.",
    status: "Ativa",
    imagem: require(
      "../assets/images/tabIcons/cesta-basica.png"
    ),
  },
  {
    id: "inverno",
    nome: "Inverno sem Fome",
    descricao:
      "Arrecadação de alimentos para o período de inverno.",
    status: "Pausada",
    imagem: require(
      "../assets/images/tabIcons/agua.jpg"
    ),
  },
  {
    id: "rede",
    nome: "Rede de Alimentos",
    descricao:
      "Combate ao desperdício e redistribuição de alimentos.",
    status: "Ativa",
    imagem: require(
      "../assets/images/tabIcons/alface.png"
    ),
  },
  {
    id: "cafe",
    nome: "Café da manhã Solidário",
    descricao:
      "Apoio alimentar a famílias e comunidades.",
    status: "Encerrada",
    imagem: require(
      "../assets/images/tabIcons/cafe.png"
    ),
  },
];

export default function TelaCampanhas({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todas");

  const [
    filtrosAbertos,
    setFiltrosAbertos,
  ] = useState(false);

  const [selecionada, setSelecionada] =
    useState(null);

  // FILTRAR CAMPANHAS
  const lista = useMemo(
    () =>
      CAMPANHAS.filter((campanha) => {
        const texto = [
          campanha.nome,
          campanha.descricao,
        ]
          .join(" ")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const pesquisa = busca
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return (
          texto.includes(pesquisa) &&
          (
            filtro === "Todas" ||
            campanha.status === filtro
          )
        );
      }),
    [busca, filtro]
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.tela,
          { width: Math.min(width, 460) },
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
                  : navigation.navigate("Home")
              }
            >
              <Ionicons
                name="chevron-back"
                size={25}
                color={VERDE}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Campanhas
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Gerencie todas as campanhas
            {"\n"}
            cadastradas.
          </Text>

          {/* PESQUISA E FILTROS */}
          <View style={styles.ferramentas}>
            <View style={styles.buscaCaixa}>
              <Ionicons
                name="search-outline"
                size={21}
                color="#838883"
              />

              <TextInput
                style={styles.input}
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar campanha..."
                placeholderTextColor="#989898"
              />
            </View>

            <TouchableOpacity
              style={styles.filtro}
              onPress={() =>
                setFiltrosAbertos(!filtrosAbertos)
              }
            >
              <Text style={styles.filtroTexto}>
                {filtro}
              </Text>

              <Ionicons
                name={
                  filtrosAbertos
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={19}
                color={VERDE}
              />
            </TouchableOpacity>
          </View>

          {/* OPÇÕES DE FILTRO */}
          {filtrosAbertos && (
            <View style={styles.opcoesFiltro}>
              {[
                "Todas",
                "Ativa",
                "Pausada",
                "Encerrada",
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.opcao}
                  onPress={() => {
                    setFiltro(item);
                    setFiltrosAbertos(false);
                  }}
                >
                  <Text
                    style={{
                      color:
                        filtro === item
                          ? VERDE
                          : "#555555",
                      fontSize: 14,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.demo}>
            Prévia de campanhas para demonstração
            do TCC. Nenhuma destas campanhas
            está publicada no Firestore.
          </Text>

          {/* LISTA DE CAMPANHAS */}
          <View style={styles.lista}>
            {lista.length === 0 && (
              <Text style={styles.vazio}>
                Nenhuma campanha encontrada.
              </Text>
            )}

            {lista.map((campanha) => (
              <TouchableOpacity
                key={campanha.id}
                style={styles.card}
                onPress={() =>
                  setSelecionada(campanha)
                }
                activeOpacity={0.85}
              >
                <Image
                  source={campanha.imagem}
                  resizeMode="contain"
                  style={styles.imagem}
                />

                <View style={styles.cardDados}>
                  <Text
                    style={styles.nome}
                    numberOfLines={2}
                  >
                    {campanha.nome}
                  </Text>

                  <Text
                    style={styles.descricao}
                    numberOfLines={3}
                  >
                    {campanha.descricao}
                  </Text>
                </View>

                <View style={styles.cardLado}>
                  <View
                    style={[
                      styles.status,
                      campanha.status ===
                        "Pausada" &&
                        styles.pausada,
                      campanha.status ===
                        "Encerrada" &&
                        styles.encerrada,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTexto,
                        campanha.status ===
                          "Pausada" && {
                          color: "#D65A17",
                        },
                        campanha.status ===
                          "Encerrada" && {
                          color: "#333333",
                        },
                      ]}
                    >
                      {campanha.status}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={26}
                    color={VERDE}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* DETALHES DEMONSTRATIVOS */}
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
            style={StyleSheet.absoluteFillObject}
            onPress={() =>
              setSelecionada(null)
            }
          />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              {selecionada?.nome}
            </Text>

            <Text style={styles.modalDescricao}>
              {selecionada?.descricao}
            </Text>

            <Text style={styles.modalDescricao}>
              Status ilustrativo:{" "}
              {selecionada?.status}
            </Text>

            <Text style={styles.modalNota}>
              Este card é somente uma prévia do
              design. A participação e a gestão
              de campanhas reais exigem cadastro
              e regras próprias no Firestore.
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
    </SafeAreaView>
  );
}

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
    paddingBottom: 128,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 56,
  },

  voltar: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 22,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 17,
    lineHeight: 25,
    color: "#666666",
    marginTop: 4,
  },

  ferramentas: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  buscaCaixa: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: "#333333",
  },

  filtro: {
    width: 101,
    height: 45,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  filtroTexto: {
    color: VERDE,
    fontSize: 12,
  },

  opcoesFiltro: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    padding: 5,
    marginTop: 5,
  },

  opcao: {
    padding: 10,
  },

  demo: {
    fontSize: 11,
    color: "#848484",
    marginTop: 13,
    lineHeight: 17,
  },

  lista: {
    marginTop: 20,
    gap: 15,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C9D3C5",
    backgroundColor: "#FFFFFF",
    padding: 7,
    elevation: 3,
    gap: 8,
  },

  imagem: {
    width: 92,
    height: 91,
    borderRadius: 9,
    backgroundColor: "#F4F4EF",
  },

  cardDados: {
    flex: 1,
    alignSelf: "center",
  },

  nome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#181818",
    lineHeight: 19,
  },

  descricao: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#282828",
    lineHeight: 17,
    marginTop: 2,
  },

  cardLado: {
    minWidth: 76,
    justifyContent: "space-between",
    alignItems: "flex-end",
    alignSelf: "stretch",
    paddingTop: 2,
    paddingBottom: 4,
  },

  status: {
    backgroundColor: "#B6D7AC",
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },

  pausada: {
    backgroundColor: "#FFE2C6",
  },

  encerrada: {
    backgroundColor: "#D9D8D2",
  },

  statusTexto: {
    fontFamily: "Poppins_600SemiBold",
    color: VERDE,
    fontSize: 11,
  },

  vazio: {
    color: "#666666",
    textAlign: "center",
    marginTop: 30,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: FUNDO,
    borderRadius: 17,
    padding: 20,
    gap: 12,
  },

  modalTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: VERDE,
  },

  modalDescricao: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
  },

  modalNota: {
    fontSize: 12,
    color: "#8B7448",
    lineHeight: 19,
  },

  fechar: {
    backgroundColor: VERDE,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  fecharTexto: {
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});
