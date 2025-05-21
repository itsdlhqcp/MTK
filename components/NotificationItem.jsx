import { StyleSheet, Text, TouchableOpacity, View} from "react-native"
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Avatar from '../components/Avatar';
import moment from "moment/moment";

const NotificationItem = ({item, router}) => {

    const handleClick = () => {
    // open post details
    let {postId, commentId} = JSON.parse(item?.data || '{}');
    // open that specific post details
    router.push({pathname: 'postDetails', params: {postId, commentId}});
    }
   // console.log('item', item);
    const createdAt = moment(item?.created_at).format('MMM d');

    return (
        <TouchableOpacity style={styles.container} onPress={handleClick}>
              {/* Avatar */}
              {/* <Text>NotificationItem</Text> */}
              <Avatar
               uri={item?.sender?.image}
               size={hp(4.5)}
              />
              <View style={styles.nameTitle}>
                  <Text style={styles.text}>
                      {item?.sender?.name}
                  </Text>
                  <Text style={[styles.text, {color: theme.colors.textLight}]}>
                      {item?.title}
                  </Text>
              </View>

              <Text style={[styles.text, {color: theme.colors.textLight}]}>
                      {
                      createdAt
                      }
                  </Text>
        </TouchableOpacity>
    )
}

export default NotificationItem 

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: 12,
        backgroundColor: theme.colors.text, 
        borderWidth: 0.5,
        borderColor: theme.colors.blue,
        padding: 15,
        borderRadius: theme.radius.lg, 
        borderCurve: 'continuous' 
    }, 
    nameTitle: {
        flex: 1, 
        gap: 2,
    },
    text: {
        fontSize: hp(1.6), 
        fontWeight: theme.fonts.medium, 
        color: theme.colors.red
    }
})