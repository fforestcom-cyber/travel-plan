import { useState, useEffect } from 'react';
import { subscribeSpots } from '../lib/firestore';
import { Spot } from '../types';

type State = {
  spots: Spot[];
  loading: boolean;
  error: Error | null;
};

/**
 * 即時監聽某行程的所有景點
 */
const useSpots = (tripId: string | null): State => {
  const [state, setState] = useState<State>({
    spots: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!tripId) {
      setState({ spots: [], loading: false, error: null });
      return;
    }
    const unsubscribe = subscribeSpots(
      tripId,
      (spots) => setState({ spots, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error }))
    );
    return unsubscribe;
  }, [tripId]);

  return state;
};

export default useSpots;
