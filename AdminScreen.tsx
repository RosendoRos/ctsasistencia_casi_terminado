import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet, ScrollView, Linking } from 'react-native';
import axios from 'axios';
import moment from 'moment-timezone';

interface User {
  id_unico: string;
  name: string;
}

interface UserDetail {
  name: string;
  puesto: string;
  timestamp: string;
  entrada_sali: string;
  latitude: number | null;
  longitude: number | null;
}

interface WeeklyReport {
  name: string;
  total_hours: string;
}

const AdminScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport[] | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://192.168.1.99:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await axios.get(`http://192.168.1.99:5000/api/users/${userId}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to fetch user details');
    }
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    fetchUserDetails(user.id_unico);
  };

  const handleWeeklyReport = async () => {
    try {
      const response = await axios.get('http://192.168.1.99:5000/api/generate-excel-report', { responseType: 'blob' });
      const url = response.request.responseURL;
      Linking.openURL(url);
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      Alert.alert('Error', 'Failed to fetch weekly report');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id_unico.toString()}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => handleUserPress(item)} />
        )}
      />
      {selectedUser && userDetails.length > 0 && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Detalles del Usuario:</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Nombre</Text>
              <Text style={styles.tableHeader}>Puesto</Text>
              <Text style={styles.tableHeader}>Fecha y Hora</Text>
              <Text style={styles.tableHeader}>Acción</Text>
              <Text style={styles.tableHeader}>Ubicación</Text>
            </View>
            {userDetails.map((detail, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{detail.name}</Text>
                <Text style={styles.tableCell}>{detail.puesto}</Text>
                <Text style={styles.tableCell}>{formatTimestamp(detail.timestamp)}</Text>
                <Text style={styles.tableCell}>{detail.entrada_sali}</Text>
                <Text style={styles.tableCell}>
                  {detail.latitude && detail.longitude ? `${detail.latitude}, ${detail.longitude}` : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <Button title="Generar Corte Semanal" onPress={handleWeeklyReport} />
      {weeklyReport && (
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Reporte Semanal:</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Nombre</Text>
              <Text style={styles.tableHeader}>Horas Totales</Text>
            </View>
            {weeklyReport.map((report, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{report.name}</Text>
                <Text style={styles.tableCell}>{report.total_hours}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  reportContainer: {
    marginTop: 20,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminScreen;
