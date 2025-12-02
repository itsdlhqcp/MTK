import React, { useState } from 'react';
import { Text, View, Pressable, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Feather';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import ReportsListComponent from '../components/ReportsList';

const AdminPanel = () => {
  const router = useRouter();
  const [totalReports, setTotalReports] = useState(4);
  
  const handleReportsCountChange = (count) => {
    setTotalReports(count);
  };

  return (
    <View style={styles.container}>
      <Header
        title={"ADMIN PANEL"}
        showBackButton={true}
        style={styles.header}
         rightIcon={
                  <TouchableOpacity
                   onPress={() => router.push('AdminControl')}
                  >
                    <Icon name="activity" size={24} color="white" />
                  </TouchableOpacity>
                }
             />
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Dashboard Controls</Text>
        
        <View style={styles.adminControls}>
          <Pressable 
            style={styles.controlButton} 
            onPress={() => router.push('createFeed')}
          >
            <View style={styles.iconContainer}>
              <Icon name="plus" size={hp(3.2)} color="#fff" />
            </View>
            <Text style={styles.buttonText}>Create News</Text>
          </Pressable>
          
          <Pressable 
            style={styles.controlButton} 
            onPress={() => router.push('newRelease')}
          >
            <View style={[styles.iconContainer, styles.greenIcon]}>
              <Icon name="plus" size={hp(3.2)} color="#fff" />
            </View>
            <Text style={styles.buttonText}>New Theatre</Text>
          </Pressable>
          
          <Pressable 
            style={styles.controlButton} 
            onPress={() => router.push('newOtt')}
          >
            <View style={[styles.iconContainer, styles.redIcon]}>
              <Icon name="plus" size={hp(3.2)} color="#fff" />
            </View>
            <Text style={styles.buttonText}>New Digital</Text>
          </Pressable>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Active News</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>New Releases</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>New Digital</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Users Report Last Week</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>New Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Flag Reports</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        
        <View style={styles.reportTitle}>
        <Text style={styles.sectionTitle}>Monitor Flag Reports</Text>
        <TouchableOpacity onPress={() => router.push('ReportsPage')}>
        <View style={styles.resolveContainer}>
         <Text style={styles.resolveTitle}>Resolve</Text>
            <Icon
            name="check" 
            size={hp(2.6)} 
            color="green" 
            />
        </View>
        </TouchableOpacity>
        </View>
        {/* <View style={styles.statsContainer}>
        <ReportsListComponent onReportsCountChange={handleReportsCountChange} />
        </View> */}
      </View>
    </View>
  );
};

export default AdminPanel;

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
      reportTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      resolveTitle: {
        color: theme.colors.textLight,
        fontSize: hp(1.8),
      },
      resolveContainer: {
        flexDirection: 'row',
        gap: 6,
      }
});


