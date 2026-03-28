import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize, AdOptions, AdLoadInfo } from '@capacitor-community/admob';

export async function initializeAdMob() {
  const { status } = await AdMob.trackingAuthorizationStatus();
  
  await AdMob.initialize({
    requestTrackingAuthorization: true,
    // App ID Anda: ca-app-pub-1754133035618017~4161697392
    // (Pastikan App ID ini juga dimasukkan ke AndroidManifest.xml saat build APK)
    initializeForTesting: false, 
  });
}

export async function showBanner() {
  const options: BannerAdOptions = {
    adId: 'ca-app-pub-1754133035618017/7623461498', // ID Banner Asli Anda
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
  };
  await AdMob.showBanner(options);
}

export async function hideBanner() {
  await AdMob.hideBanner();
}

export async function showInterstitial() {
  const options: AdOptions = {
    adId: 'ca-app-pub-3940256099942544/1033173712', // ID Testing Google
    // isTesting: true
  };
  await AdMob.prepareInterstitial(options);
  await AdMob.showInterstitial();
}
