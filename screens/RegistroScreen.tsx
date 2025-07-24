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
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function RegistroScreen({ navigation }: any) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [rolActual, setRolActual] = useState<string | null>(null);
  const [rolNuevo, setRolNuevo] = useState<'usuario' | 'admin'>('usuario');

  useEffect(() => {
    const cargarRol = async () => {
      const rol = await AsyncStorage.getItem('rol');
      setRolActual(rol);
    };
    cargarRol();
  }, []);

  const registrar = async () => {
    if (!usuario || !clave || !confirmacion) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos');
      return;
    }

    if (clave !== confirmacion) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      const credenciales = await createUserWithEmailAndPassword(auth, usuario, clave);

      await setDoc(doc(db, 'usuarios', credenciales.user.uid), {
        correo: usuario,
        rol: rolActual === 'admin' ? rolNuevo : 'usuario',
        fechaCreacion: new Date().toISOString(),
      });

      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
        <Text style={styles.titulo}>Crear cuenta</Text>

        <InputPro
          placeholder="Correo electrónico"
          value={usuario}
          onChangeText={setUsuario}
        />
        <InputPro
          placeholder="Clave"
          secureTextEntry
          value={clave}
          onChangeText={setClave}
        />
        <InputPro
          placeholder="Confirmar clave"
          secureTextEntry
          value={confirmacion}
          onChangeText={setConfirmacion}
        />

        {rolActual === 'admin' && (
          <>
            <Text style={styles.label}>Rol del nuevo usuario</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={rolNuevo}
                onValueChange={(value: 'usuario' | 'admin') => setRolNuevo(value)}
                style={{ color: 'white' }}
              >
                <Picker.Item label="Usuario" value="usuario" />
                <Picker.Item label="Administrador" value="admin" />
              </Picker>
            </View>
          </>
        )}

        <BotonPro title="Registrar" icon="user-check" onPress={registrar} />
        <BotonPro title="Volver" icon="arrow-left" onPress={() => navigation.goBack()} />
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
  label: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    marginBottom: 20,
  },
});
