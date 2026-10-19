export type ServerStatusType = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'MAINTENANCE' | 'UNKNOWN';

export type SoundType = 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny' | 'click';

export const U_HEIGHT_PX = 21; // 21px per 1U (42U = 882px, 25% height reduction for compact fit)

export interface ServerNode {
  id: string;
  serverName: string;
  hostname?: string | null;
  ipAddress?: string | null;
  serverType?: string | null;
  operatingSystem?: string | null;
  location?: string | null;
  cpu?: string | null;
  ram?: string | null;
  diskUsage?: string | null;
  uptime?: string | null;
  lastChecked?: string | null;
  status: ServerStatusType;
  purpose?: string | null;
  administrator?: string | null;
  remarks?: string | null;
  port?: number;
  online?: boolean;
  latencyMs?: number;
}

export type EquipmentCategory =
  | 'server'
  | 'switch'
  | 'patch_panel'
  | 'storage_array'
  | 'kvm'
  | 'ups'
  | 'pdu'
  | 'filler'
  | 'sdi_converter';

export interface RackEquipment {
  id: string;
  uStart: number; // e.g. 37 (1-based rack unit)
  uHeight: number; // e.g. 1 for 1U, 2 for 2U, 3 for 3U, 4 for 4U
  category: EquipmentCategory;
  name: string;
  model: string;
  vendor: 'Dell' | 'HP' | 'Supermicro' | 'Cisco' | 'Arista' | 'Grass Valley' | 'APC' | 'CyberPower' | 'Blackmagic' | 'Generic';
  serverNodeId?: string; // Links to live ITV ServerNode if this slot represents an ITV server
  // Hardware visual attributes
  driveBayCount?: number;
  driveFormFactor?: '2.5' | '3.5';
  hasBezel?: boolean;
  hasLcd?: boolean;
  dualPsu?: boolean;
  portCount?: number;
  description?: string;
  specsSummary?: string;
}

export type RackViewMode = 'front' | 'rear' | '3d';
