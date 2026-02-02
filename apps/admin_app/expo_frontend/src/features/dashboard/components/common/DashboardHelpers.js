import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { styles } from '@features/dashboard/dashboardStyles';
import { MOCK_DATA } from '@core/constants';

// Dashboard Icon Component
/**
 * Renders a dashboard grid icon.
 * @param {Object} props
 * @param {string} props.color - The fill color of the icon.
 * @returns {JSX.Element} The rendered SVG icon.
 */
export const DashboardIcon = ({ color }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" fill={color} />
    <Rect x="14" y="3" width="7" height="7" rx="1" fill={color} />
    <Rect x="14" y="14" width="7" height="7" rx="1" fill={color} />
    <Rect x="3" y="14" width="7" height="7" rx="1" fill={color} />
  </Svg>
);

// Notification Icon Component
/**
 * Renders a notification bell icon with a badge.
 * @returns {JSX.Element} The rendered component.
 */
export const NotificationIcon = () => (
  <View style={styles.notificationContainer}>
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
       <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
       <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{MOCK_DATA.NOTIFICATION_COUNT}</Text>
    </View>
  </View>
);
