import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import moment from 'moment/moment';
import { hp, wp } from '../helpers/common';
import { useNavigation } from '@react-navigation/native';

const ReportOptions = [
  { id: 1, title: 'Sexual content' },
  { id: 2, title: 'Violent or repulsive content' },
  { id: 3, title: 'Hateful or abusive content' },
  { id: 4, title: 'Harmful or dangerous acts' },
  { id: 5, title: 'False information' },
  { id: 6, title: 'Spam or misleading' },
];

const ReportsPage = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [feedsData, setFeedsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [groupedReports, setGroupedReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      fetchFeedsData();
    } else {
      setLoading(false);
    }
  }, [reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          feedsId,
          flagId,
          flaggedUserId,
          resolved
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Exception fetching reports:', error);
    }
  };

  const fetchFeedsData = async () => {
    try {
      // Get unique feedsIds from reports
      const feedsIds = [...new Set(reports.map(report => report.feedsId))];
      
      const { data, error } = await supabase
        .from('twists')
        .select('id, file')
        .in('id', feedsIds);

      if (error) {
        console.error('Error fetching feeds data:', error);
        setLoading(false);
        return;
      }

      // Create a map of feedsId to feed data
      const feedsMap = {};
      data.forEach(feed => {
        feedsMap[feed.id] = feed;
      });

      setFeedsData(feedsMap);
      setLoading(false);
    } catch (error) {
      console.error('Exception fetching feeds data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    processReports();
  }, [reports, feedsData]);

  const processReports = () => {
    if (!reports || reports.length === 0) {
      setGroupedReports([]);
      return;
    }

    // Group reports by feedsId
    const groupedData = {};
    
    reports.forEach(report => {
      if (!groupedData[report.feedsId]) {
        groupedData[report.feedsId] = {
          feedsId: report.feedsId,
          feedData: feedsData[report.feedsId] || null,
          created_at: report.created_at,
          issues: [],
          allResolved: true
        };
      }
      
      const flagTitle = ReportOptions.find(opt => opt.id === report.flagId)?.title || 'Unknown issue';
      
      groupedData[report.feedsId].issues.push({
        id: report.id,
        flagId: report.flagId,
        resolved: report.resolved || false,
        flagTitle: flagTitle,
        created_at: report.created_at
      });
      
      if (!report.resolved) {
        groupedData[report.feedsId].allResolved = false;
      }
    });

    // Filter out fully resolved groups and convert to array
    const filteredGroups = Object.values(groupedData)
      .filter(group => !group.allResolved)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setGroupedReports(filteredGroups);
  };

  const handleResolveIssue = async (issueId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ resolved: true })
        .eq('id', issueId);

      if (error) {
        console.error('Error resolving report:', error);
        return;
      }

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === issueId ? { ...report, resolved: true } : report
        )
      );
    } catch (error) {
      console.error('Exception resolving report:', error);
    }
  };

  const handleResolveAllForFeed = async (feedsId) => {
    try {
      const feedReportIds = reports
        .filter(report => report.feedsId === feedsId && !report.resolved)
        .map(report => report.id);
      
      const { error } = await supabase
        .from('reports')
        .update({ resolved: true })
        .in('id', feedReportIds);

      if (error) {
        console.error('Error resolving all reports:', error);
        return;
      }

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.feedsId === feedsId ? { ...report, resolved: true } : report
        )
      );
    } catch (error) {
      console.error('Exception resolving all reports:', error);
    }
  };

  const renderIssueItem = ({ item }) => {
    if (item.resolved) return null;
    
    return (
      <View style={styles.issueItem}>
        <Text style={styles.issueType}>{item.flagTitle}</Text>
        <Text style={styles.issueDate}>{moment(item.created_at).format('MMM DD, YYYY')}</Text>
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => handleResolveIssue(item.id)}
        >
          <Icon name="check" size={hp(2.2)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderReportCard = ({ item }) => {
    const feed = item.feedData;
    
    return (
      <View style={styles.reportCard}>
        <View style={styles.cardHeader}>
          {feed && feed.image_url ? (
            <Image 
              source={{ uri: feed.image_url }} 
              style={styles.feedImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="image" size={hp(3)} color="#555" />
            </View>
          )}
          
          <View style={styles.headerInfo}>
            <Text style={styles.feedIdText}>
              Feed ID: {item.feedsId}
            </Text>
            {feed && feed.caption && (
              <Text style={styles.captionText} numberOfLines={1}>
                {feed.caption}
              </Text>
            )}
            <Text style={styles.dateText}>
              Reported: {moment(item.created_at).format('MMM DD, YYYY')}
            </Text>
          </View>
        </View>
        
        <View style={styles.issuesList}>
          <Text style={styles.issuesHeader}>
            Reported Issues ({item.issues.filter(issue => !issue.resolved).length})
          </Text>
          {item.issues.map(issue => (
            <View key={issue.id} style={styles.issueContainer}>
              {renderIssueItem({ item: issue })}
            </View>
          ))}
        </View>
        
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.resolveAllButton}
            onPress={() => handleResolveAllForFeed(item.feedsId)}
          >
            <Text style={styles.resolveAllText}>Resolve All Issues</Text>
          </TouchableOpacity>

          {/* const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'twistDetails', params: {postId: item.id}});
  }; */}
          
          {feed && (
            <TouchableOpacity 
              style={styles.viewPostButton}
              onPress={() => navigation.navigate('twistDetails', { postId: item.feedsId })}
            >
              <Text style={styles.viewPostText}>View Post</Text>
            </TouchableOpacity>
          )}
        </View>
      </View> 
    );
  };

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="check" size={hp(6)} color="#555" />
        <Text style={styles.emptyText}>No unresolved reports available.</Text>
        <Text style={styles.emptySubText}>All content has been reviewed.</Text>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Content Reports</Text>
        <Text style={styles.headerSubtitle}>
          {groupedReports.length} posts with unresolved reports
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={groupedReports}
          renderItem={renderReportCard}
          keyExtractor={(item) => `feed-${item.feedsId}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListHeaderComponent={renderHeader}
          onRefresh={fetchReports}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: hp(1),
  },
  headerContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  headerTitle: {
    color: '#fff',
    fontSize: hp(2.8),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: hp(1.8),
    marginTop: hp(0.5),
  },
  listContainer: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  reportCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: hp(2),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  feedImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: 8,
    backgroundColor: '#222',
  },
  imagePlaceholder: {
    width: wp(20),
    height: wp(20),
    borderRadius: 8,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  feedIdText: {
    color: '#ccc',
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  captionText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '600',
    marginTop: hp(0.5),
  },
  dateText: {
    color: '#888',
    fontSize: hp(1.5),
    marginTop: hp(0.5),
  },
  issuesList: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: hp(1.5),
    marginTop: hp(1),
  },
  issuesHeader: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '600',
    marginBottom: hp(1),
  },
  issueContainer: {
    marginBottom: hp(1),
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: wp(4),
  },
  issueType: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: '500',
    flex: 1,
  },
  issueDate: {
    color: '#888',
    fontSize: hp(1.4),
    marginRight: wp(3),
  },
  resolveButton: {
    padding: hp(1),
    backgroundColor: 'rgba(0, 150, 0, 0.2)',
    borderRadius: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  resolveAllButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.6),
  },
  viewPostButton: {
    backgroundColor: '#222',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.6),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp(8),
  },
  emptyText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: hp(2),
  },
  emptySubText: {
    color: '#888',
    fontSize: hp(1.6),
    textAlign: 'center',
    marginTop: hp(1),
  },
});

export default ReportsPage;