import { Capacitor } from '@capacitor/core';

export interface DeviceInfo {
  isNative: boolean;
  platform: string;
  userAgent: string;
  isMobileScreen: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileScreen =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(userAgent));

  return {
    isNative,
    platform,
    userAgent,
    isMobileScreen,
  };
}

export function triggerHaptic(durationMs = 25) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(durationMs);
    }
  } catch {
    // ignore
  }
}

/**
 * Downloads a file with native-compatible fallback.
 * Works seamlessly in Chrome/Safari, mobile PWA, and Capacitor Android WebView.
 */
export async function downloadFileSafely(url: string, filename = 'download.zip') {
  triggerHaptic(30);

  try {
    // If Capacitor native platform is detected
    if (Capacitor.isNativePlatform()) {
      // Direct location href triggers Android DownloadManager in standard Capacitor WebView
      window.location.href = url;
      return true;
    }

    // Standard DOM link download for Web/PWA
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1000);
    return true;
  } catch (error) {
    console.warn('Fallback download trigger:', error);
    window.open(url, '_blank');
    return false;
  }
}

/**
 * Text-To-Speech audio synthesizer for Jarvis Voice Assistant
 */
export function speakJarvisResponse(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // stop previous
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 350); // speak essential summary

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.05;
    utterance.pitch = 0.95; // Slightly deeper, refined Jarvis tone

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}
