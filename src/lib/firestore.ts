/**
 * Firestore CRUD 函式
 *
 * Collection 結構：
 *   trips/{tripId}
 *   trips/{tripId}/spots/{spotId}
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Trip, Spot } from '../types';

// ── 型別輔助 ────────────────────────────────────────────

const toTrip = (id: string, data: DocumentData): Trip => ({
  id,
  title:     data.title     ?? '',
  city:      data.city      ?? '',
  region:    data.region    ?? '',
  startDate: data.startDate ?? '',
  endDate:   data.endDate   ?? '',
  status:    data.status    ?? 'planned',
  currency:  data.currency  ?? 'KRW',
  coverImage: data.coverImage,
  notes:      data.notes,
});

const toSpot = (id: string, tripId: string, data: DocumentData): Spot => ({
  id,
  tripId,
  name:     data.name     ?? '',
  category: data.category ?? 'attraction',
  address:  data.address,
  lat:      data.lat,
  lng:      data.lng,
  rating:   data.rating,
  notes:    data.notes,
  images:   data.images ?? [],
});

// ── Trips ────────────────────────────────────────────────

const tripsCol = () => collection(db, 'trips');
const tripDoc  = (id: string) => doc(db, 'trips', id);

/** 即時監聽所有行程（依 startDate 排序） */
export const subscribeTrips = (
  onData: (trips: Trip[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(tripsCol(), orderBy('startDate', 'desc'));
  return onSnapshot(
    q,
    (snap: QuerySnapshot) => {
      onData(snap.docs.map((d) => toTrip(d.id, d.data())));
    },
    onError
  );
};

/** 新增行程，回傳 Firestore 產生的 id */
export const addTrip = async (
  data: Omit<Trip, 'id'>
): Promise<string> => {
  const ref = await addDoc(tripsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/** 完整覆寫行程（id 不變） */
export const setTrip = async (trip: Trip): Promise<void> => {
  const { id, ...data } = trip;
  await setDoc(tripDoc(id), { ...data, updatedAt: serverTimestamp() });
};

/** 部分更新行程欄位 */
export const updateTrip = async (
  id: string,
  patch: Partial<Omit<Trip, 'id'>>
): Promise<void> => {
  await updateDoc(tripDoc(id), { ...patch, updatedAt: serverTimestamp() });
};

/** 刪除行程（不含子集合，子集合需另外刪除） */
export const deleteTrip = async (id: string): Promise<void> => {
  await deleteDoc(tripDoc(id));
};

// ── Spots（行程的子集合） ──────────────────────────────

const spotsCol = (tripId: string) =>
  collection(db, 'trips', tripId, 'spots');

const spotDoc = (tripId: string, spotId: string) =>
  doc(db, 'trips', tripId, 'spots', spotId);

/** 一次性讀取某行程的所有景點 */
export const fetchSpots = async (tripId: string): Promise<Spot[]> => {
  const snap = await getDocs(spotsCol(tripId));
  return snap.docs.map((d) => toSpot(d.id, tripId, d.data()));
};

/** 即時監聽某行程的景點 */
export const subscribeSpots = (
  tripId: string,
  onData: (spots: Spot[]) => void,
  onError?: (err: Error) => void
): Unsubscribe =>
  onSnapshot(
    spotsCol(tripId),
    (snap) => {
      onData(snap.docs.map((d) => toSpot(d.id, tripId, d.data())));
    },
    onError
  );

/** 新增景點 */
export const addSpot = async (
  tripId: string,
  data: Omit<Spot, 'id' | 'tripId'>
): Promise<string> => {
  const ref = await addDoc(spotsCol(tripId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/** 部分更新景點 */
export const updateSpot = async (
  tripId: string,
  spotId: string,
  patch: Partial<Omit<Spot, 'id' | 'tripId'>>
): Promise<void> => {
  await updateDoc(spotDoc(tripId, spotId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

/** 刪除景點 */
export const deleteSpot = async (
  tripId: string,
  spotId: string
): Promise<void> => {
  await deleteDoc(spotDoc(tripId, spotId));
};
