
import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { auth } from "../firebase";
import { db } from "../firebaseDb";

export const MARCOS = [1, 5, 15, 30, 50];

export function useEstatisticasUsuario() {
  const [doacoes, setDoacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setCarregando(false);
      setErro("Entre na sua conta novamente.");
      return;
    }

    const consulta = query(
      collection(db, "alimentos"),
      where("criadoPor", "==", uid)
    );

    const cancelar = onSnapshot(
      consulta,

      (resultado) => {
        const lista = resultado.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter(
            (d) =>
              d.demonstracao !== true &&
              !String(d.id).startsWith("demo-")
          )
          .sort(
            (a, b) =>
              (a.criadoEm?.toMillis?.() || 0) -
              (b.criadoEm?.toMillis?.() || 0)
          );

        setDoacoes(lista);
        setCarregando(false);
        setErro("");
      },

      (e) => {
        console.error(
          "Erro ao consultar contribuições:",
          e
        );

        setCarregando(false);

        setErro(
          "Não foi possível carregar as suas contribuições."
        );
      }
    );

    return cancelar;
  }, []);

  const total = doacoes.length;

  return {
    doacoes,
    total,
    conquistas: MARCOS.filter(
      (meta) => total >= meta
    ).length,
    carregando,
    erro,
  };
}

export function formatarDataFirestore(valor) {
  if (!valor) return "";

  const data =
    valor?.toDate?.() || new Date(valor);

  return Number.isNaN(data.getTime())
    ? ""
    : data.toLocaleDateString("pt-BR");
}
