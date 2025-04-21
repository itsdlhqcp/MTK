import React from 'react';
import { Text, View, Pressable, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Feather';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

const AdminControl = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header
        title={"MONITOR"}
        showBackButton={true}
        style={styles.header}
         rightIcon={
                          <TouchableOpacity
                            //onPress={onSubmit} 
                          //  disabled={isSubmitting}
                           // style={{ opacity: isSubmitting ? 0.5 : 1 }}  AdminControl.jsx
                           onPress={() => router.push('RevenueMonitor')}
                          >
                            <Icon name="monitor" size={22} color="white" />
                          </TouchableOpacity>
                        }
      />
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Admin Activities</Text>
        <View style={styles.statsContainer}>
          <Text style={{ color: theme.colors.text }}>Any admin can monitor other Admin Activities (Comming soon)</Text>
        </View>
      </View>


      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Monitor Flag Control Reports</Text>
        <View style={styles.statsContainer}>
          <Text style={{ color: theme.colors.text }}>This page and control monitor is comming soon!!</Text>
        </View>
      </View>
    </View>
  );
};

export default AdminControl;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', 
      },
      header: {
        backgroundColor: '#1E1E1E', 
      },
      content: {
        padding: hp(2.5),
      },
      sectionTitle: {
        color: '#FFFFFF',
        fontSize: hp(2.3),
        fontWeight: '600',
        marginBottom: hp(2.5),
        marginTop: hp(1.2),
      },
      adminControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: hp(3.8),
      },
      controlButton: {
        alignItems: 'center',
        width: wp(30),
      },
      iconContainer: {
        backgroundColor: '#333333',
        borderRadius: hp(7.5),
        width: hp(7.5),
        height: hp(7.5),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1),
        elevation: 4,
      },
      greenIcon: {
        backgroundColor: '#1E472E', 
      },
      redIcon: {
        backgroundColor: '#5E1E1E', 
      },
      buttonText: {
        color: '#D0D0D0', 
        marginTop: hp(0.6),
        fontSize: hp(1.8),
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(1.2),
      },
      statCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: hp(1),
        padding: hp(1.9),
        width: wp(30),
        alignItems: 'center',
        borderLeftWidth: 3,
        borderLeftColor: '#444',
      },
      statNumber: {
        color: '#FFFFFF',
        fontSize: hp(2.8),
        fontWeight: 'bold',
      },
      statLabel: {
        color: '#AAAAAA',
        fontSize: hp(1.5),
        marginTop: hp(0.6),
      },
});


