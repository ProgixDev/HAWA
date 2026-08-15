import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import {
  clearPostpartumSuccessToast,
  getPostpartumSuccessToast,
  subscribePostpartumSuccessToast,
} from '../../state/postpartumSuccessToastStore';
export function PostpartumSuccessToast(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(getPostpartumSuccessToast);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(
    () =>
      subscribePostpartumSuccessToast(() =>
        setToast(getPostpartumSuccessToast()),
      ),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    Animated.timing(a, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(
      () =>
        Animated.timing(a, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => clearPostpartumSuccessToast()),
      1900,
    );
    return () => clearTimeout(t);
  }, [a, toast]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: insets.top + 10,
          opacity: a,
          transform: [
            {
              translateY: a.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.icon}>
        <MaterialDesignIcons name="check-circle" size={22} color="#6B4BC4" />
      </View>
      <View>
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    zIndex: 99,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(107,75,196,.14)',
    borderRadius: 19,
    backgroundColor: '#FFFDFF',
    padding: 12,
    shadowColor: '#342060',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#F0E8FC',
  },
  title: { color: '#2F2450', fontSize: 14, fontWeight: '800' },
  text: { marginTop: 2, color: '#756C87', fontSize: 12 },
});
