"use client";

import { useState, useEffect } from "react";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/lib/constants";

interface GeolocationState {
  lat: number;
  lng: number;
  loaded: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    loaded: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loaded: true }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loaded: true,
        });
      },
      () => {
        // 위치 권한 거부 시 기본값 사용
        setState((prev) => ({ ...prev, loaded: true }));
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return state;
}
