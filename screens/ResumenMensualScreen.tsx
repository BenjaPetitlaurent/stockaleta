import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

import Titulo from '../components/Titulo';
import BotonPro from '../components/BotonPro';
import CardPro from '../components/CardPro';
import InputPro from '../components/InputPro';
import { colores, espaciado, fuentes } from '../theme';

export default function ResumenMensualScreen() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [consumoTeorico, setConsumoTeorico] = useState<{ [producto: string]: string }>({});
  const [comentarios, setComentarios] = useState<{ [producto: string]: string }>({});
  const [vistaPrevia, setVistaPrevia] = useState<any[]>([]);
  const [firma, setFirma] = useState('');
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
    cargarHistorial();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataFacturas = await AsyncStorage.getItem('facturas');
      const dataInventarios = await AsyncStorage.getItem('inventarios');
      setFacturas(dataFacturas ? JSON.parse(dataFacturas) : []);
      setInventarios(dataInventarios ? JSON.parse(dataInventarios) : []);
    } catch (error) {
      Alert.alert('Error al cargar datos');
    }
  };

  const cargarHistorial = async () => {
    const data = await AsyncStorage.getItem('historial_exportaciones');
    if (data) setHistorial(JSON.parse(data));
  };

  const actualizarTeorico = (nombre: string, valor: string) => {
    setConsumoTeorico((prev) => ({ ...prev, [nombre]: valor }));
  };

  const actualizarComentario = (nombre: string, valor: string) => {
    setComentarios((prev) => ({ ...prev, [nombre]: valor }));
  };

  const totalFacturadoDelMes = facturas
    .filter((f) => {
      const fecha = new Date(f.fecha);
      return (
        fecha.getMonth() === mesSeleccionado.getMonth() &&
        fecha.getFullYear() === mesSeleccionado.getFullYear()
      );
    })
    .reduce((acum, f) => acum + (f.total || 0), 0);

  const generarResumen = async () => {
    const resumen: { [nombre: string]: { comprado: number } } = {};
    const preciosRaw = await AsyncStorage.getItem('valores_unitarios');
    const precios: { [producto: string]: number } = preciosRaw ? JSON.parse(preciosRaw) : {};

    facturas.forEach((factura) => {
      const fecha = new Date(factura.fecha);
      if (
        fecha.getMonth() === mesSeleccionado.getMonth() &&
        fecha.getFullYear() === mesSeleccionado.getFullYear()
      ) {
        factura.productos.forEach((p: any) => {
          const nombre = p.nombre.trim().toLowerCase();
          if (!resumen[nombre]) resumen[nombre] = { comprado: 0 };
          resumen[nombre].comprado += parseFloat(p.cantidad || 0);
        });
      }
    });

    const inventariosDelMes = inventarios.filter((inv) => {
      const fecha = new Date(inv.fecha);
      return (
        fecha.getMonth() === mesSeleccionado.getMonth() &&
        fecha.getFullYear() === mesSeleccionado.getFullYear()
      );
    });

    if (inventariosDelMes.length === 0) {
      Alert.alert('No hay inventarios para este mes');
      return;
    }

    const inicial = inventariosDelMes.reduce((a, b) =>
      new Date(a.fecha) < new Date(b.fecha) ? a : b
    );
    const final = inventariosDelMes.reduce((a, b) =>
      new Date(a.fecha) > new Date(b.fecha) ? a : b
    );

    const mapInicial: { [producto: string]: number } = {};
    const mapFinal: { [producto: string]: number } = {};

    inicial.activos.forEach((item: any) => {
      const nombre = item.nombre?.trim().toLowerCase();
      mapInicial[nombre] = parseFloat(item.cantidadCajas || '0');
    });

    final.activos.forEach((item: any) => {
      const nombre = item.nombre?.trim().toLowerCase();
      mapFinal[nombre] = parseFloat(item.cantidadCajas || '0');
    });

    const resultados = Object.keys({ ...resumen, ...mapInicial, ...mapFinal }).map((nombre) => {
      const comprado = resumen[nombre]?.comprado || 0;
      const inicial = mapInicial[nombre] || 0;
      const fin = mapFinal[nombre] || 0;
      const teorico = parseFloat(consumoTeorico[nombre] || '0');
      const real = inicial + comprado - fin;
      const desviacion = real - teorico;
      const estado = desviacion === 0 ? '🟢 Normal' : desviacion > 0 ? '🟡 Exceso' : '🔴 Pérdida';
      const unitario = precios[nombre] || 0;
      const valor = Math.abs(desviacion) * unitario;
      const comentario = comentarios[nombre] || '';

      return {
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
        inicial,
        compras: comprado,
        final: fin,
        real,
        teorico,
        desviacion,
        estado,
        unitario,
        valor,
        comentario,
      };
    });

    setVistaPrevia(resultados);
  };

  const exportarResumenExcel = async () => {
    if (vistaPrevia.length === 0) {
      Alert.alert('Primero genera la vista previa');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumen');

    sheet.columns = [
      { header: 'Producto', key: 'nombre', width: 25 },
      { header: 'Inicial', key: 'inicial', width: 10 },
      { header: 'Compras', key: 'compras', width: 10 },
      { header: 'Final', key: 'final', width: 10 },
      { header: 'Consumo Real', key: 'real', width: 15 },
      { header: 'Teórico', key: 'teorico', width: 12 },
      { header: 'Desviación', key: 'desviacion', width: 12 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Valor Unitario', key: 'unitario', width: 15 },
      { header: 'Valor ($)', key: 'valor', width: 15 },
      { header: 'Comentario', key: 'comentario', width: 30 },
    ];

    vistaPrevia.forEach((row) => {
      sheet.addRow(row);
    });

    sheet.addRow([]);
    sheet.addRow(['Resumen generado por:', firma]);
    sheet.addRow(['Fecha:', new Date().toLocaleString('es-CL')]);

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const fileName = `resumen_mensual_${Date.now()}.xlsx`;
      const uri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri);

      const nuevoRegistro = {
        fecha: new Date().toLocaleString('es-CL'),
        firma,
        mes: mesSeleccionado.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }),
        total: vistaPrevia.reduce((acc, item) => acc + item.valor, 0),
        cantidadProductos: vistaPrevia.length,
      };

      const data = await AsyncStorage.getItem('historial_exportaciones');
      const historialActual = data ? JSON.parse(data) : [];
      historialActual.unshift(nuevoRegistro);
      await AsyncStorage.setItem('historial_exportaciones', JSON.stringify(historialActual));
      setHistorial(historialActual);
    } catch (e) {
      Alert.alert('Error al exportar');
      console.error(e);
    }
  };

  const onChangeFecha = (_: any, date?: Date) => {
    setMostrarPicker(Platform.OS === 'ios');
    if (date) {
      setMesSeleccionado(date);
      setVistaPrevia([]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto="Resumen Mensual" />

      <View style={styles.filaFecha}>
        <Text style={styles.label}>Mes seleccionado:</Text>
        <Text style={styles.valor}>
          {mesSeleccionado.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
          })}
        </Text>
        <BotonPro title="Cambiar Mes" icon="calendar" onPress={() => setMostrarPicker(true)} />
      </View>

      {mostrarPicker && (
        <DateTimePicker
          value={mesSeleccionado}
          mode="date"
          display="default"
          onChange={onChangeFecha}
        />
      )}

      <CardPro>
        <Text style={styles.label}>Total Facturado:</Text>
        <Text style={styles.valor}>${totalFacturadoDelMes.toLocaleString('es-CL')}</Text>
      </CardPro>

      <Titulo texto="Consumo Teórico por Producto" />
      {Object.entries(
        facturas.reduce((acc, factura) => {
          factura.productos.forEach((p: any) => {
            const nombre = p.nombre.trim().toLowerCase();
            acc[nombre] = true;
          });
          return acc;
        }, {} as { [key: string]: boolean })
      ).map(([nombre]) => (
        <View key={nombre} style={{ marginBottom: 10 }}>
          <Text style={styles.texto}>{nombre.charAt(0).toUpperCase() + nombre.slice(1)}</Text>
          <InputPro
            placeholder="Ej: 10"
            keyboardType="numeric"
            value={consumoTeorico[nombre] || ''}
            onChangeText={(text: string) => actualizarTeorico(nombre, text)}
          />
          <InputPro
            placeholder="Comentario"
            value={comentarios[nombre] || ''}
            onChangeText={(text: string) => actualizarComentario(nombre, text)}
          />
        </View>
      ))}

      <InputPro
        placeholder="Firma del responsable"
        value={firma}
        onChangeText={setFirma}
      />

      <BotonPro title="Ver Vista Previa" icon="eye" onPress={generarResumen} />

      {vistaPrevia.length > 0 && (
        <>
          <Titulo texto="Vista Previa" />
          {vistaPrevia.map((item, index) => (
            <CardPro key={index}>
              <Text style={styles.texto}>
                • {item.nombre} | Inicial: {item.inicial} | Compras: {item.compras} | Final: {item.final}
              </Text>
              <Text style={styles.texto}>
                Real: {item.real} | Teórico: {item.teorico} | Desviación: {item.desviacion} {item.estado}
              </Text>
              <Text style={styles.texto}>
                Valor Unitario: ${item.unitario} | Valor: ${item.valor}
              </Text>
              {item.comentario && (
                <Text style={styles.texto}>Comentario: {item.comentario}</Text>
              )}
            </CardPro>
          ))}
          <Text style={styles.label}>Responsable: {firma}</Text>
        </>
      )}

      <BotonPro title="Exportar Excel" icon="download" onPress={exportarResumenExcel} />

      {historial.length > 0 && (
        <>
          <Titulo texto="Historial de Exportaciones" />
          {historial.map((h, i) => (
            <CardPro key={i}>
              <Text style={styles.texto}>🗓️ {h.fecha}</Text>
              <Text style={styles.texto}>📅 Mes: {h.mes}</Text>
              <Text style={styles.texto}>👤 Responsable: {h.firma}</Text>
              <Text style={styles.texto}>📦 Productos: {h.cantidadProductos}</Text>
              <Text style={styles.texto}>💰 Total estimado: ${h.total.toLocaleString('es-CL')}</Text>
            </CardPro>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colores.fondo,
    padding: espaciado.padding,
    paddingBottom: 60,
  },
  filaFecha: {
    marginBottom: 20,
  },
  label: {
    color: colores.texto,
    fontSize: fuentes.texto,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  valor: {
    color: colores.texto,
    fontSize: fuentes.subtitulo,
    marginBottom: 10,
  },
  texto: {
    color: colores.texto,
    fontSize: fuentes.texto,
    marginBottom: 5,
  },
});
