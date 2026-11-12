import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import { concluirDoacaoCarrinho } from "../utils/carrinhoDoacoes";
import { calcularTotalCarrinho } from "../utils/carrinhoCalculos";

const VERDE = "#006838";
const VERDE_BOTAO = "#348F20";
const FUNDO = "#FFFCF6";

function converterPreco(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor ?? "")
    .replace("R$", "")
    .replace(/\s/g, "");

  const numero = Number(
    texto.includes(",")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto
  );

  return Number.isFinite(numero) ? numero : 0;
}

function moeda(valor) {
  return converterPreco(valor).toFixed(2).replace(".", ",");
}

export default function TelaSeuPedido({ navigation, route }) {
  const [pagamento, setPagamento] = useState("debito");
  const [confirmouSimulacao, setConfirmouSimulacao] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const finalizacaoIniciada = useRef(false);
  const [dadosCartao, setDadosCartao] = useState({
    titular: "",
    documento: "",
    numero: "",
    mes: "",
    ano: "",
    cvv: "",
  });

  const pedidoRecebido = route?.params?.pedido;
  const fluxoCarrinho = pedidoRecebido?.fluxo === "carrinhoDoacoes";

  const itensRecebidos = Array.isArray(pedidoRecebido?.itens)
    ? pedidoRecebido.itens
    : [];

  const demonstrativo = itensRecebidos.length === 0;

  const itens = demonstrativo
    ? [
        {
          nome: "Kit Família 2",
          preco: 87.99,
          quantidade: 1,
          descricao: [
            "Arroz, feijão, macarrão, óleo e outros alimentos embalados.",
          ],
        },
      ]
    : itensRecebidos;

  const subtotal = calcularTotalCarrinho(
    itens.map((item) => ({
      precoUnitario: converterPreco(item.precoUnitario ?? item.preco),
      quantidade: Math.max(1, Number(item.quantidade) || 1),
    }))
  );

  async function finalizarCompra() {
    if (!confirmouSimulacao) {
      Alert.alert(
        "Confirme a demonstração",
        "Marque a confirmação de que entende que nenhum valor será cobrado."
      );
      return;
    }

    if (fluxoCarrinho) {
      if (finalizacaoIniciada.current) return;

      finalizacaoIniciada.current = true;
      setFinalizando(true);

      try {
        await concluirDoacaoCarrinho(
          itensRecebidos.map((item) => ({
            produtoId: item.produtoId || item.id,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario ?? item.preco,
          })),
          auth.currentUser?.uid
        );
      } catch (erroFinalizacao) {
        console.error("Erro ao concluir doação agrupada:", erroFinalizacao);
        Alert.alert(
          "Não foi possível concluir",
          erroFinalizacao.message ||
            "Revise o carrinho e tente novamente."
        );
        finalizacaoIniciada.current = false;
        setFinalizando(false);
        return;
      }

      setFinalizando(false);
    }

    setDadosCartao({
      titular: "",
      documento: "",
      numero: "",
      mes: "",
      ano: "",
      cvv: "",
    });
    setFinalizado(true);
  }

  function atualizarDadoCartao(campo, valor) {
    setDadosCartao((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function OpcaoPagamento({ tipo, titulo }) {
    const selecionado = pagamento === tipo;

    return (
      <TouchableOpacity
        style={styles.opcaoPagamento}
        onPress={() => setPagamento(tipo)}
        activeOpacity={0.8}
      >
        <Text style={styles.textoOpcao}>{titulo}</Text>

        <View
          style={[
            styles.radio,
            selecionado && styles.radioSelecionado,
          ]}
        >
          {selecionado && <View style={styles.radioInterno} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
      >
        {finalizado ? (
          <View style={styles.finalizado}>
            <Text style={styles.tituloFinalizado}>
              {fluxoCarrinho ? "DOAÇÃO CONCLUÍDA" : "PEDIDO FINALIZADO"}
            </Text>

            <View style={styles.ilustracaoFinalizado}>
              <Ionicons name="cart" size={74} color="#E9A43A" />
              <View style={styles.seloFinalizado}>
                <Ionicons
                  name="shield-checkmark"
                  size={42}
                  color="#42C7A8"
                />
              </View>
            </View>

            <Text style={styles.tituloDetalhado}>
              Pedido Detalhado:
            </Text>

            <Text style={styles.confirmacaoDemo}>
              Simulação concluída. Nenhuma cobrança foi feita.
            </Text>

            <View style={styles.cardPedido}>
              <View style={styles.cabecalhoTabela}>
                <Text style={styles.tabelaTitulo}>PRODUTO</Text>
                <Text style={styles.tabelaTitulo}>TOTAL</Text>
              </View>

              {itens.map((item, index) => (
                <View
                  key={String(item.id ?? index)}
                  style={styles.produtoLinha}
                >
                  <View style={styles.produtoInfo}>
                    <Text style={styles.nomeProduto}>
                      {item.nome || "Produto"}
                    </Text>
                    <Text style={styles.descricaoProduto}>
                      {Array.isArray(item.descricao)
                        ? item.descricao.join("\n")
                        : item.descricao || `${item.quantidade || 1} unidade(s)`}
                    </Text>
                  </View>
                  <Text style={styles.precoProduto}>
                    {moeda(
                      converterPreco(item.preco) *
                        Math.max(1, Number(item.quantidade) || 1)
                    )}
                  </Text>
                </View>
              ))}

              <View style={styles.rodapeTabela}>
                <Text style={styles.subtotalTitulo}>Total:</Text>
                <Text style={styles.subtotalValor}>
                  R$ {moeda(subtotal)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botaoFinalizar}
              onPress={() =>
                fluxoCarrinho
                  ? navigation.navigate("TelaMinhasDoacoes")
                  : navigation.popToTop()
              }
              activeOpacity={0.85}
            >
              <Text style={styles.textoFinalizar}>
                {fluxoCarrinho
                  ? "Ver minhas doações"
                  : "Voltar para o home"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.voltar}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Voltar"
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={VERDE}
                />
              </TouchableOpacity>
              <Text style={styles.titulo}>SEU PEDIDO</Text>
            </View>

            <View style={styles.cardPedido}>
              <View style={styles.cabecalhoTabela}>
                <Text style={styles.tabelaTitulo}>PRODUTO</Text>
                <Text style={styles.tabelaTitulo}>SUBTOTAL</Text>
              </View>

              {itens.map((item, index) => (
                <View
                  key={String(item.id ?? index)}
                  style={styles.produtoLinha}
                >
                  <View style={styles.produtoInfo}>
                    <Text style={styles.nomeProduto}>
                      {item.nome || "Produto"}
                    </Text>
                    {Array.isArray(item.descricao) ? (
                      item.descricao.map((descricao, i) => (
                        <Text
                          key={i}
                          style={styles.descricaoProduto}
                        >
                          • {descricao}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.descricaoProduto}>
                        {item.quantidade || 1} {item.unidade || "unidade(s)"}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.precoProduto}>
                    R$ {moeda(
                      converterPreco(item.preco) *
                        Math.max(1, Number(item.quantidade) || 1)
                    )}
                  </Text>
                </View>
              ))}

              <View style={styles.rodapeTabela}>
                <Text style={styles.subtotalTitulo}>Subtotal</Text>
                <Text style={styles.subtotalValor}>
                  R$ {moeda(subtotal)}
                </Text>
              </View>
            </View>

            <Text style={styles.tituloPagamento}>
              Formas de Pagamento:
            </Text>

            <View style={styles.metodos}>
              <OpcaoPagamento tipo="credito" titulo="Cartão de Crédito" />
              <OpcaoPagamento tipo="debito" titulo="Cartão de Débito" />
              <OpcaoPagamento tipo="pix" titulo="Pix" />
            </View>

            {pagamento === "pix" ? (
              <View style={styles.areaPix}>
                <View style={styles.logoPix}>
                  <Ionicons name="qr-code-outline" size={20} color={VERDE} />
                  <Text style={styles.textoLogoPix}>Pix</Text>
                </View>
                <View style={styles.qrDemo}>
                  <Ionicons name="qr-code-outline" size={112} color="#111111" />
                  <Text style={styles.textoQrDemo}>Demonstração</Text>
                </View>
                <Text style={styles.rotuloPix}>Copie e Cole</Text>
                <View style={styles.codigoPix}>
                  <Text style={styles.textoCodigoPix}>
                    Pix indisponível nesta demonstração
                  </Text>
                  <Ionicons name="copy-outline" size={17} color={VERDE} />
                </View>
              </View>
            ) : (
              <View style={styles.formaCartao}>
                <View style={styles.marcasCartao}>
                  <Text style={styles.marcaMastercard}>●●</Text>
                  <Text style={styles.marcaVisa}>VISA</Text>
                </View>

                <Text style={styles.rotuloCartao}>Nome do titular</Text>
                <TextInput
                  style={styles.campoCartao}
                  value={dadosCartao.titular}
                  onChangeText={(valor) => atualizarDadoCartao("titular", valor)}
                  placeholder="Nome como impresso no cartão"
                  placeholderTextColor="#969696"
                  autoCapitalize="characters"
                />

                <Text style={styles.rotuloCartao}>CPF/CNPJ do titular</Text>
                <TextInput
                  style={styles.campoCartao}
                  value={dadosCartao.documento}
                  onChangeText={(valor) => atualizarDadoCartao("documento", valor)}
                  placeholder="Apenas números"
                  placeholderTextColor="#969696"
                  keyboardType="numeric"
                  maxLength={14}
                />

                <Text style={styles.rotuloCartao}>Número do cartão</Text>
                <TextInput
                  style={styles.campoCartao}
                  value={dadosCartao.numero}
                  onChangeText={(valor) => atualizarDadoCartao("numero", valor)}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#969696"
                  keyboardType="numeric"
                  maxLength={19}
                />

                <View style={styles.linhaCartao}>
                  <View style={styles.campoCartaoMetade}>
                    <Text style={styles.rotuloCartao}>Validade (Mês)</Text>
                    <TextInput
                      style={styles.campoCartao}
                      value={dadosCartao.mes}
                      onChangeText={(valor) => atualizarDadoCartao("mes", valor)}
                      placeholder="Mês"
                      placeholderTextColor="#969696"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.campoCartaoMetade}>
                    <Text style={styles.rotuloCartao}>Validade (Ano)</Text>
                    <TextInput
                      style={styles.campoCartao}
                      value={dadosCartao.ano}
                      onChangeText={(valor) => atualizarDadoCartao("ano", valor)}
                      placeholder="Ano"
                      placeholderTextColor="#969696"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  <View style={styles.campoCartaoMetade}>
                    <Text style={styles.rotuloCartao}>CVV</Text>
                    <TextInput
                      style={styles.campoCartao}
                      value={dadosCartao.cvv}
                      onChangeText={(valor) => atualizarDadoCartao("cvv", valor)}
                      placeholder="CVV"
                      placeholderTextColor="#969696"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.avisoDemoCompacto}>
              Demonstração: nenhum pagamento será processado.
            </Text>

            <TouchableOpacity
              style={styles.areaTermos}
              onPress={() => setConfirmouSimulacao(!confirmouSimulacao)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  confirmouSimulacao && styles.checkboxMarcado,
                ]}
              >
                {confirmouSimulacao && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.textoTermos}>
                Li e concordo que esta é uma demonstração e que não haverá cobrança.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoFinalizar,
                finalizando && styles.botaoFinalizarDesabilitado,
              ]}
              onPress={finalizarCompra}
              disabled={finalizando}
              activeOpacity={0.85}
            >
              {finalizando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoFinalizar}>
                  {fluxoCarrinho ? "Concluir doação" : "Finalizar Compra"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  voltar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8EADD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "800",
    color: VERDE,
  },

  cardPedido: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B5C9AB",
    borderRadius: 5,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },

  cabecalhoTabela: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#DADADA",
  },

  tabelaTitulo: {
    fontSize: 12,
    color: "#222222",
  },

  produtoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  produtoInfo: {
    flex: 1,
    marginRight: 10,
  },

  nomeProduto: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
    marginBottom: 4,
  },

  descricaoProduto: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 13,
  },

  precoProduto: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  rodapeTabela: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 13,
  },

  subtotalTitulo: {
    fontSize: 13,
    color: "#222222",
  },

  subtotalValor: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },

  avisoDemo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    marginTop: 7,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#EAF2E5",
  },

  avisoDemoTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: VERDE,
  },

  cardMetodoDemo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DDD6",
    backgroundColor: "#FFFFFF",
  },

  textoMetodoDemo: {
    flex: 1,
    color: "#555D55",
    fontSize: 12,
    lineHeight: 18,
  },

  tituloPagamento: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 8,
  },

  metodos: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 18,
  },

  opcaoPagamento: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  textoOpcao: {
    fontSize: 11,
    color: "#222222",
  },

  radio: {
    width: 15,
    height: 15,
    borderWidth: 1.2,
    borderColor: "#333333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  radioSelecionado: {
    borderColor: "#494BFF",
  },

  radioInterno: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#494BFF",
  },

  areaTermos: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 19,
    gap: 8,
  },

  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: "#777777",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxMarcado: {
    backgroundColor: VERDE_BOTAO,
    borderColor: VERDE_BOTAO,
  },

  textoTermos: {
    flex: 1,
    fontSize: 11,
    color: "#202020",
  },

  botaoFinalizar: {
    backgroundColor: VERDE_BOTAO,
    height: 45,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
  },
  botaoFinalizarDesabilitado: {
    opacity: 0.65,
  },

  textoFinalizar: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  formaCartao: {
    marginTop: 2,
  },

  marcasCartao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  marcaMastercard: {
    color: "#E94B35",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -6,
    width: 30,
  },

  marcaVisa: {
    color: "#3155A4",
    fontSize: 12,
    fontWeight: "800",
    fontStyle: "italic",
  },

  rotuloCartao: {
    color: "#222222",
    fontSize: 9,
    marginBottom: 3,
  },

  campoCartao: {
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  placeholderCartao: {
    color: "#969696",
    fontSize: 9,
  },

  linhaCartao: {
    flexDirection: "row",
    gap: 7,
  },

  campoCartaoMetade: {
    flex: 1,
    minWidth: 0,
  },

  areaPix: {
    alignItems: "center",
    marginTop: 2,
  },

  logoPix: {
    minWidth: 62,
    height: 31,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#AAAAAA",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  textoLogoPix: {
    fontSize: 12,
    fontWeight: "700",
    color: "#222222",
  },

  qrDemo: {
    width: 142,
    height: 142,
    marginTop: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },

  textoQrDemo: {
    color: "#777777",
    fontSize: 9,
    marginTop: 3,
  },

  rotuloPix: {
    alignSelf: "flex-start",
    color: "#222222",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 9,
    marginBottom: 4,
  },

  codigoPix: {
    minHeight: 31,
    width: "100%",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#BBBBBB",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  textoCodigoPix: {
    color: "#777777",
    fontSize: 9,
  },

  avisoDemoCompacto: {
    color: "#666666",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 7,
    textAlign: "center",
  },

  finalizado: {
    flex: 1,
    paddingTop: 3,
  },

  tituloFinalizado: {
    color: VERDE,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 15,
  },

  ilustracaoFinalizado: {
    height: 125,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  seloFinalizado: {
    position: "absolute",
    top: 10,
    left: "50%",
    marginLeft: -18,
    backgroundColor: "#DDF4EB",
    borderRadius: 20,
  },

  tituloDetalhado: {
    color: "#151515",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  confirmacaoDemo: {
    color: "#5C665C",
    fontSize: 11,
    marginBottom: 10,
  },
});