'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  Clock,
  Plus,
  Users,
  Download,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  Printer,
  Sparkles,
  Info,
  GripVertical,
  ArrowRightLeft,
  FileText,
  Mail,
  X,
  ArrowRight,
  History,
  PartyPopper,
  Flame,
  Trash2,
  Pencil,
  UserPlus,
  CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { confirmDelete, confirmAction, showWarningAlert, showErrorAlert, showSuccessAlert } from '@/lib/sweetalert';

// Festival Shift Types
const FESTIVAL_SHIFT_TYPES = {
  MORNING: {
    id: 'MORNING',
    label: 'Morning Shift',
    time: '07am-05pm',
    description: '7:00 AM – 5:00 PM (10 hrs)',
    bg: 'bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] border-[#95b3d7]',
    dot: 'bg-sky-500',
    icon: Sun,
  },
  EVENING: {
    id: 'EVENING',
    label: 'Evening Shift',
    time: '11am-09pm',
    description: '11:00 AM – 9:00 PM (10 hrs)',
    bg: 'bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] border-[#ffe599]',
    dot: 'bg-amber-400',
    icon: Sunset,
  },
  NIGHT: {
    id: 'NIGHT',
    label: 'Night Shift',
    time: '09pm-07am',
    description: '9:00 PM – 7:00 AM (10 hrs)',
    bg: 'bg-[#00b050] dark:bg-[#15803d] text-white border-[#009040]',
    dot: 'bg-emerald-400',
    icon: Moon,
  },
  OFF: {
    id: 'OFF',
    label: 'Festival Holiday Off',
    time: 'Off',
    description: 'Official Festival Rest & Holiday',
    bg: 'bg-[#c00000] dark:bg-[#b91c1c] text-white border-[#990000]',
    dot: 'bg-rose-500',
    icon: Flame,
  },
};

const FESTIVAL_PRESETS = [
  {
    id: 'RAMADAN',
    name: '🌙 Ramadan 2026',
    title: 'IT Duty Roster - Holy Ramadan 2026',
    days: [
      'Day 1 (1st Ramadan)',
      'Day 2 (10th Ramadan)',
      'Day 3 (15th Ramadan)',
      'Day 4 (20th Ramadan)',
      'Day 5 (21st Ramadan - Najaat)',
      'Day 6 (27th Ramadan - Qadr)',
      'Day 7 (Chaand Raat Standby)',
    ],
  },
  {
    id: 'EID_FITR',
    name: '🌙 Eid-ul-Fitr 2026',
    title: 'IT Duty Roster - Eid-ul-Fitr 2026',
    days: [
      'Day 1 (Chaand Raat)',
      'Day 2 (Eid Day 1)',
      'Day 3 (Eid Day 2)',
      'Day 4 (Eid Day 3)',
      'Day 5 (Post-Eid Standby)',
    ],
  },
  {
    id: 'EID_ADHA',
    name: '🕋 Eid-ul-Adha 2026',
    title: 'IT Duty Roster - Eid-ul-Adha 2026',
    days: [
      'Day 1 (Arafah Day)',
      'Day 2 (Qurbani Day 1)',
      'Day 3 (Qurbani Day 2)',
      'Day 4 (Qurbani Day 3)',
      'Day 5 (Extended Standby)',
    ],
  },
  {
    id: 'DURGA_PUJA',
    name: '🪔 Durga Puja 2026',
    title: 'IT Duty Roster - Durga Puja 2026',
    days: [
      'Day 1 (Maha Saptami)',
      'Day 2 (Maha Ashtami)',
      'Day 3 (Maha Nabami)',
      'Day 4 (Bijoya Dashami)',
      'Day 5 (Immersion Day)',
    ],
  },
  {
    id: 'NATIONAL_HOLIDAY',
    name: '🇧🇩 National Holiday Coverage',
    title: 'IT Duty Roster - National Holiday Special',
    days: [
      'Day 1 (Eve)',
      'Day 2 (Holiday Day 1)',
      'Day 3 (Holiday Day 2)',
      'Day 4 (Standby Day)',
    ],
  },
];

const DEFAULT_STAFF = [
  'Shishir',
  'Zaman',
  'Apu',
  'Jit',
  'Shofiqul',
  'Ashraful',
  'Omith',
  'Pranjol',
  'Sakib',
  'Rony',
];

const INITIAL_RAMADAN_SCHEDULE: Record<string, Record<string, string>> = {
  'Day 1 (1st Ramadan)': {
    Shishir: '07am-03pm',
    Zaman: '01pm-09pm',
    Apu: '07am-03pm',
    Jit: '01pm-09pm',
    Shofiqul: '07am-03pm',
    Ashraful: 'Off',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '07am-03pm',
    Rony: '09pm-07am',
  },
  'Day 2 (10th Ramadan)': {
    Shishir: 'Off',
    Zaman: '07am-03pm',
    Apu: '01pm-09pm',
    Jit: '01pm-09pm',
    Shofiqul: 'Off',
    Ashraful: '07am-03pm',
    Omith: '01pm-09pm',
    Pranjol: '09pm-07am',
    Sakib: 'Off',
    Rony: '09pm-07am',
  },
  'Day 3 (15th Ramadan)': {
    Shishir: '07am-03pm',
    Zaman: 'Off',
    Apu: '09pm-07am',
    Jit: 'Off',
    Shofiqul: '07am-03pm',
    Ashraful: '01pm-09pm',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '01pm-09pm',
    Rony: 'Off',
  },
  'Day 4 (20th Ramadan)': {
    Shishir: '01pm-09pm',
    Zaman: '07am-03pm',
    Apu: '07am-03pm',
    Jit: '07am-03pm',
    Shofiqul: 'Off',
    Ashraful: 'Off',
    Omith: '01pm-09pm',
    Pranjol: '09pm-07am',
    Sakib: '07am-03pm',
    Rony: '09pm-07am',
  },
  'Day 5 (21st Ramadan - Najaat)': {
    Shishir: '07am-03pm',
    Zaman: '01pm-09pm',
    Apu: 'Off',
    Jit: '01pm-09pm',
    Shofiqul: '07am-03pm',
    Ashraful: '09pm-07am',
    Omith: 'Off',
    Pranjol: '07am-03pm',
    Sakib: '01pm-09pm',
    Rony: 'Off',
  },
  'Day 6 (27th Ramadan - Qadr)': {
    Shishir: '09pm-07am',
    Zaman: '09pm-07am',
    Apu: '01pm-09pm',
    Jit: '07am-03pm',
    Shofiqul: '07am-03pm',
    Ashraful: '01pm-09pm',
    Omith: '09pm-07am',
    Pranjol: '09pm-07am',
    Sakib: 'Off',
    Rony: 'Off',
  },
  'Day 7 (Chaand Raat Standby)': {
    Shishir: '07am-03pm',
    Zaman: '01pm-09pm',
    Apu: '09pm-07am',
    Jit: '01pm-09pm',
    Shofiqul: '07am-03pm',
    Ashraful: 'Off',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '07am-03pm',
    Rony: '09pm-07am',
  },
};

const INITIAL_FESTIVAL_SCHEDULE: Record<string, Record<string, string>> = {
  ...INITIAL_RAMADAN_SCHEDULE,
  'Day 1 (Chaand Raat)': {
    Shishir: '07am-05pm',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: 'Off',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '07am-05pm',
    Rony: '09pm-07am',
  },
  'Day 2 (Eid Day 1)': {
    Shishir: 'Off',
    Zaman: '07am-05pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: 'Off',
    Ashraful: '07am-05pm',
    Omith: '11am-09pm',
    Pranjol: '09pm-07am',
    Sakib: 'Off',
    Rony: '09pm-07am',
  },
  'Day 3 (Eid Day 2)': {
    Shishir: '07am-05pm',
    Zaman: 'Off',
    Apu: '',
    Jit: 'Off',
    Shofiqul: '07am-05pm',
    Ashraful: '11am-09pm',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '11am-09pm',
    Rony: 'Off',
  },
  'Day 4 (Eid Day 3)': {
    Shishir: '11am-09pm',
    Zaman: '07am-05pm',
    Apu: '',
    Jit: '07am-05pm',
    Shofiqul: 'Off',
    Ashraful: 'Off',
    Omith: '11am-09pm',
    Pranjol: '09pm-07am',
    Sakib: '07am-05pm',
    Rony: '09pm-07am',
  },
  'Day 5 (Post-Eid Standby)': {
    Shishir: '07am-05pm',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: '09pm-07am',
    Omith: 'Off',
    Pranjol: '07am-05pm',
    Sakib: '11am-09pm',
    Rony: 'Off',
  },
};

interface FestivalSwapItem {
  id: string;
  day: string;
  staffA: string;
  shiftAOriginal: string;
  shiftANew: string;
  staffB: string;
  shiftBOriginal: string;
  shiftBNew: string;
  reason: string;
  timestamp: string;
  status: 'ACTIVE' | 'REVERTED';
}

const INITIAL_FESTIVAL_SWAPS: FestivalSwapItem[] = [];

export default function FestivalRosterPage() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [title, setTitle] = useState(FESTIVAL_PRESETS[0].title);
  const [festivalDays, setFestivalDays] = useState<string[]>(FESTIVAL_PRESETS[0].days);
  const [staffList, setStaffList] = useState<string[]>(DEFAULT_STAFF);
  const [schedule, setSchedule] = useState<Record<string, Record<string, string>>>(INITIAL_FESTIVAL_SCHEDULE);
  const [swapLogs, setSwapLogs] = useState<FestivalSwapItem[]>(INITIAL_FESTIVAL_SWAPS);

  // Day focus for history
  const [selectedHistoryDay, setSelectedHistoryDay] = useState<string>(FESTIVAL_PRESETS[0].days[0]);

  // Modals & form state
  const [selectedCell, setSelectedCell] = useState<{ day: string; staff: string } | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Dynamic Days (Rows) State
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  const [editingDay, setEditingDay] = useState<{ oldName: string; newName: string } | null>(null);

  // Dynamic Staff (Columns) State
  const [editingStaff, setEditingStaff] = useState<{ oldName: string; newName: string } | null>(null);
  const [dbStaffMembers, setDbStaffMembers] = useState<{ id: string; name: string; department?: string; email?: string }[]>([]);
  const [isLoadingDbStaff, setIsLoadingDbStaff] = useState(false);

  // Drag and drop column reordering
  const [draggedStaffIndex, setDraggedStaffIndex] = useState<number | null>(null);
  const [dragOverStaffIndex, setDragOverStaffIndex] = useState<number | null>(null);

  // Swap form
  const [swapForm, setSwapForm] = useState({
    day: FESTIVAL_PRESETS[0].days[0],
    staffA: DEFAULT_STAFF[0] || 'Shishir',
    staffB: DEFAULT_STAFF[1] || 'Zaman',
    reason: 'Festival holiday duty exchange',
    notifyEmail: true,
  });

  const isRamadanMode =
    (FESTIVAL_PRESETS[selectedPresetIndex]?.id === 'RAMADAN') ||
    title.toLowerCase().includes('ramadan');

  const shiftInfo = {
    morning: {
      time: isRamadanMode ? '07am-03pm' : '07am-05pm',
      label: 'Morning Shift',
      hours: isRamadanMode ? '07:00 AM – 03:00 PM' : '07:00 AM – 05:00 PM',
      desc: isRamadanMode ? '7:00 AM – 3:00 PM (8 hrs)' : '7:00 AM – 5:00 PM (10 hrs)',
    },
    evening: {
      time: isRamadanMode ? '01pm-09pm' : '11am-09pm',
      label: 'Evening Shift',
      hours: isRamadanMode ? '01:00 PM – 09:00 PM' : '11:00 AM – 09:00 PM',
      desc: isRamadanMode ? '1:00 PM – 9:00 PM (8 hrs)' : '11:00 AM – 9:00 PM (10 hrs)',
    },
    night: {
      time: '09pm-07am',
      label: 'Night Shift',
      hours: '09:00 PM – 07:00 AM',
      desc: '9:00 PM – 7:00 AM (10 hrs)',
    },
    off: {
      time: 'Off',
      label: isRamadanMode ? 'Ramadan Holiday Off' : 'Festival Holiday Off',
      hours: 'Off / Leave',
      desc: isRamadanMode ? 'Official Ramadan Rest & Off' : 'Official Festival Rest & Holiday',
    },
  };

  // Fetch registered IT staff / users from backend for quick-add column chips
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingDbStaff(true);
        const res = await api.get('/api/users');
        const list = res.data?.data || [];
        setDbStaffMembers(list);
      } catch (e) {
        console.warn('Could not fetch DB users for festival roster:', e);
      } finally {
        setIsLoadingDbStaff(false);
      }
    };
    fetchUsers();
  }, []);

  // Local storage load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('it_festival_roster_running');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schedule) setSchedule(parsed.schedule);
        if (parsed.staffList && parsed.staffList.length > 0) setStaffList(parsed.staffList);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.swapLogs) {
          const cleaned = parsed.swapLogs.filter((s: FestivalSwapItem) => s.id !== 'f-swap-1');
          setSwapLogs(cleaned);
        }
        if (parsed.festivalDays && parsed.festivalDays.length > 0) {
          setFestivalDays(parsed.festivalDays);
          setSelectedHistoryDay(parsed.festivalDays[0]);
          setSwapForm((prev) => ({ ...prev, day: parsed.festivalDays[0] }));
        }
      }
    } catch (e) {}
  }, []);

  const saveFestivalSchedule = (
    newSched: Record<string, Record<string, string>>,
    newStaff?: string[],
    newSwaps?: FestivalSwapItem[],
    newDays?: string[],
    newTitle?: string
  ) => {
    setSchedule(newSched);
    const staffToSave = newStaff || staffList;
    const swapsToSave = newSwaps || swapLogs;
    const daysToSave = newDays || festivalDays;
    const titleToSave = newTitle || title;
    try {
      localStorage.setItem(
        'it_festival_roster_running',
        JSON.stringify({
          schedule: newSched,
          staffList: staffToSave,
          title: titleToSave,
          swapLogs: swapsToSave,
          festivalDays: daysToSave,
        })
      );
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPreset = (idx: number) => {
    const preset = FESTIVAL_PRESETS[idx];
    setSelectedPresetIndex(idx);
    setTitle(preset.title);
    setFestivalDays(preset.days);
    setSelectedHistoryDay(preset.days[0]);
    setSwapForm((prev) => ({ ...prev, day: preset.days[0] }));

    let newSched = { ...schedule };
    if (preset.id === 'RAMADAN' && !newSched[preset.days[0]]) {
      newSched = { ...newSched, ...INITIAL_RAMADAN_SCHEDULE };
    }

    saveFestivalSchedule(newSched, staffList, swapLogs, preset.days, preset.title);
    showToast(`Switched festival preset: ${preset.name}`);
  };

  // --- DYNAMIC ROWS (FESTIVAL DAYS) HANDLERS ---
  const handleAddDay = (dayNameToAdd?: string) => {
    const trimmed = (dayNameToAdd !== undefined ? dayNameToAdd : newDayName).trim();
    if (!trimmed) {
      alert('Please enter a festival day name.');
      return;
    }
    if (festivalDays.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Festival day "${trimmed}" already exists.`);
      return;
    }

    const updatedDays = [...festivalDays, trimmed];
    const updatedSchedule = { ...schedule };
    if (!updatedSchedule[trimmed]) {
      updatedSchedule[trimmed] = {};
    }
    staffList.forEach((s) => {
      if (updatedSchedule[trimmed][s] === undefined) {
        updatedSchedule[trimmed][s] = '';
      }
    });

    setFestivalDays(updatedDays);
    saveFestivalSchedule(updatedSchedule, staffList, swapLogs, updatedDays);
    setNewDayName('');
    setShowAddDayModal(false);
    showToast(`Added "${trimmed}" to festival roster!`);
  };

  const handleRemoveDay = async (dayToRemove: string) => {
    if (festivalDays.length <= 1) {
      showWarningAlert(
        'Cannot Delete Day',
        'Cannot delete the only remaining day. A minimum of 1 day is required in the festival roster.'
      );
      return;
    }
    const confirmed = await confirmDelete({
      title: `Remove "${dayToRemove}" Row?`,
      text: `Are you sure you want to remove "${dayToRemove}" and its shift assignments from the festival roster?`,
      confirmButtonText: 'Yes, Remove Day',
    });
    if (!confirmed) return;

    const updatedDays = festivalDays.filter((d) => d !== dayToRemove);
    const updatedSchedule = { ...schedule };
    delete updatedSchedule[dayToRemove];

    if (selectedHistoryDay.toLowerCase() === dayToRemove.toLowerCase()) {
      setSelectedHistoryDay(updatedDays[0]);
    }
    if (swapForm.day.toLowerCase() === dayToRemove.toLowerCase()) {
      setSwapForm((prev) => ({ ...prev, day: updatedDays[0] }));
    }

    setFestivalDays(updatedDays);
    saveFestivalSchedule(updatedSchedule, staffList, swapLogs, updatedDays);
    showToast(`Removed "${dayToRemove}" from festival roster.`);
  };

  const handleSaveEditDay = () => {
    if (!editingDay) return;
    const trimmed = editingDay.newName.trim();
    if (!trimmed) {
      alert('Festival day name cannot be empty.');
      return;
    }
    if (
      trimmed.toLowerCase() !== editingDay.oldName.toLowerCase() &&
      festivalDays.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    ) {
      alert(`A festival day with name "${trimmed}" already exists.`);
      return;
    }

    const oldName = editingDay.oldName;
    const updatedDays = festivalDays.map((d) => (d === oldName ? trimmed : d));

    const updatedSchedule = { ...schedule };
    if (updatedSchedule[oldName]) {
      updatedSchedule[trimmed] = updatedSchedule[oldName];
      delete updatedSchedule[oldName];
    } else {
      updatedSchedule[trimmed] = updatedSchedule[trimmed] || {};
    }

    const updatedSwaps = swapLogs.map((log) =>
      log.day.toLowerCase() === oldName.toLowerCase() ? { ...log, day: trimmed } : log
    );

    if (selectedHistoryDay.toLowerCase() === oldName.toLowerCase()) {
      setSelectedHistoryDay(trimmed);
    }
    if (swapForm.day.toLowerCase() === oldName.toLowerCase()) {
      setSwapForm((prev) => ({ ...prev, day: trimmed }));
    }

    setFestivalDays(updatedDays);
    setSwapLogs(updatedSwaps);
    saveFestivalSchedule(updatedSchedule, staffList, updatedSwaps, updatedDays);
    setEditingDay(null);
    showToast(`Renamed festival day to "${trimmed}".`);
  };

  // --- DYNAMIC COLUMNS (STAFF MEMBERS) HANDLERS ---
  const handleAddStaffMember = (nameToAdd?: string) => {
    const trimmed = (nameToAdd !== undefined ? nameToAdd : newStaffName).trim();
    if (!trimmed) {
      alert('Please enter a staff member name.');
      return;
    }
    if (staffList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Staff member "${trimmed}" is already added as a column.`);
      return;
    }

    const updated = [...staffList, trimmed];
    const updatedSchedule = { ...schedule };
    festivalDays.forEach((day) => {
      if (!updatedSchedule[day]) updatedSchedule[day] = {};
      if (updatedSchedule[day][trimmed] === undefined) {
        updatedSchedule[day][trimmed] = '';
      }
    });

    setStaffList(updated);
    saveFestivalSchedule(updatedSchedule, updated);
    setNewStaffName('');
    setShowAddStaffModal(false);
    showToast(`Added "${trimmed}" column to festival roster.`);
  };

  const handleRemoveStaff = async (staffToRemove: string) => {
    if (staffList.length <= 1) {
      showWarningAlert(
        'Cannot Delete Column',
        'Cannot delete the only remaining staff column. A minimum of 1 engineer is required in the festival roster.'
      );
      return;
    }
    const confirmed = await confirmDelete({
      title: `Remove "${staffToRemove}" Column?`,
      text: `Are you sure you want to remove "${staffToRemove}" column and their assigned duties from this festival roster?`,
      confirmButtonText: 'Yes, Remove Column',
    });
    if (!confirmed) return;

    const updatedStaff = staffList.filter((s) => s !== staffToRemove);
    const updatedSchedule = { ...schedule };
    festivalDays.forEach((day) => {
      if (updatedSchedule[day]) {
        delete updatedSchedule[day][staffToRemove];
      }
    });

    if (swapForm.staffA === staffToRemove) {
      setSwapForm((prev) => ({ ...prev, staffA: updatedStaff[0] || '' }));
    }
    if (swapForm.staffB === staffToRemove) {
      setSwapForm((prev) => ({ ...prev, staffB: updatedStaff[1] || updatedStaff[0] || '' }));
    }

    setStaffList(updatedStaff);
    saveFestivalSchedule(updatedSchedule, updatedStaff);
    showToast(`Removed "${staffToRemove}" column from festival roster.`);
  };

  const handleSaveEditStaff = () => {
    if (!editingStaff) return;
    const trimmed = editingStaff.newName.trim();
    if (!trimmed) {
      alert('Staff name cannot be empty.');
      return;
    }
    if (
      trimmed.toLowerCase() !== editingStaff.oldName.toLowerCase() &&
      staffList.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      alert(`Staff member "${trimmed}" already exists.`);
      return;
    }

    const oldName = editingStaff.oldName;
    const updatedStaff = staffList.map((s) => (s === oldName ? trimmed : s));

    const updatedSchedule = { ...schedule };
    festivalDays.forEach((day) => {
      if (updatedSchedule[day] && updatedSchedule[day][oldName] !== undefined) {
        updatedSchedule[day][trimmed] = updatedSchedule[day][oldName];
        delete updatedSchedule[day][oldName];
      }
    });

    const updatedSwaps = swapLogs.map((log) => {
      let changed = false;
      const newLog = { ...log };
      if (log.staffA === oldName) {
        newLog.staffA = trimmed;
        changed = true;
      }
      if (log.staffB === oldName) {
        newLog.staffB = trimmed;
        changed = true;
      }
      return changed ? newLog : log;
    });

    if (swapForm.staffA === oldName) {
      setSwapForm((prev) => ({ ...prev, staffA: trimmed }));
    }
    if (swapForm.staffB === oldName) {
      setSwapForm((prev) => ({ ...prev, staffB: trimmed }));
    }

    setStaffList(updatedStaff);
    setSwapLogs(updatedSwaps);
    saveFestivalSchedule(updatedSchedule, updatedStaff, updatedSwaps);
    setEditingStaff(null);
    showToast(`Renamed engineer to "${trimmed}".`);
  };

  // Set cell shift
  const setCellShift = async (day: string, staff: string, value: string, sendMail = false) => {
    const updated = {
      ...schedule,
      [day]: {
        ...(schedule[day] || {}),
        [staff]: value,
      },
    };
    saveFestivalSchedule(updated);
    setSelectedCell(null);
    showToast(`Assigned ${staff}'s festival duty on ${day} to "${value || 'Empty'}"`);

    if (sendMail && value) {
      try {
        await api.post('/api/roster/notify-email', {
          staffName: staff,
          day,
          shift: value === 'Off' ? 'Festival Holiday Off' : 'Festival Duty',
          timeRange: value,
        });
        showToast(`📧 Nodemailer email sent to ${staff}!`);
      } catch (err) {
        console.warn('Mail dispatch warning:', err);
      }
    }
  };

  // Column Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStaffIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStaffIndex !== index) {
      setDragOverStaffIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedStaffIndex === null || draggedStaffIndex === dropIndex) {
      setDraggedStaffIndex(null);
      setDragOverStaffIndex(null);
      return;
    }

    const updated = [...staffList];
    const [moved] = updated.splice(draggedStaffIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setStaffList(updated);
    saveFestivalSchedule(schedule, updated);
    showToast(`Reordered column: "${moved}" to position ${dropIndex + 1}`);
    setDraggedStaffIndex(null);
    setDragOverStaffIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStaffIndex(null);
    setDragOverStaffIndex(null);
  };

  // Execute swap
  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    const { day, staffA, staffB, reason, notifyEmail } = swapForm;

    if (staffA === staffB) {
      alert('Please select two different staff members to swap festival duties.');
      return;
    }

    const currentShiftA = schedule[day]?.[staffA] || '';
    const currentShiftB = schedule[day]?.[staffB] || '';

    const updatedSchedule = {
      ...schedule,
      [day]: {
        ...(schedule[day] || {}),
        [staffA]: currentShiftB,
        [staffB]: currentShiftA,
      },
    };

    const newSwapItem: FestivalSwapItem = {
      id: `f-swap-${Date.now()}`,
      day,
      staffA,
      shiftAOriginal: currentShiftA || 'Unassigned',
      shiftANew: currentShiftB || 'Unassigned',
      staffB,
      shiftBOriginal: currentShiftB || 'Unassigned',
      shiftBNew: currentShiftA || 'Unassigned',
      reason,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'ACTIVE',
    };

    const updatedSwaps = [newSwapItem, ...swapLogs];
    setSwapLogs(updatedSwaps);
    setSelectedHistoryDay(day);
    saveFestivalSchedule(updatedSchedule, staffList, updatedSwaps);
    setShowSwapModal(false);
    showToast(`🔄 Festival duty swapped between ${staffA} and ${staffB} on ${day}!`);

    if (notifyEmail) {
      try {
        await api.post('/api/roster/swap', {
          day,
          staffA,
          shiftAOriginal: currentShiftA,
          staffB,
          shiftBOriginal: currentShiftB,
          reason,
        });
        showToast(`📧 Nodemailer festival duty swap emails dispatched to ${staffA} & ${staffB}!`);
      } catch (err) {
        console.warn('Swap notification warning:', err);
      }
    }
  };

  // Revert swap
  const handleRevertSwap = async (item: FestivalSwapItem) => {
    const confirmed = await confirmAction({
      title: 'Revert Festival Duty Swap?',
      text: `Revert festival shift exchange between ${item.staffA} and ${item.staffB} on ${item.day}?`,
      icon: 'question',
      confirmButtonText: 'Yes, Revert Swap',
    });
    if (!confirmed) return;

    const updatedSchedule = {
      ...schedule,
      [item.day]: {
        ...(schedule[item.day] || {}),
        [item.staffA]: item.shiftAOriginal === 'Unassigned' ? '' : item.shiftAOriginal,
        [item.staffB]: item.shiftBOriginal === 'Unassigned' ? '' : item.shiftBOriginal,
      },
    };

    const updatedSwaps = swapLogs.map((l) =>
      l.id === item.id ? { ...l, status: 'REVERTED' as const } : l
    );
    setSwapLogs(updatedSwaps);
    saveFestivalSchedule(updatedSchedule, staffList, updatedSwaps);
    showToast(`Reverted festival swap on ${item.day}.`);
  };

  // Delete festival swap log permanently
  const handleDeleteSwap = async (id: string) => {
    const confirmed = await confirmDelete({
      title: 'Delete Festival Swap Log?',
      text: 'Are you sure you want to permanently delete this festival swap log record?',
      confirmButtonText: 'Yes, Delete Log',
    });
    if (!confirmed) return;

    const updatedSwaps = swapLogs.filter((s) => s.id !== id);
    setSwapLogs(updatedSwaps);
    saveFestivalSchedule(schedule, staffList, updatedSwaps);
    showToast('Festival swap log removed.');
  };

  // Download B&W Vector Table PDF
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Generating official B&W Festival Roster PDF...');

      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = (autoTableModule.default || autoTableModule) as any;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Header (Black & White)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text(title.toUpperCase(), 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(
        `${isRamadanMode ? 'Holy Ramadan IT Broadcast Operations' : 'Festival IT Broadcast Operations'} | Generated: ${todayFormatted} | Focus Day: ${selectedHistoryDay}`,
        14,
        21
      );

      // Clean divider line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(14, 23.5, 283, 23.5);

      // 2. Table 1: Festival Roster Matrix (Black & White Table)
      const tableHead = [['FESTIVAL DAY', ...staffList]];
      const tableBody = festivalDays.map((day) => {
        const row = [day];
        staffList.forEach((staff) => {
          const shiftVal = schedule[day]?.[staff] || '-';
          row.push(shiftVal);
        });
        return row;
      });

      const dynamicFontSize = staffList.length > 14 ? 6 : staffList.length > 10 ? 7 : 7.5;
      const dayCellWidth = staffList.length > 14 ? 26 : staffList.length > 10 ? 30 : 34;

      autoTable(doc, {
        startY: 26,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: dynamicFontSize,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
          cellPadding: staffList.length > 12 ? 1.5 : 2,
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.35,
          fontSize: dynamicFontSize + 0.5,
        },
        columnStyles: {
          0: {
            halign: 'left',
            fontStyle: 'bold',
            cellWidth: dayCellWidth,
            fillColor: [242, 242, 242],
          },
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index > 0) {
            const text = String(data.cell.raw || '');
            if (text.toLowerCase() === 'off') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [238, 238, 238];
            }
          }
        },
      });

      // 3. Table 2: Duty Swap History for THAT DAY ONLY
      const lastTable = (doc as any).lastAutoTable;
      const finalY = lastTable ? lastTable.finalY : 120;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `FESTIVAL DUTY SWAP LOGS (${selectedHistoryDay.toUpperCase()} ONLY)`,
        14,
        finalY + 9
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Recorded shift exchanges and handovers for ${selectedHistoryDay}`,
        14,
        finalY + 13.5
      );

      const daySwaps = swapLogs.filter(
        (log) => log.day.toLowerCase() === selectedHistoryDay.toLowerCase()
      );

      const swapTableHead = [
        ['Timestamp', 'Staff 1', 'Staff 2', 'Shift Exchange Details', 'Reason / Remarks', 'Status'],
      ];

      const swapTableBody =
        daySwaps.length > 0
          ? daySwaps.map((log) => [
              log.timestamp || selectedHistoryDay,
              log.staffA,
              log.staffB,
              `${log.staffA}: ${log.shiftAOriginal} -> ${log.shiftANew}\n${log.staffB}: ${log.shiftBOriginal} -> ${log.shiftBNew}`,
              log.reason || 'Festival coverage handover',
              log.status,
            ])
          : [
              [
                '-',
                '-',
                '-',
                `No festival duty swaps recorded for ${selectedHistoryDay}.`,
                '-',
                'N/A',
              ],
            ];

      autoTable(doc, {
        startY: finalY + 16,
        head: swapTableHead,
        body: swapTableBody,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          cellPadding: 2,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 28, fontStyle: 'bold' },
          2: { cellWidth: 28, fontStyle: 'bold' },
          3: { cellWidth: 70 },
          4: { cellWidth: 85 },
          5: { cellWidth: 24, halign: 'center' },
        },
      });

      // 4. Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 110);
        doc.text(
          `Page ${i} of ${pageCount} | ITV Broadcast IT Operations - ${isRamadanMode ? 'Holy Ramadan Duty Roster' : 'Festival Duty Roster'} (Official B&W Record)`,
          14,
          203
        );
      }

      doc.save(`IT_${isRamadanMode ? 'Ramadan' : 'Festival'}_Duty_Roster_BW_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      showToast(`✅ Downloaded crisp B&W ${isRamadanMode ? 'Ramadan' : 'Festival'} Roster PDF!`);
    } catch (err: any) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Helper for cell styling
  const getCellClass = (val: string) => {
    if (!val || val.trim() === '') {
      return 'bg-card/50 text-muted-foreground/30 hover:bg-muted/50';
    }
    const clean = val.trim().toLowerCase().replace(/\s+/g, '');

    // 1. Off Day (Red)
    if (clean === 'off') {
      return 'bg-[#c00000] dark:bg-[#b91c1c] text-white font-black shadow-sm hover:brightness-110';
    }

    // 2. Evening Shift (Light Yellow) - 01pm-09pm (Ramadan: 1pm - 9pm) or 11am-09pm (Standard)
    if (
      clean.startsWith('01pm') ||
      clean.startsWith('1pm') ||
      clean.startsWith('11') ||
      clean.includes('evening') ||
      clean === '01pm-09pm' ||
      clean === '1pm-9pm' ||
      clean === '11am-09pm'
    ) {
      return 'bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] font-black shadow-sm hover:brightness-95';
    }

    // 3. Night Shift (Vibrant Green) - 09pm-07am (9pm - 7am)
    if (
      clean.startsWith('09pm') ||
      clean.startsWith('9pm') ||
      clean.includes('night') ||
      clean === '09pm-07am' ||
      clean === '9pm-7am'
    ) {
      return 'bg-[#00b050] dark:bg-[#15803d] text-white font-black shadow-sm hover:brightness-110';
    }

    // 4. Morning Shift (Steel Blue) - 07am-03pm (Ramadan: 7am - 3pm) or 07am-05pm (Standard)
    if (
      clean.startsWith('07') ||
      clean.startsWith('7am') ||
      clean.includes('morning') ||
      clean === '07am-03pm' ||
      clean === '7am-3pm' ||
      clean === '07am-05pm'
    ) {
      return 'bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] font-black shadow-sm hover:brightness-105';
    }

    // Default
    return 'bg-primary/10 text-primary font-bold';
  };

  return (
    <AccessGuard module="roster">
      <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Roster Navigation Sub-Tabs (Overview section: Daily Roster & Festival Roster) */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Link
          href="/roster"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition shadow-sm"
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span>Daily Roster</span>
        </Link>

        <Link
          href="/roster/festival"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm bg-primary text-primary-foreground shadow-primary/20"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Festival Roster</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary-foreground/20 text-[10px] font-bold">Active</span>
        </Link>
      </div>

      {/* Festival Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5 px-2">
          <PartyPopper className="h-4 w-4 text-amber-500" />
          Festival Template:
        </span>
        {FESTIVAL_PRESETS.map((preset, idx) => (
          <button
            key={preset.name}
            onClick={() => handleSelectPreset(idx)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm',
              selectedPresetIndex === idx
                ? 'bg-amber-500 text-amber-950 font-black shadow-amber-500/25'
                : 'bg-card text-foreground hover:bg-muted border border-border/60'
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none font-black text-2xl text-foreground"
              />
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black shrink-0">
              {isRamadanMode ? '🌙 Ramadan Timing (7am-3pm, 1pm-9pm, 9pm-7am)' : 'Special Festival Mode'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isRamadanMode
              ? 'Official Holy Ramadan Duty Roster (Morning: 07am-03pm, Evening: 01pm-09pm, Night: 09pm-07am) with 24/7 broadcast coverage.'
              : 'Official Festival Duty Roster for 24/7 broadcast coverage during Eid, Puja and national holidays.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Duty Swap Button */}
          <button
            onClick={() => setShowSwapModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
            title="Swap festival duty shift between two engineers"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Duty Swap</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:bg-foreground/90 transition shadow-md active:scale-95 disabled:opacity-50"
            title={`Download printable table PDF (includes ${selectedHistoryDay} swap history)`}
          >
            {isExportingPDF ? (
              <div className="h-3.5 w-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span>{isExportingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Add Day (Row) Button */}
          <button
            onClick={() => setShowAddDayModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold transition shadow-sm active:scale-95"
            title="Add a new festival day (row) to the roster"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>+ Add Day</span>
          </button>

          {/* Add Member (Column) Button */}
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition shadow-sm active:scale-95"
            title="Add a new engineer (column) to the roster"
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>+ Add Member</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Festival Shift Timings Legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Morning */}
        <div className="p-3.5 rounded-2xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] flex items-center justify-center font-bold text-xs shadow-sm">
              <Sun className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Morning Shift</p>
              <p className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400">
                {shiftInfo.morning.hours}
              </p>
            </div>
          </div>
        </div>

        {/* Evening */}
        <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] flex items-center justify-center font-bold text-xs shadow-sm">
              <Sunset className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Evening Shift</p>
              <p className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                {shiftInfo.evening.hours}
              </p>
            </div>
          </div>
        </div>

        {/* Night */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#00b050] dark:bg-[#15803d] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Moon className="h-4 w-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Night Shift</p>
              <p className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {shiftInfo.night.hours}
              </p>
            </div>
          </div>
        </div>

        {/* Festival Off */}
        <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#c00000] dark:bg-[#b91c1c] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Flame className="h-4 w-4 text-rose-200" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{shiftInfo.off.label}</p>
              <p className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                {shiftInfo.off.hours}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FESTIVAL ROSTER MATRIX */}
      <div
        id="festival-roster-container"
        className="rounded-3xl border border-border bg-card/80 shadow-xl overflow-hidden backdrop-blur-sm"
      >
        <div className="bg-[#a9d08e] dark:bg-[#2d5a27] text-[#1e4620] dark:text-[#d1e7dd] px-4 py-2.5 flex items-center justify-between font-black text-xs uppercase tracking-wider border-b border-[#8cb870] dark:border-[#23471e]">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 opacity-60" />
            <span>Drag headers to reorder • Hover headers or day cells to rename/delete</span>
          </div>
          <span className="tracking-widest font-extrabold">{title.toUpperCase()}</span>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 opacity-80" />
            <span className="text-[10px] lowercase opacity-90 font-mono">Nodemailer Integrated</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed text-center border-collapse">
            <thead>
              <tr className="bg-[#f8cbad] dark:bg-[#6e3d23] text-[#592c16] dark:text-[#fbe5d6] text-[11px] sm:text-xs font-black border-b-2 border-border">
                {/* Slim First Column (Festival Day) */}
                <th className="p-2 sm:p-2.5 border-r border-b border-[#e2a882] dark:border-[#522b17] w-[13%] min-w-[95px] uppercase tracking-wider text-left pl-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-black">DAY</span>
                    <button
                      type="button"
                      onClick={() => setShowAddDayModal(true)}
                      className="h-5 w-5 rounded bg-black/10 hover:bg-black/25 flex items-center justify-center transition shrink-0 text-foreground"
                      title="Add a new festival day row"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </th>

                {/* Dynamic Staff Columns */}
                {staffList.map((staff, idx) => (
                  <th
                    key={staff}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'p-1.5 sm:p-2 border-r border-b border-[#e2a882] dark:border-[#522b17] font-black select-none group relative transition-all duration-150',
                      'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5',
                      draggedStaffIndex === idx ? 'opacity-40 bg-amber-400/30' : '',
                      dragOverStaffIndex === idx ? 'border-l-4 border-l-primary bg-primary/20 scale-[1.02]' : ''
                    )}
                    title="Drag to reorder column. Hover for edit/delete"
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      <GripVertical className="h-3 w-3 opacity-30 group-hover:opacity-80 transition shrink-0 hidden sm:inline-block" />
                      <span className="truncate font-black text-[11px] sm:text-xs">{staff}</span>
                    </div>

                    {/* Staff Column Actions (Rename / Delete) - positioned top-right on hover without crowding text */}
                    <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/95 dark:bg-card/95 rounded shadow-sm border border-border/70 px-0.5 py-0.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStaff({ oldName: staff, newName: staff });
                        }}
                        className="h-4 w-4 rounded hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition"
                        title={`Rename "${staff}" column`}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      {staffList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStaff(staff);
                          }}
                          className="h-4 w-4 rounded hover:bg-rose-600 hover:text-white flex items-center justify-center text-rose-500 transition"
                          title={`Remove "${staff}" column`}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {festivalDays.map((day) => (
                <tr key={day} className="border-b border-border/80 group hover:bg-muted/20 transition">
                  {/* Slim Festival Day Column with Rename & Delete */}
                  <td className="p-2 sm:p-2.5 border-r border-border font-extrabold text-[11px] sm:text-xs text-foreground bg-card/60 group-hover:bg-muted/70 text-left pl-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold truncate text-[11px]" title={day}>
                        {day}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDay({ oldName: day, newName: day });
                          }}
                          className="h-4 w-4 rounded hover:bg-black/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition"
                          title={`Rename "${day}"`}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDay(day);
                          }}
                          className="h-4 w-4 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 flex items-center justify-center transition"
                          title={`Delete "${day}" row`}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Staff Shift cells */}
                  {staffList.map((staff) => {
                    const cellVal = schedule[day]?.[staff] || '';
                    const cellClass = getCellClass(cellVal);
                    return (
                      <td
                        key={staff}
                        onClick={() => setSelectedCell({ day, staff })}
                        className={cn(
                          'p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-mono font-bold border-r border-border/70 select-none cursor-pointer transition',
                          cellClass
                        )}
                        title={`Click to assign shift for ${staff} on ${day}`}
                      >
                        <span className="truncate block font-bold">{cellVal || '--'}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Bottom Add Festival Day / Row button */}
              <tr className="border-t-2 border-dashed border-border/70 hover:bg-muted/30 transition">
                <td
                  colSpan={staffList.length + 1}
                  className="p-3 text-center bg-card/30"
                >
                  <button
                    type="button"
                    onClick={() => setShowAddDayModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/10 text-xs font-extrabold transition shadow-sm active:scale-98"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Add Festival Day / Row</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FESTIVAL DUTY SWAP LOGS TABLE (Filtered by selectedHistoryDay) */}
      <div className="rounded-3xl border border-border bg-card/80 shadow-lg overflow-hidden backdrop-blur-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  Festival Duty Swap Logs
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  {selectedHistoryDay} Only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing recorded festival shift swaps exclusively for <strong>{selectedHistoryDay}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSwapForm((prev) => ({ ...prev, day: selectedHistoryDay }));
                setShowSwapModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Swap on {selectedHistoryDay}</span>
            </button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/60">
          <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Select Day:
          </span>
          {festivalDays.map((day) => {
            const count = swapLogs.filter(
              (l) => l.day.toLowerCase() === day.toLowerCase()
            ).length;
            const isSelected = selectedHistoryDay.toLowerCase() === day.toLowerCase();
            return (
              <button
                key={day}
                onClick={() => setSelectedHistoryDay(day)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-primary/20'
                    : 'bg-card text-foreground hover:bg-muted border border-border/60'
                )}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                      isSelected
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-amber-500 text-amber-950 font-black'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Swap Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3">Day & Time</th>
                <th className="p-3">Staff Member 1 (Requester)</th>
                <th className="p-3">Staff Member 2 (Exchanged With)</th>
                <th className="p-3">Shift Exchange Details</th>
                <th className="p-3">Reason / Remarks</th>
                <th className="p-3">Email Notification</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {swapLogs.filter(
                (log) => log.day.toLowerCase() === selectedHistoryDay.toLowerCase()
              ).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                        <History className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">
                        No duty swaps recorded for {selectedHistoryDay}
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm">
                        Only swaps belonging to {selectedHistoryDay} are displayed here. Use the button above to exchange festival duties on this day.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                swapLogs
                  .filter((log) => log.day.toLowerCase() === selectedHistoryDay.toLowerCase())
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition">
                      <td className="p-3 font-semibold text-foreground">
                        <p className="font-bold">{log.day}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{log.timestamp}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-foreground">{log.staffA}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {log.staffA.toLowerCase()}@company.local
                        </p>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-foreground">{log.staffB}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {log.staffB.toLowerCase()}@company.local
                        </p>
                      </td>

                      <td className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-semibold text-foreground">{log.staffA}:</span>
                          <span className="line-through text-muted-foreground opacity-75">
                            {log.shiftAOriginal}
                          </span>
                          <span className="text-emerald-500 font-bold">&rarr; {log.shiftANew}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-semibold text-foreground">{log.staffB}:</span>
                          <span className="line-through text-muted-foreground opacity-75">
                            {log.shiftBOriginal}
                          </span>
                          <span className="text-emerald-500 font-bold">&rarr; {log.shiftBNew}</span>
                        </div>
                      </td>

                      <td className="p-3 text-[11px] text-muted-foreground max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                          <Mail className="h-3 w-3" />
                          <span>Nodemailer Dispatched</span>
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleRevertSwap(log)}
                              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 text-[10px] font-bold transition shadow-sm"
                              title="Revert shift exchange back to original shifts"
                            >
                              Revert
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted/60">
                              Reverted
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteSwap(log.id)}
                            className="p-1 rounded-lg border border-border bg-card hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-muted-foreground transition shadow-sm"
                            title="Delete this festival swap record permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Festival Duty Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Initiate Festival Duty Swap</h3>
                  <p className="text-xs text-muted-foreground">Exchange assigned festival duty between two engineers</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwapModal(false)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteSwap} className="space-y-4">
              {/* Day selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select Festival Day</label>
                <select
                  value={swapForm.day}
                  onChange={(e) => setSwapForm({ ...swapForm, day: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {festivalDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Members selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Staff Member 1 (Requester)</label>
                  <select
                    value={swapForm.staffA}
                    onChange={(e) => setSwapForm({ ...swapForm, staffA: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {staffList.map((s) => (
                      <option key={s} value={s}>
                        {s} ({schedule[swapForm.day]?.[s] || 'None'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Staff Member 2 (Exchange With)</label>
                  <select
                    value={swapForm.staffB}
                    onChange={(e) => setSwapForm({ ...swapForm, staffB: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {staffList.map((s) => (
                      <option key={s} value={s}>
                        {s} ({schedule[swapForm.day]?.[s] || 'None'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />
                  <span>Festival Swap Preview on {swapForm.day}:</span>
                </p>
                <div className="flex items-center justify-between text-muted-foreground font-mono">
                  <span>
                    <strong>{swapForm.staffA}</strong>: {schedule[swapForm.day]?.[swapForm.staffA] || 'Empty'}{' '}
                    &rarr; <strong className="text-emerald-500">{schedule[swapForm.day]?.[swapForm.staffB] || 'Empty'}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-mono">
                  <span>
                    <strong>{swapForm.staffB}</strong>: {schedule[swapForm.day]?.[swapForm.staffB] || 'Empty'}{' '}
                    &rarr; <strong className="text-emerald-500">{schedule[swapForm.day]?.[swapForm.staffA] || 'Empty'}</strong>
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason / Handover Notes</label>
                <input
                  type="text"
                  required
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                  placeholder="e.g. Festival family commitment, emergency broadcast standby handover"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Email Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fNotifyEmail"
                  checked={swapForm.notifyEmail}
                  onChange={(e) => setSwapForm({ ...swapForm, notifyEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="fNotifyEmail" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>Send Nodemailer notification email to both staff members</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-amber-950 font-black text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/25 flex items-center gap-2"
                >
                  <span>Confirm & Execute Swap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Shift Assignment Popup */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Assign Festival Shift</p>
                <h3 className="text-base font-black text-foreground">
                  {selectedCell.staff} &bull; <span className="text-primary">{selectedCell.day}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-muted-foreground">Select shift to assign and notify via Nodemailer:</p>

            <div className="grid grid-cols-1 gap-2">
              {/* Morning */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, shiftInfo.morning.time, true)}
                className="p-3 rounded-2xl border border-sky-500/30 bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <div className="text-left">
                    <p className="font-black">Morning Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">{shiftInfo.morning.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/10">{shiftInfo.morning.time}</span>
              </button>

              {/* Evening */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, shiftInfo.evening.time, true)}
                className="p-3 rounded-2xl border border-amber-500/30 bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sunset className="h-4 w-4 text-amber-600" />
                  <div className="text-left">
                    <p className="font-black">Evening Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">{shiftInfo.evening.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/10">{shiftInfo.evening.time}</span>
              </button>

              {/* Night */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, shiftInfo.night.time, true)}
                className="p-3 rounded-2xl border border-emerald-500/30 bg-[#00b050] dark:bg-[#15803d] text-white font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="h-4 w-4 text-emerald-200" />
                  <div className="text-left">
                    <p className="font-black">Night Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">{shiftInfo.night.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/20">{shiftInfo.night.time}</span>
              </button>

              {/* Off */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, 'Off', true)}
                className="p-3 rounded-2xl border border-rose-500/30 bg-[#c00000] dark:bg-[#b91c1c] text-white font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-rose-200" />
                  <div className="text-left">
                    <p className="font-black">{shiftInfo.off.label} (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">{shiftInfo.off.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/20 font-black">Off</span>
              </button>

              {/* Alternate Timing Buttons for Ramadan Mode */}
              {isRamadanMode && (
                <div className="pt-1.5 border-t border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold mb-1">Standard Festival Hours (Fallback):</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '07am-05pm', true)}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[10px] font-mono font-bold text-foreground text-center transition"
                    >
                      07am-05pm (10h)
                    </button>
                    <button
                      onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '11am-09pm', true)}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[10px] font-mono font-bold text-foreground text-center transition"
                    >
                      11am-09pm (10h)
                    </button>
                  </div>
                </div>
              )}

              {/* Clear */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '')}
                className="p-2 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted transition"
              >
                Clear Duty Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Festival Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Add Festival Day / Row</h3>
                  <p className="text-xs text-muted-foreground">Add a new row to the festival schedule matrix</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddDayModal(false);
                  setNewDayName('');
                }}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Day Name / Description</label>
              <input
                type="text"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDay();
                  }
                }}
                placeholder={`e.g. Day ${festivalDays.length + 1} (Extended Standby), Eid Day 4...`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <p className="text-[11px] font-bold text-muted-foreground">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {(isRamadanMode
                  ? [
                      `Day ${festivalDays.length + 1} (Ramadan Coverage)`,
                      'Laylat al-Qadr (27th Night)',
                      'Jummat-ul-Wida',
                      'Iftar Broadcast Standby',
                      'Chaand Raat Standby',
                    ]
                  : [
                      `Day ${festivalDays.length + 1} (Extended)`,
                      'Standby Day',
                      'Post-Holiday Coverage',
                      'Emergency Standby',
                      'Festival Eve Night',
                    ]
                ).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddDay(sug)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary text-[11px] font-semibold text-foreground border border-border/80 transition"
                  >
                    <Plus className="h-3 w-3 text-primary" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowAddDayModal(false);
                  setNewDayName('');
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddDay()}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/25"
              >
                + Add Day Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Festival Day Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                <h3 className="text-base font-black text-foreground">Rename Festival Day</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Current: {editingDay.oldName}</label>
              <input
                type="text"
                value={editingDay.newName}
                onChange={(e) => setEditingDay({ ...editingDay, newName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEditDay();
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditDay}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Add Member / Column</h3>
                  <p className="text-xs text-muted-foreground">Add an engineer column to the festival roster</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddStaffModal(false);
                  setNewStaffName('');
                }}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Engineer / Staff Name</label>
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStaffMember();
                  }
                }}
                placeholder="e.g. Tanvir, Fahim, Ashik..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>

            {/* Quick Pick from Registered IT staff */}
            {(() => {
              const availableDbStaff = dbStaffMembers.filter(
                (m) =>
                  m.name &&
                  !staffList.some((s) => s.toLowerCase() === m.name.toLowerCase())
              );
              if (availableDbStaff.length === 0) return null;
              return (
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <p className="text-[11px] font-bold text-muted-foreground">Or pick from registered IT team:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableDbStaff.map((u) => (
                      <button
                        key={u.id || u.name}
                        type="button"
                        onClick={() => handleAddStaffMember(u.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary text-[11px] font-semibold text-foreground border border-border/80 transition"
                      >
                        <Plus className="h-3 w-3 text-primary" />
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowAddStaffModal(false);
                  setNewStaffName('');
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddStaffMember()}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/25"
              >
                + Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                <h3 className="text-base font-black text-foreground">Rename Engineer Column</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Current: {editingStaff.oldName}</label>
              <input
                type="text"
                value={editingStaff.newName}
                onChange={(e) => setEditingStaff({ ...editingStaff, newName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEditStaff();
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditStaff}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AccessGuard>
);
}
