import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View } from 'react-native';
import { colores } from '../theme';

export default function InputPro(props: TextInputProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colores.placeholder}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: colores.fondoClaro,
    color: colores.texto,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colores.borde,
  },
});
