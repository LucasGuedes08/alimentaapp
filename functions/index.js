const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

// ========================================
// VALIDAR CPF
// ========================================

function validarCpf(valor) {
  const cpf = String(
    valor || ""
  ).replace(/\D/g, "");

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    return false;
  }

  for (
    let pos = 9;
    pos <= 10;
    pos++
  ) {
    let soma = 0;

    for (
      let i = 0;
      i < pos;
      i++
    ) {
      soma +=
        Number(cpf[i]) *
        (pos + 1 - i);
    }

    const resto =
      (soma * 10) % 11;

    if (
      (resto === 10 ? 0 : resto) !==
      Number(cpf[pos])
    ) {
      return false;
    }
  }

  return true;
}

// ========================================
// CADASTRAR ADMINISTRADOR
// ========================================

exports.cadastrarAdministrador = onCall(
  {
    region: "southamerica-east1",
  },

  async (request) => {
    // EXIGIR AUTENTICAÇÃO

    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "Entre com uma conta administrativa."
      );
    }

    const servicoAuth = getAuth();

    let solicitante;

    // VERIFICAR QUEM ESTÁ CADASTRANDO

    try {
      solicitante =
        await servicoAuth.getUser(
          request.auth.uid
        );
    } catch (e) {
      throw new HttpsError(
        "permission-denied",
        "Conta não autorizada."
      );
    }

    if (
      solicitante.disabled ||
      solicitante.customClaims
        ?.admin !== true
    ) {
      throw new HttpsError(
        "permission-denied",
        "Apenas administradores podem cadastrar outros administradores."
      );
    }

    // RECEBER INFORMAÇÕES

    const entrada =
      request.data || {};

    const nome = String(
      entrada.nome || ""
    ).trim();

    const email = String(
      entrada.email || ""
    )
      .trim()
      .toLowerCase();

    const cargo = String(
      entrada.cargo || ""
    ).trim();

    const cpf = String(
      entrada.cpf || ""
    ).replace(/\D/g, "");

    // VALIDAR DADOS

    if (
      nome.length < 3 ||
      nome.length > 100 ||
      cargo.length < 2 ||
      cargo.length > 80 ||
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      ) ||
      !validarCpf(cpf)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Confira os dados do cadastro."
      );
    }

    let novoUsuario;

    try {
      // CRIAR CONTA

      novoUsuario =
        await servicoAuth.createUser({
          email,
          displayName: nome,
          disabled: false,
        });

      // ATRIBUIR PERMISSÃO ADMIN

      await servicoAuth.setCustomUserClaims(
        novoUsuario.uid,
        {
          admin: true,
        }
      );

      // REGISTRAR ADMINISTRADOR

      await getFirestore()
        .collection("administradores")
        .doc(novoUsuario.uid)
        .set({
          uid: novoUsuario.uid,
          nome,
          email,
          cargo,

          // Não armazenar CPF completo.
          cpfFinal: cpf.slice(-4),

          ativo: true,

          criadoPor: request.auth.uid,

          criadoEm:
            FieldValue.serverTimestamp(),
        });

      // CONVITE PARA CRIAR SENHA

      const linkAtivacao =
        await servicoAuth.generatePasswordResetLink(
          email
        );

      return {
        sucesso: true,
        uid: novoUsuario.uid,
        linkAtivacao,
      };
    } catch (e) {
      // REVERTER CADASTRO INCOMPLETO

      if (novoUsuario?.uid) {
        await Promise.allSettled([
          servicoAuth.deleteUser(
            novoUsuario.uid
          ),

          getFirestore()
            .collection("administradores")
            .doc(novoUsuario.uid)
            .delete(),
        ]);
      }

      if (
        e.code ===
        "auth/email-already-exists"
      ) {
        throw new HttpsError(
          "already-exists",
          "Este e-mail já está cadastrado."
        );
      }

      console.error(
        "Erro ao cadastrar administrador:",
        e.code || e.message
      );

      throw new HttpsError(
        "internal",
        "Não foi possível cadastrar o administrador."
      );
    }
  }
);