import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { styles } from '../../dashboardStyles';

export const DrillDownModal = ({ visible, title, data, onClose }) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>閉じる</Text>
        </TouchableOpacity>
      </View>
      <GenericDataList 
        data={data}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>JobStatID: {item.JobStatID}</Text>
            <Text style={styles.itemSubtitle}>個人: {item['選考進捗']?.['id_individual_個人ID']}</Text>
            <Text style={styles.itemDetail}>更新日: {item.UpdateTimestamp_yyyymmddtttttt}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  </Modal>
);

