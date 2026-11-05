
import React from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  MARCOS,
  useEstatisticasUsuario,
  formatarDataFirestore,
} from "../utils/estatisticasUsuario";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const CONQUISTAS = [
  {
    nome: "Sua primeira contribuição!",
    icone: "basket-outline",
  },
  {
    nome: "Você cadastrou 5 doações",
    icone: "cube-outline",
  },
  {
    nome: "Você cadastrou 15 doações",
    icone: "people-outline",
  },
  {
    nome: "Você cadastrou 30 doações",
    icone: "ribbon-outline",
  },
  {
    nome: "Você cadastrou 50 doações",
    icone: "trophy-outline",
  },
];

export default function TelaConquistas({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const largura = Math.min(width, 460);
  const larguraCard = (largura - 56) / 3;

  const {
    doacoes,
    total,
    conquistas,
    carregando,
    erro,
  } = useEstatisticasUsuario();

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.tela,
          { width: largura },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
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
                color={VERDE}
                size={25}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Minhas Conquistas
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Veja todas as suas conquistas
            {"\n"}
            e acompanhe seu progresso.
          </Text>

          {/* PROGRESSO */}
          <View style={styles.resumo}>
            <Text style={styles.resumoTitulo}>
              Conquistas desbloqueadas
            </Text>

            <Text style={styles.resumoTotal}>
              {conquistas} de {MARCOS.length}
            </Text>

            <View style={styles.trilho}>
              <View
                style={[
                  styles.preenchido,
                  {
                    width:
                      `${
                        (100 * conquistas) /
                        MARCOS.length
                      }%`,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.secao}>
            Conquistas alcançadas
          </Text>

          <Text style={styles.descricao}>
            Veja quais conquistas você já completou.
          </Text>

          {carregando && (
            <ActivityIndicator
              color={VERDE}
              style={{ marginTop: 20 }}
            />
          )}

          {!!erro && (
            <Text style={styles.erro}>
              {erro}
            </Text>
          )}

          {/* GRADE DE CONQUISTAS */}
          <View style={styles.grade}>
            {CONQUISTAS.map((item, indice) => {
              const desbloqueada =
                total >= MARCOS[indice];

              const data = desbloqueada
                ? formatarDataFirestore(
                    doacoes[
                      MARCOS[indice] - 1
                    ]?.criadoEm
                  )
                : "";

              return (
                <View
                  key={indice}
                  style={[
                    styles.card,
                    {
                      width: larguraCard,
                      minHeight: larguraCard + 45,
                    },
                  ]}
                >
                  <View style={styles.iconeFundo}>
                    <Ionicons
                      name={
                        desbloqueada
                          ? item.icone
                          : "lock-closed"
                      }
                      size={38}
                      color={
                        desbloqueada
                          ? VERDE
                          : "#6C6679"
                      }
                    />
                  </View>

                  <Text style={styles.cardTexto}>
                    {desbloqueada
                      ? item.nome
                      : "Conquista Bloqueada"}
                  </Text>

                  {desbloqueada && !!data && (
                    <View style={styles.dataChip}>
                      <Text style={styles.data}>
                        {data}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.nota}>
            As conquistas são calculadas pelas
            doações cadastradas na sua conta,
            sem contar os exemplos fictícios.
            Não confirmam entrega ou retirada.
          </Text>
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
    paddingBottom: 125,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 56,
  },

  voltar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#E6F0DF",
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontSize: 21,
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    flexShrink: 1,
  },

  subtitulo: {
    fontSize: 15,
    lineHeight: 23,
    color: "#666666",
    marginTop: 10,
    marginLeft: 10,
    fontFamily: "Poppins_400Regular",
  },

  resumo: {
    backgroundColor: "#EDF5E6",
    borderColor: "#BED2B4",
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 15,
    elevation: 3,
  },

  resumoTitulo: {
    fontSize: 15,
    color: "#242424",
    fontFamily: "Poppins_500Medium",
  },

  resumoTotal: {
    fontSize: 19,
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  trilho: {
    height: 15,
    width: 134,
    backgroundColor: "#DADADA",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },

  preenchido: {
    height: "100%",
    backgroundColor: "#31813B",
    borderRadius: 10,
  },

  secao: {
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    marginTop: 23,
    marginLeft: 5,
  },

  descricao: {
    fontSize: 14,
    color: "#777777",
    marginLeft: 5,
    marginBottom: 19,
    fontFamily: "Poppins_400Regular",
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  card: {
    backgroundColor: "#F4FAF1",
    borderColor: "#CDD5CB",
    borderWidth: 1,
    borderRadius: 14,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  iconeFundo: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  cardTexto: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    color: "#535B53",
    fontFamily: "Poppins_400Regular",
    marginTop: 5,
  },

  dataChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BCD2BC",
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginTop: 5,
  },

  data: {
    fontSize: 11,
    color: VERDE,
    fontFamily: "Poppins_500Medium",
  },

  nota: {
    marginTop: 22,
    fontSize: 11,
    lineHeight: 18,
    color: "#727A71",
    textAlign: "center",
  },

  erro: {
    textAlign: "center",
    color: "#BD3333",
    marginVertical: 15,
  },
});
