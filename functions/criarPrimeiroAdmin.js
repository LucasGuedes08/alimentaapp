const {
  initializeApp,
  applicationDefault,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

// ========================================
// FIREBASE ADMIN
// ========================================

initializeApp({
  credential: applicationDefault(),
  projectId: "alimentamaisapp",
});

// ========================================
// AUTORIZAR PRIMEIRO ADMINISTRADOR
// ========================================

async function criarPrimeiroAdmin() {
  const uid = process.argv[2];

  if (!uid) {
    console.error(
      "Informe o UID do usuário."
    );

    process.exitCode = 1;
    return;
  }

  try {
    const servicoAuth = getAuth();

    const usuario =
      await servicoAuth.getUser(uid);

    if (usuario.disabled) {
      throw new Error(
        "A conta está desativada."
      );
    }

    // Preservar permissões anteriores
    // e acrescentar a permissão admin.

    const permissoes = {
      ...(usuario.customClaims || {}),
      admin: true,
    };

    await servicoAuth.setCustomUserClaims(
      uid,
      permissoes
    );

    // Registrar administrador no Firestore.

    await getFirestore()
      .collection("administradores")
      .doc(uid)
      .set(
        {
          uid,
          nome:
            usuario.displayName ||
            "Administrador principal",

          email: usuario.email || "",

          cargo: "Administrador principal",

          ativo: true,

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    console.log(
      "Administrador autorizado com sucesso!"
    );

    console.log(
      "E-mail:",
      usuario.email
    );

    console.log(
      "Faça login novamente pelo painel administrativo."
    );
  } catch (erro) {
    console.error(
      "Erro ao autorizar administrador:",
      erro.message
    );

    process.exitCode = 1;
  }
}

criarPrimeiroAdmin();