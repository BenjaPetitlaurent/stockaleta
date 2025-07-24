import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import InputPro from '../components/InputPro';
import CardPro from '../components/CardPro';
import Titulo from '../components/Titulo';
import BotonPro from '../components/BotonPro';
import { colores, espaciado, fuentes } from '../theme';

type ItemInventario = {
  descripcion: string;
  unidadMedida: string;
  cantidadCajas: string;
  unidadesPorCaja: string;
  pesoPorCaja: string;
  unidadPeso: string;
  valorPorCaja: string;
  familia: string;
  estado: string;
  imagenUri: string;
};

export default function HacerInventarioScreen() {
  const [items, setItems] = useState<ItemInventario[]>([
    {
      descripcion: '',
      unidadMedida: 'unidad',
      cantidadCajas: '',
      unidadesPorCaja: '',
      pesoPorCaja: '',
      unidadPeso: 'kg',
      valorPorCaja: '',
      familia: '',
      estado: '',
      imagenUri: '',
    },
  ]);
  const [historialDescripciones, setHistorialDescripciones] = useState<string[]>([]);
  const [sugerencias, setSugerencias] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    const data = await AsyncStorage.getItem('inventarios');
    if (!data) return;
    const inventarios = JSON.parse(data);
    const nombres: Set<string> = new Set();
    inventarios.forEach((inv: any) => {
      inv.activos.forEach((a: any) => {
        if (a.nombre) nombres.add(a.nombre.trim());
      });
    });
    setHistorialDescripciones(Array.from(nombres));
  };

  const animar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const agregarItem = () => {
    animar();
    setItems([
      ...items,
      {
        descripcion: '',
        unidadMedida: 'unidad',
        cantidadCajas: '',
        unidadesPorCaja: '',
        pesoPorCaja: '',
        unidadPeso: 'kg',
        valorPorCaja: '',
        familia: '',
        estado: '',
        imagenUri: '',
      },
    ]);
  };

  const actualizarItem = (
    index: number,
    campo: keyof ItemInventario,
    valor: string
  ) => {
    const nuevos = [...items];
    nuevos[index][campo] = valor;
    setItems(nuevos);

    if (campo === 'descripcion') {
      const texto = valor.toLowerCase();
      const coincidencias = historialDescripciones.filter((d) =>
        d.toLowerCase().includes(texto)
      );
      setSugerencias(coincidencias);
    }
  };

  const seleccionarSugerencia = (index: number, texto: string) => {
    actualizarItem(index, 'descripcion', texto);
    setSugerencias([]);
  };

  const calcularTotal = (item: ItemInventario): number => {
    const cajas = parseFloat(item.cantidadCajas);
    const valor = parseFloat(item.valorPorCaja);
    if (!isNaN(cajas) && !isNaN(valor)) {
      return cajas * valor;
    }
    return 0;
  };

  const pedirPermisoCamara = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para usar la cámara.');
      return false;
    }
    return true;
  };

  const tomarFoto = async (index: number) => {
    const tienePermiso = await pedirPermisoCamara();
    if (!tienePermiso) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      animar();
      actualizarItem(index, 'imagenUri', result.assets[0].uri);
    }
  };

  const seleccionarImagen = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      animar();
      actualizarItem(index, 'imagenUri', result.assets[0].uri);
    }
  };
  const guardarInventario = async () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.descripcion.trim()) {
        Alert.alert(`Ítem ${i + 1}: falta la descripción`);
        return;
      }

      if (isNaN(parseFloat(item.cantidadCajas)) || parseFloat(item.cantidadCajas) <= 0) {
        Alert.alert(`Ítem ${i + 1}: la cantidad de cajas debe ser un número positivo`);
        return;
      }

      if (isNaN(parseFloat(item.valorPorCaja)) || parseFloat(item.valorPorCaja) <= 0) {
        Alert.alert(`Ítem ${i + 1}: el valor por caja debe ser un número positivo`);
        return;
      }

      if (item.unidadMedida === 'unidad') {
        if (isNaN(parseFloat(item.unidadesPorCaja)) || parseFloat(item.unidadesPorCaja) <= 0) {
          Alert.alert(`Ítem ${i + 1}: las unidades por caja deben ser un número positivo`);
          return;
        }
      } else if (item.unidadMedida === 'peso') {
        if (isNaN(parseFloat(item.pesoPorCaja)) || parseFloat(item.pesoPorCaja) <= 0) {
          Alert.alert(`Ítem ${i + 1}: el peso por caja debe ser un número positivo`);
          return;
        }
        if (!['kg', 'g'].includes(item.unidadPeso)) {
          Alert.alert(`Ítem ${i + 1}: la unidad de peso debe ser kg o g`);
          return;
        }
      }
    }

    const fecha = new Date().toISOString();
    const inventario = {
      id: Date.now().toString(),
      fecha,
      activos: items.map((item) => ({
        nombre: item.descripcion,
        unidadMedida: item.unidadMedida,
        cantidadCajas: item.cantidadCajas,
        unidadesPorCaja: item.unidadesPorCaja,
        pesoPorCaja: item.pesoPorCaja,
        unidadPeso: item.unidadPeso,
        valorPorCaja: item.valorPorCaja,
        familia: item.familia,
        estado: item.estado,
      })),
    };

    try {
      const data = await AsyncStorage.getItem('inventarios');
      const historico = data ? JSON.parse(data) : [];
      historico.push(inventario);
      await AsyncStorage.setItem('inventarios', JSON.stringify(historico));
      Alert.alert('Inventario guardado con éxito');
      animar();
      setItems([
        {
          descripcion: '',
          unidadMedida: 'unidad',
          cantidadCajas: '',
          unidadesPorCaja: '',
          pesoPorCaja: '',
          unidadPeso: 'kg',
          valorPorCaja: '',
          familia: '',
          estado: '',
          imagenUri: '',
        },
      ]);
    } catch (error) {
      Alert.alert('Error al guardar inventario');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Hacer Inventario" />

      {items.map((item, index) => (
        <CardPro key={index}>
          <Text style={styles.label}>Descripción</Text>
          <InputPro
            value={item.descripcion}
            onChangeText={(v) => actualizarItem(index, 'descripcion', v)}
            placeholder="Ej: Empanadas / Costillas"
          />
          {sugerencias.length > 0 && (
            <View style={styles.sugerencias}>
              {sugerencias.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => seleccionarSugerencia(index, s)}>
                  <Text style={styles.sugerenciaItem}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Unidad de medida</Text>
          <View style={styles.row}>
            <BotonPro
              title="Por unidad"
              icon="hash"
              onPress={() => actualizarItem(index, 'unidadMedida', 'unidad')}
              color={item.unidadMedida === 'unidad' ? colores.primario : '#444'}
            />
            <BotonPro
              title="Por peso"
              icon="scissors"
              onPress={() => actualizarItem(index, 'unidadMedida', 'peso')}
              color={item.unidadMedida === 'peso' ? colores.primario : '#444'}
            />
          </View>

          <Text style={styles.label}>Cantidad de cajas</Text>
          <InputPro
            value={item.cantidadCajas}
            onChangeText={(v) => actualizarItem(index, 'cantidadCajas', v)}
            keyboardType="numeric"
            placeholder="Ej: 3"
          />

          {item.unidadMedida === 'unidad' ? (
            <>
              <Text style={styles.label}>Unidades por caja</Text>
              <InputPro
                value={item.unidadesPorCaja}
                onChangeText={(v) => actualizarItem(index, 'unidadesPorCaja', v)}
                keyboardType="numeric"
                placeholder="Ej: 120"
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Peso por caja</Text>
              <InputPro
                value={item.pesoPorCaja}
                onChangeText={(v) => actualizarItem(index, 'pesoPorCaja', v)}
                keyboardType="numeric"
                placeholder="Ej: 5"
              />
              <View style={styles.row}>
                <BotonPro
                  title="kg"
                  icon="circle"
                  onPress={() => actualizarItem(index, 'unidadPeso', 'kg')}
                  color={item.unidadPeso === 'kg' ? colores.primario : '#444'}
                />
                <BotonPro
                  title="g"
                  icon="circle"
                  onPress={() => actualizarItem(index, 'unidadPeso', 'g')}
                  color={item.unidadPeso === 'g' ? colores.primario : '#444'}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Valor por caja</Text>
          <InputPro
            value={item.valorPorCaja}
            onChangeText={(v) => actualizarItem(index, 'valorPorCaja', v)}
            keyboardType="numeric"
            placeholder="Ej: 20000"
          />

          <Text style={styles.total}>
            Total: {calcularTotal(item).toLocaleString('es-CL', {
              style: 'currency',
              currency: 'CLP',
            })}
          </Text>

          <Text style={styles.label}>Familia</Text>
          <InputPro
            value={item.familia}
            onChangeText={(v) => actualizarItem(index, 'familia', v)}
            placeholder="Ej: Cocina / Frío / Despensa"
          />

          <Text style={styles.label}>Estado (B / R / M)</Text>
          <InputPro
            value={item.estado}
            onChangeText={(v) => actualizarItem(index, 'estado', v.toUpperCase())}
            maxLength={1}
            placeholder="Ej: B"
          />

          <BotonPro title="Tomar Foto" icon="camera" onPress={() => tomarFoto(index)} />
          <BotonPro title="Seleccionar Imagen" icon="image" onPress={() => seleccionarImagen(index)} />

          {item.imagenUri !== '' && (
            <>
              <Image source={{ uri: item.imagenUri }} style={styles.imagenPreview} />
              <BotonPro
                title="Eliminar Imagen"
                icon="trash"
                color={colores.peligro}
                onPress={() => {
                  animar();
                  actualizarItem(index, 'imagenUri', '');
                }}
              />
            </>
          )}
        </CardPro>
      ))}

      <View style={styles.agregarArea}>
        <BotonPro title="Agregar Ítem" icon="plus" onPress={agregarItem} />
        <BotonPro title="Guardar Inventario" icon="save" onPress={guardarInventario} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: espaciado.padding,
    backgroundColor: colores.fondo,
    paddingBottom: 40,
  },
  label: {
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colores.texto,
    marginBottom: 10,
    textAlign: 'right',
  },
  imagenPreview: {
    width: '100%',
    height: 150,
    marginTop: 10,
    borderRadius: 8,
  },
  agregarArea: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    gap: 12,
  },
  sugerencias: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  sugerenciaItem: {
    color: '#fff',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: '#444',
  },
});
