import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Users, UserCheck, CreditCard, Wallet, TrendingUp, Edit2, X, Check } from 'lucide-react';
import { DailyRecord, AttendanceStatus } from '../types';

export default function Dashboard() {
  const { workers, records, updateRecord } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [formData, setFormData] = useState({
    attendance: 'full' as AttendanceStatus,
    allowance: '',
