import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import moment from 'moment/moment';
import { hp } from '../helpers/common';

const ReportOptions = [
  { id: 1, title: 'Sexual content' },
  { id: 2, title: 'Violent or repulsive content' },
  { id: 3, title: 'Hateful or abusive content' },
  { id: 4, title: 'Harmful or dangerous acts' },
  { id: 5, title: 'False information' },
  { id: 6, title: 'Spam or misleading' },
];

const ReportsListComponent = ({ onReportsCountChange }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedReports, setGroupedReports] = useState([]);

  useEffect(() => {
    fetchReports();
    if(reports.length > 0){
      onReportsCountChange(reports.length);
    }
  }, []);

  useEffect(() => {
    processReports();
    
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
    } finally {
      setLoading(false);
    }
  };

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

  const renderIssueItem = ({ item }) => {
    return (
      <View style={styles.issueItem}>
        <Text style={styles.issueType}>{item.flagTitle}</Text>
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => handleResolveIssue(item.id)}
        >
          <Icon name="check" size={hp(2.6)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderReportCard = ({ item }) => {
    return (
      <View style={styles.reportCard}>
        <Text style={styles.feedIdText}>Feed ID: {item.feedsId}</Text>
        <View style={styles.issuesList}>
          {item.issues.map(issue => !issue.resolved && (
            <View key={issue.id} style={styles.issueContainer}>
              {renderIssueItem({ item: issue })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No unresolved reports available.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
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
          onRefresh={fetchReports}
          refreshing={loading}
        />
      )}
    </View>
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
  },
  listContainer: {
    padding: 12,
  },
  reportCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  feedIdText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  issuesList: {
    gap: 8,
  },
  issueContainer: {
    marginBottom: 4,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  issueType: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  resolveButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 150, 0, 0.1)',
    borderRadius: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ReportsListComponent;