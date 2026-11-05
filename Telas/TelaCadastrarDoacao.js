
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebaseDb";
import { auth } from "../firebase";

// =====================================
// CORES
// =====================================

const VERDE = "#006838";
const VERDE_BOTAO = "#378B20";
const FUNDO = "#FFFCF6";

// =====================================
// OPÇÕES DE CADASTRO
// =====================================

const CATEGORIAS = [
  "Mercearia",
  "Hortifruti",
  "Bebidas",
];

const UNIDADES = [
  "unidades",
  "kg",
  "pacotes",
  "litros",
  "cestas",
];

// =====================================
// ALIMENTOS PERMITIDOS
// =====================================

const VERDURAS = [
  "alface",
  "cenoura",
  "tomate",
  "batata",
  "cebola",
  "couve",
  "repolho",
  "brocolis",
  "beterraba",
  "pepino",
  "abobrinha",
  "chuchu",
  "abobora",
  "mandioca",
  "espinafre",
  "rucula",
  "pimentao",
  "vagem",
];

const MERCEARIA = [
  "cesta basica",
  "arroz",
  "feijao",
  "macarrao",
  "oleo",
  "acucar",
  "sal",
  "farinha",
  "cafe",
  "biscoito",
  "bolacha",
  "aveia",
  "fuba",
  "milho",
  "lentilha",
  "grao de bico",
  "sardinha em conserva",
  "atum em conserva",
  "extrato de tomate",
  "molho de tomate",
];

const RETIRADOS = [
  "suco",
  "banana",
  "maca",
  "pao",
  "paes",
  "bolo",
  "marmita",
  "sanduiche",
  "carne",
  "frango",
  "peixe",
  "queijo",
  "iogurte",
];

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function contemProduto(nome, lista) {
  return lista.some(
    (item) =>
      nome === item ||
      nome.startsWith(item + " ") ||
      nome.startsWith(item + "-")
  );
}

// VALIDAR ALIMENTOS DO CATÁLOGO
function validarCatalogo(nome, categoria) {
  const texto = normalizar(nome);

  const alimentosRetirados =
    /\b(suco|banana|bananas|maca|macas|pao|paes|bolo|bolos|marmita|marmitas|sanduiche|sanduiches|carne|frango|peixe|queijo|iogurte)\b/;

  if (alimentosRetirados.test(texto)) {
    return "Esse alimento não faz parte do catálogo atual.";
  }

  if (categoria === "Hortifruti") {
    if (!contemProduto(texto, VERDURAS)) {
      return "Nesta categoria, cadastre somente verduras ou legumes.";
    }

    return null;
  }

  if (categoria === "Bebidas") {
    const bebidaValida =
      texto.includes("agua mineral") ||
      texto.includes("agua potavel") ||
      texto.includes("leite uht") ||
      texto.includes("leite longa vida");

    if (!bebidaValida) {
      return "Em Bebidas, são aceitos água mineral e leite UHT longa vida.";
    }

    return null;
  }

  if (categoria === "Mercearia") {
    if (!contemProduto(texto, MERCEARIA)) {
      return "Cadastre a cesta básica ou um alimento de mercearia permitido.";
    }

    return null;
  }

  return "Selecione uma categoria válida.";
}

// VALIDAR DATA AAAA-MM-DD
function dataEhValida(texto) {
  if (!texto) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }

  const [ano, mes, dia] = texto
    .split("-")
    .map(Number);

  const data = new Date(ano, mes - 1, dia);

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

// =====================================
// CAMPO DO FORMULÁRIO
// =====================================

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  maxLength = 100,
}) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#969F96"
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={
          multiline ? "top" : "center"
        }
        style={[
          styles.campo,
          multiline && styles.campoMultilinha,
        ]}
      />
    </View>
  );
}

// =====================================
// TELA DE CADASTRO DE DOAÇÃO
// =====================================

export default function TelaCadastrarDoacao({
  navigation,
}) {
  // DADOS
  const [nome, setNome] = useState("");

  const [
    estabelecimento,
    setEstabelecimento,
  ] = useState("");

  const [categoria, setCategoria] =
    useState("Mercearia");

  const [quantidade, setQuantidade] =
    useState("");

  const [unidade, setUnidade] =
    useState("unidades");

  const [cidade, setCidade] =
    useState("Suzano - SP");

  const [descricao, setDescricao] =
    useState("");

  const [validade, setValidade] =
    useState("");

  // CONTROLES
  const [confirmou, setConfirmou] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  // =====================================
  // SALVAR DOAÇÃO NO FIRESTORE
  // =====================================

  async function salvar() {
    if (salvando) return;

    setErro("");
    Keyboard.dismiss();

    const nomeLimpo = nome.trim();

    const estabelecimentoLimpo =
      estabelecimento.trim();

    const cidadeLimpa = cidade.trim();

    const descricaoLimpa =
      descricao.trim();

    const validadeLimpa =
      validade.trim();

    const quantidadeNumero = Number(
      quantidade.replace(",", ".")
    );

    // CAMPOS OBRIGATÓRIOS
    if (
      nomeLimpo.length < 3 ||
      !estabelecimentoLimpo ||
      !cidadeLimpa ||
      !quantidade.trim()
    ) {
      setErro(
        "Preencha todos os campos obrigatórios."
      );
      return;
    }

    // TAMANHO DOS CAMPOS
    if (
      nomeLimpo.length > 100 ||
      estabelecimentoLimpo.length > 100 ||
      cidadeLimpa.length > 100 ||
      descricaoLimpa.length > 300
    ) {
      setErro(
        "Um dos campos ultrapassou o limite de caracteres."
      );
      return;
    }

    // QUANTIDADE
    if (
      !Number.isFinite(quantidadeNumero) ||
      quantidadeNumero <= 0 ||
      quantidadeNumero > 10000
    ) {
      setErro(
        "Digite uma quantidade entre 0 e 10.000."
      );
      return;
    }

    // VALIDADE
    if (!dataEhValida(validadeLimpa)) {
      setErro(
        "Digite a validade no formato AAAA-MM-DD."
      );
      return;
    }

    // NÃO PERMITIR ALIMENTOS VENCIDOS
    if (validadeLimpa) {
      const agora = new Date();

      const hoje = [
        agora.getFullYear(),
        String(
          agora.getMonth() + 1
        ).padStart(2, "0"),
        String(
          agora.getDate()
        ).padStart(2, "0"),
      ].join("-");

      if (validadeLimpa < hoje) {
        setErro(
          "Não é permitido cadastrar alimentos vencidos."
        );
        return;
      }
    }

    // VERIFICAR CATÁLOGO
    const erroCatalogo = validarCatalogo(
      nomeLimpo,
      categoria
    );

    if (erroCatalogo) {
      setErro(erroCatalogo);
      return;
    }

    // CONFIRMAR CONSERVAÇÃO
    if (!confirmou) {
      setErro(
        "Confirme que o alimento está próprio para consumo."
      );
      return;
    }

    // CONTA AUTENTICADA
    const usuario = auth.currentUser;

    if (!usuario) {
      setErro(
        "Faça login novamente para cadastrar."
      );
      return;
    }

    setSalvando(true);

    try {
      await addDoc(
        collection(db, "alimentos"),
        {
          nome: nomeLimpo,

          estabelecimento:
            estabelecimentoLimpo,

          categoria,

          quantidade:
            quantidadeNumero,

          unidade,

          cidade: cidadeLimpa,

          descricao:
            descricaoLimpa,

          validade:
            validadeLimpa,

          // DOAÇÃO GRATUITA
          preco: "Gratuito",
          precoAntigo: "",

          // PREÇO OPCIONAL
          precoReferencia: null,
          precoUnidade: "",

          // A HOME IDENTIFICA A IMAGEM
          // PELO NOME DO ALIMENTO
          imagemChave: "",

          status: "disponivel",
          demonstracao: false,

          criadoPor:
            usuario.uid,

          criadoEm:
            serverTimestamp(),
        }
      );

      navigation.goBack();
    } catch (erroFirebase) {
      console.error(
        "Erro ao cadastrar doação:",
        erroFirebase
      );

      setErro(
        erroFirebase.code === "permission-denied"
          ? "Permissão negada. Confira as regras do Firestore."
          : "Não foi possível salvar a doação."
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================
  // INTERFACE
  // =====================================

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.conteudo
          }
        >
          {/* VOLTAR */}
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={VERDE}
            />

            <Text style={styles.voltarTexto}>
              Voltar
            </Text>
          </TouchableOpacity>

          {/* CABEÇALHO */}
          <Text style={styles.titulo}>
            Cadastrar doação
          </Text>

          <Text style={styles.subtitulo}>
            Cadastre cestas básicas completas,
            alimentos separados, água mineral,
            leite longa vida, verduras ou legumes.
          </Text>

          {/* NOME */}
          <Campo
            label="Nome do alimento *"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Cesta Básica ou Arroz 1 kg"
          />

          {/* DOADOR */}
          <Campo
            label="Doador ou estabelecimento *"
            value={estabelecimento}
            onChangeText={setEstabelecimento}
            placeholder="Ex.: Mercado Comunitário"
          />

          {/* CATEGORIA */}
          <Text style={styles.label}>
            Categoria *
          </Text>

          <View style={styles.chips}>
            {CATEGORIAS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategoria(item)}
                style={[
                  styles.chip,
                  categoria === item &&
                    styles.chipAtivo,
                ]}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    categoria === item &&
                      styles.chipTextoAtivo,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* QUANTIDADE */}
          <Campo
            label="Quantidade *"
            value={quantidade}
            onChangeText={setQuantidade}
            placeholder="Ex.: 10 ou 2,5"
            keyboardType="decimal-pad"
          />

          {/* UNIDADE */}
          <Text style={styles.label}>
            Unidade *
          </Text>

          <View style={styles.chips}>
            {UNIDADES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setUnidade(item)}
                style={[
                  styles.chip,
                  unidade === item &&
                    styles.chipAtivo,
                ]}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    unidade === item &&
                      styles.chipTextoAtivo,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CIDADE */}
          <Campo
            label="Cidade *"
            value={cidade}
            onChangeText={setCidade}
            placeholder="Ex.: Suzano - SP"
          />

          {/* VALIDADE */}
          <Campo
            label="Validade (opcional)"
            value={validade}
            onChangeText={setValidade}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />

          {/* DESCRIÇÃO */}
          <Campo
            label="Descrição (opcional)"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Informe conservação, embalagem e outros detalhes."
            multiline
            maxLength={300}
          />

          {/* CONFIRMAÇÃO */}
          <TouchableOpacity
            style={styles.confirmar}
            onPress={() =>
              setConfirmou(!confirmou)
            }
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: confirmou,
            }}
          >
            <Ionicons
              name={
                confirmou
                  ? "checkbox"
                  : "square-outline"
              }
              size={22}
              color={VERDE}
            />

            <Text style={styles.confirmarTexto}>
              Confirmo que o alimento está próprio
              para consumo e foi armazenado
              adequadamente.
            </Text>
          </TouchableOpacity>

          {/* ERRO */}
          {!!erro && (
            <Text style={styles.erro}>
              {erro}
            </Text>
          )}

          {/* SALVAR */}
          <TouchableOpacity
            style={styles.salvar}
            onPress={salvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.salvarTexto}>
                Salvar doação no Firestore
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.observacao}>
            As doações reais devem passar por
            conferência antes de serem disponibilizadas
            para retirada.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================
// ESTILOS
// =====================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  conteudo: {
    width: "100%",
    maxWidth: 510,
    alignSelf: "center",
    paddingHorizontal: 23,
    paddingTop: 12,
    paddingBottom: 40,
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 17,
  },

  voltarTexto: {
    color: VERDE,
    fontWeight: "700",
  },

  titulo: {
    fontSize: 26,
    color: VERDE,
    fontWeight: "800",
  },

  subtitulo: {
    color: "#738273",
    marginTop: 6,
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 20,
  },

  grupo: {
    marginBottom: 16,
  },

  label: {
    color: VERDE,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 7,
  },

  campo: {
    height: 47,
    borderWidth: 1,
    borderColor: "#D5E2D0",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    color: "#202820",
    paddingHorizontal: 13,
    fontSize: 13,
  },

  campoMultilinha: {
    height: 90,
    paddingTop: 12,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  chip: {
    paddingHorizontal: 13,
    minHeight: 35,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#AAC7A3",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },

  chipAtivo: {
    backgroundColor: "#DCF0D4",
    borderColor: VERDE,
  },

  chipTexto: {
    fontSize: 12,
    color: "#354535",
  },

  chipTextoAtivo: {
    color: VERDE,
    fontWeight: "800",
  },

  confirmar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 5,
    marginBottom: 19,
  },

  confirmarTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: "#355F3D",
  },

  erro: {
    color: "#B3261E",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 15,
  },

  salvar: {
    backgroundColor: VERDE_BOTAO,
    minHeight: 49,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  salvarTexto: {
    fontWeight: "800",
    fontSize: 14,
    color: "#FFFFFF",
  },

  observacao: {
    marginTop: 14,
    fontSize: 11,
    textAlign: "center",
    color: "#777777",
    lineHeight: 18,
  },
});
