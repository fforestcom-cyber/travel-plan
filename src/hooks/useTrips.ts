import { useState, useEffect } from 'react';
import { subscribeTrips } from '../lib/firestore';
import { Trip } from '../types';

type State = {
  trips: Trip[];
  loading: boolean;
  error: Error | null;
};

/**
 * 即時監聽 Firestore 中的所有行程
 * Firebase 連線設定完成前，回傳空陣列與 loading 狀態
 */
const useTrips = (): State => {
  const [state, setState] = useState<State>({
    trips: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeTrips(
      (trips) => setState({ trips, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error }))
    );
    return unsubscribe;
  }, []);

  return state;
};

export default useTrips;
