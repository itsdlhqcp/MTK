import { Text, Button, View, Image, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import { useRouter } from 'expo-router'
import ScreenWrapper from '@/components/ScreenWrapper';

const onboardingGrid = () => {
    const router = useRouter();
    
    const gridImages = [
        {
            id: 1,
            name: 'BLINDER',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720792BLINDER.jpg?alt=media&token=c0983db4-efc6-40bd-a0cd-f719b2a43c4c'
        },
        {
            id: 2,
            name: 'KIRATA',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795KIRATA.jpg?alt=media&token=123ad8bc-b23f-4ab8-86f2-58623cb2c955'
        },
        {
            id: 3,
            name: 'SHAP',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795SHAP.jpg?alt=media&token=b611e025-473d-4c29-a922-750ba8b1ed8d'
        },
        {
            id: 4,
            name: 'HERITIC',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795HERITIC.jpg?alt=media&token=6640f5d5-6314-4f5d-98d6-ddb5ec04853a'
        },
        {
            id: 5,
            name: 'spy',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734767810179SPY.jpg?alt=media&token=df81aa04-1eaa-4f4f-b918-b172f43f7fff'
        },
        {
          id: 6,
          name: 'sonic',
          url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734767810180SONIC.jpg?alt=media&token=f48181b4-1110-4040-8571-d403ad521e57'
      },
      {
        id: 7,
        name: 'kraven',
        url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687kraven.jpg?alt=media&token=000bad96-bdb5-4c5d-b5fc-816073f71477'
    },
    {
      id: 8,
      name: 'thelionKing',
      url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lionKing.jpg?alt=media&token=f8fcce32-8062-403f-a1d4-6bc1a35871b2'
  },
  {
    id: 9,
    name: 'thelionKing',
    url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lastofus.jpg?alt=media&token=0119a36d-7a17-4e83-b2db-cc1500cacd2a'
},
{
  id: 10,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051michael.jpg?alt=media&token=2e86a937-2b74-44a2-85f7-ec0ccbcccaf7'
},
{
  id: 11,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795SUPER.jpg?alt=media&token=9af80502-9ab4-4dc8-a2f7-fe3468475c76'
},
{
  id: 12,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051pushpa2.jpg?alt=media&token=fc4460ed-b87a-42fd-996f-2b61d13f847a'
},
{
  id: 13,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051mura.jpg?alt=media&token=2eda53c6-c553-4d6a-ae98-98dff21a2df2'
},
{
  id: 14,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687fromToday.jpg?alt=media&token=9b388d46-15ef-4055-812b-3adc8aaca302'
},
{
  id: 15,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734769177738redone.jpg?alt=media&token=896a60cd-361b-4b15-9f25-83a4748fd564'
},
{
  id: 16,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734769273312kaatta.jpg?alt=media&token=9e71711c-3f41-416b-b02e-597d56f474c1'
},
    ];

    return (
        <>
           <StatusBar barStyle="dark-content" backgroundColor="black" />
           {/* <StatusBar  barStyle="light-content" backgroundColor="black"/> */}
            <View style={styles.container}>
                <View style={styles.gridContainer}>
                    {gridImages.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.gridItem}
                            onPress={() => console.log(`Pressed ${item.name}`)}
                        >
                            <Image
                                source={{ uri: item.url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                 {/* Overlay Button */}
               <View style={styles.buttonContainer}>    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={() => router.push('signup')}
                    >
                        <Text style={styles.buttonText}>Let's Go &gt;&gt;&gt;</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    )
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 4;
const SPACING = 0;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: SPACING,
    },
    gridItem: {
        width: (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT,
        marginBottom: SPACING,
        marginRight: SPACING,
    },
    image: {
        width: '100%',
        aspectRatio: 0.515, // This creates the tall poster-like appearance
        borderRadius: 0,
    },
    buttonContainer: {
      position: 'absolute',
      top: hp(85),
      width: '100%',
      zIndex: 1,
      alignItems: 'center',
      paddingHorizontal: 20,
  },
  button: {
      backgroundColor: 'rgba(33, 4, 4, 0.71)',
      paddingVertical: 9,
        paddingHorizontal: 30,
        borderRadius: 25,
        minWidth: 150,
        alignItems: 'center',
        // Add shadow for better visibility
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
  },
  buttonText: {
      color: 'rgb(201, 201, 207)',
      fontSize: 16,
      fontWeight: '600',
  }
});

export default onboardingGrid