import { useEffect, useMemo, useRef, useState } from "react";

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY || "";

function loadKakaoSdk() {
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao="true"]');
    if (existing) {
      existing.addEventListener("load", () =>
        window.kakao.maps.load(() => resolve(window.kakao)),
      );
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.kakao = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=${KAKAO_APP_KEY}`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function parseAddress(result) {
  const road = result?.road_address?.address_name;
  const jibun = result?.address?.address_name;
  return road || jibun || "";
}

function LocationCard({
  title,
  active,
  address,
  lat,
  lng,
  onFocusTarget,
  onAddressChange,
  onSearch,
  onUseCurrentLocation,
}) {
  return (
    <div className={`location-card${active ? " active" : ""}`}>
      <div className="location-card-head">
        <div>
          <strong>{title}</strong>
          <small>
            {active
              ? "지도 클릭이 이 위치에 반영됩니다."
              : "선택 버튼을 누르면 지도 클릭 대상이 됩니다."}
          </small>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className={
              active ? "btn btn-primary small" : "btn btn-secondary small"
            }
            onClick={onFocusTarget}
          >
            {active ? "선택됨" : "지도 선택"}
          </button>
          {title === "출발지" && (
            <button
              type="button"
              className="btn btn-ghost small"
              onClick={onUseCurrentLocation}
            >
              내 위치
            </button>
          )}
        </div>
      </div>
      <div className="location-search-row">
        <input
          value={address}
          placeholder={`${title} 주소를 입력하세요`}
          onChange={(e) => onAddressChange(e.target.value)}
        />
        <button type="button" className="btn btn-secondary" onClick={onSearch}>
          주소 검색
        </button>
      </div>
      <div className="location-coords">
        <div>
          <span>위도</span>
          <strong>{Number(lat).toFixed(6)}</strong>
        </div>
        <div>
          <span>경도</span>
          <strong>{Number(lng).toFixed(6)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function ShipmentLocationPicker({ value, onChange }) {
  const [activeTarget, setActiveTarget] = useState("origin");
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const clickListenerRef = useRef(null);
  const markerRefs = useRef({ origin: null, destination: null });
  const lineRef = useRef(null);

  const center = useMemo(
    () => ({
      lat: (Number(value.originLat) + Number(value.destinationLat)) / 2,
      lng: (Number(value.originLng) + Number(value.destinationLng)) / 2,
    }),
    [
      value.originLat,
      value.originLng,
      value.destinationLat,
      value.destinationLng,
    ],
  );

  useEffect(() => {
    if (!KAKAO_APP_KEY) {
      setError(
        "VITE_KAKAO_MAP_APP_KEY가 없어서 주소 검색/지도 선택 기능을 사용할 수 없습니다.",
      );
      return;
    }
    let cancelled = false;
    loadKakaoSdk()
      .then((kakao) => {
        if (cancelled || !mapRef.current) return;
        setSdkReady(true);
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new kakao.maps.Map(mapRef.current, {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level: 7,
          });
          geocoderRef.current = new kakao.maps.services.Geocoder();
        }
        setMapReady(true);
      })
      .catch(() =>
        setError(
          "카카오 지도 SDK를 불러오지 못했습니다. 앱 키와 등록 도메인을 확인해 주세요.",
        ),
      );

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTarget = (target, payload) => {
    if (target === "origin") {
      onChange({
        ...value,
        originAddress: payload.address,
        originLat: payload.lat,
        originLng: payload.lng,
      });
    } else {
      onChange({
        ...value,
        destinationAddress: payload.address,
        destinationLat: payload.lat,
        destinationLng: payload.lng,
      });
    }
  };

  const reverseGeocode = (lat, lng, callback) => {
    const kakao = window.kakao;
    const geocoder = geocoderRef.current;
    if (!kakao || !geocoder) return;
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result?.[0]) {
        callback(parseAddress(result[0]));
      } else {
        callback(`위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`);
      }
    });
  };

  const searchAddress = (target) => {
    const kakao = window.kakao;
    const geocoder = geocoderRef.current;
    const query =
      target === "origin" ? value.originAddress : value.destinationAddress;
    if (!query?.trim()) {
      setError(
        `${target === "origin" ? "출발지" : "도착지"} 주소를 먼저 입력해 주세요.`,
      );
      return;
    }
    if (!kakao || !geocoder) return;

    geocoder.addressSearch(query, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
        setError(
          "주소를 찾지 못했습니다. 도로명 또는 지번 주소로 다시 시도해 주세요.",
        );
        return;
      }
      const first = result[0];
      const lat = Number(first.y);
      const lng = Number(first.x);
      updateTarget(target, { address: first.address_name, lat, lng });
      mapInstanceRef.current?.panTo(new kakao.maps.LatLng(lat, lng));
      setError("");
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("브라우저 위치 기능을 사용할 수 없습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        reverseGeocode(lat, lng, (address) => {
          updateTarget("origin", { address: address || "현재 위치", lat, lng });
          mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(lat, lng));
          setActiveTarget("origin");
          setError("");
        });
      },
      () =>
        setError(
          "현재 위치를 가져오지 못했습니다. 브라우저 권한을 확인해 주세요.",
        ),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  useEffect(() => {
    if (!sdkReady || !mapReady || !mapInstanceRef.current || !window.kakao)
      return;
    const kakao = window.kakao;
    const map = mapInstanceRef.current;

    if (clickListenerRef.current)
      kakao.maps.event.removeListener(map, "click", clickListenerRef.current);

    const listener = (mouseEvent) => {
      const latLng = mouseEvent.latLng;
      const lat = latLng.getLat();
      const lng = latLng.getLng();
      reverseGeocode(lat, lng, (address) => {
        updateTarget(activeTarget, { address, lat, lng });
        setError("");
      });
    };

    clickListenerRef.current = listener;
    kakao.maps.event.addListener(map, "click", listener);
  }, [sdkReady, mapReady, activeTarget, value]);

  useEffect(() => {
    if (!sdkReady || !mapReady || !mapInstanceRef.current || !window.kakao)
      return;
    const kakao = window.kakao;
    const map = mapInstanceRef.current;

    const originPos = new kakao.maps.LatLng(
      Number(value.originLat),
      Number(value.originLng),
    );
    const destPos = new kakao.maps.LatLng(
      Number(value.destinationLat),
      Number(value.destinationLng),
    );

    if (!markerRefs.current.origin) {
      markerRefs.current.origin = new kakao.maps.Marker({
        map,
        position: originPos,
        title: "출발지",
      });
      markerRefs.current.destination = new kakao.maps.Marker({
        map,
        position: destPos,
        title: "도착지",
      });
    } else {
      markerRefs.current.origin.setPosition(originPos);
      markerRefs.current.destination.setPosition(destPos);
    }

    if (lineRef.current) lineRef.current.setMap(null);
    lineRef.current = new kakao.maps.Polyline({
      path: [originPos, destPos],
      strokeWeight: 4,
      strokeColor: "#2563eb",
      strokeOpacity: 0.85,
      strokeStyle: "shortdash",
    });
    lineRef.current.setMap(map);

    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(originPos);
    bounds.extend(destPos);
    map.setBounds(bounds, 60, 60, 60, 60);
  }, [
    sdkReady,
    mapReady,
    value.originLat,
    value.originLng,
    value.destinationLat,
    value.destinationLng,
  ]);

  return (
    <div className="form-stack shipment-location-picker">
      <div className="location-guide surface-sub">
        <strong>주소 검색 + 지도 클릭 입력</strong>
        <p className="section-desc">
          주소를 입력하고 검색하면 지도가 바로 이동합니다. 출발지/도착지 중
          하나를 선택한 뒤 지도에서 원하는 위치를 클릭하면 주소와 좌표가
          자동으로 채워집니다.
        </p>
      </div>
      <div className="split-2 location-card-grid">
        <LocationCard
          title="출발지"
          active={activeTarget === "origin"}
          address={value.originAddress}
          lat={value.originLat}
          lng={value.originLng}
          onFocusTarget={() => setActiveTarget("origin")}
          onAddressChange={(address) =>
            onChange({ ...value, originAddress: address })
          }
          onSearch={() => searchAddress("origin")}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
        <LocationCard
          title="도착지"
          active={activeTarget === "destination"}
          address={value.destinationAddress}
          lat={value.destinationLat}
          lng={value.destinationLng}
          onFocusTarget={() => setActiveTarget("destination")}
          onAddressChange={(address) =>
            onChange({ ...value, destinationAddress: address })
          }
          onSearch={() => searchAddress("destination")}
          onUseCurrentLocation={() => {}}
        />
      </div>
      {error ? <div className="alert-info">{error}</div> : null}
      <div className="location-map-wrap">
        {!KAKAO_APP_KEY ? (
          <div className="map-fallback">
            카카오 JavaScript 키가 없어서 주소 검색 지도를 불러오지 못했습니다.
          </div>
        ) : (
          <div ref={mapRef} className="kakao-map location-picker-map" />
        )}
      </div>
    </div>
  );
}
