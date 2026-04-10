import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDrivingRoute } from "../api";

const KAKAO_APP_KEY =
  import.meta.env.VITE_KAKAO_MAP_APP_KEY || "99887cb3e304bd757a742ebcd0f55eb7";
const INTERACTION_PAUSE_MS = 7000;

const TRUCK_ICON_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="28" viewBox="0 0 56 28">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="1.1" stdDeviation="1.1" flood-color="rgba(0,0,0,0.24)"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <rect x="5" y="7" width="26" height="12" rx="2.5" fill="#2F6BFF"/>
    <rect x="7" y="9" width="22" height="2" rx="1" fill="#7FA7FF" opacity="0.55"/>
    <path d="M31 10.5H39.5L44 14V19H31V10.5Z" fill="#1F2937"/>
    <path d="M34 11.8H39L42.2 14.3H34Z" fill="#BFE0FF" opacity="0.95"/>
    <rect x="42.5" y="16.6" width="4.5" height="2.2" rx="1.1" fill="#374151"/>
    <rect x="8" y="18.4" width="33" height="1.6" rx="0.8" fill="#4B5563" opacity="0.45"/>
    <circle cx="15" cy="21.5" r="3.5" fill="#111827"/>
    <circle cx="15" cy="21.5" r="1.45" fill="#D1D5DB"/>
    <circle cx="37.5" cy="21.5" r="3.5" fill="#111827"/>
    <circle cx="37.5" cy="21.5" r="1.45" fill="#D1D5DB"/>
    <rect x="43.5" y="15.1" width="1.8" height="1.5" rx="0.75" fill="#FDE68A"/>
  </g>
</svg>
`);

const TRUCK_ICON_URL = `data:image/svg+xml;charset=UTF-8,${TRUCK_ICON_SVG}`;

function loadKakaoSdk() {
  if (window.kakao?.maps) return Promise.resolve(window.kakao);
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getProgress(shipment, now = Date.now()) {
  if (!shipment) return 0;
  if (shipment.status === "COMPLETED") return 1;
  if (
    shipment.status !== "IN_TRANSIT" ||
    !shipment.startedAt ||
    !shipment.estimatedArrivalAt
  )
    return 0;

  const started = new Date(shipment.startedAt).getTime();
  const eta = new Date(shipment.estimatedArrivalAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(eta) || eta <= started)
    return 0;
  return clamp((now - started) / (eta - started), 0, 1);
}

function getTrackingMeta(shipment, now = Date.now()) {
  if (!shipment) return null;
  const progress = getProgress(shipment, now);
  const remainingMinutes =
    shipment.status === "COMPLETED"
      ? 0
      : shipment.status === "IN_TRANSIT" && shipment.estimatedArrivalAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(shipment.estimatedArrivalAt).getTime() - now) / 60000,
            ),
          )
        : (shipment.tracking?.remainingMinutes ?? shipment.estimatedMinutes);

  const roughLocation =
    shipment.status === "COMPLETED"
      ? "도착 완료"
      : shipment.status === "IN_TRANSIT"
        ? progress >= 0.95
          ? "도착지 진입"
          : progress >= 0.65
            ? "도로 경로 후반 이동중"
            : progress >= 0.3
              ? "도로 경로 이동중"
              : "출발지 출발"
        : shipment.tracking?.roughLocation || "출발 전";

  return { progress, remainingMinutes, roughLocation };
}

function getDistanceMeter(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildCumulativeDistances(routeCoords) {
  const cumulative = [0];
  for (let i = 1; i < routeCoords.length; i += 1) {
    cumulative.push(
      cumulative[i - 1] + getDistanceMeter(routeCoords[i - 1], routeCoords[i]),
    );
  }
  return cumulative;
}

function getPositionByProgress(routeCoords, cumulative, progress) {
  if (!routeCoords?.length) return null;
  if (progress <= 0) return routeCoords[0];
  if (progress >= 1) return routeCoords[routeCoords.length - 1];

  const total = cumulative[cumulative.length - 1];
  const target = total * progress;

  for (let i = 1; i < cumulative.length; i += 1) {
    if (target <= cumulative[i]) {
      const prevDist = cumulative[i - 1];
      const nextDist = cumulative[i];
      const ratio =
        nextDist === prevDist ? 0 : (target - prevDist) / (nextDist - prevDist);
      const prev = routeCoords[i - 1];
      const next = routeCoords[i];
      return {
        lat: prev.lat + (next.lat - prev.lat) * ratio,
        lng: prev.lng + (next.lng - prev.lng) * ratio,
      };
    }
  }

  return routeCoords[routeCoords.length - 1];
}

function buildTruckContent(progress, remainingMinutes) {
  const percent = Math.round(progress * 100);
  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translateY(-10px);pointer-events:none;">
      <div style="padding:4px 7px;border-radius:999px;background:#0f172a;color:#fff;font-size:10px;font-weight:700;line-height:1;box-shadow:0 6px 14px rgba(15,23,42,.18);white-space:nowrap;">${percent}% · ${remainingMinutes}분</div>
      <div style="margin-top:5px;width:28px;height:14px;display:flex;align-items:center;justify-content:center;">
        <img src="${TRUCK_ICON_URL}" alt="truck" style="width:28px;height:14px;display:block;"/>
      </div>
    </div>
  `;
}

export default function KakaoMapView({ shipment }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckOverlayRef = useRef(null);
  const polylineRef = useRef(null);
  const tickRef = useRef(null);
  const pauseUntilRef = useRef(0);
  const boundsAppliedRef = useRef(false);

  const [error, setError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [routeState, setRouteState] = useState({
    loading: false,
    coords: [],
    cumulative: [],
    totalDistanceMeter: 0,
    totalTimeSecond: 0,
  });

  useEffect(() => {
    if (shipment?.status !== "IN_TRANSIT") return undefined;
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [shipment?.status, shipment?.id]);

  const trackingMeta = useMemo(
    () => getTrackingMeta(shipment, nowTick),
    [shipment, nowTick],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (
        !shipment?.originLat ||
        !shipment?.originLng ||
        !shipment?.destinationLat ||
        !shipment?.destinationLng
      )
        return;
      try {
        setRouteState((prev) => ({ ...prev, loading: true }));
        const route = await fetchDrivingRoute({
          startLat: shipment.originLat,
          startLng: shipment.originLng,
          endLat: shipment.destinationLat,
          endLng: shipment.destinationLng,
        });
        if (cancelled) return;
        const coords = route.routeCoords || [];
        setRouteState({
          loading: false,
          coords,
          cumulative: buildCumulativeDistances(coords),
          totalDistanceMeter: route.totalDistanceMeter || 0,
          totalTimeSecond: route.totalTimeSecond || 0,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e.message ||
              "도로 경로를 불러오지 못했습니다.",
          );
          setRouteState({
            loading: false,
            coords: [],
            cumulative: [],
            totalDistanceMeter: 0,
            totalTimeSecond: 0,
          });
        }
      }
    }

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    shipment?.id,
    shipment?.originLat,
    shipment?.originLng,
    shipment?.destinationLat,
    shipment?.destinationLng,
  ]);

  const points = useMemo(() => {
    if (!shipment || !trackingMeta) return null;
    const origin = { lat: shipment.originLat, lng: shipment.originLng };
    const destination = {
      lat: shipment.destinationLat,
      lng: shipment.destinationLng,
    };
    const fallbackCurrent =
      shipment.status === "COMPLETED" ? destination : origin;
    const current = routeState.coords.length
      ? getPositionByProgress(
          routeState.coords,
          routeState.cumulative,
          trackingMeta.progress,
        )
      : fallbackCurrent;

    return { origin, destination, current };
  }, [shipment, trackingMeta, routeState]);

  useEffect(() => {
    if (!shipment || !points) return;

    let cancelled = false;

    loadKakaoSdk().then((kakao) => {
      if (cancelled || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(points.current.lat, points.current.lng),
          level: 7,
        });
      }

      const map = mapInstanceRef.current;

      kakao.maps.event.addListener(map, "dragstart", () => {
        pauseUntilRef.current = Date.now() + INTERACTION_PAUSE_MS;
      });
      kakao.maps.event.addListener(map, "zoom_start", () => {
        pauseUntilRef.current = Date.now() + INTERACTION_PAUSE_MS;
      });

      kakao.maps.event.addListener(map, "dragstart", () => {
        pauseUntilRef.current = Date.now() + INTERACTION_PAUSE_MS;
      });
      kakao.maps.event.addListener(map, "zoom_start", () => {
        pauseUntilRef.current = Date.now() + INTERACTION_PAUSE_MS;
      });

      if (truckOverlayRef.current) {
        truckOverlayRef.current.setMap(null);
        truckOverlayRef.current = null;
      }

      if (shipment.status === "IN_TRANSIT" && !truckOverlayRef.current) {
        const latlng = new kakao.maps.LatLng(
          points.current.lat,
          points.current.lng,
        );

        truckOverlayRef.current = new kakao.maps.CustomOverlay({
          position: latlng,
          content: buildTruckContent(
            trackingMeta.progress,
            trackingMeta.remainingMinutes,
          ),
          yAnchor: 0.55,
          xAnchor: 0.5,
          zIndex: 4,
        });

        truckOverlayRef.current.setMap(map);
      }

      if (shipment.status !== "IN_TRANSIT" && truckOverlayRef.current) {
        truckOverlayRef.current.setMap(null);
        truckOverlayRef.current = null;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shipment?.id, shipment?.status, points, trackingMeta]);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, [shipment?.id]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;
    if (!routeState.coords.length) return;
    if (boundsAppliedRef.current) return;

    const map = mapInstanceRef.current;
    const bounds = new window.kakao.maps.LatLngBounds();

    routeState.coords.forEach((coord) => {
      bounds.extend(new window.kakao.maps.LatLng(coord.lat, coord.lng));
    });

    map.setBounds(bounds);
    boundsAppliedRef.current = true;
  }, [routeState.coords]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;
    if (!routeState.coords.length) return;

    const map = mapInstanceRef.current;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const path = routeState.coords.map(
      (coord) => new window.kakao.maps.LatLng(coord.lat, coord.lng),
    );

    polylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 4,
      strokeColor: "#2F6BFF",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
    });

    polylineRef.current.setMap(map);
  }, [routeState.coords]);

  useEffect(() => {
    boundsAppliedRef.current = false;
  }, [shipment?.id]);

  useEffect(() => {
    if (!shipment || !trackingMeta || !points || !truckOverlayRef.current)
      return undefined;
    if (shipment.status !== "IN_TRANSIT") return undefined;

    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now < pauseUntilRef.current) return;

      const progress = getProgress(shipment, now);
      const remainingMinutes = shipment.estimatedArrivalAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(shipment.estimatedArrivalAt).getTime() - now) / 60000,
            ),
          )
        : (shipment.tracking?.remainingMinutes ?? shipment.estimatedMinutes);

      const current = routeState.coords.length
        ? getPositionByProgress(
            routeState.coords,
            routeState.cumulative,
            progress,
          )
        : points.current;

      if (!current || !window.kakao?.maps || !truckOverlayRef.current) return;

      const latlng = new window.kakao.maps.LatLng(current.lat, current.lng);
      truckOverlayRef.current.setPosition(latlng);
      truckOverlayRef.current.setContent(
        buildTruckContent(progress, remainingMinutes),
      );
    }, 500);

    tickRef.current = timer;
    return () => {
      window.clearInterval(timer);
    };
  }, [shipment, trackingMeta, points, routeState]);

  return (
    <div className="map-panel">
      <div className="map-header-row">
        <strong>실제 도로 경로</strong>
        <span>
          {routeState.coords.length
            ? `총 ${(routeState.totalDistanceMeter / 1000).toFixed(1)}km · 약 ${Math.ceil(routeState.totalTimeSecond / 60)}분`
            : "경로 계산 중"}
        </span>
      </div>

      {error ? (
        <div className="map-fallback">{error}</div>
      ) : (
        <div ref={mapRef} className="kakao-map" style={{ height: 400 }} />
      )}

      <div className="map-meta-grid">
        <div>
          <span>운송 진행률</span>
          <strong>{Math.round((trackingMeta?.progress || 0) * 100)}%</strong>
        </div>
        <div>
          <span>남은 시간</span>
          <strong>
            {trackingMeta?.remainingMinutes ?? shipment?.estimatedMinutes}분
          </strong>
        </div>
        <div>
          <span>현재 상태</span>
          <strong>{trackingMeta?.roughLocation || "출발 전"}</strong>
        </div>
        <div>
          <span>사용자 지도 조작</span>
          <strong>
            {Date.now() < pauseUntilRef.current
              ? "7초 일시정지"
              : "실시간 추적중"}
          </strong>
        </div>
      </div>
    </div>
  );
}
