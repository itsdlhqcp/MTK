import React, { Component } from 'react';
import { Text, View, StyleSheet, Pressable, TextInput, Animated, ActivityIndicator } from 'react-native';
import AllReleasesList from '../components/LibraryReleaseList';
import Icon from '../assets/icons';
import { hp } from '../helpers/common';
import ScreenWrapper from '../components/ScreenWrapper';
import { NetworkUtils } from '../utils/network';
import { useToast } from '../contexts/ToastContext';
export class Library extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearchVisible: false,
      searchQuery: '',
      searchWidth: new Animated.Value(0),
      isSearchEnabled: true,
      checkingNetwork: true
    };
  }

  componentDidMount() {
    this.checkSearchAvailability();
  }

  checkSearchAvailability = async () => {
    this.setState({ checkingNetwork: true });
    const isAvailable = await NetworkUtils.isConnected();
    this.setState({ 
      isSearchEnabled: isAvailable,
      checkingNetwork: false
    });
    
    // Set up network listener for search availability
    this.unsubscribeNetwork = NetworkUtils.initNetworkListener((connected) => {
      this.setState({ isSearchEnabled: connected });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
    }
  }

  toggleSearch = () => {
    const { isSearchVisible, isSearchEnabled } = this.state;
   // const { showToast } = useToast();
    // If search is disabled due to offline status, show alert
    if (!isSearchVisible && !isSearchEnabled) {
    //  showToast('success', 'Search is only available when online');
      return;
    }
    
    if (isSearchVisible) {
      // Close search bar
      Animated.timing(this.state.searchWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start(() => {
        this.setState({ 
          isSearchVisible: false,
          searchQuery: '' 
        });
      });
    } else {
      // Open search bar
      this.setState({ isSearchVisible: true }, () => {
        Animated.timing(this.state.searchWidth, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        }).start(() => {
          this.searchInput && this.searchInput.focus();
        });
      });
    }
  };

  handleSearchChange = (text) => {
    this.setState({ searchQuery: text });
  };

  render() {
    const { isSearchVisible, searchQuery, searchWidth, isSearchEnabled, checkingNetwork } = this.state;
    
    const searchBarWidth = searchWidth.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '82%']
    });

    return (
      <ScreenWrapper bg="#121212">
        <View style={styles.container}>
          <View style={styles.top}>
            {!isSearchVisible && (
              <Text style={styles.header}>Library</Text>
            )}
            
            <View style={styles.searchContainer}>
              {isSearchVisible && (
                <Animated.View style={[styles.searchBar, { width: searchBarWidth }]}>
                  <TextInput
                    ref={(ref) => (this.searchInput = ref)}
                    style={styles.searchInput}
                    placeholder="Search library..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={this.handleSearchChange}
                    autoCapitalize="none"
                  />
                  {searchQuery !== '' && (
                    <Pressable style={styles.clearButton} onPress={() => this.handleSearchChange('')}>
                      <Icon name="close" size={hp(2)} color="white" />
                    </Pressable>
                  )}
                </Animated.View>
              )}
              
              {checkingNetwork ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.searchButton} />
              ) : (
                <Pressable 
                  style={[
                    styles.searchButton, 
                    isSearchVisible && styles.searchButtonActive,
                    !isSearchEnabled && styles.searchButtonDisabled
                  ]} 
                  onPress={this.toggleSearch}
                >
                  <Icon 
                    name="search" 
                    size={hp(2.5)} 
                    color={isSearchEnabled ? "white" : "#888"} 
                  />
                </Pressable>
              )}
            </View>
          </View>
          
          <AllReleasesList searchQuery={searchQuery} />
        </View>
      </ScreenWrapper>
    );
  }
}

export default Library;

const styles = StyleSheet.create({
  container: {
    flex: 1,
     backgroundColor: 'rgb(21, 23, 24)'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 16,
    marginLeft: 16,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(5),
    width: hp(5),
    marginVertical: 12,
  },
  searchButtonActive: {
    backgroundColor: '#333',
  },
  searchBar: {
    height: hp(5),
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: 'white',
    fontSize: hp(1.8),
  },
  clearButton: {
    padding: 5,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  }
});

