import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { BabyRecord, BabyInfo, Reminder, FamilyMember, RecordType } from '@/types';
import { mockRecords, mockBabyInfo, mockReminders, mockFamilyMembers } from '@/data/mockData';
import { generateId } from '@/utils';

const STORAGE_KEYS = {
  RECORDS: 'baby_records',
  BABY_INFO: 'baby_info',
  REMINDERS: 'baby_reminders',
  FAMILY_MEMBERS: 'family_members',
  NIGHT_MODE: 'night_mode',
  IS_INITIALIZED: 'is_initialized'
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) return JSON.parse(data) as T;
  } catch (e) {
    console.warn('[Storage] 读取失败:', key, e);
  }
  return defaultValue;
};

const saveToStorage = (key: string, value: any) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] 保存失败:', key, e);
  }
};

interface BabyState {
  babyInfo: BabyInfo;
  records: BabyRecord[];
  reminders: Reminder[];
  familyMembers: FamilyMember[];
  isNightMode: boolean;
  lastDeletedRecord: BabyRecord | null;
  
  setBabyInfo: (info: Partial<BabyInfo>) => void;
  addRecord: (record: Omit<BabyRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, updates: Partial<BabyRecord>) => void;
  deleteRecord: (id: string) => void;
  undoDelete: () => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  toggleNightMode: () => void;
  getRecordsByType: (type: RecordType) => BabyRecord[];
  getRecordsByDate: (date: string) => BabyRecord[];
}

const initFromStorage = () => {
  const isInitialized = loadFromStorage(STORAGE_KEYS.IS_INITIALIZED, false);
  if (isInitialized) {
    return {
      babyInfo: loadFromStorage(STORAGE_KEYS.BABY_INFO, mockBabyInfo),
      records: loadFromStorage(STORAGE_KEYS.RECORDS, mockRecords),
      reminders: loadFromStorage(STORAGE_KEYS.REMINDERS, mockReminders),
      familyMembers: loadFromStorage(STORAGE_KEYS.FAMILY_MEMBERS, mockFamilyMembers),
      isNightMode: loadFromStorage(STORAGE_KEYS.NIGHT_MODE, false)
    };
  }
  saveToStorage(STORAGE_KEYS.RECORDS, mockRecords);
  saveToStorage(STORAGE_KEYS.BABY_INFO, mockBabyInfo);
  saveToStorage(STORAGE_KEYS.REMINDERS, mockReminders);
  saveToStorage(STORAGE_KEYS.FAMILY_MEMBERS, mockFamilyMembers);
  saveToStorage(STORAGE_KEYS.IS_INITIALIZED, true);
  return {
    babyInfo: mockBabyInfo,
    records: mockRecords,
    reminders: mockReminders,
    familyMembers: mockFamilyMembers,
    isNightMode: false
  };
};

const initialData = initFromStorage();

export const useBabyStore = create<BabyState>((set, get) => ({
  babyInfo: initialData.babyInfo,
  records: initialData.records,
  reminders: initialData.reminders,
  familyMembers: initialData.familyMembers,
  isNightMode: initialData.isNightMode,
  lastDeletedRecord: null,

  setBabyInfo: (info) => set((state) => {
    const newInfo = { ...state.babyInfo, ...info };
    saveToStorage(STORAGE_KEYS.BABY_INFO, newInfo);
    return { babyInfo: newInfo };
  }),

  addRecord: (record) => {
    const now = Date.now();
    const newRecord = {
      ...record,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    } as BabyRecord;
    set((state) => {
      const newRecords = [newRecord, ...state.records].sort((a, b) => b.timestamp - a.timestamp);
      saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
      return { records: newRecords };
    });
    console.log('[Store] addRecord:', newRecord.id, newRecord.type);
  },

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } as BabyRecord : r
    );
    saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
    return { records: newRecords };
  }),

  deleteRecord: (id) => set((state) => {
    const record = state.records.find((r) => r.id === id);
    const newRecords = state.records.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
    return {
      records: newRecords,
      lastDeletedRecord: record || null
    };
  }),

  undoDelete: () => set((state) => {
    if (!state.lastDeletedRecord) return state;
    const newRecords = [state.lastDeletedRecord, ...state.records].sort((a, b) => b.timestamp - a.timestamp);
    saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
    return {
      records: newRecords,
      lastDeletedRecord: null
    };
  }),

  addReminder: (reminder) => set((state) => {
    const newReminders = [
      ...state.reminders,
      { ...reminder, id: generateId() }
    ].sort((a, b) => a.timestamp - b.timestamp);
    saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
    return { reminders: newReminders };
  }),

  toggleReminder: (id) => set((state) => {
    const newReminders = state.reminders.map((r) =>
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    );
    saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
    return { reminders: newReminders };
  }),

  deleteReminder: (id) => set((state) => {
    const newReminders = state.reminders.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
    return { reminders: newReminders };
  }),

  toggleNightMode: () => set((state) => {
    const newMode = !state.isNightMode;
    saveToStorage(STORAGE_KEYS.NIGHT_MODE, newMode);
    return { isNightMode: newMode };
  }),

  getRecordsByType: (type) => get().records.filter((r) => r.type === type),

  getRecordsByDate: (date) => {
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);
    return get().records.filter((r) => r.timestamp >= dayStart && r.timestamp <= dayEnd);
  }
}));
