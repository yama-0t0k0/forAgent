import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator, ScrollView, ImageBackground, Image, Dimensions } from 'react-native';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { HeatmapGrid } from '@shared/src/core/components/HeatmapGrid';
import { HeatmapCalculator } from '@shared/src/core/utils/HeatmapCalculator';
import { THEME } from '@shared/src/core/theme/theme';
import { styles } from '../../dashboardStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId, extractSkills }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={styles.detailOverlay} onPress={onClose}>
      <Pressable style={styles.detailWindow} onPress={(e) => e.stopPropagation()}>
        <View style={styles.detailWindowHeader}>
          <Text style={styles.detailWindowTitle}>個人ユーザー詳細</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailWindowClose}>
            <Text style={styles.detailWindowCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.detailWindowLoading}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={styles.detailWindowLoadingText}>読み込み中...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.detailWindowLoading}>
            <Text style={styles.detailWindowErrorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && userDoc && (
          <ScrollView contentContainerStyle={styles.detailWindowScrollContent} bounces={false}>
            {(() => {
              const basicInfo = userDoc['基本情報'] || {};
              const family = basicInfo['姓'] || '';
              const first = basicInfo['名'] || '';
              const mail = basicInfo['メール'] || basicInfo['メールアドレス'] || '';
              const backgroundUri = basicInfo['背景画像URL'];
              const profileUri = basicInfo['プロフィール画像URL'];

              const skills = extractSkills(userDoc);
              const coreSkill = skills.core[0] || '-';
              const sub1Skill = skills.sub1[0] || '-';
              const sub2Skill = skills.sub2[0] || '-';

              const heatmapValues = HeatmapCalculator.calculate(userDoc);

              return (
                <>
                  <ImageBackground
                    source={backgroundUri ? { uri: backgroundUri } : undefined}
                    style={styles.detailHero}
                    imageStyle={styles.detailHeroImage}
                  >
                    <View style={styles.detailHeroTopRow}>
                      <Text style={styles.detailHeroId}>ID: {userId}</Text>
                    </View>

                    <View style={styles.detailHeroProfileRow}>
                      <View style={styles.detailPhotoContainer}>
                        <Image
                          source={{
                            uri: profileUri || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400',
                          }}
                          style={styles.detailProfileImage}
                        />
                      </View>
                      <View style={styles.detailNamePlate}>
                        <Text style={styles.detailNameText}>{`${family} ${first}`.trim() || '名称未設定'}</Text>
                        <Text style={styles.detailJobTitle}>フロントエンドエンジニア</Text>
                        <Text style={styles.detailEmailText}>{mail || '-'}</Text>
                        <Text style={styles.detailSourceText}>データ元: Firestore (individual)</Text>
                      </View>
                    </View>
                  </ImageBackground>

                  <View style={styles.detailBadgeSection}>
                    <View style={styles.detailBadgeRow}>
                      <GlassCard
                        label="コアスキル"
                        skillName={coreSkill}
                        width={(styles.detailBadgeRow.width - 12) / 3}
                        labelStyle={styles.detailCardLabel}
                        badgeStyle={styles.detailGlassBadge}
                        skillNameStyle={styles.detailCardSkillName}
                      />
                      <GlassCard
                        label="サブスキル1"
                        skillName={sub1Skill}
                        width={(styles.detailBadgeRow.width - 12) / 3}
                        labelStyle={styles.detailCardLabel}
                        badgeStyle={styles.detailGlassBadge}
                        skillNameStyle={styles.detailCardSkillName}
                      />
                      <GlassCard
                        label="サブスキル2"
                        skillName={sub2Skill}
                        width={(styles.detailBadgeRow.width - 12) / 3}
                        labelStyle={styles.detailCardLabel}
                        badgeStyle={styles.detailGlassBadge}
                        skillNameStyle={styles.detailCardSkillName}
                      />
                    </View>
                  </View>

                  <View style={styles.detailHeatmapSection}>
                    <Text style={styles.detailHeatmapTitle}>スキル・志向ヒートマップ</Text>
                    <View style={{ alignItems: 'center', marginTop: 10 }}>
                      <HeatmapGrid
                        containerWidth={SCREEN_WIDTH * 0.8 - 40}
                        dataValues={heatmapValues}
                      />
                    </View>
                  </View>
                </>
              );
            })()}
          </ScrollView>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);
