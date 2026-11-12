import React, { useEffect, useState } from "react";

import {
  View,
  Text as TextoNativo,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { doc, onSnapshot } from "firebase/firestore";
import { IMAGENS_CATALOGO } from "../assets/images/catalogo/mapa";
import {
  calcularPrecoPromocional,
  obterPrecoAtual,
  obterPrecoOriginal,
} from "../utils/precosProdutos";
import { adicionarProdutoAoCarrinho } from "../utils/carrinhoDoacoes";

import { app } from "../firebase";
import { db } from "../firebaseDb";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";
const storage = getStorage(app);

function Text({ style, ...props }) {
  const estiloOriginal = StyleSheet.flatten(style) || {};
  const pesoFonte = String(estiloOriginal.fontWeight || "400");
  const estiloSemPeso = { ...estiloOriginal };
  delete estiloSemPeso.fontWeight;

  const familiaFonte =
    estiloOriginal.fontFamily ||
    (pesoFonte === "500"
      ? "Poppins_500Medium"
      : pesoFonte === "600"
      ? "Poppins_600SemiBold"
      : ["700", "800", "bold"].includes(pesoFonte)
      ? "Poppins_700Bold"
      : "Poppins_400Regular");

  return (
    <TextoNativo
      {...props}
      style={[estiloSemPeso, { fontFamily: familiaFonte }]}
    />
  );
}

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
  ...IMAGENS_CATALOGO,
};

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function imagemProduto(produto) {
  const camposImagem = [
    "imagemUrl",
    "imageUrl",
    "fotoUrl",
    "fotoURL",
    "photoUrl",
    "photoURL",
    "urlImagem",
    "urlFoto",
    "imagem",
    "foto",
    "image",
  ];

  let imagemRemota;

  for (const campo of camposImagem) {
    const valor = produto?.[campo];

    if (typeof valor === "string" && valor.trim()) {
      imagemRemota = valor.trim();
      break;
    }

    if (valor && typeof valor === "object") {
      const url =
        valor.uri ||
        valor.url ||
        valor.downloadURL ||
        valor.downloadUrl ||
        valor.fullPath ||
        valor.path;

      if (typeof url === "string" && url.trim()) {
        imagemRemota = url.trim();
        break;
      }
    }
  }

  if (
    typeof imagemRemota === "string" &&
    /^(https?:\/\/|data:image\/|file:\/\/|content:\/\/)/i.test(
      imagemRemota.trim()
    )
  ) {
    return { tipo: "remota", valor: imagemRemota };
  }

  if (typeof imagemRemota === "string" && IMAGENS[imagemRemota]) {
    return { tipo: "local", valor: IMAGENS[imagemRemota] };
  }

  if (IMAGENS[produto?.imagemChave]) {
    return {
      tipo: "local",
      valor: IMAGENS[produto.imagemChave],
    };
  }

  if (typeof imagemRemota === "string") {
    return { tipo: "storage", valor: imagemRemota };
  }

  return null;
}

function imagemLocalPorNome(produto) {
  if (IMAGENS[produto?.imagemChave]) {
    return IMAGENS[produto.imagemChave];
  }

  const nome = normalizar(produto?.nome);

  for (const chave of Object.keys(IMAGENS)) {
    if (nome && (
      nome.includes(chave.replace(/-/g, " ")) ||
      normalizar(chave).includes(nome)
    )) {
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
  const [imagemStorage, setImagemStorage] = useState(null);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [adicionandoCarrinho, setAdicionandoCarrinho] = useState(false);
  const [avisoCarrinho, setAvisoCarrinho] = useState("");

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

  const precoOriginal =
    obterPrecoOriginal(produto) ??
    route.params?.precoAntigo ??
    route.params?.precoReferencia;
  const precoAtual =
    obterPrecoAtual(produto) ??
    (route.params?.precoAtual ??
      (produto?.demonstracao === true
        ? calcularPrecoPromocional(precoOriginal)
        : null));
  const precoAtualFormatado = moeda(precoAtual);
  const precoOriginalFormatado = moeda(precoOriginal);

  const estoque = Math.max(
    0,
    Math.floor(Number(produto?.quantidade) || 0)
  );

  const imagemProdutoAtual = imagemProduto(produto);
  const imagemFallback = imagemLocalPorNome(produto);
  const caminhoImagemStorage =
    imagemProdutoAtual?.tipo === "storage"
      ? imagemProdutoAtual.valor
      : null;

  useEffect(() => {
    let ativo = true;
    setImagemStorage(null);

    if (!caminhoImagemStorage) {
      return () => {
        ativo = false;
      };
    }

    getDownloadURL(ref(storage, caminhoImagemStorage))
      .then((uri) => {
        if (ativo) {
          setImagemStorage({ uri });
        }
      })
      .catch((erroImagem) => {
        console.warn(
          "Não foi possível carregar a imagem do produto:",
          erroImagem?.code || erroImagem?.message
        );
      });

    return () => {
      ativo = false;
    };
  }, [caminhoImagemStorage]);

  useEffect(() => {
    setImagemFalhou(false);
  }, [produto?.id, imagemProdutoAtual?.valor]);

  useEffect(() => {
    setQuantidade((atual) =>
      estoque === 0
        ? 0
        : Math.min(Math.max(1, atual), estoque)
    );
  }, [estoque]);

  const alterarQuantidade = (passo) => {
    setQuantidade((atual) =>
      estoque === 0
        ? 0
        : Math.min(estoque, Math.max(1, atual + passo))
    );
  };

  async function adicionarAoCarrinho() {
    if (!produto || estoque === 0 || quantidade < 1) return;

    setAdicionandoCarrinho(true);
    setAvisoCarrinho("");

    try {
      const armazenamento = await adicionarProdutoAoCarrinho(
        produto.id,
        quantidade,
        undefined,
        {
          ...produto,
          precoAtual,
          preco: precoAtual,
          disponibilidade: estoque,
        }
      );
      setAvisoCarrinho(
        armazenamento === "local"
          ? "Alimento salvo neste dispositivo. Para sincronizar, atualize as regras do Firestore."
          : "Alimento adicionado ao carrinho."
      );
    } catch (erroAdicao) {
      console.error("Erro ao adicionar alimento ao carrinho:", erroAdicao);
      setAvisoCarrinho(
        erroAdicao.message || "Não foi possível adicionar ao carrinho."
      );
    } finally {
      setAdicionandoCarrinho(false);
    }
  }

  const imagemCadastrada =
    imagemProdutoAtual?.tipo === "remota"
      ? { uri: imagemProdutoAtual.valor }
      : imagemProdutoAtual?.tipo === "local"
      ? imagemProdutoAtual.valor
      : imagemStorage;
  const imagem = imagemFalhou
    ? imagemFallback
    : imagemCadastrada || imagemFallback;

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["bottom"]}
    >
      <View style={[styles.painel, { width: largura }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
        >
          {/* IMAGEM PRINCIPAL */}
          <View
            style={[
              styles.hero,
              { height: Math.max(210, Math.min(280, largura * 0.68)) },
            ]}
          >
            {imagem ? (
              <Image
                source={imagem}
                resizeMode="cover"
                style={styles.imagemHero}
                onError={() => setImagemFalhou(true)}
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

            <TouchableOpacity
              style={styles.abrirCarrinho}
              onPress={() => navigation.navigate("TelaCarrinhoDoacoes")}
              accessibilityRole="button"
              accessibilityLabel="Abrir carrinho de doações"
            >
              <Ionicons name="cart-outline" color={VERDE} size={20} />
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

                <View style={styles.linhaPreco}>
                  {precoAtualFormatado ? (
                    <Text style={styles.preco}>
                      {precoAtualFormatado}
                    </Text>
                  ) : (
                    <Text style={styles.preco}>
                      Doação gratuita
                    </Text>
                  )}

                  {!!precoAtualFormatado && !!precoOriginalFormatado && (
                    <Text style={styles.precoReferencia}>
                      De {precoOriginalFormatado}
                    </Text>
                  )}
                </View>

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
              <Text style={[styles.secao, styles.secaoSobre]}>
                Sobre o produto
              </Text>

              <Text style={styles.descricao}>
                {produto.descricao ||
                  "Descrição não informada."}
              </Text>

              {/* QUANTIDADE */}
              <View style={styles.cabecalhoQuantidade}>
                <Text style={styles.secao}>Quantidade</Text>

                <Text style={styles.disponivel}>
                  Disponível: {estoque} {produto.unidade || "unidades"}
                </Text>
              </View>

              <View style={styles.linhaAcoes}>
                <View style={styles.contador}>
                  <TouchableOpacity
                    style={[
                      styles.contadorBotao,
                      quantidade <= 1 && styles.botaoContadorInativo,
                    ]}
                    onPress={() => alterarQuantidade(-1)}
                    disabled={estoque === 0 || quantidade <= 1}
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
                    style={[
                      styles.contadorBotao,
                      quantidade >= estoque &&
                        styles.botaoContadorInativo,
                    ]}
                    onPress={() => alterarQuantidade(1)}
                    disabled={estoque === 0 || quantidade >= estoque}
                    accessibilityLabel="Aumentar quantidade"
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color="#333"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.botaoDoe,
                    (estoque === 0 || adicionandoCarrinho) &&
                      styles.botaoDoeInativo,
                  ]}
                  onPress={adicionarAoCarrinho}
                  disabled={estoque === 0 || adicionandoCarrinho}
                  accessibilityRole="button"
                >
                  {adicionandoCarrinho ? (
                    <ActivityIndicator size="small" color={VERDE} />
                  ) : (
                    <Text style={styles.botaoDoeTexto}>
                      {estoque === 0
                        ? "Sem estoque"
                        : "Adicionar ao carrinho de doações"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {!!avisoCarrinho && (
                <Text style={styles.avisoCarrinho}>{avisoCarrinho}</Text>
              )}
            </>
          )}
        </ScrollView>
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
    paddingBottom: 30,
  },

  hero: {
    backgroundColor: "#E6D8C8",
    justifyContent: "center",
    alignItems: "center",
  },

  imagemHero: {
    width: "100%",
    height: "100%",
  },

  voltar: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#E9F6E2",
    alignItems: "center",
    justifyContent: "center",
  },

  abrirCarrinho: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9F6E2",
    alignItems: "center",
    justifyContent: "center",
  },

  cardProduto: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginTop: -8,
    borderRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 11,
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
    backgroundColor: "#BBD9AC",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },

  categoriaTexto: {
    color: "#356F39",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  nomeProduto: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 7,
    color: "#181818",
  },

  estabelecimento: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    fontStyle: "italic",
  },

  linhaPreco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 9,
  },

  preco: {
    color: "#248349",
    fontSize: 18,
    fontWeight: "700",
  },

  precoReferencia: {
    color: "#777777",
    fontSize: 13,
    textDecorationLine: "line-through",
  },

  local: {
    marginHorizontal: -11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },

  localTexto: {
    fontSize: 11,
    color: "#575757",
    fontWeight: "600",
  },

  secao: {
    fontSize: 15,
    fontWeight: "700",
    color: "#191919",
    marginTop: 0,
  },

  secaoSobre: {
    marginHorizontal: 30,
    marginTop: 14,
  },

  descricao: {
    fontSize: 13,
    lineHeight: 19,
    color: "#717171",
    marginHorizontal: 30,
    marginTop: 7,
  },

  cabecalhoQuantidade: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginHorizontal: 30,
    marginTop: 18,
  },

  contador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "52%",
    maxWidth: 150,
    height: 38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
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
    fontWeight: "700",
    color: "#222",
  },

  botaoContadorInativo: {
    opacity: 0.5,
  },

  disponivel: {
    fontSize: 10,
    color: "#647264",
  },

  linhaAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 30,
    marginTop: 6,
  },

  botaoDoe: {
    flex: 1,
    minHeight: 38,
    minWidth: 100,
    borderRadius: 20,
    backgroundColor: "#E7F5D8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    elevation: 2,
  },

  botaoDoeInativo: {
    backgroundColor: "#E2E2E2",
    elevation: 0,
  },

  botaoDoeTexto: {
    color: VERDE,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  avisoCarrinho: {
    marginHorizontal: 30,
    marginTop: 7,
    color: VERDE,
    fontSize: 11,
    fontWeight: "500",
  },

  erro: {
    marginTop: 20,
    textAlign: "center",
    color: "#B3261E",
    fontSize: 13,
  },
})