import React from 'react';
import { View, Text } from 'react-native';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { DetailModal } from '@shared/src/core/components/DetailModal';
import { styles } from '@features/dashboard/dashboardStyles';

/**
 * Modal component for drilling down into selection data.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible.
 * @param {string} props.title - Title of the modal.
 * @param {Array<Object>} props.data - List of data items to display.
 * @param {Function} props.onClose - Callback to close the modal.
 * @returns {JSX.Element} The rendered modal.
 */
export const DrillDownModal = ({ visible, title, data, onClose }) => (
  <DetailModal
    visible={visible}
    title={title}
    onClose={onClose}
  >
    <View style={{ flex: 1 }} testID='drill_down_modal_view'>
      <GenericDataList
        data={data}
        renderItem={({ item }) => {
          // Handle SelectionProgress model or raw object
          const rawItem = item.rawData || item;
          // Use model getters if available, fallback to raw keys
          const jobId = item.jobId || rawItem.JobStatID;
          const individualId = item.individualId || rawItem['選考進捗']?.['id_individual_個人ID'];
          const timestamp = rawItem.UpdateTimestamp_yyyymmddtttttt;

          return (
            <View style={styles.listItem}>
              <Text style={styles.itemTitle}>JobStatID: {jobId}</Text>
              <Text style={styles.itemSubtitle}>個人: {individualId}</Text>
              <Text style={styles.itemDetail}>更新日: {timestamp}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  </DetailModal>
);
