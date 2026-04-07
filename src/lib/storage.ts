/**
 * Cloudinary 圖片上傳
 *
 * 使用 unsigned upload preset（不需要 API Secret 在前端）
 * Cloudinary 資料夾結構：
 *   korea-travel/trips/{tripId}/spots/{spotId}/
 *   korea-travel/trips/{tripId}/cover/
 */

const CLOUD_NAME   = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = 'korea-travel';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export type UploadProgress = {
  percent: number;       // 0–100
  loaded: number;        // bytes
  total: number;
};

export type CloudinaryResult = {
  url: string;           // HTTPS CDN URL (secure_url)
  publicId: string;      // Cloudinary public_id，用於日後管理
};

/**
 * 上傳圖片到 Cloudinary（XHR，支援進度回呼）
 */
export const uploadImage = (
  file: File,
  folder: string,
  onProgress?: (p: UploadProgress) => void
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET);
    form.append('folder', folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((e.loaded / e.total) * 100),
          loaded: e.loaded,
          total: e.total,
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id });
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Cloudinary upload error: network failure'))
    );
    xhr.addEventListener('abort', () =>
      reject(new Error('Cloudinary upload aborted'))
    );

    xhr.open('POST', UPLOAD_URL);
    xhr.send(form);
  });
};

/**
 * 上傳景點圖片
 * Cloudinary 路徑：korea-travel/trips/{tripId}/spots/{spotId}
 */
export const uploadSpotImage = (
  tripId: string,
  spotId: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<CloudinaryResult> =>
  uploadImage(file, `korea-travel/trips/${tripId}/spots/${spotId}`, onProgress);

/**
 * 上傳行程封面圖片
 * Cloudinary 路徑：korea-travel/trips/{tripId}/cover
 */
export const uploadTripCover = (
  tripId: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<CloudinaryResult> =>
  uploadImage(file, `korea-travel/trips/${tripId}/cover`, onProgress);

/**
 * 從 Cloudinary secure_url 取得適合縮圖的 URL
 * 利用 Cloudinary URL 轉換功能自動裁切與壓縮
 * e.g. w_400,h_300,c_fill,q_auto,f_auto
 */
export const toThumbnailUrl = (secureUrl: string, width = 400, height = 300): string => {
  // 在 /upload/ 後插入轉換參數
  return secureUrl.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
  );
};
