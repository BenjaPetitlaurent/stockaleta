import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { colores } from '../theme';
import { Feather } from '@expo/vector-icons'; 

type Props = {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  onPress: () => void;
};

export default function BotonPro({ title, icon, color = colores.primario, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.boton, { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.contenido}>
        <Feather name={icon} size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.texto}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
