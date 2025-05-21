import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../../constants/theme'
import { wp, hp, stripHtmlTags } from '../../helpers/common'
import Avatar from '../Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'
import { getUserData } from '../../services/userServices';
import { router } from 'expo-router'
import { userService } from '../../services/helperService'
import { createCommentLike, removeCommentLike, createCommentUnlike, removeCommentUnlike, createCommentReplylike, removeCommentReplyunlike } from '../../services/homeService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Modal } from 'react-native'

// Custom Alert Component
const CustomAlert = ({ visible, title, message, onCancel, onConfirm, cancelText, confirmText }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={alertStyles.modalOverlay}>
        <View style={alertStyles.modalContent}>
          <Text style={alertStyles.alertTitle}>{title}</Text>
          <Text style={alertStyles.alertMessage}>{message}</Text>
          <View style={alertStyles.alertButtonsContainer}>
            <TouchableOpacity
              style={[alertStyles.alertButton, alertStyles.alertCancelButton]}
              onPress={onCancel}
            >
              <Text style={alertStyles.alertCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[alertStyles.alertButton, alertStyles.alertConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={alertStyles.alertConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TcommentItem = ({
  item, 
  canDelete=false,
  onDelete = () => {},
  highlight = false,
  onReplyPress,  // New prop to handle reply press
  onShowProfile,
  router
}) => {
  const createdAt = moment(item?.created_at).format('MMM D');
  const {user} = useAuth();
  const { showToast } = useToast();
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

  const handleDelete = () => {
    // Show custom alert instead of default Alert
    setDeleteAlertVisible(true);
  }

  // Function to handle username press
  const handleUsernamePress = () => {
    // Either use onShowProfile or navigate directly to profile
    if (onShowProfile) {
      onShowProfile(item?.user);
    } else if (router) {
      router.push({ 
        pathname: '/profile', 
        params: { userId: item?.user?.id } 
      });
    }
  }

  const renderTextWithTags = (text) => {
    if (!text) return null;
  
    const tagRegex = /(@\w+)/g;
    const parts = text.split(tagRegex);
    
    return (
      <Text style={[styles.text, {fontWeight: 'normal'}]}>
        {parts.map((part, index) => {
          if (tagRegex.test(part)) {
            // Extract the username without the '@' symbol
            const username = part.slice(1);
            return (
              <Text 
                key={index} 
                style={styles.usernameTag}
                onPress={async () => {
                  // Try to get the full user data for the tagged username
                  const userData = await userService.getUserByName(username);
                  
                  // Open profile popup for the tagged username with complete data if found
                  if (userData) {
                    onShowProfile && onShowProfile(userData);
                  } else {
                    // Fallback to just the name if user data not found
                    // Use custom alert for error message
                    setErrorAlertVisible(true);
                    setErrorMessage('User under this username not exists');
                  }
                }}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  }

  // Code for comment likes and unlikes
  const [cmtlikes, setCmtlikes] = useState([]);
  const [cmtunlikes, setCmtunlikes] = useState([]);
  const [cmtreplylikes, setCmtreplylikes] = useState([]);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    setCmtlikes(item?.ctwistLikes || []);
    setCmtunlikes(item?.ctwistUnlikes || []);
    setCmtreplylikes(item?.treplyLikes || []);
  }, [item])
  
  const cmtliked = cmtlikes?.filter(cmtlike => cmtlike?.userId === user?.id)[0] ? true : false;
  const cmtunliked = cmtunlikes?.filter(cmtunlike => cmtunlike?.userId === user?.id)[0] ? true : false;
  const cmtreplyliked = cmtreplylikes?.filter(cmtreplylike => cmtreplylike?.userId === user?.id)[0] ? true : false;

  // Updated function to show error alert
  const showErrorAlert = (message) => {
    setErrorMessage(message);
    setErrorAlertVisible(true);
  };

  // Updated function to handle comment like with mutual exclusivity
  const handleCommentLike = async () => {
    // If already liked, just remove the like
    if(cmtliked) {
      let updatedCmtLikes = cmtlikes?.filter(upvote => upvote.userId !== user?.id);
      setCmtlikes([...updatedCmtLikes]);
      const res = await removeCommentLike(item?.id, user?.id);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtlikes(cmtlikes);
      }
    } else {
      // If not liked yet, add like and remove unlike if exists
      let data = {
        userId: user?.id,
        tcommentId: item?.id
      }
      
      // Add like
      setCmtlikes([...cmtlikes, data]);
      
      // Remove unlike if exists
      if(cmtunliked) {
        let updatedCmtUnlikes = cmtunlikes?.filter(unlike => unlike.userId !== user?.id);
        setCmtunlikes([...updatedCmtUnlikes]);
        await removeCommentUnlike(item?.id, user?.id);
      }
      
      const res = await createCommentLike(data);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtlikes(cmtlikes);
        if(cmtunliked) {
          setCmtunlikes(cmtunlikes);
        }
      }
    }
  }
  
  // Updated function to handle comment unlike with mutual exclusivity
  const handleCommentUnlike = async () => {
    // If already unliked, just remove the unlike
    if(cmtunliked) {
      let updatedCmtUnlikes = cmtunlikes?.filter(unlike => unlike.userId !== user?.id);
      setCmtunlikes([...updatedCmtUnlikes]);
      const res = await removeCommentUnlike(item?.id, user?.id);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtunlikes(cmtunlikes);
      }
    } else {
      // If not unliked yet, add unlike and remove like if exists
      let data = {
        userId: user?.id,
        tcommentId: item?.id
      }
      
      // Add unlike
      setCmtunlikes([...cmtunlikes, data]);
      
      // Remove like if exists
      if(cmtliked) {
        let updatedCmtLikes = cmtlikes?.filter(like => like.userId !== user?.id);
        setCmtlikes([...updatedCmtLikes]);
        await removeCommentLike(item?.id, user?.id);
      }
      
      const res = await createCommentUnlike(data);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtunlikes(cmtunlikes);
        if(cmtliked) {
          setCmtlikes(cmtlikes);
        }
      }
    }
  }
  
  // Updated function to handle comment reply like
  const handleCommentReplylike = async () => {
    if(cmtreplyliked) {
      let updatedCmtReplylikes = cmtreplylikes?.filter(replylike => replylike.userId !== user?.id);
      setCmtreplylikes([...updatedCmtReplylikes]);
      const res = await removeCommentReplyunlike(item?.id, user?.id);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtreplylikes(cmtreplylikes);
      }
    } else {
      let data = {
        userId: user?.id,
        treplyId: item?.id
      }
      setCmtreplylikes([...cmtreplylikes, data]);
      const res = await createCommentReplylike(data);
      if(!res.success){
        showErrorAlert(res.msg || 'Something went wrong');
        // Revert state if API fails
        setCmtreplylikes(cmtreplylikes);
      }
    }
  }

  // Determine if the item is a comment or reply
  const isReply = Boolean(item?.treply);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleUsernamePress}>
        <Avatar
          uri={item?.user?.image}
        />
      </TouchableOpacity>
    
      {/* user profile tab */}
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.nameContainer}>
            <TouchableOpacity onPress={handleUsernamePress}>
              <Text style={styles.text}>
                {item?.user?.name}
              </Text>
            </TouchableOpacity>
            <Text>*</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
              {createdAt}
            </Text>
          </View>

          {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Icon name="delete" size={18} color={theme.colors.rose} strokeWidth={1.4}/>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
          {renderTextWithTags(item?.text)}
        </Text>
        
        {/* Icons moved to bottom of content */}
        <View style={styles.interactionContainer}>
          {/* Render different like button based on whether it's a reply or comment */}
          {!isReply ? (
            // Reply like button
            <>
              <TouchableOpacity 
                onPress={handleCommentReplylike}
                style={styles.iconButton}
              >
                <Icon        
                  name="commentlike"
                  size={hp(2.5)} 
                  color={cmtreplyliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtreplyliked ? theme.colors.rose : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtreplylikes.length}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Comment like/unlike buttons
            <>
              <TouchableOpacity 
                onPress={handleCommentLike}
                style={styles.iconButton}
              >
                <Icon        
                  name="commentlike"
                  size={hp(2.5)} 
                  color={cmtliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtliked ? 'Transparent' : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtlikes.length}  
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleCommentUnlike}
                style={styles.iconButton}
              >
                <Icon 
                  name="commentunlike"
                  size={hp(2.5)} 
                  color={cmtunliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtunliked ? 'Transparent' : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtunlikes.length}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Reply button with different icon based on type */}
          <TouchableOpacity 
            onPress={() => onReplyPress && onReplyPress(item?.user?.name)} 
            style={styles.iconButton}
          >
            <Icon 
              name={isReply ? "bubbleChatReply" : "replycmt"}
              size={hp(2.5)}
              color={theme.colors.primary}  
            /> 
            <Text style={styles.count}>
              {item?.treply?.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Delete Alert */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Confirm"
        message="Are you sure you want to delete this comment?"
        onCancel={() => setDeleteAlertVisible(false)}
        onConfirm={() => {
          setDeleteAlertVisible(false);
          onDelete(item);
          // Show success toast after comment deletion
          showToast('success', 'Your comment was deleted successfully, but you can still view it in case you change your mind.');
        }}
        cancelText="Cancel"
        confirmText="Delete"
      />

      {/* Custom Error Alert */}
      <CustomAlert
        visible={errorAlertVisible}
        title="Error"
        message={errorMessage}
        onCancel={() => setErrorAlertVisible(false)}
        onConfirm={() => setErrorAlertVisible(false)}
        cancelText="Cancel"
        confirmText="OK"
      />
    </View>
  )
}

export default TcommentItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: '#161B21',   
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 5, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    // borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: '#ffffff',
    fontWeight: theme.fonts.textDark,
  },
  highlight: {
    borderWidth: 0.2,
    borderColor: 'white',
    borderColor: theme.colors.dark,
    shadowColor: theme.colors.dark, 
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  usernameTag: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  // New container for interaction icons
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  // Style for each icon and its count
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    color: '#CCCCCC',
    fontSize: hp(1.5),
    fontWeight: theme.fonts.medium,
  }
})

// Styles for the custom alert
const alertStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#121212', // Dark background
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#262626',
  },
  alertTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: hp(2),
    color: '#8E8E8E',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  alertCancelButton: {
    backgroundColor: '#262626',
  },
  alertConfirmButton: {
    backgroundColor: theme.colors.error || '#FF375F', // Fallback to a common error color if theme doesn't have it
  },
  alertCancelText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
  alertConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});