"use client";

import { useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { DEFAULT_ZOOM_LEVEL } from "@/lib/constants";
import type { SelectedBuilding, Building } from "@/types";

interface KakaoMapProps {
  lat: number;
  lng: number;
  locationLoaded: boolean;
  onMapClick: (building: SelectedBuilding) => void;
  onBoundsChange: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => void;
  buildings: Building[];
  onMarkerClick: (building: Building) => void;
}

export default function KakaoMap({
  lat,
  lng,
  locationLoaded,
  onMapClick,
  onBoundsChange,
  buildings,
  onMarkerClick,
}: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const scriptLoadingRef = useRef(false);
  const sdkReadyRef = useRef(false);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !locationLoaded) return;

    const center = new window.kakao.maps.LatLng(lat, lng);
    const map = new window.kakao.maps.Map(mapContainerRef.current, {
      center,
      level: DEFAULT_ZOOM_LEVEL,
    });
    mapRef.current = map;

    // 내 위치 파란 점 마커
    const myLocationContent = document.createElement("div");
    myLocationContent.innerHTML = `
      <div style="width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(66,133,244,0.5);"></div>
    `;
    new window.kakao.maps.CustomOverlay({
      position: center,
      content: myLocationContent,
      map,
      zIndex: 1,
    });

    const geocoder = new window.kakao.maps.services.Geocoder();

    // 지도 클릭 이벤트
    window.kakao.maps.event.addListener(map, "click", (...args: unknown[]) => {
      const mouseEvent = args[0] as { latLng: kakao.maps.LatLng };
      const latlng = mouseEvent.latLng;
      const clickLat = latlng.getLat();
      const clickLng = latlng.getLng();

      // coord2Address: (lng, lat) 순서 주의
      geocoder.coord2Address(clickLng, clickLat, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const addr = result[0];
          onMapClick({
            name: addr.road_address?.building_name || null,
            address: addr.address.address_name,
            road_address: addr.road_address?.address_name || null,
            lat: clickLat,
            lng: clickLng,
          });
        }
      });
    });

    // idle 이벤트: 지도 이동/줌 완료 시 뷰포트 범위 전달
    const emitBounds = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onBoundsChange({
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      });
    };

    window.kakao.maps.event.addListener(map, "idle", emitBounds);
    // 초기 로드 시에도 한 번 호출
    emitBounds();
  }, [lat, lng, locationLoaded, onMapClick, onBoundsChange]);

  const handleScriptLoad = useCallback(() => {
    if (scriptLoadingRef.current) return;
    scriptLoadingRef.current = true;
    window.kakao.maps.load(() => {
      sdkReadyRef.current = true;
      initMap();
    });
  }, [initMap]);

  // SDK 로드 후 위치가 뒤늦게 확보된 경우
  useEffect(() => {
    if (sdkReadyRef.current && locationLoaded && !mapRef.current) {
      initMap();
    }
  }, [locationLoaded, initMap]);

  // 마커 업데이트
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    buildings.forEach((b) => {
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.18);cursor:pointer;">
          <span style="font-size:18px;line-height:1;">🚻</span>
        </div>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerClick(b);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(b.lat, b.lng),
        content: el,
        map,
        yAnchor: 1,
        clickable: true,
      });
      markersRef.current.push(overlay);
    });
  }, [buildings, onMarkerClick]);

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <div ref={mapContainerRef} className="w-full h-full" />
    </>
  );
}
