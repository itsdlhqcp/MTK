import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import theme from '../constants/theme'
import { wp, hp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'

const CommentItem = ({
  item, 
  canDelete=false,
  onDelete = () => {}
}) => {
  const createdAt = moment(item?.created_at).format('MMM d');

  const handleDelete = () => {
    Alert.alert('Confirm', 'Are you sure you want to delete this comment?', [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: ()=> onDelete(item)
          }
        ]);
  }
  return (
    <View style={styles.container}>
      <Avatar
       uri={item?.user?.image}
      />
      <View style={styles.content}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
           <View style={styles.nameContainer}>
            <Text style={styles.text}>
            {
                item?.user?.name
               }
            </Text>
            <Text>*</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
            {
                createdAt
               }
            </Text>
           </View>
           {
            canDelete && (
              <TouchableOpacity onPress={handleDelete}>
             <Icon name="delete" size={20} color={theme.colors.rose} />
           </TouchableOpacity>
            )
           }
        </View>
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
          {item?.text}
        </Text>
      </View>
    </View>
  )
}

export default CommentItem

const styles = StyleSheet.create({

  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontWeight: theme.fonts.textDark,
  }
})