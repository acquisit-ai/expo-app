import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ModalComponentProp, ModalComponentWithOptions } from 'react-native-modalfy';
import { BlurModal } from '@/shared/ui/blur';
import { SegmentedControl } from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';
import {
  useGlobalSettings,
  selectPlaybackRate,
  selectIsMuted,
  selectStaysActiveInBackground,
  selectStartsPictureInPictureAutomatically,
  selectUpdatePlayerInstanceSettings,
} from '@/entities/global-settings';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import type { PlaybackRate } from '../model/types';

const PlaybackSettingsModal: ModalComponentWithOptions<ModalComponentProp<AppModalStackParamsList, void, 'PlaybackSettingsModal'>> = ({ }: ModalComponentProp<AppModalStackParamsList, void, 'PlaybackSettingsModal'>) => {
  const { theme } = useTheme();

  // 从 global-settings 读取设置
  const playbackRate = useGlobalSettings(selectPlaybackRate);
  const isMuted = useGlobalSettings(selectIsMuted);
  const staysActiveInBackground = useGlobalSettings(selectStaysActiveInBackground);
  const startsPictureInPictureAutomatically = useGlobalSettings(selectStartsPictureInPictureAutomatically);
  const updateSettings = useGlobalSettings(selectUpdatePlayerInstanceSettings);

  // 便捷方法
  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    updateSettings({ playbackRate: clampedRate });
  }, [updateSettings]);

  const toggleMute = useCallback(() => {
    updateSettings({ isMuted: !isMuted });
  }, [updateSettings, isMuted]);

  const toggleBackgroundPlayback = useCallback(() => {
    updateSettings({ staysActiveInBackground: !staysActiveInBackground });
  }, [updateSettings, staysActiveInBackground]);

  const togglePictureInPictureAutoStart = useCallback((enabled: boolean) => {
    updateSettings({ startsPictureInPictureAutomatically: enabled });
  }, [updateSettings]);

  // 播放速度选项
  const playbackRateValues: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const playbackRateLabels = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'];
  const selectedSpeedIndex = playbackRateValues.findIndex(rate => Math.abs(rate - playbackRate) < 0.01);

  // 防止selectedIndex为-1导致的异常行为
  const safeSelectedIndex = selectedSpeedIndex >= 0 ? selectedSpeedIndex : 2; // 默认选中1x

  // 播放速度设置项渲染
  const renderPlaybackRateItem = useCallback(() => {
    return (
      <View key="playback-rate">
        <View style={modalStyles.item}>
          <View style={modalStyles.iconContainer}>
            <Ionicons name="speedometer-outline" size={22} color={theme.colors.textMedium} />
          </View>

          <View style={modalStyles.textContainer}>
            <Text style={[modalStyles.title, { color: theme.colors.textMedium }]}>
              倍速
            </Text>
          </View>

          <View style={modalStyles.controlContainer}>
            <SegmentedControl
              values={playbackRateLabels}
              selectedIndex={safeSelectedIndex}
              onChange={(event) => {
                const index = event.nativeEvent.selectedSegmentIndex;
                setPlaybackRate(playbackRateValues[index]);
              }}
              style={modalStyles.segmentedControl}
            />
          </View>
        </View>
        <View style={[modalStyles.divider, { backgroundColor: theme.colors.outline }]} />
      </View>
    );
  }, [safeSelectedIndex, playbackRateValues, playbackRateLabels, setPlaybackRate, theme.colors.textMedium, theme.colors.outline]);

  // 静音控制设置项渲染
  const renderVolumeItem = useCallback(() => {
    const handlePress = useCallback(() => {
      Haptics.selectionAsync();
      toggleMute();
    }, [toggleMute]);

    return (
      <View key="volume-control">
        <TouchableOpacity
          style={modalStyles.item}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={modalStyles.iconContainer}>
            <Ionicons name="volume-mute-outline" size={22} color={theme.colors.textMedium} />
          </View>

          <View style={modalStyles.textContainer}>
            <Text style={[modalStyles.title, { color: theme.colors.textMedium }]}>
              静音
            </Text>
          </View>

          <View style={modalStyles.controlContainer}>
            <Switch
              value={isMuted}
              onValueChange={toggleMute}
              trackColor={{
                false: theme.colors.outline,
                true: theme.colors.primary
              }}
              thumbColor={isMuted ? theme.colors.onPrimary : theme.colors.surface}
              ios_backgroundColor={theme.colors.outline}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [isMuted, toggleMute, theme.colors.textMedium, theme.colors.primary, theme.colors.outline, theme.colors.onPrimary, theme.colors.surface]);

  // 后台播放设置项渲染
  const renderBackgroundPlaybackItem = useCallback(() => {
    const handlePress = useCallback(() => {
      Haptics.selectionAsync();
      toggleBackgroundPlayback();
    }, [toggleBackgroundPlayback]);

    return (
      <View key="background-playback">
        <TouchableOpacity
          style={modalStyles.item}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={modalStyles.iconContainer}>
            <Ionicons name="play-circle-outline" size={22} color={theme.colors.textMedium} />
          </View>

          <View style={modalStyles.textContainer}>
            <Text style={[modalStyles.title, { color: theme.colors.textMedium }]}>
              后台播放
            </Text>
          </View>

          <View style={modalStyles.controlContainer}>
            <Switch
              value={staysActiveInBackground}
              onValueChange={toggleBackgroundPlayback}
              trackColor={{
                false: theme.colors.outline,
                true: theme.colors.primary
              }}
              thumbColor={staysActiveInBackground ? theme.colors.onPrimary : theme.colors.surface}
              ios_backgroundColor={theme.colors.outline}
            />
          </View>
        </TouchableOpacity>
        <View style={[modalStyles.divider, { backgroundColor: theme.colors.outline }]} />
      </View>
    );
  }, [staysActiveInBackground, toggleBackgroundPlayback, theme.colors.textMedium, theme.colors.primary, theme.colors.outline, theme.colors.onPrimary, theme.colors.surface]);

  // 画中画自动启动设置项渲染
  const renderPiPAutoStartItem = useCallback(() => {
    const handlePress = useCallback(() => {
      Haptics.selectionAsync();
      togglePictureInPictureAutoStart(!startsPictureInPictureAutomatically);
    }, [togglePictureInPictureAutoStart, startsPictureInPictureAutomatically]);

    return (
      <View key="pip-auto-start">
        <TouchableOpacity
          style={modalStyles.item}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={modalStyles.iconContainer}>
            <Ionicons name="tablet-landscape-outline" size={22} color={theme.colors.textMedium} />
          </View>

          <View style={modalStyles.textContainer}>
            <Text style={[modalStyles.title, { color: theme.colors.textMedium }]}>
              自动画中画
            </Text>
          </View>

          <View style={modalStyles.controlContainer}>
            <Switch
              value={startsPictureInPictureAutomatically}
              onValueChange={(value) => togglePictureInPictureAutoStart(value)}
              trackColor={{
                false: theme.colors.outline,
                true: theme.colors.primary
              }}
              thumbColor={startsPictureInPictureAutomatically ? theme.colors.onPrimary : theme.colors.surface}
              ios_backgroundColor={theme.colors.outline}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [startsPictureInPictureAutomatically, togglePictureInPictureAutoStart, theme.colors.textMedium, theme.colors.primary, theme.colors.outline, theme.colors.onPrimary, theme.colors.surface]);

  return (
    <BlurModal type="bottom-sheet" padding="none" variant="default" showHandle>
      <View style={modalStyles.contentContainer}>
        {renderPlaybackRateItem()}
        {renderVolumeItem()}
        {renderBackgroundPlaybackItem()}
        {renderPiPAutoStartItem()}
      </View>
    </BlurModal>
  );
};

const modalStyles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24, // md padding for horizontal
    paddingVertical: 8,    // smaller vertical paddin
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: -8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  controlContainer: {
    alignItems: 'flex-end',
  },
  segmentedControl: {
    width: 255,
    height: 32,
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
    opacity: 0.8,
  },
});

export default PlaybackSettingsModal;