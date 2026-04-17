/**
 * React Navigation 类型定义
 * 提供完整的类型安全支持
 */

import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * 根导航器参数列表
 */
export type RootStackParamList = {
  /** 主标签页导航器 */
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  /** 视频模态栈（包含 Detail 和 Fullscreen） */
  VideoStack: NavigatorScreenParams<VideoStackParamList>;
  /** 独立视频播放栈（收藏/历史） */
  StandaloneVideoStack: NavigatorScreenParams<StandaloneVideoStackParamList>;
  /** 认证流程栈 */
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  /** 收藏列表页面 */
  Favorites: undefined;
  /** 历史记录页面 */
  History: undefined;
  /** 单词收藏详情 */
  WordCollectionDetail: { id: string };
};

/**
 * 主标签页参数列表
 */
export type MainTabParamList = {
  Feed: undefined;
  Collections: undefined;
  Profile: undefined;
};

/**
 * 视频模态栈参数列表
 * 🔑 关键改进：移除 videoId 参数，使用全局状态 (currentPlayerMeta)
 * - Detail/Fullscreen 都直接读取全局状态，不需要参数传递
 * - autoPlay 仍保留，用于控制自动播放行为
 */
export type VideoStackParamList = {
  VideoDetail: undefined;
  VideoFullscreen: {
    /**
     * 是否自动播放
     * - true: 强制自动播放（Feed 首次进入）
     * - undefined/false: 保持播放器当前状态（Detail 切换过来）
     */
    autoPlay?: boolean;
  };
};

/**
 * 独立视频播放栈参数列表
 */
export type StandaloneVideoStackParamList = {
  StandaloneVideoDetail: undefined;
  StandaloneVideoFullscreen: {
    /**
     * 是否自动播放（保留与主视频栈一致的行为）
     */
    autoPlay?: boolean;
  };
};

/**
 * 认证栈参数列表
 */
export type AuthStackParamList = {
  Login: undefined;
  VerifyCode: { mode?: 'login' | 'forgotPassword'; email?: string; phoneNumber?: string };
  PasswordManage: { mode: 'reset' | 'set' };
};

/**
 * 屏幕 Props 类型辅助
 */

// ===== 主标签页屏幕 =====
export type FeedScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Feed'>,
  StackScreenProps<RootStackParamList>
>;

export type CollectionsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Collections'>,
  StackScreenProps<RootStackParamList>
>;

export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<RootStackParamList>
>;

export type FavoritesScreenProps = CompositeScreenProps<
  StackScreenProps<RootStackParamList, 'Favorites'>,
  StackScreenProps<RootStackParamList>
>;

export type HistoryScreenProps = CompositeScreenProps<
  StackScreenProps<RootStackParamList, 'History'>,
  StackScreenProps<RootStackParamList>
>;

export type WordCollectionDetailScreenProps = StackScreenProps<RootStackParamList, 'WordCollectionDetail'>;

// ===== 视频栈屏幕 =====
export type VideoDetailScreenProps = CompositeScreenProps<
  StackScreenProps<VideoStackParamList, 'VideoDetail'>,
  StackScreenProps<RootStackParamList>
>;

export type VideoFullscreenScreenProps = CompositeScreenProps<
  StackScreenProps<VideoStackParamList, 'VideoFullscreen'>,
  StackScreenProps<RootStackParamList>
>;

export type StandaloneVideoDetailScreenProps = CompositeScreenProps<
  StackScreenProps<StandaloneVideoStackParamList, 'StandaloneVideoDetail'>,
  StackScreenProps<RootStackParamList>
>;

export type StandaloneVideoFullscreenScreenProps = CompositeScreenProps<
  StackScreenProps<StandaloneVideoStackParamList, 'StandaloneVideoFullscreen'>,
  StackScreenProps<RootStackParamList>
>;

// ===== 认证栈屏幕 =====
export type LoginScreenProps = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, 'Login'>,
  StackScreenProps<RootStackParamList>
>;

export type VerifyCodeScreenProps = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, 'VerifyCode'>,
  StackScreenProps<RootStackParamList>
>;

export type PasswordManageScreenProps = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, 'PasswordManage'>,
  StackScreenProps<RootStackParamList>
>;

/**
 * 导航 Hook 类型声明
 * 使得 useNavigation() 可以获得完整的类型推断
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
