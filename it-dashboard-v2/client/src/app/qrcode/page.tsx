'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ExternalLink,
  RefreshCw,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Globe,
  Sliders,
  Printer,
  History,
  Trash2,
  Wifi,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { showSuccessAlert, showWarningAlert } from '@/lib/sweetalert';

interface QrHistoryItem {
  id: string;
  text: string;
  dataUrl: string;
  createdAt: string;
  size: number;
}

const DEFAULT_PORTAL_URL = 'http://202.84.45.240:2023/qrcode/';

export default function QrCodePage() {
  const [activeTab, setActiveTab] = useState<'portal' | 'studio'>('portal');

  // Portal State
  const [portalUrl, setPortalUrl] = useState(DEFAULT_PORTAL_URL);
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Studio Generator State
  const [qrText, setQrText] = useState('http://202.84.45.240:2023/qrcode/');
  const [qrSize, setQrSize] = useState<number>(512);
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);

  // History State
  const [history, setHistory] = useState<QrHistoryItem[]>([]);

  // ITV Quick Presets
  const presets = [
    {
      name: 'ITV QR Generator',
      url: 'http://202.84.45.240:2023/qrcode/',
      category: 'Internal Portal',
    },
    {
      name: 'ITV HRMS (Xfactor)',
      url: 'http://202.84.45.240:2023/xfactor/',
      category: 'Internal Portal',
    },
    {
      name: 'Independent Mail',
      url: 'https://mail.independent24.tv',
      category: 'Official Mail',
    },
    {
      name: 'ITV Food Order',
      url: 'http://202.84.45.1:50765',
      category: 'Catering Portal',
    },
    {
      name: 'ITV Central Operations',
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      category: 'IT Dashboard',
    },
  ];

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('itv_qr_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load QR history', e);
    }
  }, []);

  // Generate QR Code with canvas rendering and optional ITV Logo
  const generateCode = async (textToEncode = qrText) => {
    if (!textToEncode.trim()) {
      showWarningAlert('Input Required', 'Please enter text or URL for QR Code.');
      return;
    }

    try {
      // 1. Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;

      await QRCode.toCanvas(canvas, textToEncode.trim(), {
        width: qrSize,
        margin: includeMargin ? 2 : 0,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      // 2. Draw ITV logo in center if enabled
      if (includeLogo) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = '/itv-logo.png';

          await new Promise<void>((resolve) => {
            logoImg.onload = () => {
              const logoW = Math.floor(qrSize * 0.20);
              const logoH = Math.floor(logoW * (205 / 191));
              const pad = Math.floor(logoW * 0.22);
              const badgeRadius = (Math.max(logoW, logoH) + pad) / 2;
              const cx = qrSize / 2;
              const cy = qrSize / 2;

              // Draw white circular/rounded badge background behind logo
              ctx.save();
              ctx.fillStyle = bgColor || '#ffffff';
              ctx.beginPath();
              ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
              ctx.fill();

              // Border ring
              ctx.lineWidth = Math.max(2, Math.floor(qrSize * 0.01));
              ctx.strokeStyle = '#E31E24';
              ctx.stroke();

              // Draw logo centered
              ctx.drawImage(logoImg, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
              ctx.restore();
              resolve();
            };
            logoImg.onerror = () => {
              // Fallback if logo fails to load: continue without logo
              resolve();
            };
          });
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedDataUrl(dataUrl);

      // Save to history
      const newItem: QrHistoryItem = {
        id: Date.now().toString(),
        text: textToEncode.trim(),
        dataUrl,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        size: qrSize,
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.text !== textToEncode.trim());
        const updated = [newItem, ...filtered].slice(0, 8);
        try {
          localStorage.setItem('itv_qr_history', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      showWarningAlert('Generation Error', err?.message || 'Failed to generate QR Code');
    }
  };

  // Initial code generation on mount
  useEffect(() => {
    generateCode('http://202.84.45.240:2023/qrcode/');
  }, [qrSize, fgColor, bgColor, errorLevel, includeMargin, includeLogo]);

  // Download Handler
  const handleDownload = (format: 'png' | 'svg' = 'png') => {
    if (!generatedDataUrl) return;
    const a = document.createElement('a');
    a.href = generatedDataUrl;
    a.download = `itv-qrcode-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccessAlert('Downloaded', `QR Code downloaded as ${format.toUpperCase()}`);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!generatedDataUrl) return;
    try {
      const res = await fetch(generatedDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccessAlert('Copied to Clipboard', 'QR Code image copied to your clipboard!');
    } catch (err) {
      // Fallback: copy text string
      await navigator.clipboard.writeText(qrText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccessAlert('Copied Text', 'QR content copied to clipboard.');
    }
  };

  // Print QR Badge
  const handlePrint = () => {
    if (!generatedDataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Independent Television QR Badge</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .card {
              border: 2px solid #E31E24;
              border-radius: 12px;
              padding: 24px;
              max-width: 380px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              font-size: 16px;
              font-weight: bold;
              color: #E31E24;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .sub {
              font-size: 11px;
              color: #666;
              margin-bottom: 16px;
            }
            img {
              max-width: 260px;
              height: auto;
              border-radius: 8px;
            }
            .content {
              margin-top: 14px;
              font-size: 12px;
              word-break: break-all;
              font-family: monospace;
              color: #333;
              background: #f4f4f4;
              padding: 8px;
              border-radius: 6px;
            }
            .footer {
              margin-top: 14px;
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">INDEPENDENT TELEVISION</div>
            <div class="sub">IT Operations & Asset Management</div>
            <img src="${generatedDataUrl}" alt="QR Code" />
            <div class="content">${qrText}</div>
            <div class="footer">Developed by ITV IT &copy; ${new Date().getFullYear()} | All rights reserved.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Fullscreen toggle for iframe
  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Reload iframe
  const reloadIframe = () => {
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  QR Code Generator & ITV Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                  202.84.45.240:2023
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Independent Television internal QR generation portal and high-resolution asset code studio.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & External Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'portal'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span>ITV Central Portal</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'studio'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>High-Res Studio</span>
            </button>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-muted/50 hover:bg-muted text-foreground border border-border transition-all hover:border-primary/40 shadow-xs"
            title="Open portal in new browser tab"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Open Direct</span>
          </a>
        </div>
      </div>

      {/* Tab 1: Live Embedded ITV Portal */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          {/* Portal Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>Portal URL:</span>
              </div>
              <input
                type="text"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="http://202.84.45.240:2023/qrcode/"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {portalUrl !== DEFAULT_PORTAL_URL && (
                <button
                  onClick={() => setPortalUrl(DEFAULT_PORTAL_URL)}
                  className="px-2 py-1 text-[11px] rounded bg-muted text-muted-foreground hover:text-foreground border border-border"
                  title="Reset to default URL"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={reloadIframe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted text-foreground border border-border transition-colors"
                title="Refresh Portal View"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isIframeLoading ? 'animate-spin text-primary' : ''}`} />
                <span>Reload</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted text-foreground border border-border transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div
            ref={iframeContainerRef}
            className={`relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[750px] h-[calc(100vh-280px)]'
            }`}
          >
            {/* Loading Indicator */}
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 backdrop-blur-xs">
                <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-foreground">Connecting to ITV QR Portal...</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">{portalUrl}</p>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={
                !portalUrl ||
                portalUrl === DEFAULT_PORTAL_URL ||
                portalUrl.includes('202.84.45.240') ||
                portalUrl.includes('qrcode')
                  ? '/api/portal/qrcode'
                  : portalUrl
              }
              title="ITV QR Code Generator"
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsIframeLoading(false)}
              onError={() => setIsIframeLoading(false)}
              allow="clipboard-write"
            />
          </div>

          {/* Quick Info & Fallback Banner */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Hosting Server: <strong>Apache 2.4.58 / PHP 8.2</strong> at Independent Television internal gateway (<strong>202.84.45.240:2023</strong>).
              </span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <button
                onClick={() => setActiveTab('studio')}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <span>Need custom high-res or logo badges? Open Studio</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Native High-Res Studio Generator */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Preset Selector Card */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick ITV Presets
                </label>
                <span className="text-[10px] text-muted-foreground">Click to populate</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setQrText(preset.url);
                      generateCode(preset.url);
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      qrText === preset.url
                        ? 'bg-primary/10 border-primary/40 text-foreground font-semibold shadow-xs'
                        : 'bg-muted/40 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-foreground">{preset.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted-foreground/15 text-muted-foreground font-mono">
                        {preset.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground truncate w-full mt-1">
                      {preset.url}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Content Card */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Content to Encode (URL, Text, IP, WiFi, ID)
                </label>
                <textarea
                  rows={3}
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="Enter URL (e.g. http://202.84.45.240:2023/qrcode/) or plain text..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => generateCode(qrText)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Update QR Code</span>
                </button>
                <button
                  onClick={() => {
                    setQrText('');
                    setGeneratedDataUrl('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-muted text-muted-foreground hover:text-foreground border border-border"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Design & Style Settings Card */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Style & Resolution Options</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resolution */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Resolution Quality
                  </label>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={256}>256 × 256 px (Standard)</option>
                    <option value={512}>512 × 512 px (High Definition)</option>
                    <option value={1024}>1024 × 1024 px (Ultra HD / Print)</option>
                    <option value={2048}>2048 × 2048 px (Production Print 300DPI)</option>
                  </select>
                </div>

                {/* Error Correction */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Error Correction Level
                  </label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="L">L - Low (7% recovery)</option>
                    <option value="M">M - Medium (15% recovery)</option>
                    <option value="Q">Q - Quartile (25% recovery)</option>
                    <option value="H">H - High (30% recovery - Recommended)</option>
                  </select>
                </div>

                {/* Color Choices */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Foreground Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-8 w-10 rounded cursor-pointer border border-border p-0.5 bg-card"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-muted/40 border border-border text-foreground"
                    />
                    <button
                      onClick={() => setFgColor('#E31E24')}
                      className="px-2 py-1 text-[10px] rounded bg-red-600/10 text-red-600 border border-red-600/30 font-semibold"
                    >
                      ITV Red
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-10 rounded cursor-pointer border border-border p-0.5 bg-card"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-muted/40 border border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Embed Independent Television Center Logo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={includeMargin}
                    onChange={(e) => setIncludeMargin(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Include Safe Quiet-Zone Margin</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview & Export (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live QR Card */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-md flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex items-center justify-between w-full pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    High-Res Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-muted-foreground">
                  {qrSize} × {qrSize} px • Level {errorLevel}
                </span>
              </div>

              {/* QR Image Display */}
              <div className="p-4 rounded-xl bg-white border border-border/80 shadow-inner flex items-center justify-center min-h-[280px] w-full max-w-[320px]">
                {generatedDataUrl ? (
                  <img
                    src={generatedDataUrl}
                    alt="Generated QR Code"
                    className="max-w-full h-auto object-contain transition-transform duration-200 hover:scale-102"
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground py-8">
                    <QrCode className="h-12 w-12 stroke-[1.2] mb-2 opacity-40" />
                    <p className="text-xs">Enter text to generate preview</p>
                  </div>
                )}
              </div>

              {/* QR Metadata string */}
              <div className="w-full space-y-1.5">
                <p className="text-[11px] font-mono text-muted-foreground truncate bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                  {qrText || 'No text set'}
                </p>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  Developed by ITV IT &copy; {new Date().getFullYear()} | All rights reserved.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                <button
                  onClick={() => handleDownload('png')}
                  disabled={!generatedDataUrl}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!generatedDataUrl}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-all disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  disabled={!generatedDataUrl}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all disabled:opacity-50 col-span-2"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  <span>Print Physical ITV Asset Badge</span>
                </button>
              </div>
            </div>

            {/* Quick History List */}
            {history.length > 0 && (
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Recent Generation
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('itv_qr_history');
                    }}
                    className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setQrText(item.text);
                        generateCode(item.text);
                      }}
                      className="p-2 rounded-xl bg-muted/30 hover:bg-muted/70 border border-border flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <img
                          src={item.dataUrl}
                          alt="Thumbnail"
                          className="h-8 w-8 rounded bg-white p-0.5 border border-border/80 shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {item.text}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.createdAt} • {item.size}px
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
