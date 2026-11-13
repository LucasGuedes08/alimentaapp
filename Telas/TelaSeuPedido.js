
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { auth } from "../firebase";
import { concluirDoacaoCarrinho } from "../utils/carrinhoDoacoes";
import { calcularTotalCarrinho } from "../utils/carrinhoCalculos";
import {
  calcularParcelamento,
  formatarReaisCentavos,
  formatarValidadeCartao,
  obterLimiteParcelas,
  validarFormularioPagamento,
} from "../utils/pagamentoSimulado";

const VERDE = "#006838";
const VERDE_BOTAO = "#348F20";
const FUNDO = "#FFFCF6";
const CODIGO_PIX_DEMONSTRACAO =
  "ALIMENTAMAIS-PIX-DEMONSTRACAO-TCC-2026";

const BANDEIRAS_CARTAO = [
  { id: "elo", nome: "Elo", imagem: require("../assets/images/bandeirasCartao/elo.png") },
  { id: "mastercard", nome: "Mastercard", imagem: require("../assets/images/bandeirasCartao/master.png") },
  { id: "visa", nome: "Visa", imagem: require("../assets/images/bandeirasCartao/visa.png") },
];

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

function formatarNumeroCartao(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 16);
  return numeros.replace(/(\d{4})(?=\d)/g, "$1 ");
}

const DADOS_CARTAO_VAZIOS = {
  titular: "",
  numero: "",
  validade: "",
  cvv: "",
};

function ResumoPagamento({ tipo, subtotalCentavos, parcelamento }) {
  const credito = tipo === "credito";
  const pix = tipo === "pix";
  const selo = pix
    ? "Sem taxas"
    : credito && parcelamento.jurosPercentual > 0
      ? `Juros: ${parcelamento.jurosPercentual}%`
      : "Sem juros";
  const valorPrincipal = credito
    ? `${parcelamento.parcelas}x de ${formatarReaisCentavos(
        parcelamento.valorParcelaCentavos
      )}`
    : formatarReaisCentavos(subtotalCentavos);
  const acessibilidade = pix
    ? `Pagamento via Pix, sem taxas. Valor da doação simulada ${valorPrincipal}. Pagamento à vista.`
    : credito
    ? `Pagamento no crédito. ${selo}. ${valorPrincipal}. Total com juros ${formatarReaisCentavos(
        parcelamento.totalCentavos
      )}.`
    : `Pagamento no débito, sem juros. Você pagará à vista ${valorPrincipal}.`;

  return (
    <View
      style={styles.resumoPagamento}
      accessibilityRole="summary"
      accessibilityLabel={acessibilidade}
    >
      <View style={styles.cabecalhoResumoPagamento}>
        <View style={styles.tituloResumoPagamento}>
          <Ionicons
            name={pix ? "qr-code-outline" : "card-outline"}
            size={23}
            color={VERDE}
          />
          <Text style={styles.textoTituloResumoPagamento}>
            {pix
              ? "Pagamento via Pix"
              : `Pagamento no ${credito ? "crédito" : "débito"}`}
          </Text>
        </View>
        <View style={styles.seloResumoPagamento}>
          <Text style={styles.textoSeloResumoPagamento}>{selo}</Text>
        </View>
      </View>

      <View style={styles.divisorResumoPagamento} />

      <View style={styles.conteudoResumoPagamento}>
        <View style={styles.valoresResumoPagamento}>
          <Text style={styles.textoVocePagara}>
            {pix
              ? "Valor da doação simulada"
              : credito
                ? "Você pagará:"
                : "Você pagará à vista"}
          </Text>
          <Text style={styles.valorResumoPagamento}>{valorPrincipal}</Text>
          {pix && (
            <Text style={styles.totalResumoPagamento}>Pagamento à vista</Text>
          )}
          {credito && (
            <>
              <Text style={styles.totalResumoPagamento}>
                Total com juros:{" "}
                {formatarReaisCentavos(parcelamento.totalCentavos)}
              </Text>
              {parcelamento.parcelas > 1 &&
                parcelamento.ultimaParcelaCentavos !==
                  parcelamento.valorParcelaCentavos && (
                  <Text style={styles.notaUltimaParcela}>
                    Última parcela:{" "}
                    {formatarReaisCentavos(
                      parcelamento.ultimaParcelaCentavos
                    )}
                  </Text>
                )}
            </>
          )}
        </View>
        <View style={styles.iconeResumoPagamento} accessible={false}>
          <Ionicons
            name={pix ? "qr-code-outline" : "card-outline"}
            size={46}
            color="#79B879"
          />
          <View style={styles.checkResumoPagamento}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TelaSeuPedido({ navigation, route }) {
  const [pagamento, setPagamento] = useState("debito");
  const [bandeirasSelecionadas, setBandeirasSelecionadas] = useState({
    credito: "mastercard",
    debito: "mastercard",
  });
  const [confirmouSimulacao, setConfirmouSimulacao] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");
  const [avisoValidacao, setAvisoValidacao] = useState("");
  const [codigoPixCopiado, setCodigoPixCopiado] = useState(false);
  const [copiandoCodigoPix, setCopiandoCodigoPix] = useState(false);
  const [parcelas, setParcelas] = useState(1);
  const finalizacaoIniciada = useRef(false);
  const timerCodigoCopiado = useRef(null);
  const [dadosCartao, setDadosCartao] = useState(DADOS_CARTAO_VAZIOS);

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
  const limiteParcelas = obterLimiteParcelas(subtotal);
  const parcelamento = calcularParcelamento(subtotal, parcelas);
  const bandeiraSelecionada = bandeirasSelecionadas[pagamento];

  useEffect(() => {
    if (parcelas > limiteParcelas) {
      setParcelas(1);
    }
  }, [limiteParcelas, parcelas]);

  useEffect(
    () => () => {
      if (timerCodigoCopiado.current) {
        clearTimeout(timerCodigoCopiado.current);
      }
    },
    []
  );

  function selecionarPagamento(tipo) {
    setPagamento(tipo);
    setDadosCartao(DADOS_CARTAO_VAZIOS);
    setErroValidacao("");
    setAvisoValidacao("");
  }

  function selecionarBandeira(bandeira) {
    setBandeirasSelecionadas((atuais) => ({
      ...atuais,
      [pagamento]: bandeira,
    }));
  }

  async function copiarCodigoPix() {
    if (copiandoCodigoPix) return;

    setCopiandoCodigoPix(true);
    try {
      await Clipboard.setStringAsync(CODIGO_PIX_DEMONSTRACAO);
      setAvisoValidacao("");
      setCodigoPixCopiado(true);
      if (timerCodigoCopiado.current) {
        clearTimeout(timerCodigoCopiado.current);
      }
      timerCodigoCopiado.current = setTimeout(() => {
        setCodigoPixCopiado(false);
        timerCodigoCopiado.current = null;
      }, 2200);
    } catch (erroCopia) {
      console.error("Não foi possível copiar o código Pix demonstrativo:", erroCopia);
      setCodigoPixCopiado(false);
      setAvisoValidacao(
        "Não foi possível copiar o código Pix. Tente novamente."
      );
    } finally {
      setCopiandoCodigoPix(false);
    }
  }

  function validarFormulario() {
    if (pagamento === "pix") {
      return confirmouSimulacao
        ? ""
        : "Marque a confirmação de que entende que esta é uma demonstração sem cobrança.";
    }

    const erros = validarFormularioPagamento({
      pagamento,
      dadosCartao,
      confirmouSimulacao,
      bandeiraSelecionada,
      parcelas,
      limiteParcelas,
      parcelasCalculadas: parcelamento.parcelas,
    });

    if (erros.length === 0) return "";
    if (erros.length === 1) return erros[0];
    return "Verifique os dados informados. Preencha corretamente todos os campos obrigatórios e aceite os termos para continuar.";
  }

  const formularioCartaoValido = validarFormulario() === "";

  async function finalizarCompra() {
    if (finalizando) return;

    const erro = validarFormulario();
    if (erro) {
      if (pagamento === "pix") {
        setAvisoValidacao(
          "Você precisa aceitar os termos da demonstração para continuar."
        );
      } else {
        setAvisoValidacao(erro);
      }
      return;
    }

    setErroValidacao("");
    setAvisoValidacao("");

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

    const subtotalCentavos = Math.round(subtotal * 100);
    const totalCentavos =
      pagamento === "credito"
        ? parcelamento.totalCentavos
        : subtotalCentavos;

    setDadosCartao(DADOS_CARTAO_VAZIOS);
    navigation.replace("TelaConfirmacaoDoacaoSimulada", {
      subtotalCentavos,
      totalCentavos,
      pagamento,
      status: pagamento === "pix" ? "Simulação concluída" : undefined,
      parcelas: pagamento === "credito" ? parcelamento.parcelas : undefined,
      valorParcelaCentavos:
        pagamento === "credito"
          ? parcelamento.valorParcelaCentavos
          : undefined,
      ultimaParcelaCentavos:
        pagamento === "credito"
          ? parcelamento.ultimaParcelaCentavos
          : undefined,
      jurosPercentual:
        pagamento === "credito" ? parcelamento.jurosPercentual : 0,
    });
  }

  function atualizarDadoCartao(campo, valor) {
    setErroValidacao("");
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
        onPress={() => selecionarPagamento(tipo)}
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
                <ResumoPagamento
                  tipo="pix"
                  subtotalCentavos={Math.round(subtotal * 100)}
                  parcelamento={parcelamento}
                />
                <View style={styles.cartaoQrPix}>
                  <Text style={styles.tituloQrPix}>Escaneie o QR Code</Text>
                  <View
                    style={styles.qrDemo}
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel="QR Code ilustrativo não escaneável"
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={112}
                      color="#31245F"
                    />
                  </View>
                  <View style={styles.seloQrPix}>
                    <Text style={styles.textoSeloQrPix}>
                      QR Code ilustrativo — não escaneável
                    </Text>
                  </View>
                  <Text style={styles.mensagemQrPix}>
                    Este código é apenas uma representação visual para a
                    apresentação do TCC.
                  </Text>
                </View>
                <View style={styles.blocoPixCopiaCola}>
                  <Text style={styles.tituloPixCopiaCola}>
                    Pix Copia e Cola
                  </Text>
                  <View style={styles.campoPixCopiaCola}>
                    <Text style={styles.codigoPixDemonstracao}>
                      {CODIGO_PIX_DEMONSTRACAO}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.botaoCopiarPix,
                        codigoPixCopiado && styles.botaoPixCopiado,
                      ]}
                      onPress={copiarCodigoPix}
                      disabled={copiandoCodigoPix}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={
                        codigoPixCopiado
                          ? "Código Pix copiado"
                          : "Copiar código Pix demonstrativo"
                      }
                    >
                      <Ionicons
                        name={codigoPixCopiado ? "checkmark" : "copy-outline"}
                        size={codigoPixCopiado ? 16 : 20}
                        color={VERDE}
                      />
                      {codigoPixCopiado && (
                        <Text style={styles.textoPixCopiado}>Copiado!</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.avisoCodigoFicticio}>
                    Este código é fictício e utilizado apenas para demonstração.
                    Nenhum pagamento será realizado.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.formaCartao}>
                <View style={styles.marcasCartao}>
                  {BANDEIRAS_CARTAO.map((bandeira) => {
                    const selecionada = bandeiraSelecionada === bandeira.id;

                    return (
                      <TouchableOpacity
                        key={bandeira.id}
                        style={[
                          styles.itemBandeira,
                          selecionada && styles.itemBandeiraSelecionado,
                          !selecionada && styles.itemBandeiraApagado,
                        ]}
                        onPress={() => selecionarBandeira(bandeira.id)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar bandeira ${bandeira.nome}`}
                        accessibilityState={{ selected: selecionada }}
                      >
                        <Image
                          source={bandeira.imagem}
                          style={[
                            styles.imagemBandeira,
                            bandeira.id === "elo" && styles.imagemElo,
                            bandeira.id === "mastercard" &&
                              styles.imagemMastercard,
                          ]}
                          resizeMode="contain"
                          accessible={false}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.rotuloCartao}>Nome do titular</Text>
                <TextInput
                  style={styles.campoCartao}
                  value={dadosCartao.titular}
                  onChangeText={(valor) =>
                    atualizarDadoCartao(
                      "titular",
                      valor.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "")
                    )
                  }
                  placeholder="Nome fictício"
                  placeholderTextColor="#969696"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />

                <Text style={styles.rotuloCartao}>Número do cartão</Text>
                <TextInput
                  style={styles.campoCartao}
                  value={dadosCartao.numero}
                  onChangeText={(valor) =>
                    atualizarDadoCartao("numero", formatarNumeroCartao(valor))
                  }
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#969696"
                  keyboardType="numeric"
                  maxLength={19}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />

                <View style={styles.linhaCartao}>
                  <View style={styles.campoCartaoMetade}>
                    <Text style={styles.rotuloCartao}>Validade</Text>
                    <TextInput
                      style={styles.campoCartao}
                      value={dadosCartao.validade}
                      onChangeText={(valor) =>
                        atualizarDadoCartao(
                          "validade",
                          formatarValidadeCartao(valor)
                        )
                      }
                      placeholder="MM/AA"
                      placeholderTextColor="#969696"
                      keyboardType="numeric"
                      maxLength={5}
                      autoComplete="off"
                      textContentType="none"
                      importantForAutofill="no"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={styles.campoCartaoMetade}>
                    <Text style={styles.rotuloCartao}>CVV</Text>
                    <TextInput
                      style={styles.campoCartao}
                      value={dadosCartao.cvv}
                      onChangeText={(valor) =>
                        atualizarDadoCartao(
                          "cvv",
                          valor.replace(/\D/g, "").slice(0, 3)
                        )
                      }
                      placeholder="CVV"
                      placeholderTextColor="#969696"
                      keyboardType="numeric"
                      maxLength={3}
                      autoComplete="off"
                      textContentType="none"
                      importantForAutofill="no"
                      autoCorrect={false}
                      secureTextEntry
                    />
                  </View>
                </View>

                {pagamento === "debito" && (
                  <ResumoPagamento
                    tipo="debito"
                    subtotalCentavos={Math.round(subtotal * 100)}
                    parcelamento={parcelamento}
                  />
                )}

                {pagamento === "credito" && (
                  <>
                    <View style={styles.parcelamento}>
                      <View style={styles.tituloParcelamento}>
                        <Ionicons
                          name="card-outline"
                          size={20}
                          color="#494BFF"
                        />
                        <Text style={styles.textoTituloParcelamento}>
                          Escolha o parcelamento
                        </Text>
                      </View>
                      <View style={styles.opcoesParcelamento}>
                        {Array.from(
                          { length: limiteParcelas },
                          (_, indice) => indice + 1
                        ).map(
                          (quantidade) => {
                            const selecionada = parcelas === quantidade;
                            const juros =
                              calcularParcelamento(subtotal, quantidade)
                                .jurosPercentual;

                            return (
                              <TouchableOpacity
                                key={quantidade}
                                style={[
                                  styles.opcaoParcela,
                                  selecionada && styles.opcaoParcelaSelecionada,
                                ]}
                                onPress={() => setParcelas(quantidade)}
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                accessibilityState={{ selected: selecionada }}
                                accessibilityLabel={
                                  quantidade === 1
                                    ? "1 parcela sem juros"
                                    : `${quantidade} parcelas com ${juros}% de juros`
                                }
                              >
                                <Text
                                  style={[
                                    styles.textoOpcaoParcela,
                                    selecionada &&
                                      styles.textoOpcaoParcelaSelecionada,
                                  ]}
                                >
                                  {quantidade}x
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                      {limiteParcelas === 1 && (
                        <Text style={styles.avisoParcelamentoMinimo}>
                          Parcelamento disponível para pedidos a partir de
                          {" "}R$ 50,00.
                        </Text>
                      )}
                    </View>

                    <ResumoPagamento
                      tipo="credito"
                      subtotalCentavos={Math.round(subtotal * 100)}
                      parcelamento={parcelamento}
                    />
                  </>
                )}
              </View>
            )}

            <Text style={styles.avisoDemoCompacto}>
              Use apenas dados fictícios. Os dados do cartão não são salvos nem enviados; nenhuma cobrança será feita.
            </Text>

            {!!erroValidacao && (
              <Text style={styles.erroValidacao} accessibilityRole="alert">
                {erroValidacao}
              </Text>
            )}

            <TouchableOpacity
              style={styles.areaTermos}
              onPress={() => {
                setConfirmouSimulacao(!confirmouSimulacao);
                setErroValidacao("");
              }}
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
                (finalizando || !formularioCartaoValido) &&
                  styles.botaoFinalizarDesabilitado,
              ]}
              onPress={finalizarCompra}
              disabled={finalizando}
              activeOpacity={0.85}
            >
              {finalizando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoFinalizar}>
                  Confirmar doação
                </Text>
              )}
            </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={Boolean(avisoValidacao) || codigoPixCopiado}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAvisoValidacao("");
          setCodigoPixCopiado(false);
        }}
        statusBarTranslucent
      >
        <View style={styles.modalSobreposicao}>
          <Pressable
            style={styles.fundoModal}
            onPress={() => {
              setAvisoValidacao("");
              setCodigoPixCopiado(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
          />
          <View
            style={styles.modalCartao}
            accessibilityRole="alert"
            accessibilityViewIsModal
          >
            <View
              style={[
                styles.modalIcone,
                codigoPixCopiado && styles.modalIconeSucesso,
              ]}
            >
              <Ionicons
                name={codigoPixCopiado ? "checkmark" : "alert-circle"}
                size={codigoPixCopiado ? 25 : 36}
                color={codigoPixCopiado ? VERDE : "#D58A16"}
              />
            </View>
            <Text style={styles.modalTitulo}>
              {codigoPixCopiado ? "Código copiado!" : "Atenção!"}
            </Text>
            <Text style={styles.modalMensagem}>
              {codigoPixCopiado
                ? "O código Pix de demonstração foi copiado com sucesso!"
                : avisoValidacao}
            </Text>
            <TouchableOpacity
              style={styles.modalBotao}
              onPress={() => {
                setAvisoValidacao("");
                setCodigoPixCopiado(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.modalTextoBotao}>Entendi</Text>
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
  },

  conteudo: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
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
    opacity: 0.5,
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
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
  },

  itemBandeira: {
    width: 48,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },

  itemBandeiraSelecionado: {
    borderColor: "#494BFF",
  },

  itemBandeiraApagado: {
    opacity: 0.4,
  },

  imagemBandeira: {
    width: 36,
    height: 20,
  },

  imagemElo: {
    width: 20,
  },

  imagemMastercard: {
    width: 33,
  },

  rotuloCartao: {
    color: "#222222",
    fontSize: 9,
    marginBottom: 3,
  },

  campoCartao: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#222222",
    fontSize: 14,
  },

  placeholderCartao: {
    color: "#969696",
    fontSize: 9,
  },

  linhaCartao: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  campoCartaoMetade: {
    flex: 1,
    minWidth: 0,
  },

  parcelamento: {
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C9BFFF",
    borderRadius: 12,
    backgroundColor: "#F7F4FF",
  },

  tituloParcelamento: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  textoTituloParcelamento: {
    flex: 1,
    color: "#29255B",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },

  opcoesParcelamento: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  opcaoParcela: {
    width: "21%",
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C9C6D9",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },

  opcaoParcelaSelecionada: {
    borderColor: "#494BFF",
    backgroundColor: "#EDEBFF",
  },

  textoOpcaoParcela: {
    color: "#494B58",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },

  textoOpcaoParcelaSelecionada: {
    color: "#3830A8",
    fontFamily: "Poppins_700Bold",
  },

  avisoParcelamentoMinimo: {
    color: "#66616F",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
  },

  resumoPagamento: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EAF5E4",
  },

  cabecalhoResumoPagamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  tituloResumoPagamento: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minWidth: 0,
  },

  textoTituloResumoPagamento: {
    flexShrink: 1,
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },

  seloResumoPagamento: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#C9EFC1",
  },

  textoSeloResumoPagamento: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  divisorResumoPagamento: {
    height: 1,
    marginTop: 11,
    backgroundColor: "#AFCDA7",
  },

  conteudoResumoPagamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 10,
  },

  valoresResumoPagamento: {
    flex: 1,
    minWidth: 0,
  },

  textoVocePagara: {
    color: "#454B45",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  valorResumoPagamento: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    lineHeight: 30,
    marginTop: 1,
  },

  totalResumoPagamento: {
    color: "#3D4B3D",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginTop: 3,
  },

  notaUltimaParcela: {
    color: "#596159",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },

  iconeResumoPagamento: {
    width: 58,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  checkResumoPagamento: {
    position: "absolute",
    left: 0,
    bottom: 1,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#EAF5E4",
    backgroundColor: VERDE_BOTAO,
  },

  erroValidacao: {
    color: "#B3261E",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },

  modalSobreposicao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(25, 30, 25, 0.48)",
  },

  fundoModal: {
    ...StyleSheet.absoluteFillObject,
  },

  modalCartao: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: 24,
    borderRadius: 18,
    backgroundColor: FUNDO,
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },

  modalIcone: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderRadius: 29,
    backgroundColor: "#FFF1D8",
  },

  modalIconeSucesso: {
    backgroundColor: "#DCEBE0",
  },

  modalTitulo: {
    color: VERDE,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    textAlign: "center",
  },

  modalMensagem: {
    color: "#454B45",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
  },

  modalBotao: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 23,
    backgroundColor: VERDE_BOTAO,
  },

  modalTextoBotao: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },

  areaPix: {
    width: "100%",
    gap: 10,
    marginTop: 2,
  },

  cartaoQrPix: {
    width: "100%",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#D6CEEF",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  tituloQrPix: {
    color: "#30245D",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    textAlign: "center",
  },

  qrDemo: {
    width: 148,
    height: 148,
    maxWidth: "100%",
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECE9F5",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  seloQrPix: {
    maxWidth: "100%",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0ECFF",
  },

  textoSeloQrPix: {
    color: "#43317D",
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    textAlign: "center",
  },

  mensagemQrPix: {
    width: "100%",
    marginTop: 8,
    color: "#66616F",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },

  blocoPixCopiaCola: {
    width: "100%",
    gap: 6,
  },

  tituloPixCopiaCola: {
    color: "#30245D",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  campoPixCopiaCola: {
    minHeight: 48,
    width: "100%",
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D6CEEF",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  codigoPixDemonstracao: {
    flex: 1,
    minWidth: 0,
    color: "#43317D",
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },

  botaoCopiarPix: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F0ECFF",
  },

  botaoPixCopiado: {
    width: 82,
    flexDirection: "row",
    gap: 3,
  },

  textoPixCopiado: {
    color: VERDE,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },

  avisoCodigoFicticio: {
    color: "#66616F",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  avisoDemoCompacto: {
    color: "#666666",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    textAlign: "center",
  },

});
