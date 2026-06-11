export type RecordType = 'feeding' | 'solid' | 'diaper' | 'sleep' | 'growth';

export type FeedingSubType = 'breast_left' | 'breast_right' | 'bottle' | 'formula';

export type DiaperColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'other';
export type DiaperTexture = 'soft' | 'normal' | 'hard' | 'watery' | 'mucus' | 'bloody';

export type SleepQuality = 'good' | 'normal' | 'poor';

export type AllergyLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface BaseRecord {
  id: string;
  type: RecordType;
  timestamp: number;
  note?: string;
  photos?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface FeedingRecord extends BaseRecord {
  type: 'feeding';
  subType: FeedingSubType;
  duration?: number;
  amount?: number;
  formulaWaterTemp?: number;
  formulaAmount?: number;
}

export interface SolidRecord extends BaseRecord {
  type: 'solid';
  ingredients: string[];
  amount?: number;
  allergyLevel: AllergyLevel;
  allergySymptoms?: string[];
}

export interface DiaperRecord extends BaseRecord {
  type: 'diaper';
  color: DiaperColor;
  texture: DiaperTexture;
  hasPee: boolean;
  hasPoop: boolean;
  amount?: 'light' | 'medium' | 'heavy';
}

export interface SleepRecord extends BaseRecord {
  type: 'sleep';
  startTime: number;
  endTime: number;
  quality: SleepQuality;
  environment?: string;
}

export interface GrowthRecord extends BaseRecord {
  type: 'growth';
  height?: number;
  weight?: number;
  headCircumference?: number;
}

export type BabyRecord = FeedingRecord | SolidRecord | DiaperRecord | SleepRecord | GrowthRecord;

export interface Reminder {
  id: string;
  title: string;
  type: 'vaccine' | 'checkup' | 'custom';
  timestamp: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  note?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  permissions: string[];
  joinedAt: number;
}

export interface HandoverTodo {
  id: string;
  content: string;
  isDone: boolean;
}

export interface HandoverRecord {
  id: string;
  fromMember: string;
  toMember?: string;
  timestamp: number;
  keyPoints: string;
  exceptions: string;
  todos: HandoverTodo[];
  readBy: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type HealthEventType = 'fever' | 'rash' | 'vomit' | 'diarrhea' | 'cough' | 'cold' | 'medicine' | 'hospital' | 'other';
export type HealthSeverity = 'mild' | 'moderate' | 'severe';

export interface SymptomItem {
  id: string;
  name: string;
  value?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  time?: string;
}

export interface HealthEvent {
  id: string;
  type: HealthEventType;
  title: string;
  startAt: number;
  endAt?: number;
  severity: HealthSeverity;
  temperature?: number;
  symptoms: SymptomItem[];
  medicines: MedicineItem[];
  description: string;
  relatedRecordIds: string[];
  followUpIds: string[];
  photos: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type FollowUpStatus = 'pending' | 'done' | 'overdue';

export interface FollowUpObservation {
  id: string;
  content: string;
  isDone: boolean;
}

export interface FollowUpReviewRecord {
  id: string;
  reviewedAt: number;
  conclusion: string;
  newAdvice: string;
  nextStep: string;
  continueObserve: boolean;
  createdBy: string;
  createdAt: number;
}

export interface FollowUpRecord {
  id: string;
  title: string;
  reportStartDate?: string;
  reportEndDate?: string;
  doctorAdvice: string;
  nextReviewAt: number;
  observations: FollowUpObservation[];
  status: FollowUpStatus;
  result?: string;
  healthEventIds: string[];
  reviewRecords: FollowUpReviewRecord[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface BabyInfo {
  name: string;
  gender: 'boy' | 'girl';
  birthday: number;
  avatar?: string;
}

export interface DailyStats {
  date: string;
  feedingCount: number;
  feedingTotalAmount: number;
  breastLeftDuration: number;
  breastRightDuration: number;
  bottleAmount: number;
  formulaAmount: number;
  solidCount: number;
  diaperCount: number;
  sleepTotalDuration: number;
  sleepCount: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  x: number;
  y: number;
}
