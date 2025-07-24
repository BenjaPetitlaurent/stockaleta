import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import DateTimePicker from '@react-native-community/datetimepicker';

import Card from '../components/CardPro';
import Boton from '../components/BotonPro';
import Titulo from '../components/Titulo';
import { colores, fuentes, espaciado } from '../theme';

interface Producto {
  nombre: string;
  cantidad: string;
  valorUnitario: string;
}

interface Factura {
  id: string;
  productos: Producto[];
  total: number;
  fecha: string;
  imagenFactura?: string;
}

export default function VerFacturasScreen() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [editando, setEditando] = useState<Factura | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [moneda, setMoneda] = useState<'CLP' | 'USD'>('CLP');

  const [busqueda, setBusqueda] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [mostrarDesde, setMostrarDesde] = useState(false);
  const [mostrarHasta, setMostrarHasta] = useState(false);

  useEffect(() => {
    cargarFacturas();
    AsyncStorage.getItem('rol').then((r) => setRol(r));
    AsyncStorage.getItem('moneda').then((m) => {
      if (m === 'USD' || m === 'CLP') setMoneda(m);
    });
  }, []);

  const cargarFacturas = async () => {
    const data = await AsyncStorage.getItem('facturas');
    if (data) {
      setFacturas(JSON.parse(data));
    }
  };

  const actualizarProducto = (
    index: number,
    campo: keyof Producto,
    valor: string
  ) => {
    if (!editando) return;
    const nuevos = [...editando.productos];
    nuevos[index][campo] = valor;
    setEditando({ ...editando, productos: nuevos });
  };

  const guardarEdicion = async () => {
    if (!editando) return;

    const total = editando.productos.reduce((acum, p) => {
      const cantidad = parseFloat(p.cantidad);
      const valor = parseFloat(p.valorUnitario);
      return acum + (isNaN(cantidad) || isNaN(valor) ? 0 : cantidad * valor);
    }, 0);

    const actualizada: Factura = { ...editando, total };
    const nuevas = facturas.map((f) => (f.id === actualizada.id ? actualizada : f));

    await AsyncStorage.setItem('facturas', JSON.stringify(nuevas));
    setFacturas(nuevas);
    setEditando(null);
  };

  const eliminarFactura = async (id: string) => {
    const nuevas = facturas.filter((f) => f.id !== id);
    setFacturas(nuevas);
    await AsyncStorage.setItem('facturas', JSON.stringify(nuevas));
  };

  const exportarTodasLasFacturas = async () => {
    if (rol !== 'admin') return;

    if (facturas.length === 0) {
      Alert.alert('No hay facturas para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Facturas');

    hoja.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Producto', key: 'producto', width: 30 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Valor Unitario', key: 'valorUnitario', width: 15 },
      { header: 'Total Producto', key: 'total', width: 15 },
    ];

    facturas.forEach((factura) => {
      const fecha = new Date(factura.fecha).toLocaleDateString('es-CL');
      factura.productos.forEach((prod) => {
        const cantidad = parseFloat(prod.cantidad);
        const valor = parseFloat(prod.valorUnitario);
        const total = (!isNaN(cantidad) && !isNaN(valor)) ? cantidad * valor : 0;

        hoja.addRow({
          fecha,
          producto: prod.nombre,
          cantidad: prod.cantidad,
          valorUnitario: prod.valorUnitario,
          total,
        });
      });
    });

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const nombreArchivo = `facturas_completas_${Date.now()}.xlsx`;
      const ruta = `${FileSystem.documentDirectory}${nombreArchivo}`;

      await FileSystem.writeAsStringAsync(ruta, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(ruta);
    } catch (error) {
      Alert.alert('Error al exportar');
      console.error(error);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setMontoMin('');
    setMontoMax('');
    setDesde(null);
    setHasta(null);
  };

  const facturasFiltradas = facturas.filter((f) => {
    const coincideNombre = f.productos.some((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const fechaFactura = new Date(f.fecha);
    const enRangoFecha = (!desde || fechaFactura >= desde) && (!hasta || fechaFactura <= hasta);
    const enRangoMonto = (!montoMin || f.total >= parseFloat(montoMin)) && (!montoMax || f.total <= parseFloat(montoMax));

    return coincideNombre && enRangoFecha && enRangoMonto;
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Facturas Registradas" />

      {rol === 'admin' && (
        <Boton title="Exportar Todas las Facturas" icon="download" onPress={exportarTodasLasFacturas} />
      )}

      <TextInput
        placeholder="Buscar por nombre de producto..."
        placeholderTextColor={colores.placeholder}
        style={styles.inputBusqueda}
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <TextInput
        placeholder="Monto mínimo"
        placeholderTextColor={colores.placeholder}
        style={styles.inputBusqueda}
        keyboardType="numeric"
        value={montoMin}
        onChangeText={setMontoMin}
      />

      <TextInput
        placeholder="Monto máximo"
        placeholderTextColor={colores.placeholder}
        style={styles.inputBusqueda}
        keyboardType="numeric"
        value={montoMax}
        onChangeText={setMontoMax}
      />

      <Pressable onPress={() => setMostrarDesde(true)}>
        <Text style={styles.fechaTexto}>
          Desde: {desde ? desde.toLocaleDateString() : 'Seleccionar'}
        </Text>
      </Pressable>
      {mostrarDesde && (
        <DateTimePicker
          value={desde || new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setMostrarDesde(false);
            if (date) setDesde(date);
          }}
        />
      )}

      <Pressable onPress={() => setMostrarHasta(true)}>
        <Text style={styles.fechaTexto}>
          Hasta: {hasta ? hasta.toLocaleDateString() : 'Seleccionar'}
        </Text>
      </Pressable>
      {mostrarHasta && (
        <DateTimePicker
          value={hasta || new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setMostrarHasta(false);
            if (date) setHasta(date);
          }}
        />
      )}

      <Boton title="Limpiar Filtros" icon="x" color="gray" onPress={limpiarFiltros} />

      {editando ? (
        <Card>
          <Text style={styles.label}>Editando Factura</Text>
          {editando.productos.map((p, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <TextInput
                style={styles.input}
                value={p.nombre}
                placeholder="Producto"
                onChangeText={(text: string) => actualizarProducto(i, 'nombre', text)}
              />
              <TextInput
                style={styles.input}
                value={p.cantidad}
                placeholder="Cantidad"
                keyboardType="numeric"
                onChangeText={(text: string) => actualizarProducto(i, 'cantidad', text)}
              />
              <TextInput
                style={styles.input}
                value={p.valorUnitario}
                placeholder="Valor Unitario"
                keyboardType="numeric"
                onChangeText={(text: string) => actualizarProducto(i, 'valorUnitario', text)}
              />
            </View>
          ))}
          <Boton title="Guardar Cambios" icon="save" onPress={guardarEdicion} />
          <Boton title="Cancelar" icon="x" color="gray" onPress={() => setEditando(null)} />
        </Card>
      ) : facturasFiltradas.length === 0 ? (
        <Text style={styles.textoClaro}>No hay facturas para mostrar.</Text>
      ) : (
        facturasFiltradas.map((factura) => (
          <Card key={factura.id}>
            <Text style={styles.label}>
              Fecha: {new Date(factura.fecha).toLocaleDateString()}
            </Text>
            {factura.productos.map((prod, i) => (
              <Text key={i} style={styles.textoClaro}>
                • {prod.nombre} | {prod.cantidad} x ${prod.valorUnitario}
              </Text>
            ))}
            <Text style={styles.total}>
              Total: {factura.total.toLocaleString('es-CL', { style: 'currency', currency: moneda })}
            </Text>

            {factura.imagenFactura && (
              <Image source={{ uri: factura.imagenFactura }} style={styles.imagen} />
            )}

            {rol === 'admin' && (
              <View style={styles.botones}>
                <Boton title="Editar" icon="edit" onPress={() => setEditando(factura)} />
                <Boton title="Eliminar" icon="trash" color="red" onPress={() => eliminarFactura(factura.id)} />
              </View>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: espaciado.padding,
    backgroundColor: colores.fondo,
    paddingBottom: 50,
  },
  label: {
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 8,
  },
  textoClaro: {
    color: colores.texto,
    marginBottom: 5,
  },
  total: {
    fontWeight: 'bold',
    color: colores.texto,
    marginTop: 10,
    textAlign: 'right',
  },
  imagen: {
    width: '100%',
    height: 180,
    marginTop: 10,
    borderRadius: 8,
  },
  botones: {
    marginTop: 10,
    gap: 10,
  },
  input: {
    backgroundColor: colores.fondoClaro,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: 8,
    color: colores.texto,
    padding: 8,
    marginBottom: 5,
  },
  inputBusqueda: {
    backgroundColor: colores.fondoClaro,
    borderColor: colores.borde,
    borderWidth: 1,
    borderRadius: 8,
    color: colores.texto,
    padding: 10,
    fontSize: fuentes.texto,
    marginBottom: 10,
  },
  fechaTexto: {
    color: colores.texto,
    marginBottom: 10,
    fontWeight: '600',
  },
});
