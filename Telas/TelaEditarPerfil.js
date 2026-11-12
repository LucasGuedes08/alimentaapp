import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { auth } from "../firebase";

import {
  lerPerfilLocal,
  salvarPerfilLocal,
} from "../utils/perfilLocal";

const VERDE = "#006838";
const FUNDO = "#FFFCF6";

function Campo({
  rotulo,
  valor,
  alterar,
  ...props
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.rotulo}>
        {rotulo}
      </Text>

      <TextInput
        value={valor}
        onChangeText={alterar}
        placeholderTextColor="#929292"
        style={styles.campo}
        {...props}
      />
    </View>
  );
}

export default function TelaEditarPerfil({
  navigation,
}) {
  const { width } = useWindowDimensions();

  const user = auth.currentUser;

  const [nome, setNome] = useState(
    user?.displayName || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [telefone, setTelefone] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [fotoUri, setFotoUri] = useState(null);

  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // CARREGAR DADOS JÁ SALVOS
  useEffect(() => {
    let ativo = true;

    lerPerfilLocal(user?.uid).then((dados) => {
      if (!ativo) return;

      setTelefone(dados.telefone || "");
      setNascimento(dados.nascimento || "");
      setFotoUri(dados.fotoUri || null);
      setCarregando(false);
    });

    return () => {
      ativo = false;
    };
  }, [user?.uid]);

  // SELECIONAR FOTO DA GALERIA
  async function selecionarFoto() {
    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

      if (
        resultado.canceled ||
        !resultado.assets?.[0]?.uri
      ) {
        return;
      }

      const origem = resultado.assets[0].uri;

      if (Platform.OS === "web") {
        setFotoUri(origem);
      } else {
        const destino =
          `${FileSystem.documentDirectory}` +
          `perfil-${user.uid}-${Date.now()}.jpg`;

        await FileSystem.copyAsync({
          from: origem,
          to: destino,
        });

        setFotoUri(destino);
      }
    } catch (e) {
      console.error(
        "Falha ao selecionar foto:",
        e
      );

      Alert.alert(
        "Foto",
        "Não foi possível escolher esta imagem."
      );
    }
  }

  // SALVAR ALTERAÇÕES
  async function salvar() {
    if (salvando) return;

    if (!user) {
      return Alert.alert(
        "Sessão",
        "Entre novamente na sua conta."
      );
    }

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (nomeLimpo.length < 2) {
      return Alert.alert(
        "Nome",
        "Informe pelo menos dois caracteres."
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
    ) {
      return Alert.alert(
        "E-mail",
        "Digite um e-mail válido."
      );
    }

    if (
      nascimento &&
      !/^\d{2}\/\d{2}\/\d{4}$/.test(nascimento)
    ) {
      return Alert.alert(
        "Nascimento",
        "Use o formato DD/MM/AAAA."
      );
    }

    setSalvando(true);

    try {
      // NOME NO FIREBASE AUTH
      await updateProfile(user, {
        displayName: nomeLimpo,
      });

      // DADOS COMPLEMENTARES NO APARELHO
      await salvarPerfilLocal(user.uid, {
        telefone: telefone.trim(),
        nascimento: nascimento.trim(),
        fotoUri,
      });

      // ALTERAR E-MAIL COM VERIFICAÇÃO
      if (
        emailLimpo !==
        (user.email || "").toLowerCase()
      ) {
        try {
          await verifyBeforeUpdateEmail(
            user,
            emailLimpo
          );

          Alert.alert(
            "Perfil salvo",
            "Nome e dados locais salvos. Enviamos um link ao novo e-mail. A alteração será concluída após a verificação.",
            [
              {
                text: "OK",
                onPress: () =>
                  navigation.goBack(),
              },
            ]
          );
        } catch (erroEmail) {
          console.error(
            "Erro ao solicitar troca de e-mail:",
            erroEmail
          );

          Alert.alert(
            "Salvo parcialmente",
            "Nome, telefone, nascimento e foto foram salvos, mas não foi possível solicitar a troca de e-mail. Confira se você entrou recentemente na conta."
          );
        }
      } else {
        Alert.alert(
          "Perfil atualizado",
          "Suas alterações foram salvas.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );
      }
    } catch (e) {
      console.error(
        "Falha ao salvar perfil:",
        e
      );

      Alert.alert(
        "Erro",
        "Não foi possível salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.tela,
          {
            width: Math.min(width, 460),
          },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
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
                  color={VERDE}
                  size={25}
                />
              </TouchableOpacity>

              <Text style={styles.titulo}>
                Editar Perfil
              </Text>
            </View>

            <Text style={styles.subtitulo}>
              Gerencie suas informações
            </Text>

            {/* FOTO DE PERFIL */}
            <TouchableOpacity
              style={styles.fotoArea}
              onPress={selecionarFoto}
              accessibilityLabel="Alterar foto do perfil"
            >
              {fotoUri ? (
                <Image
                  source={{ uri: fotoUri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarVazio}>
                  <Ionicons
                    name="person"
                    size={72}
                    color="#FFFFFF"
                  />
                </View>
              )}

              <View style={styles.camera}>
                <Ionicons
                  name="camera-outline"
                  color="#FFFFFF"
                  size={17}
                />
              </View>

              <Text style={styles.fotoTitulo}>
                Foto de Perfil
              </Text>

              <Text style={styles.fotoDescricao}>
                Toque no ícone para alterar sua foto
              </Text>
            </TouchableOpacity>

            {carregando ? (
              <ActivityIndicator color={VERDE} />
            ) : (
              <View style={styles.formulario}>
                {/* NOME */}
                <Campo
                  rotulo="Nome:"
                  valor={nome}
                  alterar={setNome}
                  autoCapitalize="words"
                />

                {/* E-MAIL */}
                <Campo
                  rotulo="E-mail:"
                  valor={email}
                  alterar={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />

                {/* TELEFONE */}
                <Campo
                  rotulo="Telefone:"
                  valor={telefone}
                  alterar={setTelefone}
                  keyboardType="phone-pad"
                  maxLength={20}
                  placeholder="(11) 99999-9999"
                />

                {/* NASCIMENTO */}
                <Campo
                  rotulo="Data de Nascimento:"
                  valor={nascimento}
                  alterar={setNascimento}
                  placeholder="DD/MM/AAAA"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />

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
                      Salvar alterações
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.nota}>
              Nome e e-mail são gerenciados pela
              sua conta. Telefone, nascimento e foto
              ficam salvos neste aparelho; não são
              sincronizados entre dispositivos.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingBottom: 30,
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
    color: "#777777",
    fontSize: 16,
    marginTop: 5,
  },

  fotoArea: {
    alignItems: "center",
    marginTop: 22,
    marginBottom: 27,
  },

  avatarVazio: {
    width: 108,
    height: 108,
    borderRadius: 60,
    backgroundColor: "#CECECE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatar: {
    width: 108,
    height: 108,
    borderRadius: 60,
  },

  camera: {
    backgroundColor: VERDE,
    width: 31,
    height: 31,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -22,
    marginLeft: 78,
    borderWidth: 2,
    borderColor: FUNDO,
  },

  fotoTitulo: {
    fontFamily: "Poppins_600SemiBold",
    color: "#101010",
    fontSize: 20,
    marginTop: 7,
  },

  fotoDescricao: {
    fontFamily: "Poppins_400Regular",
    color: "#777777",
    fontSize: 14,
  },

  formulario: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3D7D1",
    borderRadius: 19,
    padding: 16,
    elevation: 3,
  },

  rotulo: {
    fontFamily: "Poppins_700Bold",
    color: VERDE,
    fontSize: 16,
    marginBottom: 4,
  },

  campo: {
    minHeight: 43,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#A5ACA4",
    paddingHorizontal: 14,
    color: "#242424",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },

  salvar: {
    minHeight: 45,
    backgroundColor: VERDE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginTop: 8,
  },

  salvarTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  nota: {
    fontSize: 11,
    lineHeight: 17,
    color: "#777777",
    textAlign: "center",
    marginTop: 16,
  },
})