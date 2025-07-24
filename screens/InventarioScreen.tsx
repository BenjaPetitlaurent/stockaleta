import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Titulo from '../components/Titulo';
import Input from '../components/InputPro';
import Card from '../components/CardPro';
import Boton from '../components/BotonPro';
import { colores } from '../theme';

type Estado = 'B' | 'R' | 'M';

type Activo = {
  descripcion: string;
  cantidad: string;
  estado: Estado | '';
};

const ACTIVOS_PREDEFINIDOS = [
  'Congelador 1 puerta',
  'Estufa de 4 puestos',
  'Nevera 336 litros',
  'Pipeta de gas',
  'Regulador de gas',
  'Manguera de gas',
  'Cucharas',
  'Platos',
  'Mesas del comedor',
  'Sillas del comedor',
  'Botiquín',
  'Licuadora',
  'Tanque de agua 250 litros',
];

export default function InventarioScreen() {
  const [semana, setSemana] = useState('1');
  const [activos, setActivos] = useState<Activo[]>(
    ACTIVOS_PREDEFINIDOS.map(desc => ({
      descripcion: desc,
      cantidad: '',
      estado: '',
    }))
  );

  const cambiarCantidad = (index: number, valor: string) => {
    const nuevos = [...activos];
    nuevos[index].cantidad = valor;
    setActivos(nuevos);
  };

  const cambiarEstado = (index: number, estado: Estado) => {
    const nuevos = [...activos];
    nuevos[index].estado = estado;
    setActivos(nuevos);
  };

  const guardarInventario = async () => {
    const fecha = new Date().toISOString().split('T')[0];
    const registro = {
      semana: Number(semana),
      fecha,
      registros: activos,
    };

    try {
      const key = `inventario_semanal`;
      const data = await AsyncStorage.getItem(key);
      const historico = data ? JSON.parse(data) : [];
      historico.push(registro);
      await AsyncStorage.setItem(key, JSON.stringify(historico));
      Alert.alert('Inventario guardado con éxito');
    } catch (error) {
      Alert.alert('Error al guardar inventario');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Inventario Semanal" />

      <Text style={styles.label}>Semana:</Text>
      <Input
        value={semana}
        onChangeText={(text: string) => setSemana(text)}
        keyboardType="numeric"
        maxLength={1}
        placeholder="Ej: 1"
      />

      {activos.map((item, i) => (
        <Card key={i}>
          <Text style={styles.descripcion}>{item.descripcion}</Text>
          <Input
            value={item.cantidad}
            onChangeText={(val: string) => cambiarCantidad(i, val)}
            keyboardType="numeric"
            placeholder="Cantidad"
          />
          <View style={styles.estadoRow}>
            {(['B', 'R', 'M'] as Estado[]).map((op) => (
              <Boton
                key={op}
                title={op}
                icon="check"
                onPress={() => cambiarEstado(i, op)}
                color={item.estado === op ? colores.primario : '#666'}
              />
            ))}
          </View>
        </Card>
      ))}

      <Boton
        title="Guardar Inventario Semana"
        icon="save"
        onPress={guardarInventario}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colores.fondo,
    paddingBottom: 50,
  },
  label: {
    fontWeight: '600',
    color: colores.texto,
    marginTop: 10,
    marginBottom: 5,
  },
  descripcion: {
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 5,
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    gap: 10,
  },
});
