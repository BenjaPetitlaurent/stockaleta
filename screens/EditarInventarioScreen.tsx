import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Activo = { nombre: string; cantidad: number; estado: string };
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'EditarInventarioScreen'>;

export default function EditarInventarioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { inventario } = route.params;

  const [activos, setActivos] = useState<Activo[]>(inventario.activos);

  const actualizarActivo = (index: number, campo: keyof Activo, valor: string) => {
    const nuevos = [...activos];
    (nuevos[index] as any)[campo] = campo === 'cantidad' ? Number(valor) : valor;

    setActivos(nuevos);
  };

  const guardarCambios = async () => {
    try {
      const data = await AsyncStorage.getItem('inventarios');
      const inventarios = data ? JSON.parse(data) : [];

      const actualizados = inventarios.map((inv: any) =>
        inv.id === inventario.id ? { ...inv, activos } : inv
      );

      await AsyncStorage.setItem('inventarios', JSON.stringify(actualizados));
      Alert.alert('Inventario actualizado');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error al guardar');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Inventario</Text>

      {activos.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            value={item.nombre}
            onChangeText={(text) => actualizarActivo(index, 'nombre', text)}
          />

          <Text style={styles.label}>Cantidad:</Text>
          <TextInput
            style={styles.input}
            value={String(item.cantidad)}
            keyboardType="numeric"
            onChangeText={(text) => actualizarActivo(index, 'cantidad', text)}
          />

          <Text style={styles.label}>Estado (B / R / M):</Text>
          <TextInput
            style={styles.input}
            value={item.estado}
            onChangeText={(text) => actualizarActivo(index, 'estado', text)}
          />
        </View>
      ))}

      <Button title="Guardar Cambios" onPress={guardarCambios} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});
