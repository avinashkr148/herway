import { storage } from './storage';

// App-level Device ID, created on first launch (hardware IDs are restricted by Android/iOS).
export async function getDeviceId() {
  let id = await storage.getItem('device_id');
  if (!id) {
    id = 'HW-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    await storage.setItem('device_id', id);
  }
  return id;
}
