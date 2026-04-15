import type { ThemeMode } from '../../hooks/useTheme';

interface LoadAmapScriptOptions {
  jsKey: string;
  securityCode?: string;
  onLoad: () => void;
  onError: (error: unknown, script: HTMLScriptElement) => void;
}

interface CreateMapInstanceOptions {
  AMap: any;
  container: HTMLDivElement;
  center: [number, number];
  isMobile: boolean;
  themeMode: ThemeMode;
}

interface CleanupMapRuntimeOptions {
  map: any;
  marker: any;
  userMarker: any;
}

export function loadAmapScript({
  jsKey,
  securityCode,
  onLoad,
  onError,
}: LoadAmapScriptOptions): HTMLScriptElement {
  (window as Window & { _AMapSecurityConfig?: { securityJsCode?: string } })._AMapSecurityConfig = {
    securityJsCode: securityCode,
  };

  const script = document.createElement('script');
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsKey}&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.AutoComplete`;
  script.async = true;
  script.onload = onLoad;
  script.onerror = (error) => onError(error, script);
  document.head.appendChild(script);
  return script;
}

export function createMapInstance({
  AMap,
  container,
  center,
  isMobile,
  themeMode,
}: CreateMapInstanceOptions) {
  return new AMap.Map(container, {
    zoom: isMobile ? 15 : 16,
    center,
    mapStyle: themeMode === 'dark' ? 'amap://styles/dark' : 'amap://styles/normal',
    resizeEnable: true,
    rotateEnable: false,
    pitchEnable: false,
    zoomEnable: true,
    dragEnable: true,
    touchZoom: isMobile,
    doubleClickZoom: !isMobile,
    scrollWheel: !isMobile,
    keyboardEnable: !isMobile,
  });
}

export function createPlaceSearchService(AMap: any, map: any) {
  return new AMap.PlaceSearch({
    pageSize: 10,
    pageIndex: 1,
    city: '全国',
    map,
    panel: false,
  });
}

export function createGeolocationControl(AMap: any) {
  return new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 30000,
    convert: true,
    showButton: false,
    showMarker: false,
    showCircle: false,
    panToLocation: false,
    zoomToAccuracy: false,
  });
}

export function cleanupMapRuntime({
  map,
  marker,
  userMarker,
}: CleanupMapRuntimeOptions) {
  if (!map) {
    return;
  }

  if (marker) {
    map.remove(marker);
  }

  if (userMarker) {
    map.remove(userMarker);
  }

  map.destroy();
}
