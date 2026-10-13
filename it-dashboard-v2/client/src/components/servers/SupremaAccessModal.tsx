'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Fingerprint,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  X,
  CornerDownLeft,
  Delete,
  Hash,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface EmployeeInfo {
  employeeId: string;
  name: string;
  role: string;
  department?: string;
  designation?: string;
}

interface SupremaAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
  rackNumber: string;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny') => void;
}

export function SupremaAccessModal({
  isOpen,
  onClose,
  onAccessGranted,
  rackNumber,
  soundEnabled,
  onPlaySound,
}: SupremaAccessModalProps) {
  const { user } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'GRANTED' | 'DENIED'>('IDLE');
  const [grantedUser, setGrantedUser] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [systemUsers, setSystemUsers] = useState<EmployeeInfo[]>([]);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real registered employees from database on mount or modal open
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users');
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && active) {
          const mapped: EmployeeInfo[] = list
            .map((u: any) => ({
              employeeId: String(u.employeeId || '').trim(),
              name: u.name || 'Staff Member',
              role: u.role || 'VIEWER',
              department: u.department || '',
              designation: u.designation || '',
            }))
            .filter((e) => e.employeeId.length > 0);
          setSystemUsers(mapped);
        }
      } catch (err) {
        console.warn('Could not load user directory for Suprema terminal:', err);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setStatus('IDLE');
      setGrantedUser('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Play audio helper
  const triggerAudio = (type: 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny') => {
    if (soundEnabled && onPlaySound) {
      onPlaySound(type);
    }
  };

  // Strictly authenticate entered Employee ID (Server PIN)
  const verifyEmployeeId = (idToTest: string) => {
    const rawId = idToTest.trim();
    const cleanId = rawId.toUpperCase();
    const cleanDigits = cleanId.replace(/\D/g, '');

    if (!cleanId) {
      triggerAudio('deny');
      setStatus('DENIED');
      setErrorMsg('PLEASE ENTER EMPLOYEE ID');
      setTimeout(() => setStatus('IDLE'), 1400);
      return;
    }

    setStatus('VERIFYING');

    setTimeout(() => {
      // Build master list of registered employees (DB users + fallback seeded staff)
      const fallbackStaff: EmployeeInfo[] = [
        { employeeId: '101741', name: 'Omith Hasan', role: 'SUPER_ADMIN', department: 'IT Operations', designation: 'Head of IT' },
        { employeeId: 'EMP-0001', name: 'Omith Hasan', role: 'SUPER_ADMIN', department: 'IT Operations', designation: 'Head of IT' },
        { employeeId: '100815', name: 'Apu Roy', role: 'IT_ADMIN', department: 'IT Operations', designation: 'Senior Network Engineer' },
        { employeeId: 'EMP-0002', name: 'Apu Roy', role: 'IT_ADMIN', department: 'IT Operations', designation: 'Senior Network Engineer' },
        { employeeId: '100096', name: 'Md. Asaduzzaman', role: 'IT_SUPPORT', department: 'IT Operations', designation: 'IT Support Engineer' },
        { employeeId: 'EMP-0003', name: 'Md. Asaduzzaman', role: 'IT_SUPPORT', department: 'IT Operations', designation: 'IT Support Engineer' },
        { employeeId: '100204', name: 'Mohammed Abul Hossain', role: 'VIEWER', department: 'Broadcast', designation: 'Operations' },
        { employeeId: '101503', name: 'Pronojit Mallick Jit', role: 'VIEWER', department: 'Engineering', designation: 'Broadcast Engineer' },
        { employeeId: '101745', name: 'Md. Yeamin Islam Sakib', role: 'VIEWER', department: 'IT Support', designation: 'Assistant Engineer' },
        { employeeId: '101535', name: 'Md. Shofiqui Islam', role: 'VIEWER', department: 'MCR Operations', designation: 'MCR Lead' },
        { employeeId: '101803', name: 'Tareq Ahmed', role: 'VIEWER', department: 'Broadcast Engineering', designation: 'Specialist' },
        { employeeId: '101737', name: 'Nadit Rabab Shah Pranzol', role: 'VIEWER', department: 'Engineering', designation: 'SysAdmin' },
        { employeeId: '101554', name: 'Ashraful Islam', role: 'VIEWER', department: 'Information Technology', designation: 'IT Executive' },
        { employeeId: 'ITV-101', name: 'Broadcast IT Supervisor', role: 'IT_ADMIN', department: 'ITV Engineering', designation: 'Supervisor' },
      ];

      // Merge unique employees
      const employeeMap = new Map<string, EmployeeInfo>();
      for (const s of fallbackStaff) {
        employeeMap.set(s.employeeId.toUpperCase(), s);
      }
      for (const u of systemUsers) {
        if (u.employeeId) {
          employeeMap.set(u.employeeId.toUpperCase(), u);
        }
      }
      if (user?.employeeId) {
        employeeMap.set(user.employeeId.toUpperCase(), {
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
          department: user.department || 'IT Operations',
          designation: user.designation || 'Authorized User',
        });
      }

      // Strict Lookup: ONLY valid, existing employee IDs match
      let matchedEmployee: EmployeeInfo | null = null;

      // 1. Exact match on raw ID
      if (employeeMap.has(cleanId)) {
        matchedEmployee = employeeMap.get(cleanId)!;
      }
      // 2. Exact match with "EMP-" prefix
      else if (employeeMap.has(`EMP-${cleanId}`)) {
        matchedEmployee = employeeMap.get(`EMP-${cleanId}`)!;
      }
      // 3. Match numeric digits against existing employee numeric IDs (minimum 4 digits to prevent random collision)
      else if (cleanDigits && cleanDigits.length >= 4) {
        for (const emp of employeeMap.values()) {
          const empDigits = emp.employeeId.replace(/\D/g, '');
          if (empDigits === cleanDigits) {
            matchedEmployee = emp;
            break;
          }
        }
      }

      // Strict enforcement: Only genuine employee IDs unlock the cabinet
      if (matchedEmployee) {
        const title = `${matchedEmployee.name} (${matchedEmployee.employeeId})`;
        const subtitle = matchedEmployee.designation || matchedEmployee.department || matchedEmployee.role;
        setStatus('GRANTED');
        setGrantedUser(`${title} • ${subtitle}`);
        triggerAudio('grant');

        setTimeout(() => {
          triggerAudio('door');
          onAccessGranted();
          setTimeout(() => {
            onClose();
          }, 800);
        }, 600);
      } else {
        // Access Denied: Arbitrary PIN or non-employee ID entered
        setStatus('DENIED');
        setErrorMsg('UNAUTHORIZED: EMPLOYEE ID NOT RECOGNIZED');
        triggerAudio('deny');
        setTimeout(() => {
          setStatus('IDLE');
          setPinInput('');
        }, 1600);
      }
    }, 400);
  };

  // Handle keypad digit press
  const handleKeyPress = (char: string) => {
    if (status === 'VERIFYING' || status === 'GRANTED') return;
    triggerAudio('key');

    if (char === 'DEL') {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (char === 'OK') {
      verifyEmployeeId(pinInput);
    } else {
      if (pinInput.length < 12) {
        setPinInput((prev) => prev + char);
      }
    }
  };


  // Keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        verifyEmployeeId(pinInput);
      } else if (e.key === 'Backspace') {
        triggerAudio('key');
        setPinInput((prev) => prev.slice(0, -1));
      } else if (/^[0-9]$/.test(e.key)) {
        triggerAudio('key');
        if (pinInput.length < 12) {
          setPinInput((prev) => prev + e.key);
        }
      } else if (/^[a-zA-Z\-]$/.test(e.key)) {
        triggerAudio('key');
        if (pinInput.length < 12) {
          setPinInput((prev) => prev + e.key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, pinInput, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Suprema Terminal Outer Chassis */}
      <div className="relative w-full max-w-[370px] rounded-3xl bg-gradient-to-b from-[#1c1d27] via-[#101118] to-black border-2 border-zinc-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(34,211,238,0.15)] overflow-hidden font-mono">
        {/* Chrome Metallic Beveled Trim */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-zinc-500 via-zinc-200 to-zinc-600" />

        {/* Top Header: Official Suprema Brand & Subtitle */}
        <div className="p-3.5 pb-2 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-cyan-400 shadow">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-black text-sm tracking-widest text-white uppercase">
                  SUPREMA
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold">
                  BioStation 2
                </span>
              </div>
              <p className="text-[8px] text-zinc-400 font-semibold mt-0.5">
                ITV MCR ACCESS CONTROLLER • RACK {rackNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Close Terminal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* -------------------------------------------------------------
            OLED DIGITAL SCREEN (REALISTIC SUPREMA ACCESS TERMINAL DISPLAY)
            ------------------------------------------------------------- */}
        <div className="p-3">
          <div
            className={`p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              status === 'GRANTED'
                ? 'bg-emerald-950/80 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : status === 'DENIED'
                ? 'bg-rose-950/80 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-shake'
                : 'bg-black/90 border-cyan-500/40 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]'
            }`}
          >
            {/* Top Status Bar: Live Time + Signal */}
            <div className="flex items-center justify-between text-[8px] text-zinc-400 mb-1.5 pb-1 border-b border-zinc-800/80">
              <span className="text-zinc-300 font-bold">{timeStr || '12:00:00 PM'}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400">100M LAN</span>
                <div className="flex items-center gap-0.5">
                  <div className="h-1 w-0.5 bg-emerald-400" />
                  <div className="h-1.5 w-0.5 bg-emerald-400" />
                  <div className="h-2 w-0.5 bg-emerald-400" />
                  <div className="h-2.5 w-0.5 bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Screen State Content */}
            {status === 'GRANTED' ? (
              <div className="py-2 text-center space-y-1">
                <div className="inline-flex p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
                  <Unlock className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-300 tracking-wider">
                  ✓ ACCESS GRANTED
                </h4>
                <p className="text-[10px] text-white font-bold truncate">
                  {grantedUser}
                </p>
                <p className="text-[8px] text-emerald-400 font-semibold">
                  SOLENOID UNLOCKED • CABINET DOOR OPENING
                </p>
              </div>
            ) : status === 'DENIED' ? (
              <div className="py-2 text-center space-y-1">
                <div className="inline-flex p-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-rose-300 tracking-wider">
                  ✕ ACCESS DENIED
                </h4>
                <p className="text-[9.5px] text-rose-200 font-bold">
                  {errorMsg || 'INVALID EMPLOYEE ID'}
                </p>
                <p className="text-[8px] text-rose-400">
                  SECURITY ALERT LOGGED TO SYSLOG
                </p>
              </div>
            ) : status === 'VERIFYING' ? (
              <div className="py-3 text-center space-y-1">
                <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[10px] text-cyan-300 font-bold">
                  VERIFYING CREDENTIALS...
                </p>
              </div>
            ) : (
              <div className="py-1 space-y-1 text-center">
                <p className="text-[8.5px] text-zinc-400 tracking-widest uppercase">
                  ENTER EMPLOYEE ID / PIN
                </p>

                {/* Large Monospace Input Box */}
                <div className="h-10 bg-zinc-950 rounded-xl border border-zinc-700/80 px-3 flex items-center justify-between text-base font-bold text-cyan-300 tracking-wider shadow-inner">
                  <span className="flex items-center gap-1 font-mono">
                    <span className="text-zinc-500 text-xs font-normal">ID:</span>
                    <span>{pinInput || ''}</span>
                    <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
                  </span>
                  {pinInput && (
                    <button
                      onClick={() => {
                        triggerAudio('key');
                        setPinInput('');
                      }}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                      title="Clear"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                <p className="text-[7.5px] text-cyan-400 font-semibold tracking-wide">
                  SERVER ACCESS REQUIRES VALID EMPLOYEE ID (PIN)
                </p>
                <p className="text-[7px] text-zinc-500">
                  USE KEYPAD OR KEYBOARD • ONLY REGISTERED STAFF AUTHORIZED
                </p>
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            CAPACITIVE TOUCH NUMERIC KEYPAD (3x4 MATRIX)
            ------------------------------------------------------------- */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: '1', sub: '.,-' },
              { val: '2', sub: 'ABC' },
              { val: '3', sub: 'DEF' },
              { val: '4', sub: 'GHI' },
              { val: '5', sub: 'JKL' },
              { val: '6', sub: 'MNO' },
              { val: '7', sub: 'PQRS' },
              { val: '8', sub: 'TUV' },
              { val: '9', sub: 'WXYZ' },
              { val: 'DEL', icon: <Delete className="h-4 w-4 text-rose-400" />, isSpecial: true },
              { val: '0', sub: '+' },
              { val: 'OK', icon: <CornerDownLeft className="h-4 w-4 text-emerald-400" />, isSpecial: true },
            ].map((btn) => (
              <button
                key={btn.val}
                onClick={() => handleKeyPress(btn.val)}
                className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 active:scale-95 shadow cursor-pointer ${
                  btn.val === 'OK'
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300'
                    : btn.val === 'DEL'
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300'
                    : 'bg-[#181923] hover:bg-[#222433] hover:border-cyan-500/50 border-zinc-700/80 text-white'
                }`}
              >
                {btn.icon ? (
                  btn.icon
                ) : (
                  <>
                    <span className="text-base font-bold leading-none">{btn.val}</span>
                    {btn.sub && (
                      <span className="text-[6.5px] text-zinc-400 leading-none mt-0.5 tracking-wider">
                        {btn.sub}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>


        {/* Biometric Sensor Area at Bottom */}
        <div className="p-2.5 bg-black text-center border-t border-zinc-900 flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <span className="text-[7.5px] text-zinc-400 uppercase font-bold tracking-wider">
            OPTI-FINGERPRINT 500 DPI & RFID ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
