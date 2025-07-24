import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import HomeScreen from './screens/HomeScreen';
import FacturaScreen from './screens/FacturaScreen';
import InventarioScreen from './screens/InventarioScreen';
import HacerInventarioScreen from './screens/HacerInventarioScreen';
import VerFacturasScreen from './screens/VerFacturasScreen';
import VerInventarioScreen from './screens/VerInventarioScreen';
import EditarInventarioScreen from './screens/EditarInventarioScreen';
import ResumenMensualScreen from './screens/ResumenMensualScreen';

import { colores } from './theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff8f0',
    primary: '#FF6B35',
    card: '#fff',
    text: '#333',
    border: '#ddd',
  },
};

export default function App() {
  const [logueado, setLogueado] = useState<boolean | null>(null);

  useEffect(() => {
    const verificarLogin = async () => {
      await AsyncStorage.clear(); // ⚠️ ¡Solo para limpiar sesiones viejas! QUITAR después de probar
      const sesion = await AsyncStorage.getItem('logueado');
      setLogueado(sesion !== null);
    };
    verificarLogin();
  }, []);

  if (logueado === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff8f0' }}>
        <Text style={{ color: '#333', fontSize: 18 }}>Cargando...</Text>
      </View>
    );
  }

  try {
    return (
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
          initialRouteName={logueado ? 'HomeScreen' : 'LoginScreen'}
          screenOptions={{
            headerStyle: { backgroundColor: colores.fondoClaro },
            headerTintColor: colores.texto,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RegistroScreen" component={RegistroScreen} options={{ title: 'Registro' }} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Inicio' }} />
          <Stack.Screen name="FacturaScreen" component={FacturaScreen} options={{ title: 'Agregar Factura' }} />
          <Stack.Screen name="InventarioScreen" component={InventarioScreen} options={{ title: 'Inventario' }} />
          <Stack.Screen name="HacerInventarioScreen" component={HacerInventarioScreen} options={{ title: 'Nuevo Inventario' }} />
          <Stack.Screen name="VerFacturasScreen" component={VerFacturasScreen} options={{ title: 'Facturas Registradas' }} />
          <Stack.Screen name="VerInventarioScreen" component={VerInventarioScreen} options={{ title: 'Inventarios Registrados' }} />
          <Stack.Screen name="EditarInventarioScreen" component={EditarInventarioScreen} options={{ title: 'Editar Inventario' }} />
          <Stack.Screen name="ResumenMensualScreen" component={ResumenMensualScreen} options={{ title: 'Resumen Mensual' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error('❌ Error al renderizar la app:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>Error al iniciar la app</Text>
      </View>
    );
  }
}
