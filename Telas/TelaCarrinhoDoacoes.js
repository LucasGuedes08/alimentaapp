import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase";
import { db } from "../firebaseDb";
import { IMAGENS_CATALOGO } from "../assets/images/catalogo/mapa";
import {
  alterarQuantidadeNoCarrinho,
  removerProdutoDoCarrinho,
  sincronizarCarrinhoLocal,
} from "../utils/carrinhoDoacoes";
import {
  lerCarrinhoLocal,
  usarCarrinhoLocal,
} from "../utils/carrinhoLocal";
import {
  calcularSubtotalItem,
  calcularTotalCarrinho,
} from "../utils/carrinhoCalculos";
import { obterPrecoAtual } from "../utils/precosProdutos";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

function moeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
}

function obterImagem(item) {
  return IMAGENS_CATALOGO[item.imagemChave] || null;
}

export default function TelaCarrinhoDoacoes({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState("");
  const [erro, setErro] = useState("");
  const [avisoLocal, setAvisoLocal] = useState(false);
  const sequenciaAtualizacao = useRef(0);
  const primeiroFoco = useRef(true);
  const [chaveAtualizacao, setChaveAtualizacao] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }

      setChaveAtualizacao((atual) => atual + 1);
    }, [])
  );

  useEffect(() => {
    if (!uid) {
      setErro("Faça login para usar o carrinho.");
      setCarregando(false);
      return undefined;
    }

    let ativo = true;

    async function carregarDadosLocais(mensagem) {
      try {
        const itensLocais = await lerCarrinhoLocal(uid);
        if (!ativo) return;

        setItens(
          itensLocais.map((item) => ({
            ...item,
            disponibilidade: Number(item.disponibilidade) || 0,
            indisponivel: Number(item.disponibilidade) <= 0,
          }))
        );
        setAvisoLocal(itensLocais.length > 0);
        setErro(
          itensLocais.length > 0
            ? ""
            : mensagem ||
                "O Firestore não permite acessar o carrinho. Publique as regras atualizadas para habilitar a sincronização."
        );
      } catch (erroLocal) {
        console.error("Erro ao carregar carrinho salvo neste dispositivo:", erroLocal);
        if (ativo) {
          setErro("Não foi possível carregar o carrinho salvo neste dispositivo.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    let cancelar;

    cancelar = onSnapshot(
      doc(db, "carrinhos", uid),
      async (snapshot) => {
        const sequencia = ++sequenciaAtualizacao.current;

        if (await usarCarrinhoLocal(uid)) {
          try {
            const sincronizados = await sincronizarCarrinhoLocal(uid);
            if (Array.isArray(sincronizados)) {
              setItens(
                sincronizados.map((item) => ({
                  ...item,
                  disponibilidade: Number(item.disponibilidade) || 0,
                  indisponivel: Number(item.disponibilidade) <= 0,
                }))
              );
              setAvisoLocal(false);
              setErro("");
              setCarregando(false);
              return;
            }
          } catch (erroSincronizacao) {
            console.error(
              "Não foi possível sincronizar o carrinho local:",
              erroSincronizacao
            );
            const mensagem =
              erroSincronizacao.message ||
              "Revise os itens e a disponibilidade antes de sincronizar.";
            await carregarDadosLocais();
            if (ativo) setErro(mensagem);
            return;
          }

          await carregarDadosLocais();
          return;
        }

        const itensCarrinho = Array.isArray(snapshot.data()?.itens)
          ? snapshot.data().itens
          : [];

        if (itensCarrinho.length === 0) {
          setItens([]);
          setErro("");
          setAvisoLocal(false);
          setCarregando(false);
          return;
        }

        try {
          const itensAtualizados = await Promise.all(
            itensCarrinho.map(async (item) => {
              const alimento = await getDoc(
                doc(db, "alimentos", item.produtoId)
              );

              if (!alimento.exists()) {
                return {
                  ...item,
                  indisponivel: true,
                  disponibilidade: 0,
                };
              }

              const dados = alimento.data();

              return {
                ...item,
                ...dados,
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: Math.max(
                  0,
                  obterPrecoAtual(dados) ?? 0
                ),
                disponibilidade: Math.max(
                  0,
                  Number(dados.quantidade) || 0
                ),
                indisponivel:
                  dados.status !== "disponivel" ||
                  Number(dados.quantidade) <= 0,
              };
            })
          );

          if (sequencia === sequenciaAtualizacao.current) {
            setItens(itensAtualizados);
            setErro("");
            setAvisoLocal(false);
            setCarregando(false);
          }
        } catch (erroLeitura) {
          console.error("Erro ao atualizar itens do carrinho:", erroLeitura);
          if (sequencia === sequenciaAtualizacao.current) {
            await carregarDadosLocais(
              erroLeitura.code === "permission-denied"
                ? "As regras do Firestore precisam ser atualizadas para sincronizar o carrinho."
                : "Não foi possível carregar os produtos do carrinho."
            );
          }
        }
      },
      async (erroSnapshot) => {
        console.error("Erro ao acompanhar o carrinho:", erroSnapshot);
        if (erroSnapshot.code === "permission-denied") {
          setAvisoLocal(true);
          await carregarDadosLocais(
            "As regras do Firestore precisam ser atualizadas para sincronizar o carrinho."
          );
          return;
        }

        if (erroSnapshot.code === "unavailable") {
          setAvisoLocal(true);
          await carregarDadosLocais(
            "Sem conexão com o Firestore. Exibindo o carrinho salvo neste dispositivo."
          );
          return;
        }

        setErro("Não foi possível carregar seu carrinho.");
        setCarregando(false);
      }
    );

    return () => {
      ativo = false;
      cancelar();
    };
  }, [uid, chaveAtualizacao]);

  const total = useMemo(() => calcularTotalCarrinho(itens), [itens]);
  const itensInvalidos = itens.some(
    (item) =>
      item.indisponivel ||
      item.quantidade > item.disponibilidade
  );

  async function alterarQuantidade(item, quantidade) {
    setProcessando(item.produtoId);
    setErro("");

    try {
      const armazenamento = await alterarQuantidadeNoCarrinho(
        item.produtoId,
        quantidade,
        uid
      );
      if (armazenamento === "local") {
        setItens(await lerCarrinhoLocal(uid));
        setAvisoLocal(true);
      }
    } catch (erroAtualizacao) {
      console.error("Erro ao alterar quantidade do carrinho:", erroAtualizacao);
      setErro(erroAtualizacao.message || "Não foi possível alterar a quantidade.");
    } finally {
      setProcessando("");
    }
  }

  async function removerItem(item) {
    setProcessando(item.produtoId);
    setErro("");

    try {
      const armazenamento = await removerProdutoDoCarrinho(
        item.produtoId,
        uid
      );
      if (armazenamento === "local") {
        setItens(await lerCarrinhoLocal(uid));
        setAvisoLocal(true);
      }
    } catch (erroRemocao) {
      console.error("Erro ao remover produto do carrinho:", erroRemocao);
      setErro(erroRemocao.message || "Não foi possível remover o produto.");
    } finally {
      setProcessando("");
    }
  }

  function continuarParaPagamento() {
    if (itens.length === 0 || itensInvalidos) return;

    if (avisoLocal) {
      setErro(
        "O carrinho está salvo neste dispositivo. Publique as regras atualizadas do Firestore para sincronizar e concluir a doação com baixa de estoque."
      );
      return;
    }

    navigation.navigate("TelaSeuPedido", {
      pedido: {
        fluxo: "carrinhoDoacoes",
        demonstracao: true,
        itens: itens.map((item) => ({
          id: item.produtoId,
          produtoId: item.produtoId,
          nome: item.nome,
          preco: item.precoUnitario,
          precoUnitario: item.precoUnitario,
          quantidade: item.quantidade,
          unidade: item.unidade,
          precoUnidade: item.precoUnidade,
          categoria: item.categoria,
          cidade: item.cidade,
          imagemChave: item.imagemChave,
          estabelecimento: item.estabelecimento,
          descricao: item.descricao,
          demonstracao: item.demonstracao === true,
        })),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.tela}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={VERDE} />
          </TouchableOpacity>
          <Text style={styles.titulo}>Carrinho de doações</Text>
        </View>

        {carregando ? (
          <ActivityIndicator
            color={VERDE}
            size="large"
            style={styles.carregando}
          />
        ) : itens.length === 0 ? (
          <View style={styles.vazio}>
            {!!erro && <Text style={styles.erro}>{erro}</Text>}
            {avisoLocal && (
              <Text style={styles.avisoSincronizacao}>
                Seus itens estão salvos neste dispositivo. Para sincronizar
                e concluir a doação, publique as regras atualizadas do
                Firestore.
              </Text>
            )}
            <Ionicons name="cart-outline" size={54} color="#8BA58B" />
            <Text style={styles.vazioTitulo}>Seu carrinho está vazio</Text>
            <Text style={styles.vazioTexto}>
              Adicione alimentos do catálogo para revisar sua doação.
            </Text>
            <TouchableOpacity
              style={styles.botaoVoltarCatalogo}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.botaoPrincipalTexto}>Ver alimentos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.lista}
              contentContainerStyle={styles.listaConteudo}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.subtitulo}>
                Revise os alimentos e as quantidades antes de concluir.
              </Text>

              {itens.map((item) => {
                const imagem = obterImagem(item);
                const subtotal = calcularSubtotalItem(item);
                const quantidadeProcessando =
                  processando === item.produtoId;

                return (
                  <View key={item.produtoId} style={styles.card}>
                    {imagem ? (
                      <Image
                        source={imagem}
                        style={styles.imagem}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.imagem, styles.imagemVazia]}>
                        <Ionicons
                          name="nutrition-outline"
                          size={30}
                          color={VERDE}
                        />
                      </View>
                    )}

                    <View style={styles.info}>
                      <View style={styles.linhaTitulo}>
                        <Text style={styles.nome} numberOfLines={2}>
                          {item.nome}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removerItem(item)}
                          disabled={quantidadeProcessando}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover ${item.nome}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={19}
                            color="#8A4038"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.precoUnitario}>
                        {moeda(item.precoUnitario)} por{" "}
                        {item.precoUnidade || item.unidade}
                      </Text>
                      <Text style={styles.disponibilidade}>
                        {item.indisponivel
                          ? "Produto indisponível"
                          : `Disponível: ${item.disponibilidade} ${item.unidade}`}
                      </Text>

                      <View style={styles.linhaRodape}>
                        <View style={styles.contador}>
                          <TouchableOpacity
                            onPress={() =>
                              alterarQuantidade(item, item.quantidade - 1)
                            }
                            disabled={
                              quantidadeProcessando || item.quantidade <= 1
                            }
                            accessibilityLabel="Diminuir quantidade"
                          >
                            <Ionicons
                              name="remove-circle"
                              size={27}
                              color={
                                item.quantidade <= 1 ? "#C9C9C9" : VERDE
                              }
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantidade}>
                            {item.quantidade}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              alterarQuantidade(item, item.quantidade + 1)
                            }
                            disabled={
                              quantidadeProcessando ||
                              item.indisponivel ||
                              item.quantidade >= item.disponibilidade
                            }
                            accessibilityLabel="Aumentar quantidade"
                          >
                            <Ionicons
                              name="add-circle"
                              size={27}
                              color={
                                item.indisponivel ||
                                item.quantidade >= item.disponibilidade
                                  ? "#C9C9C9"
                                  : VERDE
                              }
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.subtotal}>
                          {moeda(subtotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {!!erro && <Text style={styles.erro}>{erro}</Text>}
              {itensInvalidos && (
                <Text style={styles.erro}>
                  Remova os produtos indisponíveis ou ajuste a quantidade ao
                  estoque atual.
                </Text>
              )}
            </ScrollView>

            <View style={styles.resumo}>
              <View style={styles.linhaTotal}>
                <Text style={styles.rotuloTotal}>Total demonstrativo</Text>
                <Text style={styles.valorTotal}>{moeda(total)}</Text>
              </View>
              <Text style={styles.aviso}>
                Nenhum pagamento será cobrado nesta demonstração.
              </Text>
              <TouchableOpacity
                style={[
                  styles.botaoPrincipal,
                  (itensInvalidos || !!processando) &&
                    styles.botaoDesabilitado,
                ]}
                onPress={continuarParaPagamento}
                disabled={itensInvalidos || !!processando}
                accessibilityRole="button"
              >
                <Text style={styles.botaoPrincipalTexto}>
                  Concluir doação
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  tela: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
  },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  voltar: {
    position: "absolute",
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F0DF",
  },
  titulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  subtitulo: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 7,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 11,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imagem: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#F1F1EC",
  },
  imagemVazia: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  linhaTitulo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  nome: {
    flex: 1,
    color: "#222222",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  precoUnitario: {
    color: VERDE,
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginTop: 1,
  },
  disponibilidade: {
    color: "#687568",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 1,
  },
  linhaRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  quantidade: {
    color: "#222222",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    minWidth: 12,
    textAlign: "center",
  },
  subtotal: {
    color: "#222222",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  resumo: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
  },
  linhaTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rotuloTotal: {
    color: "#333333",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  valorTotal: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  aviso: {
    color: "#687568",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 2,
    marginBottom: 9,
  },
  botaoPrincipal: {
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F5D8",
  },
  botaoDesabilitado: {
    opacity: 0.55,
  },
  botaoPrincipalTexto: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  carregando: {
    flex: 1,
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  vazioTitulo: {
    color: "#222222",
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    marginTop: 12,
  },
  vazioTexto: {
    color: "#686868",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 16,
  },
  botaoVoltarCatalogo: {
    paddingHorizontal: 20,
    minHeight: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F5D8",
  },
  erro: {
    color: "#B3261E",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginTop: 8,
  },
  avisoSincronizacao: {
    color: "#755510",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
});