import AsyncStorage from '@react-native-async-storage/async-storage';

export type PostpartumNifasReminderState = {
  deliveryDate: string | null;
  configVersion: number;
  warningScheduled: boolean;
  referenceScheduled: boolean;
  /** Persisted trigger snapshots make reconciliation independent of JS events. */
  warningFireAt: string | null;
  referenceFireAt: string | null;
  warningOccurrenceId: string | null;
  referenceOccurrenceId: string | null;
};

const STORAGE_KEY = '@hawa/postpartum-nifas-reminders/v1';
const DEFAULT_STATE: PostpartumNifasReminderState = {
  deliveryDate: null,
  configVersion: 0,
  warningScheduled: false,
  referenceScheduled: false,
  warningFireAt: null,
  referenceFireAt: null,
  warningOccurrenceId: null,
  referenceOccurrenceId: null,
};

let state = { ...DEFAULT_STATE };
let hydration: Promise<PostpartumNifasReminderState> | null = null;

const readString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

export const getPostpartumNifasReminderState =
  (): PostpartumNifasReminderState => ({ ...state });

export const hydratePostpartumNifasReminderState =
  (): Promise<PostpartumNifasReminderState> => {
    if (!hydration) {
      hydration = AsyncStorage.getItem(STORAGE_KEY)
        .then(raw => {
          if (raw) {
            const candidate = JSON.parse(
              raw,
            ) as Partial<PostpartumNifasReminderState>;
            state = {
              deliveryDate: readString(candidate.deliveryDate),
              configVersion:
                typeof candidate.configVersion === 'number'
                  ? candidate.configVersion
                  : 0,
              warningScheduled: candidate.warningScheduled === true,
              referenceScheduled: candidate.referenceScheduled === true,
              warningFireAt: readString(candidate.warningFireAt),
              referenceFireAt: readString(candidate.referenceFireAt),
              warningOccurrenceId: readString(candidate.warningOccurrenceId),
              referenceOccurrenceId: readString(
                candidate.referenceOccurrenceId,
              ),
            };
          }
          return getPostpartumNifasReminderState();
        })
        .catch(() => getPostpartumNifasReminderState());
    }
    return hydration;
  };

export const setPostpartumNifasReminderState = async (
  next: PostpartumNifasReminderState,
): Promise<void> => {
  state = { ...next };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
