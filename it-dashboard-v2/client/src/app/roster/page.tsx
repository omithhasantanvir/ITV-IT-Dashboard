'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  Clock,
  Plus,
  Users,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  ShieldAlert,
  UserX,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Info,
  GripVertical,
  ArrowRightLeft,
  FileText,
  Mail,
  Send,
  X,
  ArrowRight,
  History,
  AlertCircle,
  Trash2,
  Pencil,
  UserPlus,
  Flame,
  CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { confirmDelete, confirmAction, showWarningAlert, showErrorAlert, showSuccessAlert } from '@/lib/sweetalert';

// Shift definitions matching user's exact specification
const SHIFT_TYPES = {
  MORNING: {
    id: 'MORNING',
    label: 'Morning Shift',
    time: '07am-05pm',
    description: '7:00 AM – 5:00 PM (10 hrs)',
    bg: 'bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] border-[#95b3d7] dark:border-[#1e3a5f]',
    dot: 'bg-sky-500',
    icon: Sun,
  },
  EVENING: {
    id: 'EVENING',
    label: 'Evening Shift',
    time: '11am-09pm',
    description: '11:00 AM – 9:00 PM (10 hrs)',
    bg: 'bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] border-[#ffe599] dark:border-[#92400e]',
    dot: 'bg-amber-400',
    icon: Sunset,
  },
  NIGHT: {
    id: 'NIGHT',
    label: 'Night Shift',
    time: '09pm-07am',
    description: '9:00 PM – 7:00 AM (10 hrs)',
    bg: 'bg-[#00b050] dark:bg-[#15803d] text-white border-[#008a3e]',
    dot: 'bg-emerald-500',
    icon: Moon,
  },
  OFF: {
    id: 'OFF',
    label: 'Off Day',
    time: 'Off',
    description: 'Weekly Off / Leave',
    bg: 'bg-[#c00000] dark:bg-[#b91c1c] text-white border-[#990000]',
    dot: 'bg-rose-500',
    icon: Flame,
  },
  EMPTY: {
    id: 'EMPTY',
    label: 'Not Assigned',
    time: '',
    description: 'Leave empty / TBD',
    bg: 'bg-card text-muted-foreground border-border',
    dot: 'bg-zinc-400',
    icon: Clock,
  },
} as const;

export type ShiftKey = keyof typeof SHIFT_TYPES;

const DAYS = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
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

// Initial running schedule matching user's spreadsheet image
const INITIAL_SCHEDULE: Record<string, Record<string, string>> = {
  Saturday: {
    Shishir: '11am-09pm',
    Zaman: 'Off',
    Apu: '',
    Jit: 'Off',
    Shofiqul: 'Off',
    Ashraful: '11am-09pm',
    Omith: 'Off',
    Pranjol: '07am-05pm',
    Sakib: '09pm-07am',
    Rony: '07am-05pm',
  },
  Sunday: {
    Shishir: 'Off',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: '09pm-07am',
    Omith: '11am-09pm',
    Pranjol: '07am-05pm',
    Sakib: 'Off',
    Rony: '11am-09pm',
  },
  Monday: {
    Shishir: 'Off',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: '09pm-07am',
    Omith: '11am-09pm',
    Pranjol: '07am-05pm',
    Sakib: 'Off',
    Rony: '11am-09pm',
  },
  Tuesday: {
    Shishir: '07am-05pm',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: 'Off',
    Omith: '11am-09pm',
    Pranjol: '07am-05pm',
    Sakib: '11am-09pm',
    Rony: '09pm-07am',
  },
  Wednesday: {
    Shishir: '07am-03pm',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: 'Off',
    Omith: '11am-09pm',
    Pranjol: '09pm-07am',
    Sakib: '07am-05pm',
    Rony: 'Off',
  },
  Thursday: {
    Shishir: '07am-03pm',
    Zaman: '11am-09pm',
    Apu: '',
    Jit: '11am-09pm',
    Shofiqul: '07am-05pm',
    Ashraful: '11am-09pm',
    Omith: '09pm-07am',
    Pranjol: 'Off',
    Sakib: '07am-05pm',
    Rony: 'Off',
  },
  Friday: {
    Shishir: '11am-09pm',
    Zaman: 'Off',
    Apu: '',
    Jit: 'Off',
    Shofiqul: 'Off',
    Ashraful: '11am-09pm',
    Omith: 'Off',
    Pranjol: 'Off',
    Sakib: '09pm-07am',
    Rony: '07am-05pm',
  },
};

export interface SwapLogItem {
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

const INITIAL_SWAP_LOGS: SwapLogItem[] = [];

export default function DutyRosterPage() {
  const [title, setTitle] = useState('IT Duty Roster October 2026');
  const [staffList, setStaffList] = useState<string[]>(DEFAULT_STAFF);
  const [schedule, setSchedule] = useState<Record<string, Record<string, string>>>(INITIAL_SCHEDULE);
  const [swapLogs, setSwapLogs] = useState<SwapLogItem[]>(INITIAL_SWAP_LOGS);

  // Cell Selection / Quick Edit
  const [selectedCell, setSelectedCell] = useState<{ day: string; staff: string } | null>(null);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [todayDay, setTodayDay] = useState<string>('Sunday');
  const [selectedHistoryDay, setSelectedHistoryDay] = useState<string>('Sunday');

  // Staff column edit & DB users pick
  const [editingStaff, setEditingStaff] = useState<{ oldName: string; newName: string } | null>(null);
  const [dbStaffMembers, setDbStaffMembers] = useState<{ id: string; name: string; department?: string; email?: string }[]>([]);
  const [isLoadingDbStaff, setIsLoadingDbStaff] = useState(false);

  // Duty Swap Form State
  const [swapForm, setSwapForm] = useState({
    day: 'Sunday',
    staffA: DEFAULT_STAFF[0] || 'Shishir',
    staffB: DEFAULT_STAFF[1] || 'Zaman',
    reason: 'Personal adjustment & operational coverage',
    notifyEmail: true,
  });

  // Fetch registered IT staff / users from backend for quick-add column chips
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingDbStaff(true);
        const res = await api.get('/api/users');
        const list = res.data?.data || [];
        setDbStaffMembers(list);
      } catch (e) {
        console.warn('Could not fetch DB users for duty roster:', e);
      } finally {
        setIsLoadingDbStaff(false);
      }
    };
    fetchUsers();
  }, []);

  // Drag and Drop Column Reordering States
  const [draggedStaffIndex, setDraggedStaffIndex] = useState<number | null>(null);
  const [dragOverStaffIndex, setDragOverStaffIndex] = useState<number | null>(null);

  // Column Drag & Drop Handlers
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
    saveSchedule(schedule, updated);
    showToast(`Reordered column: "${moved}" to position ${dropIndex + 1}`);
    setDraggedStaffIndex(null);
    setDragOverStaffIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStaffIndex(null);
    setDragOverStaffIndex(null);
  };

  // Load saved roster & swaps from local storage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('it_duty_roster_running');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schedule) setSchedule(parsed.schedule);
        if (parsed.staffList) setStaffList(parsed.staffList);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.swapLogs) {
          // Filter out initial sample dummy log if present
          const cleaned = parsed.swapLogs.filter((s: SwapLogItem) => s.id !== 'swap-init-1');
          setSwapLogs(cleaned);
        }
      }
    } catch (e) {}

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const current = dayNames[new Date().getDay()];
    setTodayDay(current);
    setSelectedHistoryDay(current);
    setSwapForm((prev) => ({ ...prev, day: current }));
  }, []);

  // Save changes
  const saveSchedule = (
    newSched: Record<string, Record<string, string>>,
    newStaff?: string[],
    newSwaps?: SwapLogItem[]
  ) => {
    setSchedule(newSched);
    const staffToSave = newStaff || staffList;
    const swapsToSave = newSwaps || swapLogs;
    try {
      localStorage.setItem(
        'it_duty_roster_running',
        JSON.stringify({
          schedule: newSched,
          staffList: staffToSave,
          title,
          swapLogs: swapsToSave,
        })
      );
    } catch (e) {}
  };

  // Cell shift setter with optional Nodemailer dispatch
  const setCellShift = async (day: string, staff: string, value: string, sendMail = false) => {
    const updated = {
      ...schedule,
      [day]: {
        ...(schedule[day] || {}),
        [staff]: value,
      },
    };
    saveSchedule(updated);
    setSelectedCell(null);
    showToast(`Assigned ${staff}'s duty on ${day} to "${value || 'Empty'}"`);

    if (sendMail && value) {
      try {
        await api.post('/api/roster/notify-email', {
          staffName: staff,
          day,
          shift: value === 'Off' ? 'Off Day' : 'Active Duty',
          timeRange: value,
        });
        showToast(`📧 Nodemailer email sent to ${staff}!`);
      } catch (err) {
        console.warn('Mail delivery notice:', err);
      }
    }
  };

  // Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new staff column
  const handleAddStaff = (nameToAdd?: string) => {
    const trimmed = (nameToAdd !== undefined ? nameToAdd : newStaffName).trim();
    if (!trimmed) return;
    if (staffList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      alert('Staff member already exists.');
      return;
    }
    const updatedStaff = [...staffList, trimmed];
    const updatedSchedule = { ...schedule };
    DAYS.forEach((day) => {
      if (!updatedSchedule[day]) updatedSchedule[day] = {};
      if (updatedSchedule[day][trimmed] === undefined) {
        updatedSchedule[day][trimmed] = '';
      }
    });
    setStaffList(updatedStaff);
    saveSchedule(updatedSchedule, updatedStaff);
    setNewStaffName('');
    setShowAddStaffModal(false);
    showToast(`Added ${trimmed} to duty roster.`);
  };

  // Remove staff column
  const handleRemoveStaff = async (staff: string) => {
    if (staffList.length <= 1) {
      showWarningAlert(
        'Cannot Delete Column',
        'Cannot delete the only remaining staff column. Minimum 1 engineer is required in the duty roster.'
      );
      return;
    }
    const confirmed = await confirmDelete({
      title: `Remove "${staff}" Column?`,
      text: `Are you sure you want to remove "${staff}" and their assigned shifts from the duty roster?`,
      confirmButtonText: 'Yes, Remove Column',
    });
    if (!confirmed) return;

    const updatedStaff = staffList.filter((s) => s !== staff);
    const updatedSchedule = { ...schedule };
    DAYS.forEach((day) => {
      if (updatedSchedule[day]) {
        delete updatedSchedule[day][staff];
      }
    });

    if (swapForm.staffA === staff) {
      setSwapForm((prev) => ({ ...prev, staffA: updatedStaff[0] || '' }));
    }
    if (swapForm.staffB === staff) {
      setSwapForm((prev) => ({ ...prev, staffB: updatedStaff[1] || updatedStaff[0] || '' }));
    }

    setStaffList(updatedStaff);
    saveSchedule(updatedSchedule, updatedStaff);
    showToast(`Removed "${staff}" from duty roster.`);
  };

  // Rename staff column
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
    DAYS.forEach((day) => {
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
    saveSchedule(updatedSchedule, updatedStaff, updatedSwaps);
    setEditingStaff(null);
    showToast(`Renamed engineer to "${trimmed}".`);
  };

  // Reset to default spreadsheet
  const handleReset = async () => {
    const confirmed = await confirmAction({
      title: 'Reset Duty Roster?',
      text: 'Are you sure you want to reset all shift assignments back to the initial October 2026 schedule?',
      icon: 'warning',
      confirmButtonText: 'Yes, Reset All',
      isDanger: true,
    });
    if (!confirmed) return;

    setSchedule(INITIAL_SCHEDULE);
    setStaffList(DEFAULT_STAFF);
    setTitle('IT Duty Roster October 2026');
    setSwapLogs(INITIAL_SWAP_LOGS);
    try {
      localStorage.removeItem('it_duty_roster_running');
    } catch (e) {}
    showToast('Reset to original IT duty roster.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = `"${title}"\n`;
    csv += ['DAY', ...staffList].join(',') + '\n';
    DAYS.forEach((day) => {
      const row = [day];
      staffList.forEach((staff) => {
        row.push(`"${schedule[day]?.[staff] || ''}"`);
      });
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IT_Duty_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Roster exported to CSV.');
  };

  // Export / Download as Crisp B&W Vector Table PDF using jsPDF + jspdf-autotable
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Generating official B&W printable roster PDF...');

      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = (autoTableModule.default || autoTableModule) as any;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Header (Black & White, crisp typography)
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
        `IT Operations Duty Roster | Generated: ${todayFormatted} | Shift Day Focus: ${selectedHistoryDay}`,
        14,
        21
      );

      // Clean divider line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(14, 23.5, 283, 23.5);

      // 2. Table 1: Main Roster Matrix (Black & White Table)
      const tableHead = [['DAY', ...staffList]];
      const tableBody = DAYS.map((day) => {
        const isToday = day.toLowerCase() === todayDay.toLowerCase();
        const row = [isToday ? `${day}* (TODAY)` : day];
        staffList.forEach((staff) => {
          const shiftVal = schedule[day]?.[staff] || '-';
          row.push(shiftVal);
        });
        return row;
      });

      autoTable(doc, {
        startY: 26,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.35,
          fontSize: 8,
        },
        columnStyles: {
          0: {
            halign: 'left',
            fontStyle: 'bold',
            cellWidth: 26,
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

      // 3. Table 2: Duty Swap History for THAT DAY ONLY (as requested by user)
      const lastTable = (doc as any).lastAutoTable;
      const finalY = lastTable ? lastTable.finalY : 120;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `DUTY SWAP HISTORY & EXCHANGE RECORDS (${selectedHistoryDay.toUpperCase()} ONLY)`,
        14,
        finalY + 9
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Shift exchange records strictly registered for ${selectedHistoryDay}`,
        14,
        finalY + 13.5
      );

      // Filter swap records ONLY for the selected day
      const daySwaps = swapLogs.filter(
        (log) => log.day.toLowerCase() === selectedHistoryDay.toLowerCase()
      );

      const swapTableHead = [
        ['Timestamp', 'Staff 1 (Requester)', 'Staff 2 (Exchanged With)', 'Shift Exchange Details', 'Reason / Remarks', 'Status']
      ];

      const swapTableBody =
        daySwaps.length > 0
          ? daySwaps.map((log) => [
              log.timestamp || selectedHistoryDay,
              log.staffA,
              log.staffB,
              `${log.staffA}: ${log.shiftAOriginal} -> ${log.shiftANew}\n${log.staffB}: ${log.shiftBOriginal} -> ${log.shiftBNew}`,
              log.reason || 'Handover & coverage',
              log.status,
            ])
          : [
              [
                '-',
                '-',
                '-',
                `No duty swaps recorded for ${selectedHistoryDay}.`,
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

      // 4. Footer & Page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 110);
        doc.text(
          `Page ${i} of ${pageCount} | Official ITV Broadcast IT Operations Duty Roster (Black & White Document)`,
          14,
          203
        );
      }

      doc.save(
        `IT_Duty_Roster_BW_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedHistoryDay}.pdf`
      );
      showToast(`✅ Downloaded crisp B&W table PDF with ${selectedHistoryDay} swap logs!`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Execute Duty Swap
  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    const { day, staffA, staffB, reason, notifyEmail } = swapForm;

    if (staffA === staffB) {
      alert('Please select two different staff members to swap duties.');
      return;
    }

    const currentShiftA = schedule[day]?.[staffA] || '';
    const currentShiftB = schedule[day]?.[staffB] || '';

    // Swap shifts: staffA gets staffB's shift, staffB gets staffA's shift
    const updatedSchedule = {
      ...schedule,
      [day]: {
        ...(schedule[day] || {}),
        [staffA]: currentShiftB,
        [staffB]: currentShiftA,
      },
    };

    const newSwapItem: SwapLogItem = {
      id: `swap-${Date.now()}`,
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
    saveSchedule(updatedSchedule, staffList, updatedSwaps);
    setShowSwapModal(false);
    showToast(`🔄 Duty swapped between ${staffA} and ${staffB} on ${day}!`);

    // Call backend API with Nodemailer notification
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
        showToast(`📧 Nodemailer duty swap notification emails sent to ${staffA} & ${staffB}!`);
      } catch (apiErr) {
        console.warn('Swap API notification warning:', apiErr);
      }
    }
  };

  // Revert a swap
  const handleRevertSwap = async (item: SwapLogItem) => {
    const confirmed = await confirmAction({
      title: 'Revert Duty Shift Swap?',
      text: `Revert duty exchange between ${item.staffA} and ${item.staffB} on ${item.day} back to their previous shifts?`,
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

    const updatedSwaps: SwapLogItem[] = swapLogs.map((s) =>
      s.id === item.id ? { ...s, status: 'REVERTED' } : s
    );

    setSwapLogs(updatedSwaps);
    saveSchedule(updatedSchedule, staffList, updatedSwaps);
    showToast(`Reverted duty swap on ${item.day}.`);
  };

  // Delete a swap record permanently
  const handleDeleteSwap = async (id: string) => {
    const confirmed = await confirmDelete({
      title: 'Delete Swap Record?',
      text: 'Are you sure you want to permanently delete this duty swap log record?',
      confirmButtonText: 'Yes, Delete Record',
    });
    if (!confirmed) return;

    const updatedSwaps = swapLogs.filter((s) => s.id !== id);
    setSwapLogs(updatedSwaps);
    saveSchedule(schedule, staffList, updatedSwaps);
    showToast('Duty swap log removed.');
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

    // 2. Evening Shift (Light Yellow) - Starts with 11am or 11pm
    if (
      clean.startsWith('11') ||
      clean.includes('evening') ||
      clean === '11am-09pm' ||
      clean === '11pm-09pm'
    ) {
      return 'bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] font-black shadow-sm hover:brightness-95';
    }

    // 3. Night Shift (Vibrant Green) - Starts with 09pm or 9pm
    if (
      clean.startsWith('09pm') ||
      clean.startsWith('9pm') ||
      clean.includes('night') ||
      clean === '09pm-07am'
    ) {
      return 'bg-[#00b050] dark:bg-[#15803d] text-white font-black shadow-sm hover:brightness-110';
    }

    // 4. Morning Shift (Light Blue / Steel Blue) - Starts with 07am or 7am
    if (
      clean.startsWith('07') ||
      clean.startsWith('7') ||
      clean.includes('morning') ||
      clean === '07am-05pm' ||
      clean === '07am-03pm'
    ) {
      return 'bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] font-black shadow-sm hover:brightness-95';
    }

    return 'bg-muted text-foreground font-semibold';
  };

  // Metrics for selected day or today
  const todayRoster = schedule[todayDay] || {};
  const morningEngineers = staffList.filter((s) => {
    const val = (todayRoster[s] || '').toLowerCase().replace(/\s+/g, '');
    return val.startsWith('07') || val.includes('morning');
  });
  const eveningEngineers = staffList.filter((s) => {
    const val = (todayRoster[s] || '').toLowerCase().replace(/\s+/g, '');
    return val.startsWith('11') || val.includes('evening');
  });
  const nightEngineers = staffList.filter((s) => {
    const val = (todayRoster[s] || '').toLowerCase().replace(/\s+/g, '');
    return val.startsWith('09pm') || val.startsWith('9pm') || val.includes('night');
  });
  const offEngineers = staffList.filter((s) => {
    const val = (todayRoster[s] || '').toLowerCase().trim();
    return val === 'off';
  });

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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm bg-primary text-primary-foreground shadow-primary/20"
        >
          <Calendar className="h-4 w-4" />
          <span>Daily Roster</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary-foreground/20 text-[10px] font-bold">Active</span>
        </Link>

        <Link
          href="/roster/festival"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Festival Roster</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20">Special</span>
        </Link>
      </div>

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none font-black text-2xl text-foreground"
              />
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold shrink-0">
              Active Shift Matrix
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Running 3-Shift IT Duty Roster. Click any cell to assign shifts, perform duty swaps & export PDF.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Duty Swap Button */}
          <button
            onClick={() => setShowSwapModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
            title="Swap duty shift between two engineers"
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

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>Add Member</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
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

      {/* Shift Timings Legend & Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Morning Shift Card */}
        <div className="p-3.5 rounded-2xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] flex items-center justify-center font-bold text-xs shadow-sm">
                <Sun className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Morning Shift</p>
                <p className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400">
                  07:00 AM – 05:00 PM
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-sky-500/10 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Today ({todayDay}):</span>
            <span className="font-bold text-foreground truncate max-w-[150px]">
              {morningEngineers.length > 0 ? morningEngineers.join(', ') : 'None'}
            </span>
          </div>
        </div>

        {/* Evening Shift Card */}
        <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] flex items-center justify-center font-bold text-xs shadow-sm">
                <Sunset className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Evening Shift</p>
                <p className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                  11:00 AM – 09:00 PM
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Today ({todayDay}):</span>
            <span className="font-bold text-foreground truncate max-w-[150px]">
              {eveningEngineers.length > 0 ? eveningEngineers.join(', ') : 'None'}
            </span>
          </div>
        </div>

        {/* Night Shift Card */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#00b050] dark:bg-[#15803d] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <Moon className="h-4 w-4 text-emerald-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Night Shift</p>
                <p className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  09:00 PM – 07:00 AM
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Today ({todayDay}):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
              {nightEngineers.length > 0 ? nightEngineers.join(', ') : 'None'}
            </span>
          </div>
        </div>

        {/* Off Day Card */}
        <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#c00000] dark:bg-[#b91c1c] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <Flame className="h-4 w-4 text-rose-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Weekly Off</p>
                <p className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                  Off / Rest Day
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-500/10 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Today ({todayDay}):</span>
            <span className="font-bold text-rose-500 truncate max-w-[150px]">
              {offEngineers.length > 0 ? offEngineers.join(', ') : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* SPREADSHEET MATRIX TABLE (Printable / Exportable Container) */}
      <div
        id="roster-matrix-container"
        className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden backdrop-blur-sm"
      >
        {/* Table Top Green Banner matching screenshot */}
        <div className="bg-[#a9d08e] dark:bg-[#386b24] text-[#1e293b] dark:text-white px-6 py-2.5 text-center font-extrabold text-sm tracking-wide border-b border-border shadow-sm flex items-center justify-between">
          <span className="text-xs opacity-80 hidden sm:inline-flex items-center gap-1 font-medium">
            <GripVertical className="h-3.5 w-3.5" />
            <span>Drag column headers to reorder</span>
          </span>
          <span className="font-black tracking-wider uppercase text-sm sm:text-base">
            {title}
          </span>
          <span className="text-xs opacity-80 hidden sm:inline-flex items-center gap-1 font-medium">
            <Mail className="h-3.5 w-3.5" />
            <span>Nodemailer Integrated</span>
          </span>
        </div>

        {/* Table Container - Perfectly sized edge-to-edge spreadsheet matrix */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-max">
            <thead>
              {/* Header row with DAY and Team Members */}
              <tr className="bg-[#f8cbad] dark:bg-[#804c26] text-[#1e293b] dark:text-white border-b-2 border-border font-black text-[11px] sm:text-xs">
                <th className="sticky left-0 z-20 bg-[#f8cbad] dark:bg-[#804c26] p-2.5 sm:p-3 border-r border-border text-center min-w-[95px] w-28 uppercase tracking-wider shadow-[2px_0_6px_rgba(0,0,0,0.08)]">
                  DAY
                </th>
                {staffList.map((staff, index) => {
                  const isBeingDragged = draggedStaffIndex === index;
                  const isDropTarget = dragOverStaffIndex === index && draggedStaffIndex !== index;

                  return (
                    <th
                      key={staff}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={cn(
                        'p-2 sm:p-2.5 border-r border-border text-center tracking-tight relative group select-none transition-all duration-150 min-w-[105px]',
                        'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5',
                        isBeingDragged && 'opacity-30 scale-95 border-dashed border-2 border-primary bg-primary/10',
                        isDropTarget && 'ring-2 ring-primary ring-inset bg-primary/25 scale-[1.02]'
                      )}
                      title="Drag to reorder column. Hover to edit/delete"
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        <GripVertical className="h-3 w-3 opacity-30 group-hover:opacity-80 transition shrink-0 text-foreground hidden sm:inline-block" />
                        <span className="truncate font-black">{staff}</span>
                      </div>

                      {/* Staff Column Actions on Hover - absolute positioned so it never takes up column width */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/95 dark:bg-card/95 rounded shadow-sm border border-border/70 px-0.5 py-0.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStaff({ oldName: staff, newName: staff });
                          }}
                          className="h-4 w-4 rounded hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-foreground transition"
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
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {DAYS.map((day) => {
                const isCurrent = day === todayDay;

                return (
                  <tr
                    key={day}
                    className={
                      isCurrent
                        ? 'bg-primary/5 ring-1 ring-inset ring-primary/30 font-bold'
                        : 'hover:bg-muted/20 transition'
                    }
                  >
                    {/* Day Column */}
                    <td className="sticky left-0 z-10 p-2 sm:p-2.5 font-black text-[11px] sm:text-xs text-foreground border-r border-border bg-card shadow-[2px_0_6px_rgba(0,0,0,0.08)] flex-nowrap whitespace-nowrap text-left pl-3">
                      <div className="flex items-center gap-1.5">
                        <span>{day}</span>
                        {isCurrent && (
                          <span className="px-1 py-0.2 rounded text-[8px] bg-primary text-primary-foreground font-extrabold uppercase hidden sm:inline">
                            Today
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Member Shift Cells */}
                    {staffList.map((staff) => {
                      const value = schedule[day]?.[staff] || '';
                      const isCellSelected =
                        selectedCell?.day === day && selectedCell?.staff === staff;

                      return (
                        <td
                          key={staff}
                          onClick={() => setSelectedCell({ day, staff })}
                          className={`p-2 sm:p-2.5 text-[10px] sm:text-[11px] font-mono font-bold border-r border-border cursor-pointer transition select-none relative min-w-[105px] ${getCellClass(
                            value
                          )} ${isCellSelected ? 'ring-2 ring-primary ring-inset scale-[0.98]' : ''}`}
                          title={`Click to edit ${staff} on ${day}`}
                        >
                          <span className="truncate block">{value || '--'}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DUTY SWAP LOGS & MENTION TABLE (Showing only that day's history as requested) */}
      <div className="rounded-3xl border border-border bg-card/80 shadow-lg overflow-hidden backdrop-blur-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  Duty Swap Logs & Exchange Records
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  {selectedHistoryDay} Only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing recorded shift swaps exclusively for <strong>{selectedHistoryDay}</strong>.
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

        {/* Day Selector Tabs (Filter history to only that day) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/60">
          <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Select Day:
          </span>
          {DAYS.map((day) => {
            const count = swapLogs.filter(
              (l) => l.day.toLowerCase() === day.toLowerCase()
            ).length;
            const isSelected = selectedHistoryDay.toLowerCase() === day.toLowerCase();
            const isToday = todayDay.toLowerCase() === day.toLowerCase();
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
                {isToday && (
                  <span
                    className={cn(
                      'text-[9px] px-1 py-0.2 rounded font-black',
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                    )}
                  >
                    Today
                  </span>
                )}
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

        {/* Swap Records Table (Filtered strictly for selectedHistoryDay) */}
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
                        Only swaps belonging to {selectedHistoryDay} are displayed here. Use the button above to exchange duties on this day.
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
                            title="Delete this swap record permanently"
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

      {/* Duty Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Initiate Duty Shift Swap</h3>
                  <p className="text-xs text-muted-foreground">Exchange assigned duty between two staff members</p>
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
                <label className="text-xs font-bold text-foreground">Select Duty Day to Swap</label>
                <select
                  value={swapForm.day}
                  onChange={(e) => setSwapForm({ ...swapForm, day: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === todayDay ? '(Today)' : ''}
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

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />
                  <span>Swap Preview on {swapForm.day}:</span>
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
                  placeholder="e.g. Server maintenance handover, personal emergency, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Email Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyEmail"
                  checked={swapForm.notifyEmail}
                  onChange={(e) => setSwapForm({ ...swapForm, notifyEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="notifyEmail" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
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

      {/* Quick Shift Assignment Popup with Email Toggle */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Assign Shift & Send Email</p>
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
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '07am-05pm', true)}
                className="p-3 rounded-2xl border border-sky-500/30 bg-[#b8cce4] dark:bg-[#1e3a5f] text-[#0f2d59] dark:text-[#dbeafe] font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <div className="text-left">
                    <p className="font-black">Morning Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">7:00 AM – 5:00 PM</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  07am-05pm
                </span>
              </button>

              {/* Special Morning (Wed/Thu) */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '07am-03pm', true)}
                className="p-2.5 rounded-2xl border border-sky-400/30 bg-[#b8cce4]/70 dark:bg-[#1e3a5f]/70 text-[#0f2d59] dark:text-[#dbeafe] font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <div className="text-left">
                    <p className="font-bold">Short Morning (8h)</p>
                    <p className="text-[10px] opacity-80">7:00 AM – 3:00 PM</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10">
                  07am-03pm
                </span>
              </button>

              {/* Evening */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '11am-09pm', true)}
                className="p-3 rounded-2xl border border-amber-400/30 bg-[#fff2cc] dark:bg-[#78590b] text-[#78350f] dark:text-[#fef3c7] font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sunset className="h-4 w-4 text-amber-500" />
                  <div className="text-left">
                    <p className="font-black">Evening Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-80">11:00 AM – 9:00 PM</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  11am-09pm
                </span>
              </button>

              {/* Night */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '09pm-07am', true)}
                className="p-3 rounded-2xl border border-emerald-500/40 bg-[#00b050] dark:bg-[#15803d] text-white font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="h-4 w-4 text-emerald-200" />
                  <div className="text-left">
                    <p className="font-black">Night Shift (Notify 📧)</p>
                    <p className="text-[10px] opacity-90">9:00 PM – 7:00 AM</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/20">
                  09pm-07am
                </span>
              </button>

              {/* Off Day */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, 'Off', true)}
                className="p-3 rounded-2xl border border-rose-500/40 bg-[#c00000] dark:bg-[#b91c1c] text-white font-extrabold text-xs flex items-center justify-between hover:scale-[1.02] transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-rose-200" />
                  <div className="text-left">
                    <p className="font-black">Off Day (Notify 📧)</p>
                    <p className="text-[10px] opacity-90">Weekly Off / Rest</p>
                  </div>
                </div>
                <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-black/20">
                  Off
                </span>
              </button>

              {/* Clear */}
              <button
                onClick={() => setCellShift(selectedCell.day, selectedCell.staff, '', false)}
                className="p-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted text-center transition"
              >
                Clear / Leave Blank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Column Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                <span>Rename Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Staff Name for &quot;{editingStaff.oldName}&quot;
              </label>
              <input
                type="text"
                placeholder="Enter new staff name..."
                value={editingStaff.newName}
                onChange={(e) =>
                  setEditingStaff({ ...editingStaff, newName: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditStaff()}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                autoFocus
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditStaff}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Column Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>Add Team Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Member Name / Column Header</label>
              <input
                type="text"
                placeholder="e.g. Farhan, Tanvir, etc."
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>

            {dbStaffMembers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Or pick from registered IT engineers:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {dbStaffMembers
                    .filter((u) => !staffList.includes(u.name))
                    .map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddStaff(user.name)}
                        className="px-2 py-1 rounded-lg border border-border bg-muted/60 hover:bg-primary hover:text-primary-foreground text-[11px] font-semibold transition"
                      >
                        + {user.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddStaff()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AccessGuard>
);
}
