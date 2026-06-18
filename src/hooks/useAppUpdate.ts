import { useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { Device } from '@capacitor/device';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';

export interface AppUpdateInfo {
  version: string;
  build: number;
  apkUrl: string;
  changelog?: string;
  mandatory: boolean;
}

const INSTALLED_BUILD_KEY = 'classnest_installed_build';
const DISMISSED_UNTIL_KEY = 'classnest_dismissed_until';
const GRACE_DAYS = 3;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

const getInstalledBuild = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(INSTALLED_BUILD_KEY);
  const parsed = parseInt(raw || '0', 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const setInstalledBuild = (build: number) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INSTALLED_BUILD_KEY, String(build));
};

const getDismissedUntil = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(DISMISSED_UNTIL_KEY);
  const parsed = parseInt(raw || '0', 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const setDismissedUntil = (timestamp: number) => {
  window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(timestamp));
};

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [isMandatoryBlocked, setIsMandatoryBlocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined') return;

    let isAndroid = false;
    try {
      const deviceInfo = await Device.getInfo();
      isAndroid = deviceInfo.platform === 'android';
    } catch {
      return;
    }

    if (!isAndroid) return;
    setIsNative(true);
    setChecking(true);

    try {
      const { data, error } = await supabase
        .from('app_updates')
        .select('version,build,apk_url,changelog,mandatory')
        .order('build', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return;
      }

      const latestBuild = data.build;
      const installedBuild = getInstalledBuild();
      const dismissedUntil = getDismissedUntil();
      const now = Date.now();

      if (latestBuild > installedBuild) {
        const hasGraceExpired = data.mandatory && dismissedUntil > 0 && dismissedUntil <= now;
        const isGraceActive = data.mandatory && dismissedUntil > now;
        const remaining = isGraceActive ? Math.ceil((dismissedUntil - now) / GRACE_MS) : 0;

        setDaysRemaining(remaining);
        setIsMandatoryBlocked(hasGraceExpired);

        setUpdateInfo({
          version: data.version,
          build: data.build,
          apkUrl: data.apk_url,
          changelog: data.changelog,
          mandatory: data.mandatory || false,
        });
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!updateInfo?.apkUrl) return;

    try {
      await Browser.open({ url: updateInfo.apkUrl });
    } catch {
      try {
        window.open(updateInfo.apkUrl, '_system');
      } catch (error) {
        console.error('Error downloading update:', error);
        await Toast.show({
          text: 'Error al descargar la actualizacion',
          duration: 'long',
        });
      }
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(() => {
    if (!updateInfo) return;
    if (updateInfo.mandatory) {
      setDismissedUntil(Date.now() + GRACE_MS);
      setDaysRemaining(GRACE_DAYS);
    }
    setUpdateAvailable(false);
    setUpdateInfo(null);
    setIsMandatoryBlocked(false);
  }, [updateInfo]);

  const confirmInstalled = useCallback(() => {
    if (!updateInfo) return;
    setInstalledBuild(updateInfo.build);
    setUpdateAvailable(false);
    setUpdateInfo(null);
    setIsMandatoryBlocked(false);
    setDaysRemaining(0);
    window.localStorage.removeItem(DISMISSED_UNTIL_KEY);
  }, [updateInfo]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    updateAvailable,
    updateInfo,
    checking,
    isNative,
    isMandatoryBlocked,
    daysRemaining,
    checkForUpdate,
    downloadUpdate,
    dismissUpdate,
    confirmInstalled,
  };
};
