import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BotonPro from '../components/BotonPro';
import Titulo from '../components/Titulo';
import { colores, fuentes, espaciado } from '../theme';

export default function ConfiguracionesScreen() {
  const [nombreLocal, setNombreLocal] = useState('');
  const [moneda, setMoneda] = useState<'CLP' | 'USD'>('CLP');

  useEffect(() => {
    const cargar = async () => {
      const nombre = await AsyncStorage.getItem('nombreLocal');
      const m = await AsyncStorage.getItem('moneda');
      if (nombre) setNombreLocal(nombre);
      if (m === 'USD' || m === 'CLP') setMoneda(m);
    };
    cargar();
  }, []);

  const guardar = async () => {
    await AsyncStorage.setItem('nombreLocal', nombreLocal);
    await AsyncStorage.setItem('moneda', moneda);
    Alert.alert('Guardado', 'Configuración actualizada');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Configuraciones" />

      <Text style={styles.label}>Nombre del local o sucursal:</Text>
      <TextInput
        value={nombreLocal}
        onChangeText={setNombreLocal}
        placeholder="Ej: Restaurante El Buen Sabor"
        placeholderTextColor={colores.placeholder}
        style={styles.input}
      />

      <Text style={styles.label}>Moneda preferida:</Text>
      <View style={styles.fila}>
        <BotonPro
          title="CLP (\$)"
          onPress={() => setMoneda('CLP')}
          icon="dollar-sign"
          color={moneda === 'CLP' ? colores.primario : '#444'}
        />
        <BotonPro
          title="USD ($)"
          onPress={() => setMoneda('USD')}
          icon="dollar-sign"
          color={moneda === 'USD' ? colores.primario : '#444'}
        />
      </View>

      <BotonPro title="Guardar configuración" icon="save" onPress={guardar} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: espaciado.padding,
    backgroundColor: colores.fondo,
    gap: 20,
  },
  label: {
    color: colores.texto,
    fontSize: fuentes.texto,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colores.fondoClaro,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: 8,
    color: colores.texto,
    padding: 10,
    fontSize: fuentes.texto,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
});
