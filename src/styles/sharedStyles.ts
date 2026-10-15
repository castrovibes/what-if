import { StyleSheet } from 'react-native';
import { Typography, Spacing, getBottomPadding } from '../utils/deviceHelpers';
import { cardShadow, subtleShadow } from './shadows';

export const styles = StyleSheet.create({
  // Loading Screen
  loadingGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingQuestionMark: {
    marginBottom: Spacing.lg,
  },
  loadingQuestionMarkText: {
    fontSize: 120,
    fontWeight: 'bold',
    fontFamily: 'Barrio-Regular',
    color: '#49297e',
    opacity: 0.15,
  },
  loadingTitle: {
    fontSize: Typography.largeTitle,
    fontFamily: 'Barrio-Regular',
    color: '#111827',
    textAlign: 'center',
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
  },
  welcomeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 244, 255, 0.75)',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  welcomeTitle: {
    fontSize: Typography.display * 1.4,
    fontFamily: 'Barrio-Regular',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    textAlign: 'center',
    maxWidth: 400,
  },
  welcomeButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    zIndex: 10,
  },
  getStartedButton: {
    backgroundColor: '#e10086',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    shadowColor: '#e10086',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: Typography.title3,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  welcomeFooter: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    zIndex: 10,
  },
  welcomeFooterText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },

  // Common
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: Typography.title1,
    fontWeight: 'bold',
    fontFamily: 'Barrio-Regular',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginTop: Spacing.xs,
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  backButtonText: {
    color: '#e10086',
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Instruction Cards
  instructionCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    ...cardShadow,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  instructionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: Typography.title2,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: Typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: Spacing.sm,
  },
  instructionDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    lineHeight: 20,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#e10086',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: Typography.title2,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },

  // Community Screen
  communityHeaderCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...cardShadow,
  },
  communityHeaderTitle: {
    fontSize: Typography.title2,
    fontWeight: '600',
    fontFamily: 'Barrio-Regular',
    color: '#111827',
    marginBottom: Spacing.sm,
  },
  communityHeaderDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginBottom: Spacing.md,
  },
  filterScrollView: {
    marginBottom: Spacing.md,
  },
  filterButtonActive: {
    backgroundColor: '#e10086',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    ...subtleShadow,
  },
  filterButtonActiveText: {
    color: '#fff',
    fontSize: Typography.subheadline,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    color: '#4b5563',
    fontSize: Typography.subheadline,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  communityPostCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...cardShadow,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postUserName: {
    fontSize: Typography.subheadline,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  postMeta: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
  ageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ageBadgeText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  postContent: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
  },
  postActionText: {
    fontSize: Typography.subheadline,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },

  // Profile Screen
  profileHeaderCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    backgroundColor: '#90dcff',
    marginBottom: Spacing.lg,
    ...cardShadow,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: Typography.title3,
    fontWeight: 'bold',
    fontFamily: 'Barrio-Regular',
    color: '#111827',
  },
  profileRole: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
  editProfileButton: {
    backgroundColor: '#fff',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#e10086',
    fontSize: Typography.subheadline,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...cardShadow,
  },
  statsTitle: {
    fontSize: Typography.title2,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.md,
    borderRadius: 12,
    ...subtleShadow,
  },
  statValue: {
    fontSize: Typography.title1,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
    color: '#49297e',
  },
  statLabel: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginTop: Spacing.xs,
  },

  // Content Filter
  contentFilterCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#49297e',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...cardShadow,
  },
  contentFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contentFilterTitle: {
    fontSize: Typography.title2,
    fontWeight: '600',
    fontFamily: 'Barrio-Regular',
    color: '#111827',
  },
  contentFilterDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginBottom: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e10086',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e10086',
  },
  radioContent: {
    flex: 1,
  },
  radioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  radioLabel: {
    fontSize: Typography.subheadline,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  radioDescription: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
  recommendedBadge: {
    backgroundColor: '#49297e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  radioDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: Spacing.sm,
  },

  // Upgrade Card
  upgradeCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  upgradeTitle: {
    fontSize: Typography.title2,
    fontWeight: '600',
    fontFamily: 'Barrio-Regular',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  upgradeDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#fdfb76',
    marginBottom: Spacing.md,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#e10086',
    fontSize: Typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },

  // Settings Screen
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  settingsSectionTitle: {
    fontSize: Typography.caption,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#49297e',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 44,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsItemText: {
    fontSize: Typography.body,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  settingsItemSubtext: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginTop: 2,
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },

  // Prompt Screen
  tipsBox: {
    backgroundColor: '#f9fafb',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(73, 41, 126, 0.2)',
    ...subtleShadow,
  },
  tipsBoxTitle: {
    fontSize: Typography.callout,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: Spacing.sm,
  },
  tipsBoxList: {
    gap: 6,
  },
  tipsBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsBoxItem: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
});
