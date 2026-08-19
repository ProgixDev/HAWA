export type SymptomSeverity = 'mild' | 'moderate' | 'severe';
export type MoodLevel = 'veryGood' | 'good' | 'neutral' | 'stressed' | 'irritable' | 'anxious' | 'sad' | 'tired' | 'motivated';
export type FlowIntensity = 'none' | 'light' | 'moderate' | 'heavy' | 'veryHeavy';
export type CervicalMucusType = 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggWhite';
export type LHTestResult = 'negative' | 'positive' | 'invalid';

export type DailyJournalEntry = {
  id: string;
  date: string;
  cycleDay?: number;
  symptoms?: {names: string[]; severity?: SymptomSeverity; painLocation?: string; note?: string};
  mood?: {level: MoodLevel; energy: number; stress: number; irritability: number; motivation: number; note?: string};
  flow?: {intensity: FlowIntensity; color?: string; clots?: string; protections?: string[]; periodStart?: boolean; periodEnd?: boolean; pain?: string; note?: string};
  temperature?: {value: number; unit: 'C' | 'F'; time?: string; method?: string; note?: string};
  sleep?: {bedtime?: string; wakeTime?: string; duration?: string; quality?: string; awakenings?: number; wakeFeeling?: string; note?: string};
  activity?: {type?: string; durationMinutes?: number; intensity?: string; feeling?: string; none?: boolean; note?: string};
  hydration?: {milliliters: number; dailyGoal?: number; glasses?: number; goalGlasses?: number};
  weight?: {value?: number; unit: 'kg' | 'lb'; moment?: string; note?: string};
  note?: {text: string; private: true; updatedAt: string};
  intimacy?: {answer: 'yes' | 'no' | 'preferNot'; protection?: string; libido?: string; discomfort?: string; note?: string};
  cervicalMucus?: {type: CervicalMucusType; note?: string};
  lhTest?: {result: LHTestResult; time?: string; note?: string};
};

export type JournalSection = Exclude<keyof DailyJournalEntry, 'id' | 'date' | 'cycleDay'>;
