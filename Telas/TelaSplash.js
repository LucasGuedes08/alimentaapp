
import React, { useEffect } from "react";

import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

const FUNDO = "#FEFEF8";

export default function TelaSplash({ navigation }) {
  const { width } = useWindowDimensions();

  const largura = Math.min(width, 460);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2300);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.tela}>
      <View
        style={[
          styles.painel,
          { width: largura },
        ]}
      >
        {/* FUNDO FIXO */}
        <Image
          source={require(
            "../assets/images/tabIcons/fundoCadastro.png"
          )}
          resizeMode="cover"
          style={styles.imagemFundo}
        />

        {/* LOGO ORIGINAL */}
        <View style={styles.centro}>
          <Image
            source={require(
              "../assets/images/tabIcons/logo.png"
            )}
            resizeMode="contain"
            style={{
              width: largura * 0.88,
              height: largura * 0.88,
            }}
            accessibilityLabel="Logo Alimenta+"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: "center",
    backgroundColor: FUNDO,
  },

  painel: {
    flex: 1,
    maxWidth: 460,
    overflow: "hidden",
    backgroundColor: FUNDO,
  },

  imagemFundo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
