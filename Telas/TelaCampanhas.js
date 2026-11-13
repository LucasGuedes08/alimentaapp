import React, {
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseDb";
import { imagemCampanha, textoNormalizado } from "../utils/campanhasAdmin";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

export default function TelaCampanhas({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [campanhas, setCampanhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [
    filtrosAbertos,
    setFiltrosAbertos,
  ] = useState(false);

  React.useEffect(() => {
    return onSnapshot(
      collection(db, "campanhas"),
      (snapshot) => {
        setCampanhas(
          snapshot.docs
            .map((documento) => ({
              id: documento.id,
              ...documento.data(),
            }))
            .filter((campanha) => campanha.exemplo !== true)
        );
        setCarregando(false);
        setErro("");
      },
      (falha) => {
        console.error("Erro ao consultar campanhas:", falha);
        setErro(
          falha.code === "permission-denied"
            ? "Você não tem permissão para visualizar campanhas."
            : "Não foi possível carregar as campanhas."
        );
        setCarregando(false);
      }
    );
  }, []);

  // FILTRAR CAMPANHAS
  const lista = useMemo(
    () =>
      campanhas.filter((campanha) => {
        const texto = textoNormalizado(
          `${campanha.nome || ""} ${campanha.descricao || ""}`
        );
        const pesquisa = textoNormalizado(busca);

        return (
          texto.includes(pesquisa) &&
          (
            filtro === "Todas" ||
            campanha.status === filtro
          )
        );
      }),
    [busca, filtro, campanhas]
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
            Conheça as campanhas disponíveis
            {"\n"}
            e escolha como contribuir.
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

          {/* LISTA DE CAMPANHAS */}
          <View style={styles.lista}>
            {carregando && (
              <ActivityIndicator
                size="large"
                color={VERDE}
                style={{ marginTop: 24 }}
              />
            )}

            {!!erro && (
              <Text style={styles.vazio}>{erro}</Text>
            )}

            {!carregando && !erro && lista.length === 0 && (
              <Text style={styles.vazio}>
                {campanhas.length === 0
                  ? "Ainda não há campanhas disponíveis."
                  : "Nenhuma campanha encontrada."}
              </Text>
            )}

            {!carregando && !erro && lista.map((campanha) => (
              <TouchableOpacity
                key={campanha.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("TelaDetalheCampanha", {
                    campanha,
                  })
                }
                activeOpacity={0.85}
              >
                {campanha.imagemChave ? (
                  <Image
                    source={imagemCampanha(campanha)}
                    resizeMode="contain"
                    style={styles.imagem}
                  />
                ) : (
                  <View style={[styles.imagem, styles.imagemVazia]}>
                    <Ionicons name="heart-outline" size={30} color={VERDE} />
                  </View>
                )}

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
    paddingBottom: 92,
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

  imagemVazia: {
    alignItems: "center",
    justifyContent: "center",
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

})