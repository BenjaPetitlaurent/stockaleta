import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputPro from '../components/InputPro';
import BotonPro from '../components/BotonPro';
import { colores, fuentes } from '../theme';
import { signInWithEmailAndPassword } from '../firebaseConfig';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginScreen({ navigation }: any) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  useEffect(() => {
    const revisarSesion = async () => {
      const logueado = await AsyncStorage.getItem('logueado');
      if (logueado) {
        navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
      }
    };
    revisarSesion();
  }, []);

  const ingresar = async () => {
    try {
      const credenciales = await signInWithEmailAndPassword(auth, usuario, clave);
      const uid = credenciales.user.uid;

      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datos = docSnap.data();

        await AsyncStorage.setItem('logueado', uid);
        await AsyncStorage.setItem('usuario_actual', JSON.stringify(datos));
        await AsyncStorage.setItem('rol', datos.rol);

        Alert.alert('Bienvenido', `Has ingresado como ${datos.rol}`);
        navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
      } else {
        Alert.alert('Error', 'No se encontraron datos del usuario');
      }
    } catch (error: any) {
      Alert.alert('Acceso denegado', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/fondo_stockaleta.png')}
      style={styles.fondo}
      resizeMode="cover"
    >
      <View style={styles.contenido}>
        <Image
          source={require('../assets/logo_stockaleta.png')}
          style={styles.logo}
        />
        <Text style={styles.titulo}>Iniciar sesión</Text>

        <InputPro
          placeholder="Correo electrónico"
          value={usuario}
          onChangeText={setUsuario}
        />

        <InputPro
          placeholder="Clave"
          value={clave}
          onChangeText={setClave}
          secureTextEntry
        />

        <BotonPro title="Ingresar" icon="log-in" onPress={ingresar} />
        <BotonPro
          title="Crear cuenta"
          icon="user-plus"
          onPress={() => navigation.navigate('RegistroScreen')}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'center',
  },
  contenido: {
    padding: 30,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: fuentes.titulo,
    color: colores.texto,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
    resizeMode: 'contain',
  },
});
