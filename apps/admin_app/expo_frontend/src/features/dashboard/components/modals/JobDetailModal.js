import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { JobDescriptionScreen } from '../../../../../../../job_description/expo_frontend/src/features/job_description/JobDescriptionScreen';
import { styles } from '../../dashboardStyles';

export const JobDetailModal = ({ visible, onClose, jobDoc }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.detailOverlay} pointerEvents="box-none">
      <View style={[styles.detailWindow, { width: '95%', height: '90%', maxWidth: 600 }]} pointerEvents="auto">
        <View style={styles.detailWindowHeader}>
          <Text style={styles.detailWindowTitle} testID="job_detail_title">求人詳細プレビュー</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailWindowClose} testID="job_detail_close">
            <Text style={styles.detailWindowCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {jobDoc && (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <JobDescriptionScreen
              companyId={jobDoc.company_ID}
              jdNumber={jobDoc.JD_Number}
            />
          </View>
        )}
      </View>
    </View>
  </Modal>
);
