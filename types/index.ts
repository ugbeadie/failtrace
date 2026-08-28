export type Equipment = {
  id: string;
  name: string;
  location: string;
};

export type Part = {
  id: string;
  name: string;
};

export type Technician = {
  id: string;
  name: string;
  trade: string;
};

export type DownstreamItem = Equipment & { hops: number };

export type EquipmentDetail = {
  equipment: Equipment;
  downstream: DownstreamItem[];
  parts: Part[];
  technicians: Technician[];
};

export type SharedPart = Part & {
  machineCount: number;
  machines: string[];
};

export type CriticalityRow = Equipment & { impact: number };
