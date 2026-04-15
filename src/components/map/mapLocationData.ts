import type { LocationInfo } from '../../types/index.ts';
import { debugLog, debugWarn } from '../../utils/logger.ts';

function getLocationName(addressComponent: any, formattedAddress: string) {
  if (addressComponent.building?.name) return addressComponent.building.name;
  if (addressComponent.neighborhood?.name) return addressComponent.neighborhood.name;
  if (addressComponent.streetNumber?.street && addressComponent.streetNumber?.number) {
    return `${addressComponent.streetNumber.street}${addressComponent.streetNumber.number}号`;
  }
  if (addressComponent.streetNumber?.street) return addressComponent.streetNumber.street;
  if (addressComponent.township?.name) return addressComponent.township.name;
  if (addressComponent.district) return `${addressComponent.city || ''}${addressComponent.district}`;

  if (formattedAddress) {
    const parts = formattedAddress.split(/[省市区县]/);
    if (parts.length > 1) return parts[parts.length - 1].trim();
  }

  return '选中位置';
}

function buildFallbackLocationInfo(lat: number, lng: number): LocationInfo {
  return {
    name: `位置 ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    latitude: lat,
    longitude: lng,
    address: `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`,
    details: {
      city: '未知城市',
      country: '中国',
    },
  };
}

function buildGeocodedLocationInfo(lat: number, lng: number, regeocode: any): LocationInfo {
  const addressComponent = regeocode.addressComponent;
  const formattedAddress = regeocode.formattedAddress;

  return {
    name: getLocationName(addressComponent, formattedAddress),
    latitude: lat,
    longitude: lng,
    address: formattedAddress,
    details: {
      building: addressComponent.building?.name,
      neighbourhood: addressComponent.neighborhood?.name,
      road: addressComponent.streetNumber?.street,
      house_number: addressComponent.streetNumber?.number,
      suburb: addressComponent.district,
      city: addressComponent.city,
      state: addressComponent.province,
      country: '中国',
    },
  };
}

export function buildPoiLocationInfo(poi: any): LocationInfo {
  return {
    name: poi.name || '选中位置',
    latitude: poi.location.lat,
    longitude: poi.location.lng,
    address: poi.address || poi.name || '未知地址',
    details: {
      building: poi.name,
      city: poi.cityname,
      suburb: poi.adname,
      country: '中国',
    },
  };
}

export function getPoiCoordinates(poi: any): [number, number] | null {
  if (!poi?.location) {
    return null;
  }

  const lng = poi.location.lng;
  const lat = poi.location.lat;

  if (!lng || !lat) {
    return null;
  }

  return [lng, lat];
}

export async function reverseGeocodeLocation(AMap: any, lng: number, lat: number): Promise<LocationInfo> {
  return new Promise((resolve) => {
    try {
      const geocoder = new AMap.Geocoder({
        radius: 1000,
        extensions: 'all',
      });

      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        debugLog('🗺️ 地理编码结果:', { status, result });

        if (status === 'complete' && result.regeocode) {
          resolve(buildGeocodedLocationInfo(lat, lng, result.regeocode));
          return;
        }

        debugWarn('🗺️ 地理编码失败，使用坐标创建位置:', { status, result });
        resolve(buildFallbackLocationInfo(lat, lng));
      });
    } catch (error) {
      debugWarn('逆地理编码失败:', error);
      resolve(buildFallbackLocationInfo(lat, lng));
    }
  });
}
