import { StyleSheet, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconButton: { padding: 5, marginRight: 2 },
  notificationContainer: { position: 'relative', padding: 5 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: THEME.error, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: THEME.textInverse, fontSize: 10, fontWeight: 'bold' },

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: THEME.surfaceElevated, marginHorizontal: 20, borderRadius: 16, padding: 4, ...THEME.shadow.sm },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, justifyContent: 'center' },
  activeTabItem: { backgroundColor: THEME.surface, ...THEME.shadow.sm, flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, justifyContent: 'center' },
  tabText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '600' },
  activeTabText: { color: THEME.primary, fontWeight: 'bold', fontSize: 13 },

  contentArea: { flex: 1 },
  tabContent: { flex: 1, padding: 20 },

  // New Dashboard Styles
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  displayBadge: { backgroundColor: THEME.surfaceInfo, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  displayBadgeText: { color: THEME.primary, fontSize: 12, fontWeight: 'bold' },

  // Search
  searchContainer: { marginBottom: 20 },
  searchInput: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.textPrimary,
    ...THEME.shadow.sm,
    borderWidth: 1,
    borderColor: THEME.surfaceNeutral
  },
  quickFilterContainer: { flexDirection: 'row', marginTop: 12 },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: THEME.borderDefault
  },
  quickFilterText: { fontSize: 12, color: THEME.textSecondary, fontWeight: '600' },

  // List Item (Legacy)
  listItem: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...THEME.shadow.sm,
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.textPrimary, marginBottom: 4 },
  itemSubtitle: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
  itemDetail: { fontSize: 12, color: THEME.textMuted },
  statusBadge: { marginTop: 8, fontSize: 12, color: THEME.info, fontWeight: 'bold' },

  // Glass List Item (Modern)
  glassListItem: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleModern: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 2,
  },
  itemSubtitleModern: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  statusBadgeModern: {
    backgroundColor: THEME.surfaceInfo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextModern: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  skillScrollContainer: {
    paddingVertical: 4,
    paddingLeft: 10,
    alignItems: 'flex-start',
  },

  // Other components
  flowContainer: { marginBottom: 20 },
  whiteCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    marginRight: 10,
    alignItems: 'center',
    ...THEME.shadow.sm,
  },
  cardCount: { fontSize: 24, fontWeight: 'bold', color: THEME.textPrimary, marginBottom: 4 },
  unitText: { fontSize: 12, color: THEME.textSecondary, fontWeight: 'normal' },
  cardLabel: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
  cardRate: { fontSize: 11, color: THEME.success, fontWeight: 'bold' },
  arrowContainer: { justifyContent: 'center', marginRight: 10 },
  arrow: { color: THEME.borderNeutral, fontSize: 20 },

  rowContainer: { flexDirection: 'row', marginBottom: 20 },
  halfCard: { flex: 1, backgroundColor: THEME.surface, borderRadius: 16, padding: 16, ...THEME.shadow.sm },
  fullCard: { backgroundColor: THEME.surface, borderRadius: 16, padding: 16, marginBottom: 20, ...THEME.shadow.sm },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

  segmentControl: { flexDirection: 'row', backgroundColor: THEME.surfaceNeutral, borderRadius: 8, padding: 2 },
  segmentActive: { backgroundColor: THEME.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, ...THEME.shadow.sm },
  segmentInactive: { paddingHorizontal: 12, paddingVertical: 4 },
  segmentTextActive: { fontSize: 11, fontWeight: 'bold', color: THEME.textPrimary },
  segmentTextInactive: { fontSize: 11, color: THEME.textSecondary },

  legendContainer: { marginTop: 10 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: THEME.textSecondary },

  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: THEME.textMuted, marginTop: 20 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: THEME.background, paddingTop: 20 },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.borderDefault, backgroundColor: THEME.surface },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textPrimary },
  closeButton: { padding: 8 },
  closeButtonText: { color: THEME.primary, fontWeight: 'bold' },

  // User Detail
  detailHeader: { marginBottom: 20, alignItems: 'center' },
  detailName: { fontSize: 22, fontWeight: 'bold', color: THEME.textPrimary, marginBottom: 4 },
  detailId: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
  detailInfo: { fontSize: 14, color: THEME.textSecondary },
  skillListContainer: { marginTop: 10 },
  skillGroup: { marginBottom: 15 },
  skillGroupTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },
  skillBadges: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  skillBadgeText: { fontSize: 12, fontWeight: '600' },

  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: 10,
    borderRadius: 8,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(30, 41, 59, 0.95)',
  },
  arrowUp: {
    top: -6,
    transform: [{ rotate: '0deg' }],
  },
  arrowDown: {
    bottom: -6,
    transform: [{ rotate: '180deg' }],
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  tooltipText: {
    color: THEME.chartLevel1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipSubText: {
    color: THEME.borderNeutral,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  detailWindow: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: THEME.background,
    borderRadius: 16,
    // Note: removed overflow: 'hidden' to ensure no clipping of interactive elements
  },
  detailWindowHeader: {
    height: 54,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailWindowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
  },
  detailWindowClose: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.surfaceInfo,
  },
  detailWindowCloseText: {
    color: THEME.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  detailWindowLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  detailWindowLoadingText: {
    color: THEME.subText,
    fontWeight: '600',
  },
  detailWindowErrorText: {
    color: THEME.textError,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailWindowScrollContent: {
    paddingBottom: 24,
  },
  detailHero: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8 * 0.32,
    backgroundColor: THEME.textPrimary,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  detailHeroImage: {
    opacity: 0.92,
  },
  detailHeroTopRow: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailHeroId: {
    color: THEME.textInverse,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailHeroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailPhotoContainer: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.surface,
    backgroundColor: THEME.borderLight,
    marginRight: 10,
  },
  detailProfileImage: {
    width: '100%',
    height: '100%',
  },
  detailNamePlate: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  detailNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  detailJobTitle: {
    fontSize: 11,
    color: THEME.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailEmailText: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  detailSourceText: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  detailBadgeSection: {
    marginTop: -18,
    paddingHorizontal: 14,
  },
  detailBadgeRow: {
    width: SCREEN_WIDTH * 0.8 - 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCardLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailGlassBadge: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 230, 253, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  detailCardSkillName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailHeatmapSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  detailHeatmapTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.text,
  },
});
