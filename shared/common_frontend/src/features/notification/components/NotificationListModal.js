import React from 'react';
2: import { 
3:   View, 
4:   Text, 
5:   StyleSheet, 
6:   Modal, 
7:   FlatList, 
8:   TouchableOpacity, 
9:   SafeAreaView,
10:   StatusBar
11: } from 'react-native';
12: import { Ionicons } from '@expo/vector-icons';
13: import { THEME } from '@shared/src/core/theme/theme';
14: import { NotificationService } from '../services/NotificationService';
15: 
16: /**
17:  * Modal component to display a list of notifications.
18:  * 
19:  * @param {Object} props
20:  * @param {boolean} props.visible - Modal visibility.
21:  * @param {string} props.uid - User UID for marking all as read.
22:  * @param {Function} props.onClose - Multi-purpose close handler.
23:  * @param {Array} props.notifications - List of notification objects.
24:  * @param {Function} props.onRefresh - Callback to refresh notification list.
25:  */
26: export const NotificationListModal = ({ 
27:   visible, 
28:   uid,
29:   onClose, 
30:   notifications,
31:   onRefresh
32: }) => {
33:   const handleItemPress = async (item) => {
34:     if (!item.isRead) {
35:       try {
36:         await NotificationService.markAsRead(item.id);
37:         if (onRefresh) onRefresh();
38:       } catch (error) {
39:         console.error('Failed to mark as read:', error);
40:       }
41:     }
42:   };
43: 
44:   const handleMarkAllAsRead = async () => {
45:     if (!uid) return;
46:     try {
47:       await NotificationService.markAllAsRead(uid);
48:       if (onRefresh) onRefresh();
49:     } catch (error) {
50:       console.error('Failed to mark all as read:', error);
51:     }
52:   };
53: 
54:   const renderItem = ({ item }) => (
55:     <TouchableOpacity 
56:       style={[
57:         styles.itemContainer, 
58:         !item.isRead && styles.unreadItem
59:       ]}
60:       onPress={() => handleItemPress(item)}
61:       activeOpacity={0.7}
62:     >
63:       <View style={[
64:         styles.itemIconContainer,
65:         !item.isRead && styles.unreadIconBg
66:       ]}>
67:         <Ionicons 
68:           name={item.isRead ? "mail-open-outline" : "notifications"} 
69:           size={22} 
70:           color={item.isRead ? THEME.textMuted : THEME.primary} 
71:         />
72:       </View>
73:       <View style={styles.itemTextContainer}>
74:         <View style={styles.itemHeader}>
75:           <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>
76:             {item.title || 'システム通知'}
77:           </Text>
78:           <Text style={styles.itemDate}>
79:             {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Today'}
80:           </Text>
81:         </View>
82:         <Text style={styles.itemMessage} numberOfLines={3}>
83:           {item.message}
84:         </Text>
85:       </View>
86:       {!item.isRead && <View style={styles.unreadDot} />}
87:     </TouchableOpacity>
88:   );
89: 
90:   return (
91:     <Modal
92:       visible={visible}
93:       animationType="slide"
94:       transparent={true}
95:       onRequestClose={onClose}
96:     >
97:       <View style={styles.modalOverlay}>
98:         <SafeAreaView style={styles.safeArea}>
99:           <StatusBar barStyle="dark-content" />
100:           <View style={styles.contentContainer}>
101:             <View style={styles.header}>
102:               <TouchableOpacity onPress={onClose} style={styles.iconButton}>
103:                 <Ionicons name="chevron-down" size={28} color={THEME.textPrimary} />
104:               </TouchableOpacity>
105:               
106:               <Text style={styles.headerTitle}>通知</Text>
107:               
108:               <TouchableOpacity 
109:                 onPress={handleMarkAllAsRead} 
110:                 style={styles.textButton}
111:                 disabled={!notifications || notifications.filter(n => !n.isRead).length === 0}
112:               >
113:                 <Text style={[
114:                   styles.markAllText,
115:                   (!notifications || notifications.filter(n => !n.isRead).length === 0) && styles.disabledText
116:                 ]}>すべて既読</Text>
117:               </TouchableOpacity>
118:             </View>
119: 
120:             <FlatList
121:               data={notifications}
122:               keyExtractor={(item) => item.id}
123:               renderItem={renderItem}
124:               ListEmptyComponent={
125:                 <View style={styles.emptyContainer}>
126:                   <View style={styles.emptyIconCircle}>
127:                     <Ionicons name="notifications-off-outline" size={40} color={THEME.textMuted} />
128:                   </View>
129:                   <Text style={styles.emptyTitle}>通知はありません</Text>
130:                   <Text style={styles.emptySubtitle}>新しい通知が届くとここに表示されます</Text>
131:                 </View>
132:               }
133:               contentContainerStyle={styles.listContent}
134:               showsVerticalScrollIndicator={false}
135:             />
136:           </View>
137:         </SafeAreaView>
138:       </View>
139:     </Modal>
140:   );
141: };
142: 
143: const styles = StyleSheet.create({
144:   modalOverlay: {
145:     flex: 1,
146:     backgroundColor: THEME.overlayMedium, // Darkened backdrop
147:   },
148:   safeArea: {
149:     flex: 1,
150:     marginTop: 60, // Slide down effect
151:   },
152:   contentContainer: {
153:     flex: 1,
154:     backgroundColor: THEME.background,
155:     borderTopLeftRadius: 30,
156:     borderTopRightRadius: 30,
157:     overflow: 'hidden',
158:     ...THEME.shadow.lg,
159:   },
160:   header: {
161:     flexDirection: 'row',
162:     alignItems: 'center',
163:     justifyContent: 'space-between',
164:     paddingHorizontal: 20,
165:     paddingVertical: 18,
166:     backgroundColor: THEME.surface,
167:     borderBottomWidth: 1,
168:     borderBottomColor: THEME.borderDefault,
169:   },
170:   headerTitle: {
171:     fontSize: 18,
172:     fontWeight: '800',
173:     color: THEME.textPrimary,
174:     letterSpacing: 0.5,
175:   },
176:   iconButton: {
177:     padding: 4,
178:   },
179:   textButton: {
180:     paddingVertical: 6,
181:     paddingHorizontal: 12,
182:   },
183:   markAllText: {
184:     fontSize: 13,
185:     fontWeight: '700',
186:     color: THEME.primary,
187:   },
188:   disabledText: {
189:     color: THEME.textMuted,
190:   },
191:   listContent: {
192:     paddingBottom: 40,
193:   },
194:   itemContainer: {
195:     flexDirection: 'row',
196:     padding: 18,
197:     borderBottomWidth: 1,
198:     borderBottomColor: THEME.borderDefault,
199:     backgroundColor: THEME.background,
200:   },
201:   unreadItem: {
202:     backgroundColor: THEME.primary + '05', // Extremely subtle tint
203:   },
204:   itemIconContainer: {
205:     width: 44,
206:     height: 44,
207:     borderRadius: 22,
208:     backgroundColor: THEME.surfaceInput,
209:     justifyContent: 'center',
210:     alignItems: 'center',
211:     marginRight: 16,
212:   },
213:   unreadIconBg: {
214:     backgroundColor: THEME.primary + '15',
215:   },
216:   itemTextContainer: {
217:     flex: 1,
218:   },
219:   itemHeader: {
220:     flexDirection: 'row',
221:     justifyContent: 'space-between',
222:     alignItems: 'center',
223:     marginBottom: 6,
224:   },
225:   itemTitle: {
226:     fontSize: 15,
227:     fontWeight: '700',
228:     color: THEME.textSecondary,
229:     flex: 1,
230:     marginRight: 8,
231:   },
232:   unreadText: {
233:     color: THEME.textPrimary,
234:   },
235:   itemMessage: {
236:     fontSize: 14,
237:     color: THEME.textSecondary,
238:     lineHeight: 20,
239:   },
240:   itemDate: {
241:     fontSize: 11,
242:     color: THEME.textMuted,
243:     fontWeight: '500',
244:   },
245:   unreadDot: {
246:     width: 8,
247:     height: 8,
248:     borderRadius: 4,
249:     backgroundColor: THEME.primary,
250:     alignSelf: 'center',
251:     marginLeft: 12,
252:     shadowColor: THEME.primary,
253:     shadowOffset: { width: 0, height: 0 },
254:     shadowOpacity: 0.5,
255:     shadowRadius: 4,
256:   },
257:   emptyContainer: {
258:     alignItems: 'center',
259:     justifyContent: 'center',
260:     paddingTop: 100,
261:     paddingHorizontal: 40,
262:   },
263:   emptyIconCircle: {
264:     width: 80,
265:     height: 80,
266:     borderRadius: 40,
267:     backgroundColor: THEME.surfaceInput,
268:     justifyContent: 'center',
269:     alignItems: 'center',
270:     marginBottom: 20,
271:   },
272:   emptyTitle: {
273:     fontSize: 17,
274:     fontWeight: '800',
275:     color: THEME.textPrimary,
276:     marginBottom: 8,
277:   },
278:   emptySubtitle: {
279:     fontSize: 14,
280:     color: THEME.textSecondary,
281:     textAlign: 'center',
282:     lineHeight: 20,
283:   },
284: });
285: 
