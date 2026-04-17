import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { ModalComponentProp } from 'react-native-modalfy';
import { useModal } from '@/shared/lib/modal';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import { BlurModal, BlurButton } from '@/shared/ui/blur';
import { useTheme } from '@/shared/providers/ThemeProvider';

const IntroModal = ({}: ModalComponentProp<AppModalStackParamsList, void, 'IntroModal'>) => {
  const { openModal } = useModal<AppModalStackParamsList>();
  const { theme } = useTheme();

  const handleOpenDemoModal = () => {
    openModal('DemoModal', { name: 'DemoModal', color: 'darkgreen', origin: 'Hooks' });
  };

  return (
    <BlurModal type="bottom-sheet" padding="md" variant="default" showHandle>
      <BlurButton
        onPress={handleOpenDemoModal}
        style={styles.button}
        variant="default"
      >
        <View style={styles.buttonContent}>
          <View style={[styles.buttonIcon, { backgroundColor: 'darkgreen' }]}>
            <Text style={styles.buttonIconText}>D</Text>
          </View>
          <Text style={[styles.buttonTitle, { color: theme.colors.textMedium }]}>打开 Demo Modal</Text>
        </View>
      </BlurButton>
    </BlurModal>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 150,
    width: '90%',
    marginBottom: 25,
    alignSelf: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  buttonIcon: {
    width: 80,
    height: 80,
    marginRight: 30,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    width: '70%',
  },
});

export default IntroModal;