export interface AdResult { success: boolean; reason?: string; }
export type AdCallback = (result: AdResult) => void;

export class NoopAdAdapter {
  isRewardedVideoAvailable(): boolean { return true; }
  showRewardedVideo(callback: AdCallback): void {
    setTimeout(() => callback({ success: true }), 100);
  }
  isInterstitialAvailable(): boolean { return false; }
  showInterstitial(callback: AdCallback): void {
    callback({ success: false, reason: 'noop: interstitial not supported' });
  }
}
