import { useState, useCallback } from 'react';
import { uploadSpotImage, uploadTripCover, CloudinaryResult, UploadProgress } from '../lib/storage';

type UploadState = {
  uploading: boolean;
  progress: number;          // 0–100
  error: Error | null;
  url: string | null;        // Cloudinary secure_url
  publicId: string | null;   // Cloudinary public_id（備用，管理用）
};

const initialState: UploadState = {
  uploading: false,
  progress: 0,
  error: null,
  url: null,
  publicId: null,
};

/**
 * 圖片上傳 hook（Cloudinary unsigned upload）
 *
 * 用法：
 *   const { uploadSpot, uploading, progress, url } = useStorage();
 *   const result = await uploadSpot(tripId, spotId, file);
 *   // result?.url → Cloudinary CDN URL，存入 Firestore
 */
const useStorage = () => {
  const [state, setState] = useState<UploadState>(initialState);

  const handleProgress = useCallback((p: UploadProgress) => {
    setState((prev) => ({ ...prev, progress: p.percent }));
  }, []);

  const handleResult = (result: CloudinaryResult) => {
    setState({
      uploading: false,
      progress: 100,
      error: null,
      url: result.url,
      publicId: result.publicId,
    });
  };

  const handleError = (err: unknown) => {
    setState({
      uploading: false,
      progress: 0,
      error: err instanceof Error ? err : new Error(String(err)),
      url: null,
      publicId: null,
    });
  };

  /** 上傳景點圖片，回傳 CloudinaryResult 或 null */
  const uploadSpot = useCallback(
    async (
      tripId: string,
      spotId: string,
      file: File
    ): Promise<CloudinaryResult | null> => {
      setState({ uploading: true, progress: 0, error: null, url: null, publicId: null });
      try {
        const result = await uploadSpotImage(tripId, spotId, file, handleProgress);
        handleResult(result);
        return result;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleProgress]
  );

  /** 上傳行程封面，回傳 CloudinaryResult 或 null */
  const uploadCover = useCallback(
    async (tripId: string, file: File): Promise<CloudinaryResult | null> => {
      setState({ uploading: true, progress: 0, error: null, url: null, publicId: null });
      try {
        const result = await uploadTripCover(tripId, file, handleProgress);
        handleResult(result);
        return result;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleProgress]
  );

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, uploadSpot, uploadCover, reset };
};

export default useStorage;
