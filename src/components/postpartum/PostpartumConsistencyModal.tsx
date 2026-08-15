import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  infoText: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onRequestClose: () => void;
};

export function PostpartumConsistencyModal({
  visible,
  title,
  message,
  infoText,
  primaryLabel,
  secondaryLabel = 'Annuler',
  onPrimary,
  onSecondary,
  onRequestClose,
}: Props): React.JSX.Element {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fermer l’avertissement"
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityRole="alert" style={styles.card}>
          <View style={styles.icon}>
            <MaterialDesignIcons
              color="#6B4BC4"
              name="alert-circle-outline"
              size={36}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.info}>
            <MaterialDesignIcons
              color="#6B4BC4"
              name="information-outline"
              size={19}
            />
            <Text style={styles.infoText}>{infoText}</Text>
          </View>
          <Pressable
            accessibilityLabel={primaryLabel}
            accessibilityRole="button"
            onPress={onPrimary}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
            <MaterialDesignIcons color="#FFFFFF" name="arrow-right" size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel={secondaryLabel}
            accessibilityRole="button"
            onPress={onSecondary}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 21,
    backgroundColor: 'rgba(34,20,69,0.40)',
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E4D9F5',
    backgroundColor: '#FFFDFF',
    padding: 23,
    shadowColor: '#24134A',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  icon: {
    width: 70,
    height: 70,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    backgroundColor: '#F0E8FC',
  },
  title: {
    marginTop: 15,
    color: '#30205D',
    fontFamily: 'serif',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    color: '#62577A',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  info: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 9,
    borderRadius: 16,
    backgroundColor: '#F2ECFC',
    padding: 13,
  },
  infoText: { flex: 1, color: '#61557B', fontSize: 13, lineHeight: 19 },
  primary: {
    height: 51,
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#6B4BC4',
    shadowColor: '#4E2A9B',
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    borderRadius: 15,
    backgroundColor: '#F7F3FC',
  },
  secondaryText: { color: '#6B4BC4', fontSize: 14, fontWeight: '800' },
});
