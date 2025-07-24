import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

import CardPro from '../components/CardPro';
import BotonPro from '../components/BotonPro';
import Titulo from '../components/Titulo';
import Input from '../components/InputPro';
import { colores, espaciado, fuentes } from '../theme';

type Inventario = {
  id: string;
  fecha: string;
  activos: any[];
};

export default function VerInventarioScreen() {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tempActivos, setTempActivos] = useState<any[]>([]);
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    const cargar = async () => {
      const data = await AsyncStorage.getItem('inventarios');
      if (data) setInventarios(JSON.parse(data));

      const rolGuardado = await AsyncStorage.getItem('rol');
      setRol(rolGuardado);
    };

    cargar();
  }, []);

  const exportarIndividual = async (inventario: Inventario) => {
    const wb = new ExcelJS.Workbook();
    const hoja = wb.addWorksheet('Inventario');

    hoja.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Unidad de Medida', key: 'unidadMedida', width: 20 },
      { header: 'Cajas', key: 'cantidadCajas', width: 10 },
      { header: 'Unidades/Caja', key: 'unidadesPorCaja', width: 15 },
      { header: 'Peso/Caja', key: 'pesoPorCaja', width: 12 },
      { header: 'Unidad Peso', key: 'unidadPeso', width: 12 },
      { header: 'Valor/Caja', key: 'valorPorCaja', width: 15 },
      { header: 'Estado', key: 'estado', width: 10 },
    ];

    inventario.activos.forEach((item) => hoja.addRow({ ...item }));

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const fileName = `inventario_${inventario.id}.xlsx`;
    const uri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri);
  };

  const exportarTodos = async () => {
    if (rol !== 'admin') return;

    if (inventarios.length === 0) {
      Alert.alert('No hay inventarios para exportar');
      return;
    }

    const wb = new ExcelJS.Workbook();

    inventarios.forEach((inv, i) => {
      const fecha = new Date(inv.fecha).toLocaleDateString('es-CL');
      const hoja = wb.addWorksheet(`Inventario ${i + 1} (${fecha})`);

      hoja.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Unidad de Medida', key: 'unidadMedida', width: 20 },
        { header: 'Cajas', key: 'cantidadCajas', width: 10 },
        { header: 'Unidades/Caja', key: 'unidadesPorCaja', width: 15 },
        { header: 'Peso/Caja', key: 'pesoPorCaja', width: 12 },
        { header: 'Unidad Peso', key: 'unidadPeso', width: 12 },
        { header: 'Valor/Caja', key: 'valorPorCaja', width: 15 },
        { header: 'Estado', key: 'estado', width: 10 },
      ];

      inv.activos.forEach((item) => hoja.addRow({ ...item }));
    });

    try {
      const buffer = await wb.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const fileName = `inventarios_completos_${Date.now()}.xlsx`;
      const uri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error al exportar');
      console.error(error);
    }
  };

  const eliminarInventario = async (id: string) => {
    const nuevos = inventarios.filter((inv) => inv.id !== id);
    await AsyncStorage.setItem('inventarios', JSON.stringify(nuevos));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInventarios(nuevos);
  };

  const iniciarEdicion = (inv: Inventario) => {
    setEditandoId(inv.id);
    setTempActivos(JSON.parse(JSON.stringify(inv.activos)));
  };

  const actualizarCampo = (index: number, campo: string, valor: string) => {
    const nuevos = [...tempActivos];
    nuevos[index][campo] = valor;
    setTempActivos(nuevos);
  };

  const guardarCambios = async (id: string) => {
    const nuevos = inventarios.map((inv) =>
      inv.id === id ? { ...inv, activos: tempActivos } : inv
    );
    await AsyncStorage.setItem('inventarios', JSON.stringify(nuevos));
    setInventarios(nuevos);
    setEditandoId(null);
  };

  const aplicarFiltros = (activos: any[]) => {
    return activos.filter((item) => {
      const coincideFamilia =
        filtroFamilia === '' || item.familia?.toLowerCase().includes(filtroFamilia.toLowerCase());
      const coincideUnidad = filtroUnidad === '' || item.unidadMedida === filtroUnidad;
      const coincideEstado = filtroEstado === '' || item.estado === filtroEstado;
      return coincideFamilia && coincideUnidad && coincideEstado;
    });
  };

  const limpiarFiltros = () => {
    setFiltroFamilia('');
    setFiltroUnidad('');
    setFiltroEstado('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Inventario Semanal" />

      {rol === 'admin' && (
        <BotonPro title="Exportar Todos" icon="file-text" onPress={exportarTodos} />
      )}

      <Text style={styles.filtroTitulo}>Filtros:</Text>

      <Input placeholder="Familia..." value={filtroFamilia} onChangeText={setFiltroFamilia} />

      <View style={styles.fila}>
        <BotonPro
          title="Unidad"
          icon="box"
          onPress={() => setFiltroUnidad('unidad')}
          color={filtroUnidad === 'unidad' ? colores.primario : '#555'}
        />
        <BotonPro
          title="Peso"
          icon="scissors"
          onPress={() => setFiltroUnidad('peso')}
          color={filtroUnidad === 'peso' ? colores.primario : '#555'}
        />
      </View>

      <View style={styles.fila}>
        <BotonPro
          title="B"
          icon="check"
          onPress={() => setFiltroEstado('B')}
          color={filtroEstado === 'B' ? colores.primario : '#555'}
        />
        <BotonPro
          title="R"
          icon="alert-circle"
          onPress={() => setFiltroEstado('R')}
          color={filtroEstado === 'R' ? colores.primario : '#555'}
        />
        <BotonPro
          title="M"
          icon="x"
          onPress={() => setFiltroEstado('M')}
          color={filtroEstado === 'M' ? colores.primario : '#555'}
        />
      </View>

      <BotonPro title="Limpiar Filtros" icon="rotate-ccw" color="gray" onPress={limpiarFiltros} />

      {inventarios.map((inv, index) => {
        const activosFiltrados = aplicarFiltros(inv.activos);
        if (activosFiltrados.length === 0) return null;

        return (
          <CardPro key={inv.id}>
            <Text style={styles.label}>
              Inventario N° {index + 1} — {new Date(inv.fecha).toLocaleDateString('es-CL')}
            </Text>

            {(editandoId === inv.id ? tempActivos : activosFiltrados).map((item, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                {editandoId === inv.id ? (
                  <>
                    <Input value={item.nombre} onChangeText={(v: string) => actualizarCampo(i, 'nombre', v)} placeholder="Nombre" />
                    <Input value={item.cantidadCajas} onChangeText={(v: string) => actualizarCampo(i, 'cantidadCajas', v)} placeholder="Cajas" keyboardType="numeric" />
                    <Input value={item.unidadMedida} onChangeText={(v: string) => actualizarCampo(i, 'unidadMedida', v)} placeholder="unidad/peso" />
                    <Input value={item.unidadesPorCaja} onChangeText={(v: string) => actualizarCampo(i, 'unidadesPorCaja', v)} placeholder="Unidades/Caja" keyboardType="numeric" />
                    <Input value={item.pesoPorCaja} onChangeText={(v: string) => actualizarCampo(i, 'pesoPorCaja', v)} placeholder="Peso/Caja" keyboardType="numeric" />
                    <Input value={item.unidadPeso} onChangeText={(v: string) => actualizarCampo(i, 'unidadPeso', v)} placeholder="kg/g" />
                    <Input value={item.valorPorCaja} onChangeText={(v: string) => actualizarCampo(i, 'valorPorCaja', v)} placeholder="Valor/Caja" keyboardType="numeric" />
                    <Input value={item.estado} onChangeText={(v: string) => actualizarCampo(i, 'estado', v.toUpperCase())} placeholder="B/R/M" maxLength={1} />
                  </>
                ) : (
                  <Text style={styles.texto}>
                    • {item.nombre} — {item.cantidadCajas} caja(s) — {item.unidadMedida === 'unidad'
                      ? `${item.unidadesPorCaja} unidades/caja`
                      : `${item.pesoPorCaja}${item.unidadPeso} por caja`} — Estado: {item.estado}
                  </Text>
                )}
              </View>
            ))}

            <View style={styles.fila}>
              {editandoId === inv.id ? (
                <>
                  <BotonPro title="Guardar" icon="save" onPress={() => guardarCambios(inv.id)} />
                  <BotonPro title="Cancelar" icon="x" color="gray" onPress={() => { setEditandoId(null); setTempActivos([]); }} />
                </>
              ) : (
                <>
                  {rol === 'admin' && (
                    <>
                      <BotonPro title="Exportar" icon="download" onPress={() => exportarIndividual(inv)} />
                      <BotonPro title="Editar" icon="edit" onPress={() => iniciarEdicion(inv)} />
                      <BotonPro title="Eliminar" icon="trash" color={colores.peligro} onPress={() =>
                        Alert.alert('¿Eliminar?', '¿Seguro que deseas eliminar este inventario?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => eliminarInventario(inv.id) },
                        ])
                      } />
                    </>
                  )}
                </>
              )}
            </View>
          </CardPro>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: espaciado.padding,
    backgroundColor: colores.fondo,
    paddingBottom: 60,
  },
  label: {
    fontWeight: 'bold',
    color: colores.texto,
    marginBottom: 5,
  },
  texto: {
    color: colores.texto,
    fontSize: fuentes.texto,
    marginBottom: 6,
  },
  filtroTitulo: {
    fontWeight: 'bold',
    fontSize: fuentes.subtitulo,
    color: colores.texto,
    marginTop: 20,
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
});
