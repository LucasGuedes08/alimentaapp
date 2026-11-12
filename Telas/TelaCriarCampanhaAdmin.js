import React, {
  useState,
} from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebaseDb";
import { auth } from "../firebase";

import {
  CATEGORIAS_CAMPANHA,
  imagemCampanha,
  dataBRValida,
  moedaParaNumero,
} from "../utils/campanhasAdmin";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

// ========================================
// CRIAR CAMPANHA
// ========================================

export default function TelaCriarCampanhaAdmin({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const [nome, setNome] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState("");

  const [inicio, setInicio] =
    useState("");

  const [termino, setTermino] =
    useState("");

  const [meta, setMeta] =
    useState("");

  const [
    imagemChave,
    setImagemChave,
  ] = useState("cesta");

  const [
    mostrarCategorias,
    setMostrarCategorias,
  ] = useState(false);

  const [
    mostrarImagens,
    setMostrarImagens,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  // ========================================
  // CADASTRAR CAMPANHA NO FIRESTORE
  // ========================================

  async function criarCampanha() {
    if (salvando) return;

    setErro("");

    const dataInicio =
      dataBRValida(inicio);

    const dataTermino =
      dataBRValida(termino);

    const valorMeta =
      moedaParaNumero(meta);

    if (
      nome.trim().length < 3 ||
      descricao.trim().length < 10 ||
      !categoria
    ) {
      setErro(
        "Preencha o nome, a descrição e a categoria."
      );

      return;
    }

    if (
      !dataInicio ||
      !dataTermino ||
      dataTermino < dataInicio
    ) {
      setErro(
        "Digite datas válidas no formato dd/mm/aaaa."
      );

      return;
    }

    if (!Number.isFinite(valorMeta)) {
      setErro(
        "Informe uma meta válida."
      );

      return;
    }

    setSalvando(true);

    try {
      const token =
        await auth.currentUser?.getIdTokenResult(
          true
        );

      if (
        token?.claims?.admin !== true
      ) {
        throw new Error(
          "Sua conta não possui permissão administrativa."
        );
      }

      await addDoc(
        collection(db, "campanhas"),
        {
          nome: nome.trim(),
          descricao: descricao.trim(),
          categoria,
          inicio,
          termino,
          meta: valorMeta,
          status: "Ativa",
          imagemChave,
          exemplo: false,
          criadoPor: auth.currentUser.uid,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        }
      );

      navigation.goBack();
    } catch (e) {
      setErro(
        e.code === "permission-denied"
          ? "Acesso negado. Publique as regras administrativas no Firestore."
          : e.message ||
            "Não foi possível cadastrar a campanha."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ========================================
  // INTERFACE
  // ========================================

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
                size={25}
                color={VERDE}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Criar Campanha
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Preencha as informações para criar uma nova campanha.
          </Text>

          {/* IMAGEM */}

          <TouchableOpacity
            style={styles.imagemCaixa}
            onPress={() =>
              setMostrarImagens(!mostrarImagens)
            }
          >
            <Image
              source={imagemCampanha({
                imagemChave,
              })}
              resizeMode="contain"
              style={styles.imagem}
            />

            <View>
              <Text style={styles.adicionar}>
                Adicionar imagem
              </Text>

              <Text style={styles.ajudaImagem}>
                Escolha uma ilustração do app
              </Text>
            </View>
          </TouchableOpacity>

          {mostrarImagens && (
            <View style={styles.opcoesImagem}>
              {[
                "cesta",
                "arroz",
                "leite",
                "alface",
                "cafe",
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    imagemChave === item && {
                      backgroundColor:
                        "#E3F2DF",
                    },
                  ]}
                  onPress={() => {
                    setImagemChave(item);
                    setMostrarImagens(false);
                  }}
                >
                  <Text style={styles.chipTexto}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* NOME */}

          <Text style={styles.rotulo}>
            Nome da Campanha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o nome da campanha"
            value={nome}
            onChangeText={setNome}
            maxLength={100}
          />

          {/* DESCRIÇÃO */}

          <Text style={styles.rotulo}>
            Descrição
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.desc,
            ]}
            placeholder="Descreva o objetivo da campanha"
            multiline
            value={descricao}
            onChangeText={setDescricao}
            maxLength={500}
            textAlignVertical="top"
          />

          {/* CATEGORIA */}

          <Text style={styles.rotulo}>
            Categoria
          </Text>

          <TouchableOpacity
            style={styles.seletor}
            onPress={() =>
              setMostrarCategorias(!mostrarCategorias)
            }
          >
            <Text
              style={{
                color: categoria
                  ? "#333333"
                  : "#999999",
                fontSize: 12,
              }}
            >
              {categoria ||
                "Selecione uma categoria"}
            </Text>

            <Ionicons
              name="chevron-down"
              size={19}
            />
          </TouchableOpacity>

          {mostrarCategorias &&
            CATEGORIAS_CAMPANHA.map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.opcao}
                  onPress={() => {
                    setCategoria(item);
                    setMostrarCategorias(false);
                  }}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )
            )}

          {/* DATAS */}

          <View style={styles.datas}>
            <View style={styles.dataCol}>
              <Text style={styles.rotulo}>
                Data de Início
              </Text>

              <View style={styles.dataCampo}>
                <TextInput
                  style={styles.dataInput}
                  placeholder="dd/mm/aaaa"
                  value={inicio}
                  onChangeText={setInicio}
                  keyboardType="number-pad"
                  maxLength={10}
                />

                <Ionicons
                  name="calendar-outline"
                  color={VERDE}
                  size={18}
                />
              </View>
            </View>

            <View style={styles.dataCol}>
              <Text style={styles.rotulo}>
                Data de Término
              </Text>

              <View style={styles.dataCampo}>
                <TextInput
                  style={styles.dataInput}
                  placeholder="dd/mm/aaaa"
                  value={termino}
                  onChangeText={setTermino}
                  keyboardType="number-pad"
                  maxLength={10}
                />

                <Ionicons
                  name="calendar-outline"
                  color={VERDE}
                  size={18}
                />
              </View>
            </View>
          </View>

          {/* META */}

          <Text style={styles.rotulo}>
            Meta de arrecadação{" "}
            <Text
              style={{
                color: "#777777",
                fontSize: 11,
              }}
            >
              (opcional)
            </Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            value={meta}
            onChangeText={setMeta}
            keyboardType="decimal-pad"
          />

          {!!erro && (
            <Text style={styles.erro}>
              {erro}
            </Text>
          )}

          {/* BOTÕES */}

          <View style={styles.botoes}>
            <TouchableOpacity
              style={styles.cancelar}
              onPress={() =>
                navigation.goBack()
              }
              disabled={salvando}
            >
              <Text style={styles.cancelarTexto}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.salvar}
              onPress={criarCampanha}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.salvarTexto}>
                  Criar campanha
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    padding: 18,
    paddingBottom: 36,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  voltar: {
    height: 37,
    width: 37,
    borderRadius: 20,
    backgroundColor: "#E8EEE0",
    justifyContent: "center",
    alignItems: "center",
  },

  titulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: VERDE,
  },

  subtitulo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "#777777",
    marginTop: 10,
    marginBottom: 14,
  },

  imagemCaixa: {
    backgroundColor: "#E6E6E0",
    minHeight: 100,
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  imagem: {
    height: 90,
    width: 90,
  },

  adicionar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: VERDE,
  },

  ajudaImagem: {
    fontSize: 10,
    color: "#555555",
  },

  opcoesImagem: {
    flexDirection: "row",
    gap: 7,
    flexWrap: "wrap",
    marginBottom: 10,
  },

  chip: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },

  chipTexto: {
    fontSize: 11,
    textTransform: "capitalize",
  },

  rotulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#111111",
    marginTop: 11,
    marginBottom: 7,
  },

  input: {
    minHeight: 45,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D9DED5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  desc: {
    minHeight: 83,
    paddingTop: 12,
  },

  seletor: {
    height: 45,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D9DED5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  opcao: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  datas: {
    flexDirection: "row",
    gap: 13,
    marginTop: 8,
  },

  dataCol: {
    flex: 1,
  },

  dataCampo: {
    height: 45,
    borderWidth: 1,
    borderColor: "#D9DED5",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
  },

  dataInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
  },

  erro: {
    fontSize: 12,
    color: "#B3261E",
    textAlign: "center",
    marginTop: 12,
  },

  botoes: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },

  cancelar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderColor: VERDE,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  salvar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#3D9924",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelarTexto: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  salvarTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});