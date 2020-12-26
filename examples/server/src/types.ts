export interface LocationData {
  id: number;
  name: string;
}

export interface BossData {
  id: number;
  name: string;
  required: boolean;
  locationId: number;
}

export interface ReviewData {
  id: string;
  subjectId: number;
  subjectType: number;
  time: Date;
  author?: string;
  difficulty: string;
  design?: number;
  theme?: number;
}
