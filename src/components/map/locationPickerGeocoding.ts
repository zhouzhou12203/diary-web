import { LOCATION_CONFIG, getAmapRegeoUrl, isAmapConfigured } from '../../config/location';
import type { LocationInfo } from '../../types/index.ts';
import { debugError, debugLog, debugWarn } from '../../utils/logger.ts';
import { createSmartOfflineLocation } from './locationPickerOffline';

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getAmapLocationName(addressComponent: any, formattedAddress: string): string {
  if (addressComponent.building?.name) return addressComponent.building.name;
  if (addressComponent.neighborhood?.name) return addressComponent.neighborhood.name;
  if (addressComponent.streetNumber?.street && addressComponent.streetNumber?.number) {
    return `${addressComponent.streetNumber.street}${addressComponent.streetNumber.number}号`;
  }
  if (addressComponent.streetNumber?.street) return addressComponent.streetNumber.street;
  if (addressComponent.township?.name) return addressComponent.township.name;
  if (addressComponent.district) return `${normalizeString(addressComponent.city) || ''}${addressComponent.district}`;

  if (formattedAddress) {
    const parts = formattedAddress.split(/[省市区县]/);
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
  }

  return '未知位置';
}

function getJsonpLocationName(data: any, address: any): string {
  debugLog('选择位置名称，数据:', { data, address });

  if (data.display_name) {
    const parts = data.display_name.split(',').map((part: string) => part.trim());
    debugLog('地址部分:', parts);

    if (parts[0] && parts[0] !== data.lat && parts[0] !== data.lon && !/^\d+$/.test(parts[0])) {
      return parts[0];
    }
  }

  if (address.building) return address.building;
  if (address.shop) return address.shop;
  if (address.amenity) return address.amenity;
  if (data.name) return data.name;
  if (data.namedetails?.name) return data.namedetails.name;
  if (address.house_number && address.road) return `${address.road}${address.house_number}号`;
  if (address.road) return address.road;
  if (address.neighbourhood) return address.neighbourhood;
  if (address.suburb) return address.suburb;
  if (address.city || address.town || address.village) return address.city || address.town || address.village;

  debugLog('无法确定位置名称，使用默认');
  return '未知位置';
}

async function tryBrowserGeocoding(_lat: number, _lng: number): Promise<LocationInfo | null> {
  if (typeof window !== 'undefined' && 'google' in window && (window as any).google?.maps) {
    return null;
  }

  return null;
}

export async function tryAmapGeocoding(lat: number, lng: number): Promise<LocationInfo | null> {
  try {
    if (!LOCATION_CONFIG.ENABLE_AMAP) {
      debugLog('高德地图API已禁用');
      return null;
    }

    if (!isAmapConfigured()) {
      debugLog('高德地图API密钥未配置，跳过');
      return null;
    }

    const url = getAmapRegeoUrl(lng, lat);
    debugLog('调用高德地图API:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOCATION_CONFIG.API_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`高德地图API响应错误: ${response.status}`);
    }

    const data = await response.json();
    debugLog('高德地图API响应:', data);

    if (data.status !== '1' || !data.regeocode) {
      const errorMsg = data.info || '未知错误';
      debugWarn(`高德地图API错误: ${errorMsg} (错误码: ${data.infocode})`);

      if (data.infocode === '10009') {
        debugWarn('API密钥配置问题：请确保在高德控制台中将服务平台设置为"Web服务"');
      }

      throw new Error(`高德地图API返回错误: ${errorMsg}`);
    }

    const addressComponent = data.regeocode.addressComponent;
    const formattedAddress = data.regeocode.formatted_address;

    return {
      name: getAmapLocationName(addressComponent, formattedAddress),
      latitude: lat,
      longitude: lng,
      address: formattedAddress,
      details: {
        building: normalizeString(addressComponent.building?.name),
        neighbourhood: normalizeString(addressComponent.neighborhood?.name),
        road: normalizeString(addressComponent.streetNumber?.street),
        house_number: normalizeString(addressComponent.streetNumber?.number),
        suburb: normalizeString(addressComponent.district) || normalizeString(addressComponent.township?.name),
        city: normalizeString(addressComponent.city),
        state: normalizeString(addressComponent.province),
        country: '中国',
      },
    };
  } catch (error) {
    debugError('高德地图API调用失败:', error);
    return null;
  }
}

export async function tryJSONPGeocoding(lat: number, lng: number): Promise<LocationInfo | null> {
  return new Promise((resolve) => {
    const callbackName = `geocodeCallback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      document.getElementById(callbackName)?.remove();
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();

      try {
        if (!data?.display_name) {
          resolve(null);
          return;
        }

        const address = data.address || {};
        resolve({
          name: getJsonpLocationName(data, address),
          address: data.display_name,
          latitude: lat,
          longitude: lng,
          nearbyPOIs: [],
          details: {
            building: normalizeString(address.building),
            house_number: normalizeString(address.house_number),
            road: normalizeString(address.road),
            neighbourhood: normalizeString(address.neighbourhood),
            suburb: normalizeString(address.suburb),
            city: normalizeString(address.city || address.town || address.village),
            state: normalizeString(address.state),
            country: normalizeString(address.country),
          },
        });
      } catch (error) {
        debugError('JSONP回调处理错误:', error);
        resolve(null);
      }
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh-CN,zh,en&json_callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      resolve(null);
    };

    document.head.appendChild(script);
  });
}

export async function getDetailedLocationInfo(lat: number, lng: number): Promise<LocationInfo> {
  debugLog('开始获取位置信息:', lat, lng);

  try {
    const amapLocationInfo = await tryAmapGeocoding(lat, lng);
    if (amapLocationInfo) {
      debugLog('高德地图地理编码成功:', amapLocationInfo);
      return amapLocationInfo;
    }
  } catch (error) {
    debugLog('高德地图API失败:', error);
  }

  try {
    const browserLocationInfo = await tryBrowserGeocoding(lat, lng);
    if (browserLocationInfo) {
      debugLog('使用浏览器地理编码成功:', browserLocationInfo);
      return browserLocationInfo;
    }
  } catch (error) {
    debugLog('浏览器地理编码不可用:', error);
  }

  try {
    debugLog('尝试使用OpenStreetMap JSONP方式...');
    const locationInfo = await tryJSONPGeocoding(lat, lng);
    if (locationInfo) {
      debugLog('OpenStreetMap地理编码成功:', locationInfo);
      return locationInfo;
    }
  } catch (error) {
    debugError('OpenStreetMap服务失败:', error);
  }

  debugLog('所有在线服务失败，使用智能离线模式');
  return createSmartOfflineLocation(lat, lng);
}
