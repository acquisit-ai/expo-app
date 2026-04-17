import React, { useMemo } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { TabPageLayout, BlurButton, BlurCard, BlurList, BlurListItem, Alert, SegmentedControl } from '@/shared/ui';
import { useThemeToggle } from '@/features/theme-toggle';
import { useAuthOperations } from '@/features/auth/lib/auth-operations';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { useUserEmail, useUser } from '@/entities/user';
import { spacing } from '@/shared/config/theme';
import { toast } from '@/shared/lib/toast';
import { useModal } from '@/shared/lib/modal';
import { log, LogType } from '@/shared/lib/logger';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import type { ProfileScreenProps } from '@/shared/navigation/types';

const { width: screenWidth } = Dimensions.get('window');
const dynamicGap = screenWidth * 0.05; // 屏幕宽度的 5%

export function ProfilePage() {
  const { theme } = useTheme();
  const { openModal } = useModal<AppModalStackParamsList>();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();

  // 状态栏跟随 App 主题
  useForceStatusBarStyle('auto');

  // ✅ 使用新的业务逻辑 Hook
  const { signOut } = useAuthOperations();

  // ✅ 获取用户信息
  const userEmail = useUserEmail();
  const user = useUser();

  // 主题切换逻辑
  const { selectedIndex, labels, handleThemeChange } = useThemeToggle();

  // 缓存样式对象，需要在使用前定义
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 从用户信息中提取显示信息，使用 useMemo 优化性能
  const { displayName, avatarUrl } = useMemo(() => ({
    displayName: user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      userEmail?.split('@')[0] ||
      'User',
    avatarUrl: user?.user_metadata?.avatar_url
  }), [user, userEmail]);

  const handleLogout = () => {
    Alert.exit(
      '确认退出',
      '确定要退出登录吗？',
      async () => {
        await signOut();
        // ✅ 退出登录后，清空导航栈，回到登录页
        log('profile', LogType.INFO, '退出登录成功，清空导航栈并回到登录页');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'AuthStack' }],
          })
        );
      }
    );
  };


  // 创建个人资料功能列表，使用 useMemo 避免重复创建
  const profileFunctionItems: BlurListItem[] = useMemo(() => [
    {
      id: 'edit-profile',
      title: '编辑个人资料',
      icon: <Ionicons name="person-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击编辑个人资料');
        // TODO: 导航到编辑个人资料页面
      }
    },
    {
      id: 'study-stats',
      title: '学习统计',
      icon: <Ionicons name="stats-chart-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击学习统计');
        // TODO: 导航到学习统计页面
      }
    },
    {
      id: 'favorites',
      title: '我的收藏',
      icon: <Ionicons name="heart-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击我的收藏');
        navigation.navigate('Favorites');
      }
    },
    {
      id: 'history',
      title: '历史记录',
      icon: <Ionicons name="time-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击历史记录');
        navigation.navigate('History');
      }
    },
    {
      id: 'settings',
      title: '设置',
      icon: <Ionicons name="settings-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击设置');
        // TODO: 导航到设置页面
      }
    },
    {
      id: 'theme-settings',
      title: '主题',
      icon: <Ionicons name="color-palette-outline" size={22} color={theme.colors.textMedium} />,
      rightControl: (
        <SegmentedControl
          values={labels}
          selectedIndex={selectedIndex}
          onChange={(event) => handleThemeChange(event.nativeEvent.selectedSegmentIndex)}
          style={styles.segmentedControl}
        />
      )
    }
  ], [theme.colors.textMedium, labels, selectedIndex, handleThemeChange, styles.segmentedControl, navigation]);

  const helpItems: BlurListItem[] = useMemo(() => [
    {
      id: 'feedback',
      title: '意见反馈',
      icon: <Ionicons name="chatbubble-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击意见反馈');
        // TODO: 打开反馈页面或邮件
      }
    },
    {
      id: 'about',
      title: '关于应用',
      icon: <Ionicons name="information-circle-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        log('profile', LogType.INFO, '用户点击关于应用');
        // TODO: 显示关于页面
      }
    }
  ], [theme.colors.textMedium]);

  // Toast测试功能列表
  const toastTestItems: BlurListItem[] = [
    {
      id: 'toast-success',
      title: 'Success Toast',
      icon: <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        toast.show({
          type: 'success',
          title: '操作成功',
          message: '这是一个成功提示消息'
        });
      }
    },
    {
      id: 'toast-error',
      title: 'Error Toast',
      icon: <Ionicons name="close-circle-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        toast.show({
          type: 'error',
          title: '操作失败',
          message: '这是一个错误提示消息'
        });
      }
    },
    {
      id: 'toast-warning',
      title: 'Warning Toast',
      icon: <Ionicons name="warning-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        toast.show({
          type: 'warning',
          title: '警告提示',
          message: '这是一个警告提示消息'
        });
      }
    },
    {
      id: 'toast-info',
      title: 'Info Toast',
      icon: <Ionicons name="information-circle-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        toast.show({
          type: 'info',
          title: '信息提示',
          message: '这是一个信息提示消息'
        });
      }
    }
  ];

  // Modal测试功能列表
  const modalTestItems: BlurListItem[] = [
    {
      id: 'modal-playback-settings',
      title: '播放设置 Modal',
      icon: <Ionicons name="settings-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        openModal('PlaybackSettingsModal');
      }
    },
    {
      id: 'modal-demo',
      title: '弹出 Demo Modal',
      icon: <Ionicons name="add-circle-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        openModal('DemoModal', { name: 'DemoModal', color: 'darkgreen', origin: 'Hooks' });
      }
    },
    {
      id: 'modal-word',
      title: '元素解释 Modal',
      icon: <Ionicons name="book-outline" size={22} color={theme.colors.textMedium} />,
      onPress: () => {
        openModal('ElementExplanationModal', {
          word: 'really',
          translation: '真的 / 实际上',
          label: 'really',
          pos: 'ADV',
          dictionaryLabel: '真的 / 实际上',
          definition: '句子或从句层面的副词，用来表示事实性、确认、纠正或惊讶，意为“实际上/真的/事实上”。',
        });
      }
    }
  ];

  const textStyles = useMemo(() => ({
    username: {
      fontSize: 24,
      fontWeight: '600' as const,
      color: theme.colors.textMedium,
    },
    info: {
      fontSize: 16,
      color: theme.colors.textMedium,
    }
  }), [theme.colors.textMedium]);

  return (
    <TabPageLayout>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <BlurCard style={styles.card}>
            <View style={styles.profileInfo}>
              <Image
                source={{
                  uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&faceindex=1'
                }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={textStyles.username}>{displayName}</Text>
                {userEmail && (
                  <Text style={textStyles.info}>{userEmail}</Text>
                )}
              </View>
            </View>
          </BlurCard>

          <BlurList
            items={profileFunctionItems}
          />

          <BlurList
            items={helpItems}
          />

          <BlurList
            items={toastTestItems}
          />

          <BlurList
            items={modalTestItems}
          />

          <View style={styles.buttonWrapper}>
            <BlurButton
              onPress={handleLogout}
              style={styles.logoutButton}
              variant="error"
            >
              退出登录
            </BlurButton>
          </View>
        </View>
      </View>
    </TabPageLayout>
  );
}

// 将样式创建函数提取到组件外部，支持主题切换
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: dynamicGap,
    paddingBottom: dynamicGap,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: dynamicGap,
  },
  card: {
    // 移除 marginBottom，由 contentContainer 的 gap 统一管理
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: dynamicGap * 0.8,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  segmentedControl: {
    width: 200,
    height: 32,
  },
  buttonWrapper: {
    width: '90%',
    alignSelf: 'center',
  },
  logoutButton: {
    width: '100%',
  },
});
