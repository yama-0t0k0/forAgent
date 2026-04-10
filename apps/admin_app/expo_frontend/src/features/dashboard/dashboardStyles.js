import { StyleSheet, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Admin App Specific Nuance: Use app.admin.background for utilitarian feel
const ADMIN_THEME = THEME.app.admin;

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: ADMIN_THEME.background, 
    paddingTop: THEME.spacing.xxl 
  },
  header: { 
    paddingHorizontal: THEME.spacing.md, 
    marginBottom: THEME.spacing.sm, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { 
    ...THEME.typography.h1, 
    color: THEME.textPrimary 
  },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconButton: { padding: THEME.spacing.xs, marginRight: THEME.spacing.xs },
  notificationContainer: { position: 'relative', padding: THEME.spacing.xs },
  badge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: THEME.error, 
    borderRadius: THEME.radius.full, 
    width: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgeText: { 
    color: THEME.textInverse, 
    ...THEME.typography.micro, 
    fontWeight: 'bold' 
  },

  // Tab Bar (Business tool look: consistent spacing)
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: THEME.surfaceElevated, 
    marginHorizontal: THEME.spacing.md, 
    borderRadius: THEME.radius.lg, 
    padding: THEME.spacing.xs, 
    ...THEME.shadow.sm 
  },
  tabItem: { 
    flex: 1, 
    paddingVertical: THEME.spacing.sm, 
    alignItems: 'center', 
    borderRadius: THEME.radius.md, 
    justifyContent: 'center' 
  },
  activeTabItem: { 
    backgroundColor: THEME.surface, 
    ...THEME.shadow.sm, 
    flex: 1, 
    paddingVertical: THEME.spacing.sm, 
    alignItems: 'center', 
    borderRadius: THEME.radius.md, 
    justifyContent: 'center' 
  },
  tabText: { 
    ...THEME.typography.button, 
    color: THEME.textSecondary 
  },
  activeTabText: { 
    color: ADMIN_THEME.primary, 
    fontWeight: 'bold', 
    ...THEME.typography.button 
  },

  contentArea: { flex: 1 },
  tabContent: { flex: 1, padding: THEME.spacing.md },

  // New Dashboard Styles
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: THEME.spacing.sm, 
    marginTop: THEME.spacing.sm 
  },
  sectionTitle: { 
    ...THEME.typography.h3, 
    color: THEME.textPrimary 
  },
  displayBadge: { 
    backgroundColor: THEME.surfaceInfo, 
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs, 
    borderRadius: THEME.radius.lg 
  },
  displayBadgeText: { 
    color: THEME.primary, 
    ...THEME.typography.micro, 
    fontWeight: 'bold' 
  },

  // Search
  searchContainer: { marginBottom: THEME.spacing.md },
  searchInput: {
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md, 
    paddingVertical: THEME.spacing.sm, 
    ...THEME.typography.bodySmall,
    color: THEME.textPrimary,
    ...THEME.shadow.sm,
    borderWidth: 1,
    borderColor: THEME.borderDefault
  },
  quickFilterContainer: { flexDirection: 'row', marginTop: THEME.spacing.sm },
  quickFilterChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.pill,
    marginRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.borderDefault
  },
  quickFilterText: { 
    ...THEME.typography.small, 
    color: THEME.textSecondary, 
    fontWeight: '600' 
  },

  // List Item (Consistent with Business UI)
  listItem: {
    backgroundColor: THEME.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadow.sm,
  },
  itemTitle: { 
    ...THEME.typography.body, 
    fontWeight: 'bold', 
    color: THEME.textPrimary, 
    marginBottom: 2 
  },
  itemSubtitle: { 
    ...THEME.typography.small, 
    color: THEME.textSecondary, 
    marginBottom: 2 
  },
  itemDetail: { 
    ...THEME.typography.micro, 
    color: THEME.textMuted 
  },
  statusBadge: { 
    marginTop: THEME.spacing.xs, 
    ...THEME.typography.small, 
    color: THEME.primary, 
    fontWeight: 'bold' 
  },

  // Modern List Item (Glass used sparingly for highlights)
  glassListItem: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadow.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  itemTitleModern: {
    ...THEME.typography.h3,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  itemSubtitleModern: {
    ...THEME.typography.small,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  statusBadgeModern: {
    backgroundColor: THEME.surfaceInfo,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.sm,
  },
  statusTextModern: {
    color: THEME.primary,
    ...THEME.typography.micro,
    fontWeight: '700',
  },
  skillScrollContainer: {
    paddingVertical: THEME.spacing.xs, 
    paddingLeft: THEME.spacing.sm,
    alignItems: 'flex-start',
  },

  // Cards
  flowContainer: { marginBottom: THEME.spacing.md },
  whiteCard: {
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    minWidth: 100,
    marginRight: THEME.spacing.sm,
    alignItems: 'center',
    ...THEME.shadow.sm,
  },
  cardCount: { 
    ...THEME.typography.h2, 
    color: THEME.textPrimary, 
    marginBottom: 4 
  },
  unitText: { 
    ...THEME.typography.micro, 
    color: THEME.textSecondary, 
    fontWeight: 'normal' 
  },
  cardLabel: { 
    ...THEME.typography.small, 
    color: THEME.textSecondary, 
    marginBottom: 4 
  },
  cardRate: { 
    ...THEME.typography.micro, 
    color: THEME.success, 
    fontWeight: 'bold' 
  },
  arrowContainer: { justifyContent: 'center', marginRight: THEME.spacing.sm },
  arrow: { 
    color: THEME.borderNeutral, 
    ...THEME.typography.h3 
  },

  rowContainer: { flexDirection: 'row', marginBottom: THEME.spacing.md },
  halfCard: { 
    flex: 1, 
    backgroundColor: THEME.surface, 
    borderRadius: THEME.radius.lg, 
    padding: THEME.spacing.md, 
    ...THEME.shadow.sm 
  },
  fullCard: { 
    backgroundColor: THEME.surface, 
    borderRadius: THEME.radius.lg, 
    padding: THEME.spacing.md, 
    marginBottom: THEME.spacing.md, 
    ...THEME.shadow.sm 
  },
  cardTitle: { 
    ...THEME.typography.h3, 
    color: THEME.textPrimary, 
    marginBottom: THEME.spacing.md 
  },

  segmentControl: { 
    flexDirection: 'row', 
    backgroundColor: THEME.surfaceInput, 
    borderRadius: THEME.radius.sm, 
    padding: 2 
  },
  segmentActive: { 
    backgroundColor: THEME.surface, 
    paddingHorizontal: THEME.spacing.sm, 
    paddingVertical: 4, 
    borderRadius: THEME.radius.sm - 2, 
    ...THEME.shadow.sm 
  },
  segmentInactive: { 
    paddingHorizontal: THEME.spacing.sm, 
    paddingVertical: 4 
  },
  segmentTextActive: { 
    ...THEME.typography.micro, 
    fontWeight: 'bold', 
    color: THEME.textPrimary 
  },
  segmentTextInactive: { 
    ...THEME.typography.micro, 
    color: THEME.textSecondary 
  },

  listContainer: { paddingBottom: THEME.spacing.xxl },
  emptyText: { 
    textAlign: 'center', 
    color: THEME.textMuted, 
    marginTop: THEME.spacing.md, 
    ...THEME.typography.bodySmall 
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    backgroundColor: ADMIN_THEME.background, 
    paddingTop: THEME.spacing.lg 
  },
  modalHeader: { 
    padding: THEME.spacing.md, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: THEME.borderDefault, 
    backgroundColor: THEME.surface 
  },
  modalTitle: { 
    ...THEME.typography.h3, 
    color: THEME.textPrimary 
  },
  closeButton: { padding: THEME.spacing.sm },
  closeButtonText: { 
    color: THEME.primary, 
    fontWeight: 'bold' 
  },

  // User Detail (Nuance: More utilitarian than Personal app profile)
  detailHeader: { 
    marginBottom: THEME.spacing.md, 
    alignItems: 'center' 
  },
  detailName: { 
    ...THEME.typography.h2, 
    color: THEME.textPrimary, 
    marginBottom: 4 
  },
  detailId: { 
    ...THEME.typography.small, 
    color: THEME.textSecondary, 
    marginBottom: 2 
  },
  detailInfo: { 
    ...THEME.typography.small, 
    color: THEME.textSecondary 
  },
  skillListContainer: { marginTop: THEME.spacing.md },
  skillGroup: { marginBottom: THEME.spacing.md },
  skillGroupTitle: { 
    ...THEME.typography.button, 
    color: THEME.textPrimary, 
    marginBottom: THEME.spacing.sm 
  },
  skillBadges: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBadge: { 
    paddingHorizontal: THEME.spacing.sm, 
    paddingVertical: THEME.spacing.xs, 
    borderRadius: THEME.radius.pill, 
    marginRight: THEME.spacing.xs, 
    marginBottom: THEME.spacing.xs, 
    borderWidth: 1, 
    borderColor: THEME.borderDefault 
  },
  skillBadgeText: { 
    ...THEME.typography.micro, 
    fontWeight: '600' 
  },

  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    backgroundColor: THEME.overlayDark, 
    padding: THEME.spacing.sm, 
    borderRadius: THEME.radius.md, 
    zIndex: 100, 
    ...THEME.shadow.md,
  },
  tooltipTitle: {
    color: THEME.textInverse,
    ...THEME.typography.small, 
    fontWeight: 'bold', 
    marginBottom: 4,
    textAlign: 'center', 
  },
  separator: {
    height: 1, 
    backgroundColor: THEME.overlayLight, 
    marginVertical: 4,
  },
  tooltipText: {
    color: THEME.chartLevel1,
    ...THEME.typography.small, 
    fontWeight: '600',
    textAlign: 'center', 
  },
  tooltipSubText: {
    color: THEME.textMuted,
    ...THEME.typography.micro,
    textAlign: 'center', 
    marginTop: 2,
  },

  detailOverlay: {
    flex: 1,
    backgroundColor: THEME.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  detailWindow: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: ADMIN_THEME.background,
    borderRadius: THEME.radius.lg,
  },
  detailWindowHeader: {
    height: 54,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
    paddingHorizontal: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailWindowTitle: { 
    ...THEME.typography.button, 
    color: THEME.textPrimary 
  },
  detailWindowClose: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.surfaceInfo,
  },
  detailWindowCloseText: {
    color: THEME.primary,
    fontWeight: '800',
    ...THEME.typography.micro,
  },
  detailWindowScrollContent: {
    paddingBottom: THEME.spacing.lg,
  },
  detailHero: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8 * 0.32,
    backgroundColor: THEME.textPrimary,
    justifyContent: 'flex-end', 
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  detailHeroId: {
    color: THEME.textInverse,
    ...THEME.typography.micro, 
    fontWeight: '700',
    backgroundColor: THEME.overlayDark,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
  },
  detailPhotoContainer: {
    width: 84,
    height: 84,
    borderRadius: THEME.radius.md,
    overflow: 'hidden', 
    borderWidth: 2,
    borderColor: THEME.surface,
    backgroundColor: THEME.surfaceInput,
    marginRight: THEME.spacing.sm,
  },
  detailNamePlate: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    ...THEME.shadow.sm,
  },
  detailNameText: {
    ...THEME.typography.h3,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  detailJobTitle: {
    ...THEME.typography.small,
    color: THEME.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailEmailText: {
    ...THEME.typography.micro, 
    color: THEME.textSecondary,
  },
  detailSourceText: {
    ...THEME.typography.micro, 
    color: THEME.textMuted,
    marginTop: 4,
  },
  detailBadgeSection: {
    marginTop: -18, 
    paddingHorizontal: THEME.spacing.sm,
  },
  detailBadgeRow: {
    width: SCREEN_WIDTH * 0.8 - 28, 
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCardLabel: {
    color: THEME.textInverse,
    ...THEME.typography.micro, 
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: THEME.shadowColor,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailGlassBadge: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.surfaceInfo, // Subtle admin blue highlight
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  detailCardSkillName: {
    color: THEME.textPrimary, 
    ...THEME.typography.micro, 
    fontWeight: '900',
    textAlign: 'center', 
    paddingHorizontal: 4,
  },
  detailHeatmapSection: {
    paddingHorizontal: THEME.spacing.sm, 
    paddingTop: THEME.spacing.md, 
  },
  detailHeatmapTitle: {
    ...THEME.typography.button, 
    color: THEME.textPrimary,
  },
});
