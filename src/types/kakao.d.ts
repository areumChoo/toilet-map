declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number): void;
    getLevel(): number;
    getBounds(): LatLngBounds;
    panTo(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
  }

  interface CustomOverlayOptions {
    content: HTMLElement | string;
    position: LatLng;
    map?: Map;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker: Marker): void;
    close(): void;
  }

  interface InfoWindowOptions {
    content: string;
    removable?: boolean;
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      callback: (...args: unknown[]) => void
    ): void;
    function removeListener(
      target: Map | Marker,
      type: string,
      callback: (...args: unknown[]) => void
    ): void;
  }

  namespace services {
    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: GeocoderResult[], status: Status) => void
      ): void;
    }

    interface GeocoderResult {
      address: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
        mountain_yn: string;
        main_address_no: string;
        sub_address_no: string;
      };
      road_address: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
        road_name: string;
        underground_yn: string;
        main_building_no: string;
        sub_building_no: string;
        building_name: string;
        zone_no: string;
      } | null;
    }

    enum Status {
      OK = "OK",
      ZERO_RESULT = "ZERO_RESULT",
      ERROR = "ERROR",
    }
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: {
    maps: typeof kakao.maps & {
      load: (callback: () => void) => void;
    };
  };
}
