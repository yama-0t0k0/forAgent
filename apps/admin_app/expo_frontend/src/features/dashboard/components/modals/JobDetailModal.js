import React from 'react';
import { View } from 'react-native';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { DetailModal } from '@shared/src/core/components/DetailModal';

/**
 * Modal component for displaying job description details.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {Object} props.jobDoc - The job document object.
 * @returns {JSX.Element} The rendered modal.
 */
export const JobDetailModal = ({ visible, onClose, jobDoc }) => (
  <DetailModal
    visible={visible}
    onClose={onClose}
    title='求人詳細プレビュー'
    width='95%'
    height='90%'
  >
    {jobDoc && (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <JobDescriptionScreen
          companyId={jobDoc.company_ID}
          jdNumber={jobDoc.JD_Number}
        />
      </View>
    )}
  </DetailModal>
);
