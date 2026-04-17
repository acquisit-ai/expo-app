/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ModalComponentProp,
  ModalComponentWithOptions,
  ModalEventCallback,
  ModalEventListener,
} from 'react-native-modalfy';
import { BlurModal } from '@/shared/ui/blur';
import { useTheme } from '@/shared/providers/ThemeProvider';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import { Ionicons } from '@expo/vector-icons';
import { useWordCollectionEntity } from '@/entities/word-collection';
import type { WordItem } from '@/entities/word-collection';
import { log, LogType } from '@/shared/lib/logger';

interface ModalMetadata {
  id: string;
  kind: 'word' | 'phrase';
  label: string;
  pos?: string;
  chineseLabel?: string;
  chineseDef?: string;
}

const ElementExplanationModal: ModalComponentWithOptions<ModalComponentProp<AppModalStackParamsList, void, 'ElementExplanationModal'>> = ({
  modal: { addListener, currentModal, getParam },
}) => {
  const modalListener = useRef<ModalEventListener | undefined>(undefined);
  const { theme } = useTheme();
  const { entities, actions } = useWordCollectionEntity();

  const handleClose: ModalEventCallback = useCallback(() => {
    console.log(`👋 ${currentModal} closed`);

    // 获取视频播放恢复参数
    const wasPlayingBeforeModal = getParam('wasPlayingBeforeModal', false);

    // 获取clearModalHighlight回调函数
    const clearModalHighlight = getParam('clearModalHighlight', undefined);
    if (clearModalHighlight) {
      clearModalHighlight();
    }

    // 如果Modal打开前视频在播放，则恢复播放
    if (wasPlayingBeforeModal) {
      // 这里需要访问视频播放器控制功能
      // 通过参数传递的方式获取play函数
      const resumePlayback = getParam('resumePlayback', undefined);
      if (resumePlayback) {
        resumePlayback();
      }
    }
  }, [currentModal, getParam]);

  // 获取单词数据参数
  const word = getParam('word', 'totalitarianism');
  const translation = getParam('translation', '极权主义');
  const label = getParam('label', undefined);
  const pos = getParam('pos', undefined);
  const definition = getParam('definition', undefined);
  const dictionaryLabel = getParam('dictionaryLabel', undefined);
  const metadata = getParam('metadata', undefined) as ModalMetadata | undefined;

  const isAlreadySaved = useMemo(() => {
    if (!metadata) {
      return false;
    }
    return Boolean(entities[metadata.id]);
  }, [entities, metadata]);

  const [isSaved, setIsSaved] = useState(isAlreadySaved);

  useEffect(() => {
    setIsSaved(isAlreadySaved);
  }, [isAlreadySaved]);

  const handleAddToCollection = useCallback(() => {
    if (!metadata) {
      return;
    }

    if (isSaved) {
      actions.removeItem(metadata.id);
      setIsSaved(false);
      log('word-collection', LogType.INFO, `Removed word ${word} from collection`);
      return;
    }

    const newItem: WordItem = {
      id: metadata.id,
      kind: metadata.kind,
      label: metadata.label,
      pos: metadata.pos ?? '',
      chineseLabel: metadata.chineseLabel ?? translation,
      chineseDef: metadata.chineseDef ?? '',
      source: 'custom',
      progress: 0,
      addedAt: new Date().toISOString(),
    };

    actions.upsertItem(newItem);
    setIsSaved(true);
    log('word-collection', LogType.INFO, `Saved word ${word} from subtitle modal`);
  }, [actions, metadata, isSaved, translation, word]);

  useEffect(() => {
    modalListener.current = addListener('onClose', handleClose);

    return () => {
      modalListener.current?.remove();
    };
  }, [addListener, handleClose]);

  return (
    <BlurModal type="square" sizeRatio={0.85} padding="lg" variant="default">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 标题区域 - 单词和原形 */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleSide} />
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.primary }]}>
                {word}
              </Text>
            </View>
            <View style={styles.titleSide}>
              {metadata ? (
                <Pressable
                  onPress={handleAddToCollection}
                  style={({ pressed }) => [
                    styles.starButton,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name={isSaved ? 'star' : 'star-outline'}
                    size={22}
                    color={isSaved ? '#FFC740' : theme.colors.textMedium}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
          {(pos || label) && (
            <View style={styles.metaRow}>
              {pos && (
                <Text
                  style={[styles.pos, { color: theme.colors.textMedium }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {pos}
                </Text>
              )}
              {pos && label && (
                <Text style={[styles.metaSpace, { color: theme.colors.textMedium }]}> </Text>
              )}
              {label && (
                <Text
                  style={[styles.labelText, { color: theme.colors.textMedium }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {label}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 分隔线 */}
        <View style={[styles.divider, { backgroundColor: theme.colors.textMedium }]} />

        {/* 上下文释义 */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>上下文释义</Text>
          <Text style={[styles.content, { color: theme.colors.textMedium }]}>{translation}</Text>
        </View>

        {/* 字典释义（短标签） */}
        {dictionaryLabel && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.primary }]}>字典释义</Text>
            <Text style={[styles.content, { color: theme.colors.textMedium }]}>{dictionaryLabel}</Text>
          </View>
        )}

        {/* 词典释义（详细） */}
        {definition && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.primary }]}>解释</Text>
            <Text style={[styles.content, { color: theme.colors.textMedium }]}>{definition}</Text>
          </View>
        )}
      </ScrollView>
    </BlurModal>
  );
};

ElementExplanationModal.modalOptions = {
  backdropOpacity: 0.4,
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  titleSide: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  starButton: {
    padding: 6,
    borderRadius: 999,
  },
  labelText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  pos: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  metaSpace: {
    fontSize: 14,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    width: '80%',
    alignSelf: 'center',
    opacity: 0.2,
    marginBottom: 25,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
});

export default ElementExplanationModal;
