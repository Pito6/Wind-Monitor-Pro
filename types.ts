
export interface WindData {
  location: string;
  speedKmh: number;
  gustsKmh?: number;
  direction: string;
  directionDeg: number;
  description: string;
  beaufortScale: number;
  timestamp: string;
  visualImageUrl?: string;
  forecast: Array<{
    time: string;
    speed: number;
  }>;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface WeatherState {
  data: WindData | null;
  loading: boolean;
  error: string | null;
  sources: GroundingSource[];
  alertSettings: {
    threshold: number;
    enabled: boolean;
  };
}
