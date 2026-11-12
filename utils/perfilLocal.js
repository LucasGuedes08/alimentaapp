import AsyncStorage from "@react-native-async-storage/async-storage";

const chave = (uid) => `alimentamais:perfil:${uid}`;

export async function lerPerfilLocal(uid) {
  if (!uid) return {};

  try {
    const texto = await AsyncStorage.getItem(chave(uid));
    return texto ? JSON.parse(texto) : {};
  } catch (erro) {
    console.warn("Falha ao ler perfil local:", erro);
    return {};
  }
}

export async function salvarPerfilLocal(uid, dados) {
  if (!uid) {
    throw new Error("Entre na sua conta novamente.");
  }

  const anterior = await lerPerfilLocal(uid);

  await AsyncStorage.setItem(
    chave(uid),
    JSON.stringify({
      ...anterior,
      ...dados,
    })
  );
}
