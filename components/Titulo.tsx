import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colores, fuentes, espaciado } from '../theme';

export default function Titulo({ texto }: { texto: string }) {
  return <Text style={styles.titulo}>{texto}</Text>;
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: fuentes.titulo,
    color: colores.texto,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: espaciado.margen,
  },
});
