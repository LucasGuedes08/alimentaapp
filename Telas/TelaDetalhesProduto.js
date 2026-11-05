
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebaseDb";
import MenuInferior from "../components/MenuInferior";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

const IMAGENS = {
  cesta: require("../assets/images/tabIcons/cesta-basica.png"),
  arroz: require("../assets/images/tabIcons/arroz.png"),
  feijao: require("../assets/images/tabIcons/feijao.webp"),
  macarrao: require("../assets/images/tabIcons/macarrao.png"),
  oleo: require("../assets/images/tabIcons/oleo.png"),
  acucar: require("../assets/images/tabIcons/acucar.png"),
  sal: require("../assets/images/tabIcons/sal.png"),
  farinha: require("../assets/images/tabIcons/farinhadetrigo.webp"),
  cafe: require("../assets/images/tabIcons/cafe.png"),
  biscoito: require("../assets/images/tabIcons/bolacha.png"),
  leite: require("../assets/images/tabIcons/leite.webp"),
  agua: require("../assets/images/tabIcons/agua.jpg"),
  tomate: require("../assets/images/tabIcons/tomate.png"),
  cenoura: require("../assets/images/tabIcons/cenoura.png"),
  alface: require("../assets/images/tabIcons/alface.png"),
};

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function imagemProduto(produto) {
  if (IMAGENS[produto?.imagemChave]) {
    return IMAGENS[produto.imagemChave];
  }

  const nome = normalizar(produto?.nome);

  for (const chave of Object.keys(IMAGENS)) {
    if (nome.includes(chave)) {
      return IMAGENS[chave];
    }
  }

  if (nome.includes("bolacha")) {
    return IMAGENS.biscoito;
  }

  if (nome.includes("farinha")) {
    return IMAGENS.farinha;
  }

  return null;
}

function moeda(valor) {
  let numero = valor;

  if (typeof numero === "string") {
    const texto = numero
      .trim()
      .replace(/^R\$\s*/i, "")
      .replace(/\s/g, "");

    if (!texto || !/\d/.test(texto)) {
      return null;
    }

    numero = texto.includes(",")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto;
    numero = Number(numero);
  }

  return typeof numero === "number" &&
    Number.isFinite(numero)
    ? `R$ ${numero.toFixed(2).replace(".", ",")}`
    : null;
}

export default function TelaDetalhesProduto({
  route,
  navigation,
}) {
  const { width } = useWindowDimensions();
  const largura = Math.min(width, 460);
  const produtoId = route.params?.produtoId;

  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    if (!produtoId) {
      setErro("Produto não identificado.");
      setCarregando(false);
      return;
    }

    const parar = onSnapshot(
      doc(db, "alimentos", produtoId),

      (snapshot) => {
        if (snapshot.exists()) {
          setProduto({
            id: snapshot.id,
            ...snapshot.data(),
          });

          setErro("");
        } else {
          setErro("Produto não encontrado.");
          setProduto(null);
        }

        setCarregando(false);
      },

      (e) => {
        console.error(
          "Erro ao abrir detalhes do alimento:",
          e
        );

        setCarregando(false);

        setErro(
          "Não foi possível carregar os detalhes."
        );
      }
    );

    return parar;
  }, [produtoId]);

  const preco =
    moeda(produto?.precoReferencia) ||
    moeda(produto?.precoAntigo) ||
    moeda(produto?.preco) ||
    moeda(route.params?.precoReferencia);
  const unidadePreco =
    produto?.precoUnidade ||
    route.params?.precoUnidade ||
    produto?.unidade ||
    "unidade";

  const maximo = Math.max(
    1,
    Math.floor(Number(produto?.quantidade) || 1)
  );

  const alterarQuantidade = (passo) => {
    setQuantidade((atual) =>
      Math.max(
        1,
        Math.min(maximo, atual + passo)
      )
    );
  };

  const imagem = imagemProduto(produto);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View style={[styles.painel, { width: largura }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          {/* IMAGEM PRINCIPAL */}
          <View style={styles.hero}>
            {imagem ? (
              <Image
                source={imagem}
                resizeMode="contain"
                style={styles.imagemHero}
              />
            ) : (
              <Ionicons
                name="basket-outline"
                size={85}
                color="#8CB18C"
              />
            )}

            <TouchableOpacity
              style={styles.voltar}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                color={VERDE}
                size={23}
              />
            </TouchableOpacity>
          </View>

          {carregando && (
            <ActivityIndicator
              color={VERDE}
              size="large"
              style={{ marginTop: 30 }}
            />
          )}

          {!!erro && (
            <Text style={styles.erro}>{erro}</Text>
          )}

          {!!produto && !erro && (
            <>
              {/* CARD PRINCIPAL */}
              <View style={styles.cardProduto}>
                <View style={styles.categoriaPill}>
                  <Text style={styles.categoriaTexto}>
                    {String(
                      produto.categoria || "Alimento"
                    ).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.nomeProduto}>
                  {produto.nome || "Alimento"}
                </Text>

                <Text style={styles.estabelecimento}>
                  {produto.estabelecimento ||
                    "Doador não informado"}
                </Text>

                {!!preco && (
                  <Text style={styles.preco}>
                    Varejo: {preco} / {unidadePreco}
                  </Text>
                )}

                <View style={styles.local}>
                  <Text style={styles.localTexto}>
                    Retirada:{" "}
                    {produto.localRetirada ||
                      produto.cidade ||
                      "A combinar"}
                  </Text>
                </View>
              </View>

              {/* DESCRIÇÃO */}
              <Text style={styles.secao}>
                Sobre o produto
              </Text>

              <Text style={styles.descricao}>
                {produto.descricao ||
                  "Descrição não informada."}
              </Text>

              {/* QUANTIDADE */}
              <Text style={styles.secao}>
                Quantidade
              </Text>

              <View style={styles.contador}>
                <TouchableOpacity
                  style={styles.contadorBotao}
                  onPress={() =>
                    alterarQuantidade(-1)
                  }
                  accessibilityLabel="Diminuir quantidade"
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color="#333"
                  />
                </TouchableOpacity>

                <Text style={styles.contadorNumero}>
                  {quantidade}
                </Text>

                <TouchableOpacity
                  style={styles.contadorBotao}
                  onPress={() =>
                    alterarQuantidade(1)
                  }
                  accessibilityLabel="Aumentar quantidade"
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.disponivel}>
                Disponível: {produto.quantidade || "—"}{" "}
                {produto.unidade || "unidades"}
              </Text>

              <Text style={styles.aviso}>
                {produto.demonstracao
                  ? "Este alimento é um exemplo fictício do TCC e não está disponível para retirada."
                  : "A seleção de quantidade é apenas demonstrativa. A reserva precisa ser implementada e validada no Firestore antes de ser liberada."}
              </Text>
            </>
          )}
        </ScrollView>

        <MenuInferior navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: "center",
    backgroundColor: FUNDO,
  },

  painel: {
    flex: 1,
    maxWidth: 460,
    backgroundColor: FUNDO,
  },

  conteudo: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  hero: {
    height: 225,
    backgroundColor: "#EFEDE6",
    justifyContent: "center",
    alignItems: "center",
  },

  imagemHero: {
    width: "100%",
    height: "96%",
  },

  voltar: {
    position: "absolute",
    left: 16,
    top: 15,
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: "#E5F1DC",
    alignItems: "center",
    justifyContent: "center",
  },

  cardProduto: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginTop: -22,
    borderRadius: 17,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
  },

  categoriaPill: {
    alignSelf: "flex-start",
    backgroundColor: "#C5E1B8",
    paddingHorizontal: 17,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoriaTexto: {
    color: "#356F39",
    fontSize: 10,
    fontWeight: "700",
  },

  nomeProduto: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 8,
    color: "#181818",
  },

  estabelecimento: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  preco: {
    color: VERDE,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 12,
  },

  local: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },

  localTexto: {
    fontSize: 12,
    color: "#575757",
  },

  secao: {
    fontSize: 16,
    fontWeight: "800",
    color: "#191919",
    marginHorizontal: 22,
    marginTop: 18,
  },

  descricao: {
    fontSize: 13,
    lineHeight: 20,
    color: "#717171",
    marginHorizontal: 22,
    marginTop: 7,
  },

  contador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 140,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 11,
    marginLeft: 22,
    marginTop: 9,
    paddingHorizontal: 10,
  },

  contadorBotao: {
    width: 27,
    height: 27,
    borderRadius: 16,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  contadorNumero: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  disponivel: {
    marginLeft: 22,
    marginTop: 8,
    fontSize: 11,
    color: VERDE,
  },

  aviso: {
    marginHorizontal: 22,
    marginTop: 15,
    fontSize: 11,
    lineHeight: 17,
    color: "#887348",
  },

  erro: {
    marginTop: 20,
    textAlign: "center",
    color: "#B3261E",
    fontSize: 13,
  },
});
