import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Pressable,
  LayoutAnimation,
  UIManager,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import InputPro from '../components/InputPro';
import CardPro from '../components/CardPro';
import Titulo from '../components/Titulo';
import BotonPro from '../components/BotonPro';
import { colores, espaciado, fuentes } from '../theme';

export default function FacturaScreen() {
  const [productos, setProductos] = useState([{ nombre: '', cantidad: '', valorUnitario: '' }]);
  const [imagenFactura, setImagenFactura] = useState('');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [historialNombres, setHistorialNombres] = useState<string[]>([]);
  const [moneda, setMoneda] = useState<'CLP' | 'USD'>('CLP');

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    cargarHistorial();

    AsyncStorage.getItem('moneda').then((m) => {
      if (m === 'USD' || m === 'CLP') setMoneda(m);
    });
  }, []);

  const cargarHistorial = async () => {
    const data = await AsyncStorage.getItem('facturas');
    if (!data) return;
    const facturas = JSON.parse(data);
    const nombres: Set<string> = new Set();
    facturas.forEach((f: any) => {
      f.productos.forEach((p: any) => nombres.add(p.nombre.trim()));
    });
    setHistorialNombres(Array.from(nombres));
  };

  const animar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const agregarProducto = () => {
    animar();
    setProductos([...productos, { nombre: '', cantidad: '', valorUnitario: '' }]);
  };

  const actualizarProducto = (
    index: number,
    campo: keyof typeof productos[0],
    valor: string
  ) => {
    const nuevos = [...productos];
    nuevos[index][campo] = valor;
    setProductos(nuevos);

    if (campo === 'nombre') {
      const texto = valor.toLowerCase();
      const coincidencias = historialNombres.filter((nombre) =>
        nombre.toLowerCase().includes(texto)
      );
      setSugerencias(coincidencias);
    }
  };

  const seleccionarSugerencia = (index: number, texto: string) => {
    actualizarProducto(index, 'nombre', texto);
    setSugerencias([]);
  };

  const totalFactura = () => {
    return productos.reduce((acum, prod) => {
      const cantidad = parseFloat(prod.cantidad);
      const valor = parseFloat(prod.valorUnitario);
      if (!isNaN(cantidad) && !isNaN(valor)) {
        return acum + cantidad * valor;
      }
      return acum;
    }, 0);
  };

  const pedirPermisoCamara = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para usar la cámara.');
      return false;
    }
    return true;
  };

  const tomarFoto = async () => {
    const tienePermiso = await pedirPermisoCamara();
    if (!tienePermiso) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      animar();
      setImagenFactura(result.assets[0].uri);
    }
  };

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      animar();
      setImagenFactura(result.assets[0].uri);
    }
  };

  const guardarFactura = async () => {
    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      if (!p.nombre.trim()) {
        Alert.alert(`Producto ${i + 1}: falta el nombre`);
        return;
      }
      if (isNaN(parseFloat(p.cantidad)) || parseFloat(p.cantidad) <= 0) {
        Alert.alert(`Producto ${i + 1}: la cantidad debe ser un número positivo`);
        return;
      }
      if (isNaN(parseFloat(p.valorUnitario)) || parseFloat(p.valorUnitario) <= 0) {
        Alert.alert(`Producto ${i + 1}: el valor unitario debe ser un número positivo`);
        return;
      }
    }

    const factura = {
      id: Date.now().toString(),
      productos,
      total: totalFactura(),
      imagenFactura,
      fecha: fecha.toISOString(),
    };

    try {
      const data = await AsyncStorage.getItem('facturas');
      const facturas = data ? JSON.parse(data) : [];
      facturas.push(factura);
      await AsyncStorage.setItem('facturas', JSON.stringify(facturas));

      const preciosGuardados = await AsyncStorage.getItem('valores_unitarios');
      const precios = preciosGuardados ? JSON.parse(preciosGuardados) : {};

      productos.forEach((p) => {
        const nombreNormalizado = p.nombre.trim().toLowerCase();
        const valor = parseFloat(p.valorUnitario);
        if (!isNaN(valor)) {
          precios[nombreNormalizado] = valor;
        }
      });

      await AsyncStorage.setItem('valores_unitarios', JSON.stringify(precios));

      Alert.alert('Factura guardada correctamente');
      animar();
      setProductos([{ nombre: '', cantidad: '', valorUnitario: '' }]);
      setImagenFactura('');
      setFecha(new Date());
    } catch (error) {
      Alert.alert('Error al guardar la factura');
      console.error(error);
    }
  };

  const onChangeFecha = (event: any, selectedDate?: Date) => {
    setMostrarPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: colores.fondo }}>
      <Titulo texto="Registrar Factura" />

      <Pressable onPress={() => setMostrarPicker(true)} style={styles.fechaSelector}>
        <Text style={styles.label}>Fecha: {fecha.toLocaleDateString()}</Text>
      </Pressable>

      {mostrarPicker && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display="default"
          onChange={onChangeFecha}
          locale="es-CL"
        />
      )}

      {productos.map((producto, index) => (
        <CardPro key={index}>
          <Text style={styles.label}>Producto</Text>
          <InputPro
            value={producto.nombre}
            onChangeText={(text: string) => actualizarProducto(index, 'nombre', text)}
            placeholder="Ej: Empanadas de queso"
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

          <Text style={styles.label}>Cantidad</Text>
          <InputPro
            value={producto.cantidad}
            onChangeText={(text: string) => actualizarProducto(index, 'cantidad', text)}
            keyboardType="numeric"
            placeholder="Ej: 10"
          />

          <Text style={styles.label}>Valor unitario</Text>
          <InputPro
            value={producto.valorUnitario}
            onChangeText={(text: string) => actualizarProducto(index, 'valorUnitario', text)}
            keyboardType="numeric"
            placeholder="Ej: 1500"
          />
        </CardPro>
      ))}

      <BotonPro title="Agregar Producto" icon="plus" onPress={agregarProducto} />

      <Text style={styles.total}>
        Total: {totalFactura().toLocaleString('es-CL', {
          style: 'currency',
          currency: moneda,
        })}
      </Text>

      <BotonPro title="Tomar Foto" icon="camera" onPress={tomarFoto} />
      <BotonPro title="Galería" icon="image" onPress={seleccionarImagen} />

      {imagenFactura !== '' && (
        <>
          <Image source={{ uri: imagenFactura }} style={styles.imagenPreview} />
          <BotonPro
            title="Eliminar Imagen"
            icon="trash-2"
            color={colores.peligro}
            onPress={() => {
              animar();
              setImagenFactura('');
            }}
          />
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <BotonPro title="Guardar Factura" icon="save" onPress={guardarFactura} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: espaciado.padding,
    paddingBottom: 60,
    backgroundColor: colores.fondo,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    color: colores.texto,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 15,
    textAlign: 'right',
    color: colores.texto,
  },
  imagenPreview: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  fechaSelector: {
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colores.borde,
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
