import React, {
  createContext,
  useContext,
  useMemo,
} from "react";

import {
  useWindowDimensions,
} from "react-native";

const ResponsiveContext = createContext(null);

export function ResponsiveProvider({ children }) {
  const {
    width,
    height,
    fontScale,
  } = useWindowDimensions();

  const value = useMemo(() => {
    // Limitar largura dos layouts de celular
    const screenWidth = Math.min(width, 460);

    // Escala que evita elementos exagerados
    const factor = Math.min(
      1.12,
      Math.max(0.82, screenWidth / 390)
    );

    return {
      width,
      height,
      fontScale,
      screenWidth,

      isSmall: width < 375,
      isCompact: height < 740,
      isTablet: width >= 768,

      // Ajusta medidas ao aparelho
      scale: (size) =>
        Math.round(size * factor),

      // Altura mínima para campos e botões
      touch: (size = 46) =>
        Math.max(
          44,
          Math.round(size * factor)
        ),
    };
  }, [width, height, fontScale]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const value = useContext(ResponsiveContext);

  if (!value) {
    throw new Error(
      "useResponsive precisa de ResponsiveProvider no App.js"
    );
  }

  return value;
}
