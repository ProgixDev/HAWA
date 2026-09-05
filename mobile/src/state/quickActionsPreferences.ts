import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDER_KEY = '@hawa/home/quick-actions-order';

export async function loadQuickActionsOrder(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export const saveQuickActionsOrder = (order: string[]): void => {
  AsyncStorage.setItem(ORDER_KEY, JSON.stringify(order)).catch(() => {});
};
