/* eslint-disable react-native/no-inline-styles */
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Easing,
} from 'react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import type {
  ModalComponentProp,
  ModalComponentWithOptions,
  ModalEventCallback,
  ModalEventListener,
} from 'react-native-modalfy';

import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import { BlurModal } from '@/shared/ui/blur';
import { useTheme } from '@/shared/providers/ThemeProvider';

const DemoModal: ModalComponentWithOptions<ModalComponentProp<AppModalStackParamsList, void, 'DemoModal'>> = ({
  modal: { addListener, currentModal, getParam, openModal },
}) => {
  const modalListener = useRef<ModalEventListener | undefined>(undefined);
  const { theme } = useTheme();

  const handleClose: ModalEventCallback = useCallback(() => {
    console.log(`👋 ${currentModal} closed`);
  }, [currentModal]);

  const origin = getParam('origin', 'Hooks');
  const color = getParam('color', 'darkgreen');
  const modalName = getParam('name');



  // Type checking at work 👇
  const onOpenSameModal = () =>
    openModal('DemoModal', { name: modalName, color, origin });

  useEffect(() => {
    modalListener.current = addListener('onClose', handleClose);

    return () => {
      modalListener.current?.remove();
    };
  }, [addListener, handleClose]);

  return (
    <BlurModal type="square" sizeRatio={0.85} padding="lg" variant="default">
      <View style={styles.centerContent}>
        <TouchableOpacity onPress={onOpenSameModal} style={styles.addButton}>
          <Text style={{ fontSize: 40, fontWeight: 'bold', color: theme.colors.textMedium }}>{modalName}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textMedium }}>添加modal</Text>
        </TouchableOpacity>
      </View>
    </BlurModal>
  );
};

DemoModal.modalOptions = {
  backdropOpacity: 0.5,
  transitionOptions: animatedValue => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 0.6],
    }),
    transform: [
      {
        perspective: 2000,
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0.95, 1, 0.88],
        }),
      },
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [20, 0, -40],
        }),
      },
    ],
  }),
  animateInConfig: {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    duration: 100,
  },
  animateOutConfig: {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    duration: 250,
  },
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default DemoModal;