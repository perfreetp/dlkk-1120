import { create } from 'zustand';
import type { BabyRecord, BabyInfo, Reminder, FamilyMember, RecordType } from '@/types';
import { mockRecords, mockBabyInfo, mockReminders, mockFamilyMembers } from '@/data/mockData';
import { generateId } from '@/utils';

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

export const useBabyStore = create<BabyState>((set, get) => ({
  babyInfo: mockBabyInfo,
  records: mockRecords,
  reminders: mockReminders,
  familyMembers: mockFamilyMembers,
  isNightMode: false,
  lastDeletedRecord: null,

  setBabyInfo: (info) => set((state) => ({
    babyInfo: { ...state.babyInfo, ...info }
  })),

  addRecord: (record) => {
    const now = Date.now();
    const newRecord = {
      ...record,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    } as BabyRecord;
    set((state) => ({
      records: [newRecord, ...state.records].sort((a, b) => b.timestamp - a.timestamp)
    }));
    console.log('[Store] addRecord:', newRecord.id, newRecord.type);
  },

  updateRecord: (id, updates) => set((state) => ({
    records: state.records.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } as BabyRecord : r
    )
  })),

  deleteRecord: (id) => set((state) => {
    const record = state.records.find((r) => r.id === id);
    return {
      records: state.records.filter((r) => r.id !== id),
      lastDeletedRecord: record || null
    };
  }),

  undoDelete: () => set((state) => {
    if (!state.lastDeletedRecord) return state;
    return {
      records: [state.lastDeletedRecord, ...state.records].sort((a, b) => b.timestamp - a.timestamp),
      lastDeletedRecord: null
    };
  }),

  addReminder: (reminder) => set((state) => ({
    reminders: [
      ...state.reminders,
      { ...reminder, id: generateId() }
    ].sort((a, b) => a.timestamp - b.timestamp)
  })),

  toggleReminder: (id) => set((state) => ({
    reminders: state.reminders.map((r) =>
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    )
  })),

  deleteReminder: (id) => set((state) => ({
    reminders: state.reminders.filter((r) => r.id !== id)
  })),

  toggleNightMode: () => set((state) => ({
    isNightMode: !state.isNightMode
  })),

  getRecordsByType: (type) => get().records.filter((r) => r.type === type),

  getRecordsByDate: (date) => {
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);
    return get().records.filter((r) => r.timestamp >= dayStart && r.timestamp <= dayEnd);
  }
}));
