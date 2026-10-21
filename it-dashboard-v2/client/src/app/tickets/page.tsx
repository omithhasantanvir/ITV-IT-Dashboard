'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Flame,
  User,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Computer,
  Wrench,
  Printer,
  Download,
  RotateCcw,
  MessageSquare,
  Send,
  Eye,
  Trash2,
  X,
  ChevronDown,
  ArrowUpDown,
  Tag,
  Shield,
  Layers,
  Radio,
  FileSpreadsheet,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, formatDate } from '@/lib/utils';
import { showSuccessAlert, showWarningAlert, confirmAction } from '@/lib/sweetalert';
import QRCode from 'qrcode';

export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type TicketCategory =
  | 'Hardware & Workstation'
  | 'Network & Internet'
  | 'Broadcast & MCR Systems'
  | 'PABX & Telephony'
  | 'Email & Domain Access'
  | 'HRMS & Web Portals'
  | 'Printers & Peripherals'
  | 'Security & Antivirus';

export interface TicketTimelineItem {
  id: string;
  author: string;
  action: string;
  note?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterName: string;
  requesterDepartment: string;
  requesterExtension?: string;
  requesterLocation?: string;
  requesterEmail?: string;
  assignedTo: string;
  deviceAssetId?: string;
  resolutionNotes?: string;
  rootCause?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: TicketTimelineItem[];
}

const STORAGE_KEY = 'itv_support_tickets_v2';

export const ITV_ENGINEERS = [
  'Unassigned',
  'Omith Hasan Tanvir',
  'Abu Toha Md. Anowarul Azim',
  'Md. Rashedul Islam',
  'Md. Tariqul Islam',
  'Syed Moniruzzaman',
  'Fahim Faysal',
  'Md. Al-Amin',
  'Kazi Tanvir Ahmed',
  'IT Operations Desk',
];

export const CATEGORIES: { label: TicketCategory; icon: any }[] = [
  { label: 'Hardware & Workstation', icon: Computer },
  { label: 'Network & Internet', icon: Radio },
  { label: 'Broadcast & MCR Systems', icon: Layers },
  { label: 'PABX & Telephony', icon: Phone },
  { label: 'Email & Domain Access', icon: Mail },
  { label: 'HRMS & Web Portals', icon: FileSpreadsheet },
  { label: 'Printers & Peripherals', icon: Printer },
  { label: 'Security & Antivirus', icon: Shield },
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'ITV-TK-1001',
    title: 'MCR Video Ingest Line 2 Audio Dropout During 2PM Bulletin',
    description: 'Line 2 SDI embedded audio channels 1-2 dropped out intermittently during live news feed. Checked cable patching and need hardware level loop test on card.',
    category: 'Broadcast & MCR Systems',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    requesterName: 'Md. Tariqul Islam',
    requesterDepartment: 'Master Control Room (MCR)',
    requesterExtension: '30412',
    requesterLocation: 'HQ Floor 3 - Central MCR',
    requesterEmail: 'tariqul.mcr@independent24.tv',
    assignedTo: 'Abu Toha Md. Anowarul Azim',
    deviceAssetId: 'ITV-SRV-INGEST-02',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Md. Tariqul Islam',
        action: 'Created Ticket',
        note: 'Reported critical audio stutter during live feed switch',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: '2',
        author: 'Abu Toha Md. Anowarul Azim',
        action: 'Assigned to self',
        note: 'Switched feed to backup SDI line 4 and investigating Blackmagic Decklink SDI card buffer.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  },
  {
    id: 'ITV-TK-1002',
    title: 'Newsroom Desk #18 PC Blue Screen (KERNEL_DATA_INPAGE_ERROR)',
    description: 'Workstation crashed repeatedly while rendering video edit on EDIUS. System fails to boot past BIOS on subsequent restart.',
    category: 'Hardware & Workstation',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Fariha Hossain',
    requesterDepartment: 'News Reporting',
    requesterExtension: '30214',
    requesterLocation: 'Floor 3 - Newsroom Row B',
    requesterEmail: 'fariha.news@independent24.tv',
    assignedTo: 'Omith Hasan Tanvir',
    deviceAssetId: 'ITV-WS-NR-18',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Fariha Hossain',
        action: 'Created Ticket',
        note: 'Editing workstation is down, pending 6 PM news package edit.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  },
  {
    id: 'ITV-TK-1003',
    title: 'Outlook Exchange Email Sync Failing on Mac Mail Client',
    description: 'Password accepted but folder hierarchy not updating. Offline cache might be corrupted after macOS upgrade.',
    category: 'Email & Domain Access',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    requesterName: 'Kamrul Hasan',
    requesterDepartment: 'Current Affairs',
    requesterExtension: '30155',
    requesterLocation: 'Floor 4 - Room 402',
    requesterEmail: 'kamrul.hasan@independent24.tv',
    assignedTo: 'Md. Rashedul Islam',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Kamrul Hasan',
        action: 'Created Ticket',
        note: 'Unable to receive incoming story assignments via Outlook.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: '2',
        author: 'Md. Rashedul Islam',
        action: 'Updated Status',
        note: 'Re-building OST profile cache and verified TLS 1.3 cert.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  },
  {
    id: 'ITV-TK-1004',
    title: 'Intercom Ext 30512 Continuously Dead / Audible Static Noise',
    description: 'Telephone handset has no dial tone. Loose wiring suspected at the wall faceplate junction.',
    category: 'PABX & Telephony',
    priority: 'LOW',
    status: 'RESOLVED',
    requesterName: 'Sharmin Sultana',
    requesterDepartment: 'Human Resources',
    requesterExtension: '30512',
    requesterLocation: 'Floor 2 - HR Wing',
    requesterEmail: 'sharmin.hr@independent24.tv',
    assignedTo: 'Omith Hasan Tanvir',
    resolutionNotes: 'Re-punched pair 4 on Krone block terminal in Floor 2 distribution rack. Tested clear bidirectional dial tone and incoming call ring.',
    rootCause: 'Corroded copper pair terminal at floor patch box.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Sharmin Sultana',
        action: 'Created Ticket',
        note: 'Phone line is silent.',
        timestamp: 'Yesterday 10:15 AM',
      },
      {
        id: '2',
        author: 'Omith Hasan Tanvir',
        action: 'Resolved Ticket',
        note: 'Re-punched line terminal. Handset tested OK.',
        timestamp: 'Today 09:30 AM',
      },
    ],
  },
  {
    id: 'ITV-TK-1005',
    title: 'Network Gateway High Latency in Central Archive Storage',
    description: 'Transferring uncompressed footage from SAN to Alto archive experiencing ~30% packet loss.',
    category: 'Network & Internet',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Shahidul Alam',
    requesterDepartment: 'Central Video Archive',
    requesterExtension: '30288',
    requesterLocation: 'Basement Archive Vault',
    requesterEmail: 'shahidul.archive@independent24.tv',
    assignedTo: 'Unassigned',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Shahidul Alam',
        action: 'Created Ticket',
        note: 'Large video transfers failing halfway.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  },
  {
    id: 'ITV-TK-1006',
    title: 'Studio 2 Teleprompter Secondary Display Signal Disconnected',
    description: 'Anchor side screen blacked out before news recording. Signal converter LED is unlit.',
    category: 'Broadcast & MCR Systems',
    priority: 'CRITICAL',
    status: 'RESOLVED',
    requesterName: 'Syed Moniruzzaman',
    requesterDepartment: 'Studio Operations',
    requesterExtension: '30340',
    requesterLocation: 'Studio Floor 2',
    requesterEmail: 'monir.studio@independent24.tv',
    assignedTo: 'Abu Toha Md. Anowarul Azim',
    resolutionNotes: 'Replaced failed 12V 2A DC adapter on Decimator MD-HX cross converter. Dual display verified with live rundown text.',
    rootCause: 'Power supply burnout due to power surge.',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Syed Moniruzzaman',
        action: 'Created Ticket',
        note: 'Need immediate fix before 7 PM prime bulletin.',
        timestamp: 'Yesterday 02:20 PM',
      },
      {
        id: '2',
        author: 'Abu Toha Md. Anowarul Azim',
        action: 'Resolved Ticket',
        note: 'Replaced converter power unit. Signal active.',
        timestamp: 'Yesterday 03:00 PM',
      },
    ],
  },
  {
    id: 'ITV-TK-1007',
    title: '4th Floor Accounts HP LaserJet Network Printer Paper Jam',
    description: 'Error code 13.00.00 Paper Jam in tray 2 and manual bypass tray roller worn out.',
    category: 'Printers & Peripherals',
    priority: 'MEDIUM',
    status: 'ON_HOLD',
    requesterName: 'Ziaur Rahman',
    requesterDepartment: 'Accounts & Finance',
    requesterExtension: '30110',
    requesterLocation: 'Floor 4 - Accounts Office',
    requesterEmail: 'zia.accounts@independent24.tv',
    assignedTo: 'Omith Hasan Tanvir',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: '1',
        author: 'Ziaur Rahman',
        action: 'Created Ticket',
        note: 'Monthly salary billing checks printing pending.',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: '2',
        author: 'Omith Hasan Tanvir',
        action: 'Updated Status',
        note: 'Pickup roller rubber torn. Spare pickup roller kit requisitioned from vendor.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  },
];

export default function SupportTicketsPage() {
  const { user } = useAuth();

  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveRootCause, setResolveRootCause] = useState('');

  // Print Job Card State
  const [ticketToPrint, setTicketToPrint] = useState<SupportTicket | null>(null);
  const [printQrDataUrl, setPrintQrDataUrl] = useState<string>('');

  // Form State for New Ticket
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Hardware & Workstation');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [newReqName, setNewReqName] = useState('');
  const [newReqDept, setNewReqDept] = useState('');
  const [newReqExt, setNewReqExt] = useState('');
  const [newReqLoc, setNewReqLoc] = useState('');
  const [newReqEmail, setNewReqEmail] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('Unassigned');
  const [newAssetId, setNewAssetId] = useState('');

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        setTickets(INITIAL_TICKETS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
      }
    } catch {
      setTickets(INITIAL_TICKETS);
    }
  }, []);

  // Save to local storage
  const saveTickets = (updated: SupportTicket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save tickets:', err);
    }
  };

  // Pre-fill requester info from logged in user when modal opens
  useEffect(() => {
    if (isCreateModalOpen && user) {
      if (!newReqName) setNewReqName(user.name || '');
      if (!newReqDept) setNewReqDept(user.department || 'Information Technology');
      if (!newReqExt) setNewReqExt(user.extensionNumber || '30555');
      if (!newReqEmail) setNewReqEmail(user.email || '');
      if (!newReqLoc) setNewReqLoc(user.officeLocation || 'HQ Floor 4');
    }
  }, [isCreateModalOpen, user]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const onHold = tickets.filter((t) => t.status === 'ON_HOLD').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const critical = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, open, inProgress, onHold, resolved, critical, resolvedRate };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ticket.id.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.requesterName.toLowerCase().includes(q) ||
        ticket.requesterDepartment.toLowerCase().includes(q) ||
        ticket.assignedTo.toLowerCase().includes(q) ||
        (ticket.deviceAssetId && ticket.deviceAssetId.toLowerCase().includes(q));

      // Status
      const matchStatus = statusFilter === 'ALL' || ticket.status === statusFilter;

      // Priority
      const matchPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

      // Category
      const matchCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Quick Preset Handlers for Create Form
  const applyPreset = (preset: {
    title: string;
    cat: TicketCategory;
    prio: TicketPriority;
    desc: string;
  }) => {
    setNewTitle(preset.title);
    setNewCategory(preset.cat);
    setNewPriority(preset.prio);
    setNewDescription(preset.desc);
  };

  // Create Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newReqName.trim()) {
      showWarningAlert('Input Missing', 'Please fill in Title, Description, and Requester Name.');
      return;
    }

    const nextIdNum = 1000 + tickets.length + 1;
    const ticketId = `ITV-TK-${nextIdNum}`;
    const nowIso = new Date().toISOString();

    const created: SupportTicket = {
      id: ticketId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'OPEN',
      requesterName: newReqName.trim(),
      requesterDepartment: newReqDept.trim() || 'General Operations',
      requesterExtension: newReqExt.trim() || undefined,
      requesterLocation: newReqLoc.trim() || undefined,
      requesterEmail: newReqEmail.trim() || undefined,
      assignedTo: newAssignedTo,
      deviceAssetId: newAssetId.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          id: Date.now().toString(),
          author: user?.name || newReqName || 'IT Support',
          action: 'Created Ticket',
          note: newTitle.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    const updated = [created, ...tickets];
    saveTickets(updated);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewAssetId('');
    setIsCreateModalOpen(false);
    showSuccessAlert('Ticket Created', `Support ticket #${ticketId} registered successfully!`);
  };

  // Update Status
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (newStatus === 'RESOLVED') {
      setIsResolveModalOpen(true);
      return;
    }

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const item: TicketTimelineItem = {
          id: Date.now().toString(),
          author: user?.name || 'IT Support',
          action: `Status changed to ${newStatus.replace('_', ' ')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const updatedTicket: SupportTicket = {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [item, ...t.timeline],
        };
        if (activeTicket?.id === ticketId) setActiveTicket(updatedTicket);
        return updatedTicket;
      }
      return t;
    });

    saveTickets(updated);
    showSuccessAlert('Status Updated', `Ticket status updated to ${newStatus.replace('_', ' ')}`);
  };

  // Submit Resolution
  const handleConfirmResolution = () => {
    if (!activeTicket) return;
    if (!resolveNotes.trim()) {
      showWarningAlert('Resolution Required', 'Please enter action taken / resolution summary.');
      return;
    }

    const updated = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        const item: TicketTimelineItem = {
          id: Date.now().toString(),
          author: user?.name || 'IT Support Engineer',
          action: 'Ticket Resolved',
          note: resolveNotes.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const resolved: SupportTicket = {
          ...t,
          status: 'RESOLVED',
          resolutionNotes: resolveNotes.trim(),
          rootCause: resolveRootCause.trim() || undefined,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [item, ...t.timeline],
        };
        setActiveTicket(resolved);
        return resolved;
      }
      return t;
    });

    saveTickets(updated);
    setIsResolveModalOpen(false);
    setResolveNotes('');
    setResolveRootCause('');
    showSuccessAlert('Ticket Resolved', `Ticket #${activeTicket.id} marked as resolved!`);
  };

  // Add Comment/Timeline note
  const handleAddComment = () => {
    if (!activeTicket || !newComment.trim()) return;

    const item: TicketTimelineItem = {
      id: Date.now().toString(),
      author: user?.name || 'IT Support',
      action: 'Added Note',
      note: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        const modified: SupportTicket = {
          ...t,
          updatedAt: new Date().toISOString(),
          timeline: [item, ...t.timeline],
        };
        setActiveTicket(modified);
        return modified;
      }
      return t;
    });

    saveTickets(updated);
    setNewComment('');
  };

  // Reassign Engineer
  const handleReassign = (ticketId: string, engineer: string) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const item: TicketTimelineItem = {
          id: Date.now().toString(),
          author: user?.name || 'IT Admin',
          action: `Assigned to ${engineer}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const modified: SupportTicket = {
          ...t,
          assignedTo: engineer,
          updatedAt: new Date().toISOString(),
          timeline: [item, ...t.timeline],
        };
        if (activeTicket?.id === ticketId) setActiveTicket(modified);
        return modified;
      }
      return t;
    });

    saveTickets(updated);
    showSuccessAlert('Assignee Updated', `Ticket assigned to ${engineer}`);
  };

  // Delete Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await confirmAction('Delete Ticket', `Are you sure you want to delete ticket #${ticketId}?`);
    if (!confirmed) return;

    const updated = tickets.filter((t) => t.id !== ticketId);
    saveTickets(updated);
    if (activeTicket?.id === ticketId) setActiveTicket(null);
    showSuccessAlert('Deleted', `Ticket #${ticketId} removed.`);
  };

  // Print Job Card Handler
  const handlePrintJobCard = async (ticket: SupportTicket) => {
    setTicketToPrint(ticket);
    try {
      const qrData = await QRCode.toDataURL(
        `http://202.84.45.240:2023/ticket/${ticket.id}`,
        { width: 150, margin: 1, errorCorrectionLevel: 'M' }
      );
      setPrintQrDataUrl(qrData);
    } catch {
      setPrintQrDataUrl('');
    }

    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (tickets.length === 0) return;
    const headers = [
      'Ticket ID',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Requester Name',
      'Department',
      'Extension',
      'Location',
      'Assigned To',
      'Created At',
      'Resolved At',
      'Resolution Notes',
    ];

    const rows = tickets.map((t) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.requesterName.replace(/"/g, '""')}"`,
      `"${t.requesterDepartment.replace(/"/g, '""')}"`,
      `"${t.requesterExtension || ''}"`,
      `"${t.requesterLocation || ''}"`,
      `"${t.assignedTo}"`,
      `"${t.createdAt}"`,
      `"${t.resolvedAt || ''}"`,
      `"${(t.resolutionNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `itv-support-tickets-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessAlert('Exported', 'Ticket dataset exported as CSV.');
  };

  // Reset to default sample tickets
  const handleResetDefaults = async () => {
    const ok = await confirmAction('Reset Tickets', 'Reset to initial authentic ITV sample tickets?');
    if (!ok) return;
    saveTickets(INITIAL_TICKETS);
    setActiveTicket(null);
    showSuccessAlert('Reset Complete', 'Default ITV tickets restored.');
  };

  // Helper for status badge
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            IN PROGRESS
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 border border-purple-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            ON HOLD
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <Check className="h-3 w-3 text-emerald-600" />
            RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-600 border border-slate-500/30">
            CLOSED
          </span>
        );
    }
  };

  // Helper for priority badge
  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-500/15 text-red-600 border border-red-500/30 animate-pulse">
            <Flame className="h-3 w-3" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/15 text-orange-600 border border-orange-500/30">
            <AlertTriangle className="h-3 w-3" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Support Ticket System & Helpdesk
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized IT incident resolution, broadcast hardware support & service requests — Independent Television
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border shadow-xs transition-colors"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-xl text-xs font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border shadow-xs transition-colors"
            title="Reset Sample Tickets"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-101 active:scale-99"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Tickets */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Volume</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-foreground">{stats.total}</span>
            <span className="text-[11px] text-muted-foreground">tickets</span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="p-4 rounded-2xl bg-card border border-amber-500/30 bg-amber-500/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Review</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600">{stats.open}</span>
            <span className="text-[11px] font-semibold text-amber-600/80">open tickets</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-card border border-blue-500/30 bg-blue-500/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600">
              <Wrench className="h-4 w-4 animate-spin [animation-duration:12s]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-blue-600">{stats.inProgress}</span>
            <span className="text-[11px] font-semibold text-blue-600/80">investigating</span>
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="p-4 rounded-2xl bg-card border border-red-500/30 bg-red-500/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Priority</span>
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-600">
              <Flame className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-600">{stats.critical}</span>
            <span className="text-[11px] font-semibold text-red-600/80">urgent issues</span>
          </div>
        </div>

        {/* Resolved & Closed */}
        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 bg-emerald-500/5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">{stats.resolved}</span>
            <span className="text-[11px] font-semibold text-emerald-600/80">({stats.resolvedRate}% SLA)</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID (#ITV-TK-...), issue title, employee, department, device..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Priority & Category Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[190px] truncate"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-muted rounded-xl border border-border">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
                title="Table View"
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'kanban' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
                title="Kanban Board View"
              >
                Kanban
              </button>
            </div>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          {(
            [
              { id: 'ALL', label: 'All Tickets', count: stats.total },
              { id: 'OPEN', label: 'Open', count: stats.open },
              { id: 'IN_PROGRESS', label: 'In Progress', count: stats.inProgress },
              { id: 'ON_HOLD', label: 'On Hold', count: stats.onHold },
              { id: 'RESOLVED', label: 'Resolved', count: stats.resolved },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main View: Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Assigned Engineer</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <LifeBuoy className="h-10 w-10 mx-auto stroke-[1.2] opacity-40 mb-2" />
                      <p className="font-medium text-sm">No support tickets match current filters.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setPriorityFilter('ALL');
                          setCategoryFilter('ALL');
                        }}
                        className="mt-2 text-xs text-primary hover:underline font-semibold"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* Ticket ID & Title */}
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] text-primary group-hover:underline">
                            {ticket.id}
                          </span>
                          {ticket.deviceAssetId && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
                              {ticket.deviceAssetId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground line-clamp-1 mt-0.5 group-hover:text-primary transition-colors">
                          {ticket.title}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Tag className="h-3 w-3 text-primary/70 shrink-0" />
                          <span>{ticket.category}</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(ticket.priority)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>

                      {/* Requester */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-foreground">{ticket.requesterName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ticket.requesterDepartment}
                          {ticket.requesterExtension ? ` • Ext. ${ticket.requesterExtension}` : ''}
                        </p>
                      </td>

                      {/* Assigned Engineer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px]">
                            {ticket.assignedTo !== 'Unassigned' ? ticket.assignedTo.charAt(0) : '?'}
                          </div>
                          <span
                            className={cn(
                              'font-medium text-xs',
                              ticket.assignedTo === 'Unassigned' ? 'text-amber-600 italic' : 'text-foreground'
                            )}
                          >
                            {ticket.assignedTo}
                          </span>
                        </div>
                      </td>

                      {/* Updated Time */}
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintJobCard(ticket)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Print Work Order Job Slip"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveTicket(ticket)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
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
      )}

      {/* 5. Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              { key: 'OPEN', title: 'Open Tickets', count: stats.open, color: 'border-amber-500/40' },
              { key: 'IN_PROGRESS', title: 'In Progress', count: stats.inProgress, color: 'border-blue-500/40' },
              { key: 'ON_HOLD', title: 'On Hold', count: stats.onHold, color: 'border-purple-500/40' },
              { key: 'RESOLVED', title: 'Resolved', count: stats.resolved, color: 'border-emerald-500/40' },
            ] as const
          ).map((col) => {
            const colTickets = filteredTickets.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="p-3.5 rounded-2xl bg-card border border-border flex flex-col space-y-3">
                <div className={cn('flex items-center justify-between pb-2 border-b-2', col.color)}>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">{col.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-muted text-muted-foreground">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                  {colTickets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground italic">No tickets in this lane</div>
                  ) : (
                    colTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setActiveTicket(ticket)}
                        className="p-3 rounded-xl bg-muted/30 hover:bg-muted/70 border border-border/80 shadow-2xs cursor-pointer transition-all hover:scale-101 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-primary">{ticket.id}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>

                        <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{ticket.title}</h4>

                        <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
                          <span className="truncate max-w-[120px]">{ticket.requesterName}</span>
                          <span className="font-mono text-primary/80">{ticket.assignedTo.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Ticket Details & Management Slide-Over Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-extrabold font-mono text-primary">{activeTicket.id}</span>
                {getStatusBadge(activeTicket.status)}
                {getPriorityBadge(activeTicket.priority)}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintJobCard(activeTicket)}
                  className="p-2 rounded-xl text-xs bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1 transition-colors"
                  title="Print Work Order Slip"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Job Slip</span>
                </button>
                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
              {/* Title & Category */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {activeTicket.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-foreground mt-2 leading-snug">
                  {activeTicket.title}
                </h2>
                {activeTicket.deviceAssetId && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-mono">
                    <Computer className="h-3.5 w-3.5 text-primary" />
                    <span>Target Device: <strong>{activeTicket.deviceAssetId}</strong></span>
                  </div>
                )}
              </div>

              {/* Status Action Workflow Pills */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Workflow State Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeTicket.status !== 'IN_PROGRESS' && activeTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {activeTicket.status !== 'ON_HOLD' && activeTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'ON_HOLD')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 border border-purple-600/30 transition-colors flex items-center gap-1"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Put On Hold</span>
                    </button>
                  )}

                  {activeTicket.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => {
                        setIsResolveModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'OPEN')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/10 text-amber-600 hover:bg-amber-600/20 border border-amber-600/30 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Re-open Ticket</span>
                    </button>
                  )}

                  {activeTicket.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'CLOSED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Close Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Requester Details Card */}
              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Requester Information
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Name & Department</span>
                    <strong className="text-foreground">{activeTicket.requesterName}</strong>
                    <p className="text-muted-foreground text-[11px]">{activeTicket.requesterDepartment}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Contact / Ext</span>
                    <strong className="text-foreground">
                      {activeTicket.requesterExtension ? `Ext. ${activeTicket.requesterExtension}` : 'N/A'}
                    </strong>
                    <p className="text-muted-foreground text-[11px]">{activeTicket.requesterLocation || 'Main Office'}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Engineer Selector */}
              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Assigned IT Engineer
                </span>
                <select
                  value={activeTicket.assignedTo}
                  onChange={(e) => handleReassign(activeTicket.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ITV_ENGINEERS.map((eng) => (
                    <option key={eng} value={eng}>
                      {eng}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Issue Description
                </span>
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {activeTicket.description}
                </div>
              </div>

              {/* Resolution Notes (if resolved) */}
              {activeTicket.resolutionNotes && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Resolution Summary</span>
                  </div>
                  <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    {activeTicket.resolutionNotes}
                  </p>
                  {activeTicket.rootCause && (
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic pt-1 border-t border-emerald-500/20">
                      <strong>Root Cause:</strong> {activeTicket.rootCause}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline & Activity History */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Activity Timeline ({activeTicket.timeline.length})
                </span>

                <div className="space-y-2 pl-2 border-l-2 border-border ml-1.5">
                  {activeTicket.timeline.map((item) => (
                    <div key={item.id} className="relative pl-3 text-xs space-y-0.5">
                      <div className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
                      <div className="flex items-center justify-between">
                        <strong className="text-foreground font-semibold">{item.author}</strong>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.timestamp}</span>
                      </div>
                      <p className="text-primary font-medium text-[11px]">{item.action}</p>
                      {item.note && (
                        <p className="text-muted-foreground text-xs bg-muted/30 p-2 rounded-lg border border-border/60">
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Internal Comment */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add progress note or engineering comment..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Delete Option */}
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <button
                onClick={() => handleDeleteTicket(activeTicket.id)}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Ticket</span>
              </button>

              <button
                onClick={() => setActiveTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Create New Support Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Create Support Ticket</h3>
                  <p className="text-xs text-muted-foreground">Register an incident or assistance request for IT Team</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Templates Strip */}
            <div className="px-5 py-2.5 bg-muted/40 border-b border-border/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Templates:
              </span>
              {[
                {
                  label: 'Desktop Freeze',
                  title: 'Workstation System Crash / OS Freeze',
                  cat: 'Hardware & Workstation' as TicketCategory,
                  prio: 'HIGH' as TicketPriority,
                  desc: 'Workstation experiences blue screen error or freezes while running software.',
                },
                {
                  label: 'No Internet / LAN',
                  title: 'No Network / LAN Connection at Desk',
                  cat: 'Network & Internet' as TicketCategory,
                  prio: 'HIGH' as TicketPriority,
                  desc: 'Ethernet cable plugged in but showing No Internet Access. IP conflict suspected.',
                },
                {
                  label: 'Outlook Sync',
                  title: 'Exchange Email Password / Sync Issue',
                  cat: 'Email & Domain Access' as TicketCategory,
                  prio: 'MEDIUM' as TicketPriority,
                  desc: 'Outlook prompt for credentials repeatedly and emails not updating.',
                },
                {
                  label: 'PABX Ext Fault',
                  title: 'PABX Intercom Handset Dead / No Dialtone',
                  cat: 'PABX & Telephony' as TicketCategory,
                  prio: 'LOW' as TicketPriority,
                  desc: 'Handset has no dialtone or static noise on incoming calls.',
                },
                {
                  label: 'MCR Video Signal',
                  title: 'Broadcast Ingest / Prompter Signal Loss',
                  cat: 'Broadcast & MCR Systems' as TicketCategory,
                  prio: 'CRITICAL' as TicketPriority,
                  desc: 'SDI/HDMI signal dropped on live studio display converter.',
                },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-card hover:bg-primary/10 hover:text-primary border border-border/80 transition-colors shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Issue Summary / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Newsroom Desktop #14 Blue Screen, Studio 1 Prompter Display Disconnected..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="CRITICAL">🔴 Critical (Broadcast Impact / On-Air Down)</option>
                    <option value="HIGH">🟠 High (Urgent Newsroom / Manager PC)</option>
                    <option value="MEDIUM">🟡 Medium (Standard Incident / Email / PABX)</option>
                    <option value="LOW">🟢 Low (General Request / Minor Peripheral)</option>
                  </select>
                </div>
              </div>

              {/* Requester Information */}
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Requester Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Employee Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newReqName}
                      onChange={(e) => setNewReqName(e.target.value)}
                      placeholder="e.g. Fariha Hossain"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Department</label>
                    <input
                      type="text"
                      value={newReqDept}
                      onChange={(e) => setNewReqDept(e.target.value)}
                      placeholder="e.g. News Reporting, MCR, Studio"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Intercom Extension</label>
                    <input
                      type="text"
                      value={newReqExt}
                      onChange={(e) => setNewReqExt(e.target.value)}
                      placeholder="e.g. 30214"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Desk / Location</label>
                    <input
                      type="text"
                      value={newReqLoc}
                      onChange={(e) => setNewReqLoc(e.target.value)}
                      placeholder="e.g. Floor 3 Newsroom, Studio 1"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment & Asset ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Assign to IT Engineer</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {ITV_ENGINEERS.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Hardware / Device Asset ID (Optional)</label>
                  <input
                    type="text"
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    placeholder="e.g. ITV-WS-14, ITV-PRN-02..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail the problem, error messages, symptoms, and urgency..."
                  className="w-full p-3 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                >
                  Register Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Resolution Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-base font-bold text-foreground">Mark Ticket as Resolved</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Provide the resolution steps taken and root cause for knowledge base audit.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Action Taken / Resolution Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe how the problem was resolved, parts replaced, tests conducted..."
                  className="w-full p-2.5 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Root Cause (Optional)</label>
                <input
                  type="text"
                  value={resolveRootCause}
                  onChange={(e) => setResolveRootCause(e.target.value)}
                  placeholder="e.g. Corroded cable, faulty RAM stick, DNS server timeout..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Printable Physical IT Support Work Order / Job Slip (Hidden from screen view, shown on print) */}
      {ticketToPrint && (
        <div id="itv-job-slip-print" className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
          <div className="max-w-2xl mx-auto border-2 border-slate-900 rounded-lg p-6 space-y-4 font-sans text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <img src="/itv-logo.png" alt="ITV" className="h-10 w-auto" />
                <div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-950">
                    Independent Television Ltd.
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700">IT Department • Support Job Card / Work Order</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-extrabold text-red-600 block">{ticketToPrint.id}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(ticketToPrint.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Ticket Summary Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-300">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Requester Details</p>
                <p className="font-bold text-sm text-slate-950">{ticketToPrint.requesterName}</p>
                <p className="text-xs text-slate-700">{ticketToPrint.requesterDepartment}</p>
                <p className="text-xs text-slate-700">
                  {ticketToPrint.requesterExtension ? `Intercom: Ext. ${ticketToPrint.requesterExtension}` : ''}
                  {ticketToPrint.requesterLocation ? ` • ${ticketToPrint.requesterLocation}` : ''}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Ticket Class & Priority</p>
                <p className="font-bold text-slate-950">{ticketToPrint.category}</p>
                <p className="text-xs">
                  Priority: <strong className="font-extrabold text-red-700">{ticketToPrint.priority}</strong>
                </p>
                <p className="text-xs">
                  Assigned IT Engineer: <strong>{ticketToPrint.assignedTo}</strong>
                </p>
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Reported Problem / Incident Description</p>
              <div className="p-3 bg-white border border-slate-300 rounded text-xs min-h-[70px]">
                <strong className="block mb-1">{ticketToPrint.title}</strong>
                <p className="text-slate-800 leading-relaxed">{ticketToPrint.description}</p>
              </div>
            </div>

            {/* Action Taken & Diagnosis */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">IT Engineer Action Taken & Root Cause</p>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs min-h-[80px]">
                {ticketToPrint.resolutionNotes ? (
                  <>
                    <p className="text-slate-900 leading-relaxed">{ticketToPrint.resolutionNotes}</p>
                    {ticketToPrint.rootCause && (
                      <p className="text-slate-600 italic mt-1">
                        <strong>Root Cause:</strong> {ticketToPrint.rootCause}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 italic">Technician inspection & diagnostic notes:</p>
                )}
              </div>
            </div>

            {/* QR Code & Signatures */}
            <div className="pt-6 grid grid-cols-3 items-end gap-4 border-t border-slate-300">
              <div className="flex items-center gap-2">
                {printQrDataUrl && <img src={printQrDataUrl} alt="QR" className="h-16 w-16" />}
                <div className="text-[9px] text-slate-500">
                  <p>Scan to verify</p>
                  <p className="font-mono">{ticketToPrint.id}</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-bold text-slate-900">IT Support Engineer</p>
                  <p className="text-[9px] text-slate-500">Signature & Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-bold text-slate-900">Requester / User Acknowledgment</p>
                  <p className="text-[9px] text-slate-500">Signature & Date</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[9px] text-slate-400 border-t border-slate-200">
              Independent Television Limited • 179 Shahid Tajuddin Ahmed Sharani, Tejgaon I/A, Dhaka-1208 • IT Support Ext. 30555
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
