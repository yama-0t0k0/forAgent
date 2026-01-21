import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { JobDescriptionContent } from '../../../../../../../job_description/expo_frontend/src/features/job_description/components/JobDescriptionContent';
import { styles } from '../../dashboardStyles';

export const JobDetailModal = ({ visible, onClose, jobDoc }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={styles.detailOverlay} onPress={onClose}>
      <Pressable style={[styles.detailWindow, { width: '95%', height: '90%', maxWidth: 600 }]} onPress={(e) => e.stopPropagation()}>
        <View style={styles.detailWindowHeader}>
          <Text style={styles.detailWindowTitle}>求人詳細プレビュー</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailWindowClose}>
            <Text style={styles.detailWindowCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {jobDoc && (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <JobDescriptionContent 
              companyId={jobDoc.company_ID}
              jdNumber={jobDoc.JD_Number}
            />
          </View>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);
