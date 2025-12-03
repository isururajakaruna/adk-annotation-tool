/**
 * Storage factory - creates the appropriate storage provider based on configuration
 */

import { StorageProvider } from './types';
import { LocalStorage } from './LocalStorage';
import { GCSStorage } from './GCSStorage';

let storageInstance: StorageProvider | null = null;

/**
 * Get or create storage provider instance
 * Uses Google Cloud Storage by default, falls back to local storage
 */
export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  // Check environment variable for storage type
  const useGCS = process.env.USE_CLOUD_STORAGE !== 'false'; // Default to true
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (useGCS && bucketName) {
    console.log('[Storage] Using Google Cloud Storage');
    console.log(`[Storage] Bucket: ${bucketName}`);
    storageInstance = new GCSStorage(bucketName);
  } else if (useGCS && !bucketName) {
    console.warn('[Storage] GCS enabled but GCS_BUCKET_NAME not set, falling back to local storage');
    console.warn('[Storage] Set USE_CLOUD_STORAGE=false to disable this warning');
    storageInstance = new LocalStorage();
  } else {
    console.log('[Storage] Using local filesystem storage');
    storageInstance = new LocalStorage();
  }

  return storageInstance;
}

/**
 * Reset storage instance (useful for testing or configuration changes)
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}

// Export types and implementations
export * from './types';
export { LocalStorage } from './LocalStorage';
export { GCSStorage } from './GCSStorage';

