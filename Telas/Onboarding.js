
import React, { useRef, useState, useEffect } from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const FUNDO = "#FCF9F3";
const VERDE = "#006838";
const LARANJA = "#FF7827";

const SLIDES = [
  {
    id: "1",
    imagem: require(
      "../assets/images/tabIcons/onboarding1.png"
    ),
  },
  {
    id: "2",
    imagem: require(
      "../assets/images/tabIcons/onboarding2.png"
    ),
  },
  {
    id: "3",
    imagem: require(
      "../assets/images/tabIcons/onboarding3.png"
    ),
  },
  {
    id: "4",
    imagem: require(
      "../assets/images/tabIcons/onboarding4.png"
    ),
  },
];

// TÍTULOS ORIGINAIS DO ALIMENTA+
function TituloSlide({ indice, tamanho }) {
  const estilo = [
    styles.titulo,
    {
      fontSize: tamanho,
      lineHeight: tamanho * 1.4,
    },
  ];

  if (indice === 0) {
    return (
      <Text style={estilo}>
        Juntos, podemos{"\n"}
        <Text style={styles.laranja}>
          transformar alimentos
        </Text>
        {" em novas\n"}
        histórias.
      </Text>
    );
  }

  if (indice === 1) {
    return (
      <Text style={estilo}>
        Cada doação{"\n"}
        <Text style={styles.laranja}>
          alimenta
        </Text>
        {" mais que o\n"}
        corpo: alimenta{"\n"}
        <Text style={styles.verde}>
          esperança.
        </Text>
      </Text>
    );
  }

  if (indice === 2) {
    return (
      <Text style={estilo}>
        <Text style={styles.laranja}>
          Doe
        </Text>
        {" alimentos,\ntransforme "}
        <Text style={styles.laranja}>
          vidas
        </Text>
        {" e\nfaça parte dessa\ncorrente do "}
        <Text style={styles.verde}>
          bem.
        </Text>
      </Text>
    );
  }

  return (
    <Text style={estilo}>
      Doar é{" "}
      <Text style={styles.laranja}>
        simples,
      </Text>
      {"\n"}
      <Text style={styles.verde}>
        seguro
      </Text>
      {" e faz toda a\n"}
      diferença para quem{"\n"}
      precisa.
    </Text>
  );
}

// COMPONENTE PRINCIPAL
export default function Onboarding({ navigation }) {
  const { width, height } = useWindowDimensions();

  const largura = Math.min(width, 460);
  const compacto = height < 750;

  const lista = useRef(null);
  const [pagina, setPagina] = useState(0);

  const tamanhoTitulo = compacto
    ? Math.min(22, largura * 0.057)
    : Math.min(25, largura * 0.063);

  const alturaImagem = Math.min(
    height * (compacto ? 0.40 : 0.45),
    385
  );

  useEffect(() => {
    lista.current?.scrollTo({
      x: pagina * largura,
      animated: false,
    });
  }, [largura]);

  // AVANÇAR
  function proximo() {
    if (pagina === SLIDES.length - 1) {
      navigation.replace("TelaCadastro");
      return;
    }

    const novaPagina = pagina + 1;

    lista.current?.scrollTo({
      x: novaPagina * largura,
      animated: true,
    });

    setPagina(novaPagina);
  }

  // ATUALIZAR PÁGINA AO DESLIZAR
  function atualizarPagina(evento) {
    const posicao =
      evento.nativeEvent.contentOffset.x;

    const indice = Math.round(
      posicao / largura
    );

    setPagina(
      Math.max(
        0,
        Math.min(SLIDES.length - 1, indice)
      )
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.painel,
          { width: largura },
        ]}
      >
        {/* CARROSSEL */}
        <ScrollView
          ref={lista}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={atualizarPagina}
          scrollEventThrottle={16}
          style={styles.carrossel}
        >
          {SLIDES.map((slide, indice) => (
            <View
              key={slide.id}
              style={[
                styles.slide,
                { width: largura },
              ]}
            >
              {/* TEXTO */}
              <View style={styles.areaTitulo}>
                <TituloSlide
                  indice={indice}
                  tamanho={tamanhoTitulo}
                />
              </View>

              {/* IMAGEM SEM ESTICAR */}
              <View style={styles.areaIlustracao}>
                <Image
                  source={slide.imagem}
                  resizeMode="contain"
                  style={{
                    width: largura * 0.87,
                    height: alturaImagem,
                  }}
                  accessibilityLabel={
                    `Ilustração ${indice + 1} do Alimenta+`
                  }
                />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* INDICADORES */}
        <View style={styles.indicadores}>
          {SLIDES.map((slide, indice) => (
            <View
              key={slide.id}
              style={[
                styles.ponto,
                pagina === indice &&
                  styles.pontoAtivo,
              ]}
            />
          ))}
        </View>

        {/* BOTÕES FIXOS */}
        <View style={styles.areaBotoes}>
          <TouchableOpacity
            style={styles.botao}
            onPress={() =>
              navigation.replace("TelaCadastro")
            }
          >
            <Text style={styles.pular}>
              Pular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botao}
            onPress={proximo}
          >
            <Text style={styles.proximo}>
              {pagina === SLIDES.length - 1
                ? "Começar ›"
                : "Próximo ›"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FUNDO,
    alignItems: "center",
  },

  painel: {
    flex: 1,
    maxWidth: 460,
    backgroundColor: FUNDO,
    overflow: "hidden",
  },

  carrossel: {
    flex: 1,
    minHeight: 0,
  },

  slide: {
    flex: 1,
    backgroundColor: FUNDO,
    paddingTop: 25,
  },

  areaTitulo: {
    paddingHorizontal: 27,
    minHeight: 155,
    justifyContent: "flex-start",
  },

  titulo: {
    color: "#181818",
    fontFamily: "Poppins_700Bold",
    textAlign: "left",
  },

  laranja: {
    color: LARANJA,
  },

  verde: {
    color: VERDE,
  },

  areaIlustracao: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  indicadores: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
  },

  ponto: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#D2D2D2",
  },

  pontoAtivo: {
    backgroundColor: VERDE,
  },

  areaBotoes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    minHeight: 58,
    paddingBottom: 5,
  },

  botao: {
    minWidth: 95,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  pular: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#527156",
  },

  proximo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: VERDE,
  },
});
