import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { colores } from '../theme';

type Props = {
  children: React.ReactNode;
  estiloExtra?: ViewStyle;
};

export default function CardPro({ children, estiloExtra }: Props) {
  return (
    <View style={[styles.card, estiloExtra]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colores.fondoClaro,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
