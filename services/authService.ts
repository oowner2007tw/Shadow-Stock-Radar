import { supabase } from './supabaseClient';

const DEVICE_ID_KEY = 'ssr_device_id';

// Helper to get or create a persistent Device ID for this browser
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a simple random UUID-like string
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export interface AuthResult {
  success: boolean;
  message?: string;
}

// Simple connectivity check
export const checkSystemStatus = async (): Promise<boolean> => {
  try {
    // Attempt a lightweight query. Even if it returns 0 rows or a permission error,
    // getting a response means we are connected to the Supabase infrastructure.
    // If the network is down, this promise will likely reject or return a fetch error.
    const { error } = await supabase.from('access_control').select('id').limit(1);
    
    // If the error is purely network related, it often throws in modern fetch usage, 
    // but supabase-js might return specific error codes. 
    // We assume if the promise resolves (even with DB error), network is okay.
    return true;
  } catch (err) {
    console.error("Connectivity check failed:", err);
    return false;
  }
};

export const verifyAccessCode = async (passcode: string): Promise<AuthResult> => {
  const deviceId = getDeviceId();

  try {
    // 1. Query the access_control table
    const { data, error } = await supabase
      .from('access_control')
      .select('*')
      .eq('passcode', passcode)
      .single();

    if (error || !data) {
      return { success: false, message: '通行碼無效 (Invalid Passcode)' };
    }

    // 2. Check Device Binding
    if (data.bound_device_id) {
      // If bound, strictly check if it matches current device
      if (data.bound_device_id === deviceId) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: '此通行碼已綁定其他裝置，無法在此登入 (Code is bound to another device)' 
        };
      }
    } else {
      // 3. First time use: Bind this device to the passcode
      const { error: updateError } = await supabase
        .from('access_control')
        .update({ bound_device_id: deviceId })
        .eq('passcode', passcode);

      if (updateError) {
        return { success: false, message: '裝置綁定失敗，請重試 (Device binding failed)' };
      }

      return { success: true, message: '裝置綁定成功 (Device bound successfully)' };
    }

  } catch (err) {
    console.error("Auth error:", err);
    return { success: false, message: '系統錯誤，請檢查網路連線' };
  }
};