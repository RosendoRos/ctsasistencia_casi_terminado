import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, Pressable, TextInput, Alert, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';

type Props = {
  navigation: StackNavigationProp<any>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.99:5000/api/register', { username, password });
      Alert.alert('Registro exitoso', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error de registro:', error.message);
        const errorMessage = error.response?.data || 'Error de registro';
        if (errorMessage.includes('Username already taken')) {
          Alert.alert('Error de registro', 'El nombre de usuario ya está en uso.');
        } else {
          Alert.alert('Error de registro', errorMessage);
        }
      } else {
        console.error('Error desconocido:', error);
        Alert.alert('Error desconocido', 'Ocurrió un error inesperado');
      }
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.99:5000/api/login', { username, password });
      Alert.alert('Inicio de sesión exitoso', response.data.message);
      const { isAdmin } = response.data;
      if (isAdmin) {
        navigation.navigate('AdminScreen');
      } else {
        navigation.navigate('Scanner');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error de inicio de sesión:', error.message);
        Alert.alert('Error de inicio de sesión por usuario o contraseña incorrectos', error.message);
      } else {
        console.error('Error desconocido:', error);
        Alert.alert('Error desconocido', 'Ocurrió un error inesperado');
      }
    }
  };

  return (
    <ImageBackground source={require('./assets/img/1.jpg')} style={styles.background}>
      <View style={styles.container}>
        
        <Text style={[styles.title, { color: 'white' }]}>Sistema de asistencias</Text>

        <Image source={require('./assets/img/5 .png')} style={styles.logo} /> 

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            onChangeText={setUsername}
            value={username}
            placeholderTextColor="black"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry={true}
            onChangeText={setPassword}
            value={password}
            placeholderTextColor="black"
          />
          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </Pressable>
          <Pressable style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Registrarse</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    paddingLeft: 10,
    color: 'black',
  },
  loginButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 50,
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 50,
    marginTop: 10,
  },
  registerButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default LoginScreen;
