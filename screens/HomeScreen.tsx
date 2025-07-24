import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Titulo from '../components/Titulo';
import CardPro from '../components/CardPro';
import BotonPro from '../components/BotonPro';
import { colores, espaciado, fuentes } from '../theme';
import { RootStackParamList } from '../types';
import { configurarNotificaciones, mostrarNotificacion } from '../notificaciones';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [cantidadInventarios, setCantidadInventarios] = useState(0);
  const [porcentajePerdida, setPorcentajePerdida] = useState(0);
  const [nombreLocal, setNombreLocal] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    cargarResumen();
    AsyncStorage.getItem('nombreLocal').then((n) => {
      if (n) setNombreLocal(n);
    });
    configurarNotificaciones();
  }, []);

  const cargarResumen = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const dataFacturas = await AsyncStorage.getItem('facturas');
      const dataInventarios = await AsyncStorage.getItem('inventarios');

      const facturas = dataFacturas ? JSON.parse(dataFacturas) : [];
      const inventarios = dataInventarios ? JSON.parse(dataInventarios) : [];

      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();

      const facturadoMes = facturas
        .filter((f: any) => {
          const fecha = new Date(f.fecha);
          return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
        })
        .reduce((acum: number, f: any) => acum + (f.total || 0), 0);

      const inventariosMes = inventarios.filter((inv: any) => {
        const fecha = new Date(inv.fecha);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      });

      setTotalFacturado(facturadoMes);
      setCantidadInventarios(inventariosMes.length);

      if (inventariosMes.length >= 2) {
        const inicial = inventariosMes.reduce((prev: any, curr: any) =>
          new Date(prev.fecha) < new Date(curr.fecha) ? prev : curr
        );
        const final = inventariosMes.reduce((prev: any, curr: any) =>
          new Date(prev.fecha) > new Date(curr.fecha) ? prev : curr
        );

        const totalInicial = inicial.activos.reduce(
          (sum: number, a: any) => sum + Number(a.cantidadCajas || 0), 0
        );
        const totalFinal = final.activos.reduce(
          (sum: number, a: any) => sum + Number(a.cantidadCajas || 0), 0
        );

        const diferencia = totalInicial - totalFinal;
        const perdida = totalInicial > 0 ? (diferencia / totalInicial) * 100 : 0;
        setPorcentajePerdida(Math.round(perdida));
      } else {
        setPorcentajePerdida(0);
      }
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const cargarDatosDemo = async () => {
    const hoy = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);

    const demoFactura = {
      id: 'demo-factura',
      fecha: hoy.toISOString(),
      total: 45000,
      imagenFactura: '',
      productos: [
        { nombre: 'Empanadas queso', cantidad: '10', valorUnitario: '1500' },
        { nombre: 'Costillas BBQ', cantidad: '5', valorUnitario: '3000' },
      ],
    };

    const demoInventario1 = {
      id: 'demo-inv-1',
      fecha: haceUnaSemana.toISOString(),
      activos: [
        { nombre: 'Empanadas queso', cantidadCajas: '3', estado: 'B' },
        { nombre: 'Costillas BBQ', cantidadCajas: '4', estado: 'B' },
      ],
    };

    const demoInventario2 = {
      id: 'demo-inv-2',
      fecha: hoy.toISOString(),
      activos: [
        { nombre: 'Empanadas queso', cantidadCajas: '1', estado: 'B' },
        { nombre: 'Costillas BBQ', cantidadCajas: '2', estado: 'B' },
      ],
    };

    try {
      const dataFacturas = await AsyncStorage.getItem('facturas');
      const dataInventarios = await AsyncStorage.getItem('inventarios');

      const facturas = dataFacturas ? JSON.parse(dataFacturas) : [];
      const inventarios = dataInventarios ? JSON.parse(dataInventarios) : [];

      facturas.push(demoFactura);
      inventarios.push(demoInventario1, demoInventario2);

      await AsyncStorage.setItem('facturas', JSON.stringify(facturas));
      await AsyncStorage.setItem('inventarios', JSON.stringify(inventarios));

      Alert.alert('Modo demo', 'Datos de prueba cargados correctamente');
      cargarResumen();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de prueba');
      console.error(error);
    }
  };

  const borrarTodo = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Datos eliminados', 'Toda la información fue borrada correctamente');
      setTotalFacturado(0);
      setCantidadInventarios(0);
      setPorcentajePerdida(0);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron borrar los datos');
      console.error(error);
    }
  };

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('logueado');
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Titulo texto={`Bienvenido a ${nombreLocal || 'Stockaleta'}`} />

      <CardPro>
        <Text style={styles.label}>Total facturado del mes</Text>
        <Text style={styles.valor}>${totalFacturado.toLocaleString('es-CL')}</Text>
      </CardPro>

      <CardPro>
        <Text style={styles.label}>Inventarios registrados este mes</Text>
        <Text style={styles.valor}>{cantidadInventarios}</Text>
      </CardPro>

      <CardPro>
        <Text style={styles.label}>% de pérdida estimada</Text>
        <Text
          style={[
            styles.valor,
            { color: porcentajePerdida > 10 ? colores.peligro : colores.exito },
          ]}
        >
          {porcentajePerdida}%
        </Text>
      </CardPro>

      <View style={styles.botones}>
        <BotonPro
          title="Hacer Inventario"
          icon="edit"
          onPress={() => navigation.navigate('HacerInventarioScreen')}
        />
        <BotonPro
          title="Ver Inventario"
          icon="eye"
          onPress={() => navigation.navigate('VerInventarioScreen')}
        />
        <BotonPro
          title="Agregar Factura"
          icon="file-plus"
          onPress={() => navigation.navigate('FacturaScreen')}
        />
        <BotonPro
          title='Ver Facturas'
          icon="list"
          onPress={() => navigation.navigate("VerFacturasScreen")}
        />
        <BotonPro
          title="Resumen Mensual"
          icon="bar-chart"
          onPress={() => navigation.navigate('ResumenMensualScreen')}
        />
        <BotonPro
          title="Cargar Datos de Prueba"
          icon="refresh-ccw"
          color="#555"
          onPress={cargarDatosDemo}
        />
        <BotonPro
          title="Borrar Todo"
          icon="trash-2"
          color={colores.peligro}
          onPress={borrarTodo}
        />
        <BotonPro
          title="Cerrar sesión"
          icon="log-out"
          color="#888"
          onPress={cerrarSesion}
        />
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
    fontSize: fuentes.texto,
  },
  valor: {
    fontSize: fuentes.subtitulo,
    color: colores.texto,
    fontWeight: 'bold',
  },
  botones: {
    marginTop: 20,
    gap: 12,
  },
});
