import React, {
  useEffect,
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
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth } from "../firebase";
import { db } from "../firebaseDb";

import {
  CATEGORIAS_CAMPANHA,
  imagemCampanha,
  dataBRValida,
  formatarMoedaBR,
  moedaParaNumero,
} from "../utils/campanhasAdmin";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

export default function TelaEditarCampanhaAdmin({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();

  const campanhaInicial =
    route.params?.campanha || {};

  const id = campanhaInicial.id;

  const [nome, setNome] = useState(
    campanhaInicial.nome || ""
  );

  const [
    descricao,
    setDescricao,
  ] = useState(
    campanhaInicial.descricao || ""
  );

  const [
    categoria,
    setCategoria,
  ] = useState(
    campanhaInicial.categoria || "Alimentos"
  );

  const [inicio, setInicio] = useState(
    campanhaInicial.inicio || ""
  );

  const [
    termino,
    setTermino,
  ] = useState(
    campanhaInicial.termino || ""
  );

  const [meta, setMeta] = useState(
    formatarMoedaBR(campanhaInicial.meta)
  );

  const [status, setStatus] = useState(
    campanhaInicial.status || "Ativa"
  );

  const [
    imagemAtual,
    setImagemAtual,
  ] = useState(
    campanhaInicial.imagemChave || "cesta"
  );

  const [
    abrirCategorias,
    setAbrirCategorias,
  ] = useState(false);

  const [
    abrirStatus,
    setAbrirStatus,
  ] = useState(false);

  const [
    mostrarImagens,
    setMostrarImagens,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");

  // ========================================
  // CARREGAR DADOS DO FIRESTORE
  // ========================================

  useEffect(() => {
    if (!id || campanhaInicial.exemplo) {
      return;
    }

    let ativo = true;

    getDoc(doc(db, "campanhas", id))
      .then((snapshot) => {
        if (!ativo || !snapshot.exists()) {
          return;
        }

        const dados = snapshot.data();

        setNome(dados.nome || "");
        setDescricao(dados.descricao || "");
        setCategoria(
          dados.categoria || "Alimentos"
        );
        setInicio(dados.inicio || "");
        setTermino(dados.termino || "");

        setMeta(
          formatarMoedaBR(dados.meta)
        );

        setStatus(
          dados.status || "Ativa"
        );

        setImagemAtual(
          dados.imagemChave || "cesta"
        );
      })
      .catch(() => {
        if (ativo) {
          setErro(
            "Não foi possível atualizar os dados da campanha."
          );
        }
      });

    return () => {
      ativo = false;
    };
  }, [id, campanhaInicial.exemplo]);

  // ========================================
  // SALVAR ALTERAÇÕES
  // ========================================

  async function salvar() {
    if (salvando) return;

    setErro("");

    const dataInicio = dataBRValida(inicio);
    const dataTermino = dataBRValida(termino);
    const valorMeta = moedaParaNumero(meta);

    if (!id) {
      setErro("Campanha não identificada.");
      return;
    }

    if (
      nome.trim().length < 3 ||
      descricao.trim().length < 10
    ) {
      setErro(
        "Informe nome e descrição com pelo menos 10 caracteres."
      );
      return;
    }

    if (
      !dataInicio ||
      !dataTermino ||
      dataTermino < dataInicio
    ) {
      setErro(
        "Confira as datas de início e término."
      );
      return;
    }

    if (!Number.isFinite(valorMeta)) {
      setErro("Meta inválida.");
      return;
    }

    setSalvando(true);

    try {
      const token =
        await auth.currentUser?.getIdTokenResult(
          true
        );

      if (token?.claims?.admin !== true) {
        throw new Error(
          "Conta sem permissão administrativa."
        );
      }

      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        inicio,
        termino,
        meta: valorMeta,
        status,
        imagemChave: imagemAtual,
        atualizadoEm: serverTimestamp(),
      };

      const referencia = doc(
        db,
        "campanhas",
        id
      );

      if (campanhaInicial.exemplo) {
        // Salvar o modelo demonstrativo
        // como uma campanha real.

        await setDoc(referencia, {
          ...dados,
          exemplo: false,
          criadoEm: serverTimestamp(),
          criadoPor: auth.currentUser.uid,
        });
      } else {
        await updateDoc(
          referencia,
          dados
        );
      }

      navigation.goBack();
    } catch (e) {
      setErro(
        e?.code === "permission-denied"
          ? "Permissão negada. Publique as regras administrativas do Firestore."
          : e.message ||
            "Não foi possível salvar a campanha."
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
          <View style={styles.cabecalho}>
            <TouchableOpacity
              style={styles.voltar}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                color={VERDE}
                size={25}
              />
            </TouchableOpacity>

            <Text style={styles.titulo}>
              Editar Campanha
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Preencha as informações para editar a campanha.
          </Text>

          {/* IMAGEM */}

          <Image
            source={imagemCampanha({
              imagemChave: imagemAtual,
            })}
            style={styles.imagem}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.trocarImagem}
            onPress={() =>
              setMostrarImagens(!mostrarImagens)
            }
          >
            <Ionicons
              name="images-outline"
              size={17}
              color={VERDE}
            />

            <Text style={styles.textoTrocar}>
              Alterar imagem
            </Text>
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
                  style={styles.chipImagem}
                  onPress={() => {
                    setImagemAtual(item);
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
            style={styles.campo}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome da campanha"
            maxLength={100}
          />

          {/* DESCRIÇÃO */}

          <Text style={styles.rotulo}>
            Descrição
          </Text>

          <TextInput
            style={[
              styles.campo,
              styles.descricao,
            ]}
            multiline
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva a campanha"
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
              setAbrirCategorias(!abrirCategorias)
            }
          >
            <Text style={styles.textoSeletor}>
              {categoria}
            </Text>

            <Ionicons
              name="chevron-down"
              color="#333333"
              size={20}
            />
          </TouchableOpacity>

          {abrirCategorias &&
            CATEGORIAS_CAMPANHA.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.opcao}
                onPress={() => {
                  setCategoria(item);
                  setAbrirCategorias(false);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}

          {/* DATAS */}

          <View style={styles.datas}>
            <View style={styles.dataCol}>
              <Text style={styles.rotulo}>
                Data de Início
              </Text>

              <View style={styles.campoData}>
                <TextInput
                  style={styles.dataInput}
                  value={inicio}
                  onChangeText={setInicio}
                  placeholder="dd/mm/aaaa"
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

              <View style={styles.campoData}>
                <TextInput
                  style={styles.dataInput}
                  value={termino}
                  onChangeText={setTermino}
                  placeholder="dd/mm/aaaa"
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
            <Text style={styles.opcional}>
              (opcional)
            </Text>
          </Text>

          <TextInput
            style={styles.campo}
            value={meta}
            onChangeText={setMeta}
            placeholder="R$ 0,00"
            keyboardType="decimal-pad"
          />

          {/* STATUS */}

          <Text style={styles.rotulo}>
            Status
          </Text>

          <TouchableOpacity
            style={styles.seletor}
            onPress={() =>
              setAbrirStatus(!abrirStatus)
            }
          >
            <Text>{status}</Text>

            <Ionicons
              name="chevron-down"
              size={19}
            />
          </TouchableOpacity>

          {abrirStatus &&
            [
              "Ativa",
              "Pausada",
              "Encerrada",
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.opcao}
                onPress={() => {
                  setStatus(item);
                  setAbrirStatus(false);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}

          {campanhaInicial.exemplo && (
            <Text style={styles.obs}>
              Este modelo é demonstrativo.
              Ao salvar, ele será cadastrado
              como campanha real no Firestore.
            </Text>
          )}

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
              onPress={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.salvarTexto}>
                  Salvar alterações
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

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  voltar: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#EAF0E3",
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

  imagem: {
    height: 108,
    width: "100%",
    backgroundColor: "#E8E8E2",
    borderRadius: 10,
  },

  trocarImagem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 43,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DED5",
    marginTop: 8,
    marginBottom: 12,
  },

  textoTrocar: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: VERDE,
  },

  opcoesImagem: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 11,
  },

  chipImagem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },

  chipTexto: {
    fontSize: 11,
    color: VERDE,
    textTransform: "capitalize",
  },

  rotulo: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: "#151515",
    marginBottom: 7,
    marginTop: 9,
  },

  opcional: {
    color: "#777777",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
  },

  campo: {
    minHeight: 46,
    borderColor: "#D9DED5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#333333",
  },

  descricao: {
    minHeight: 84,
    paddingTop: 12,
  },

  seletor: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: "#D9DED5",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  textoSeletor: {
    fontSize: 12,
    color: "#333333",
  },

  opcao: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  datas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },

  dataCol: {
    flex: 1,
  },

  campoData: {
    height: 45,
    borderWidth: 1,
    borderColor: "#D9DED5",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  dataInput: {
    flex: 1,
    fontSize: 11,
    color: "#333333",
  },

  obs: {
    fontSize: 11,
    lineHeight: 17,
    color: "#80683A",
    marginTop: 14,
  },

  erro: {
    color: "#B3261E",
    textAlign: "center",
    fontSize: 12,
    marginTop: 15,
  },

  botoes: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },

  cancelar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VERDE,
    justifyContent: "center",
    alignItems: "center",
  },

  salvar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 8,
    backgroundColor: "#3D9924",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelarTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  salvarTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
});