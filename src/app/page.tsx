"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import KakaoMap from "@/components/KakaoMap";
import BuildingPanel from "@/components/BuildingPanel";
import MapFilter from "@/components/MapFilter";
import type { MapFilterType } from "@/components/MapFilter";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { SelectedBuilding, Building } from "@/types";

function findNearestBuilding(
  buildings: Building[],
  lat: number,
  lng: number
): Building | null {
  if (buildings.length === 0) return null;
  let nearest = buildings[0];
  let minDist = (nearest.lat - lat) ** 2 + (nearest.lng - lng) ** 2;
  for (let i = 1; i < buildings.length; i++) {
    const d = (buildings[i].lat - lat) ** 2 + (buildings[i].lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = buildings[i];
    }
  }
  return nearest;
}

export default function Home() {
  const { lat, lng, loaded } = useGeolocation();
  const [selectedBuilding, setSelectedBuilding] =
    useState<SelectedBuilding | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filter, setFilter] = useState<MapFilterType>("all");
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoSelected = useRef(false);

  const filteredBuildings = useMemo(() => {
    if (filter === "all") return buildings;
    return buildings.filter((b) => !b.has_passwords);
  }, [buildings, filter]);

  const handleMapClick = useCallback((building: SelectedBuilding) => {
    setSelectedBuilding(building);
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
      // 디바운스: 지도 이동 중 과도한 요청 방지
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(async () => {
        try {
          const params = new URLSearchParams({
            swLat: String(bounds.swLat),
            swLng: String(bounds.swLng),
            neLat: String(bounds.neLat),
            neLng: String(bounds.neLng),
          });
          const res = await fetch(`/api/buildings?${params}`);
          const data = await res.json();
          if (Array.isArray(data)) setBuildings(data);
        } catch {
          // 네트워크 에러 무시
        }
      }, 300);
    },
    []
  );

  const handleMarkerClick = useCallback((building: Building) => {
    setSelectedBuilding({
      name: building.name,
      address: building.address,
      road_address: building.road_address,
      lat: building.lat,
      lng: building.lng,
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  // 최초 로드 시 가장 가까운 건물 자동 선택
  useEffect(() => {
    if (hasAutoSelected.current || !loaded || buildings.length === 0 || selectedBuilding) return;
    hasAutoSelected.current = true;
    const nearest = findNearestBuilding(buildings, lat, lng);
    if (nearest) {
      setSelectedBuilding({
        name: nearest.name,
        address: nearest.address,
        road_address: nearest.road_address,
        lat: nearest.lat,
        lng: nearest.lng,
      });
    }
  }, [buildings, loaded, lat, lng, selectedBuilding]);

  return (
    <div className="relative h-dvh w-full">
      <KakaoMap
        lat={lat}
        lng={lng}
        locationLoaded={loaded}
        onMapClick={handleMapClick}
        onBoundsChange={handleBoundsChange}
        buildings={filteredBuildings}
        onMarkerClick={handleMarkerClick}
      />
      <MapFilter filter={filter} onFilterChange={setFilter} />
      <BuildingPanel building={selectedBuilding} onClose={handleClose} />
    </div>
  );
}
