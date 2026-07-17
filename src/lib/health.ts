// Cross-platform Health bridge. Reads from Apple HealthKit (iOS) and
// Google Health Connect (Android) via Capacitor plugins. All exports are
// safe to import from anywhere — on web/unsupported platforms every call
// resolves to a graceful no-op.
import { Capacitor } from '@capacitor/core';

export type HealthWorkout = {
  source_id: string;
  activity: string;
  started_at: string;
  duration_min: number;
  calories?: number;
  distance_m?: number;
};

export type HealthSnapshot = {
  captured_on: string; // YYYY-MM-DD
  source: 'healthkit' | 'health_connect' | 'unavailable';
  steps?: number;
  calories_burned?: number;
  distance_m?: number;
  active_minutes?: number;
  avg_heart_rate?: number;
  resting_heart_rate?: number;
  sleep_minutes?: number;
  weight_kg?: number;
  height_cm?: number;
  workouts: HealthWorkout[];
};

const platform = () =>
  typeof window !== 'undefined' && Capacitor?.isNativePlatform?.()
    ? Capacitor.getPlatform()
    : 'web';

export function isHealthAvailable() {
  const p = platform();
  return p === 'ios' || p === 'android';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function readHealthKit(sinceISO: string): Promise<HealthSnapshot> {
  const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit');
  const READ = [
    'steps',
    'calories',
    'distance',
    'activity',
    'heartRate',
    'sleep',
    'weight',
    'height',
  ] as const;
  try {
    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: READ as unknown as string[],
      write: [],
    });
  } catch {
    return { captured_on: todayISO(), source: 'unavailable', workouts: [] };
  }
  const start = new Date(sinceISO);
  const end = new Date();
  const q = { startDate: start.toISOString(), endDate: end.toISOString(), limit: 0 } as any;

  const safe = async (fn: () => Promise<any>): Promise<any> => {
    try { return await fn(); } catch { return null; }
  };

  const [steps, calories, distance, hr, sleep, weight, height, workouts] = await Promise.all([
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'stepCount' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'activeEnergyBurned' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'distanceWalkingRunning' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'heartRate' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'sleepAnalysis' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'weight' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'height' })),
    safe(() => (CapacitorHealthkit as any).queryHKitSampleType({ ...q, sampleName: 'workoutType' })),
  ]);

  const sum = (rows: any) => (rows?.resultData ?? []).reduce((a: number, r: any) => a + Number(r.value ?? 0), 0);
  const avg = (rows: any) => {
    const rs = rows?.resultData ?? [];
    if (!rs.length) return undefined;
    return Math.round(rs.reduce((a: number, r: any) => a + Number(r.value ?? 0), 0) / rs.length);
  };
  const latest = (rows: any) => {
    const rs = rows?.resultData ?? [];
    if (!rs.length) return undefined;
    return Number(rs[rs.length - 1].value ?? 0);
  };
  const sleepMin = (() => {
    const rs = sleep?.resultData ?? [];
    return Math.round(rs.reduce((a: number, r: any) => a + Number(r.duration ?? 0), 0) / 60);
  })();

  const wk: HealthWorkout[] = (workouts?.resultData ?? []).map((w: any, i: number) => ({
    source_id: String(w.uuid ?? w.startDate ?? i),
    activity: String(w.workoutActivityName ?? w.activityType ?? 'workout'),
    started_at: String(w.startDate ?? new Date().toISOString()),
    duration_min: Math.round(Number(w.duration ?? 0) / 60),
    calories: Number(w.totalEnergyBurned ?? 0) || undefined,
    distance_m: Number(w.totalDistance ?? 0) || undefined,
  }));

  return {
    captured_on: todayISO(),
    source: 'healthkit',
    steps: Math.round(sum(steps)) || undefined,
    calories_burned: Math.round(sum(calories)) || undefined,
    distance_m: Math.round(sum(distance)) || undefined,
    active_minutes: undefined,
    avg_heart_rate: avg(hr),
    resting_heart_rate: undefined,
    sleep_minutes: sleepMin || undefined,
    weight_kg: latest(weight),
    height_cm: latest(height) ? Number(latest(height)) * 100 : undefined,
    workouts: wk,
  };
}

async function readHealthConnect(sinceISO: string): Promise<HealthSnapshot> {
  const { HealthConnect } = (await import('@kiwi-health/capacitor-health-connect')) as any;
  const available = await safeCall(() => HealthConnect.checkAvailability?.());
  if (available && available.availability && available.availability !== 'Available') {
    return { captured_on: todayISO(), source: 'unavailable', workouts: [] };
  }
  const types = ['Steps', 'ActiveCaloriesBurned', 'Distance', 'HeartRate', 'SleepSession', 'Weight', 'Height', 'ExerciseSession'];
  try {
    await HealthConnect.requestHealthPermissions({ read: types, write: [] });
  } catch {
    return { captured_on: todayISO(), source: 'unavailable', workouts: [] };
  }

  const timeRangeFilter = { type: 'between', startTime: sinceISO, endTime: new Date().toISOString() };
  const query = async (recordType: string) => {
    try {
      const res = await HealthConnect.readRecords({ type: recordType, timeRangeFilter });
      return res?.records ?? [];
    } catch { return []; }
  };
  const [steps, cals, dist, hr, sleep, weight, height, sessions] = await Promise.all([
    query('Steps'), query('ActiveCaloriesBurned'), query('Distance'),
    query('HeartRate'), query('SleepSession'), query('Weight'), query('Height'), query('ExerciseSession'),
  ]);

  const sum = (rows: any[], key: string) => rows.reduce((a, r) => a + Number(r[key]?.value ?? r[key] ?? 0), 0);
  const avgHr = (() => {
    const flat = hr.flatMap((r: any) => (r.samples ?? []).map((s: any) => Number(s.beatsPerMinute)));
    if (!flat.length) return undefined;
    return Math.round(flat.reduce((a: number, v: number) => a + v, 0) / flat.length);
  })();
  const sleepMin = sleep.reduce((a: number, r: any) => {
    const s = new Date(r.startTime).getTime();
    const e = new Date(r.endTime).getTime();
    return a + Math.max(0, Math.round((e - s) / 60000));
  }, 0);
  const latestNum = (rows: any[], key: string) => {
    if (!rows.length) return undefined;
    const last = rows[rows.length - 1];
    return Number(last[key]?.inKilograms ?? last[key]?.inMeters ?? last[key]?.value ?? last[key] ?? 0) || undefined;
  };

  const wk: HealthWorkout[] = sessions.map((s: any, i: number) => ({
    source_id: String(s.metadata?.id ?? s.startTime ?? i),
    activity: String(s.exerciseType ?? s.title ?? 'workout'),
    started_at: String(s.startTime ?? new Date().toISOString()),
    duration_min: Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000),
  }));

  const heightM = latestNum(height, 'height');
  return {
    captured_on: todayISO(),
    source: 'health_connect',
    steps: Math.round(sum(steps, 'count')) || undefined,
    calories_burned: Math.round(sum(cals, 'energy')) || undefined,
    distance_m: Math.round(sum(dist, 'distance')) || undefined,
    active_minutes: undefined,
    avg_heart_rate: avgHr,
    resting_heart_rate: undefined,
    sleep_minutes: sleepMin || undefined,
    weight_kg: latestNum(weight, 'weight'),
    height_cm: heightM ? Number(heightM) * 100 : undefined,
    workouts: wk,
  };
}

async function safeCall<T>(fn: () => Promise<T> | T): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export async function readHealthSnapshot(sinceDays = 1): Promise<HealthSnapshot | null> {
  if (!isHealthAvailable()) return null;
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  try {
    if (platform() === 'ios') return await readHealthKit(since);
    return await readHealthConnect(since);
  } catch (e) {
    console.warn('[health] read failed', e);
    return null;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  const snap = await readHealthSnapshot(1);
  return !!snap && snap.source !== 'unavailable';
}
