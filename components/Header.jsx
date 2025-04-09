import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import BackButton from './BackButton'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'

const Header = ({title, showBackButton = false, mb = 10, ms = 10, rightIcon, backButtonColor}) => {
    const router = useRouter();
    return (
        <View style={[styles.container, {marginBottom: mb}, {marginLeft: ms}]}>
            <View style={styles.titleContainer}>
                {showBackButton && (
                    <View style={styles.backButton}>
                        <BackButton router={router} color={backButtonColor} />
                    </View>
                )}
                <Text style={styles.title}>{title}</Text>
                {rightIcon && (
                    <View style={styles.rightButton}>
                        {rightIcon}
                    </View>
                )}
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        marginTop: 28,
        position: 'relative'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%'
    },
    title: {
        fontSize: hp(2.7),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.textDark,
        textAlign: 'center'
    },
    backButton: {
        position: 'absolute',
        left: 0
    },
    rightButton: {
        position: 'absolute',
        right: 0,
        paddingRight: wp(4)
    }
})