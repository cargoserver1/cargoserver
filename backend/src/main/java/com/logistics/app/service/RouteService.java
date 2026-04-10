package com.logistics.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logistics.app.dto.PublicDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class RouteService {

    private static final String TMAP_ROUTE_URL = "https://apis.openapi.sk.com/tmap/routes?version=1&format=json";

    private final String tmapAppKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public RouteService(@Value("${app.tmap.app-key:}") String tmapAppKey,
                        ObjectMapper objectMapper) {
        this.tmapAppKey = tmapAppKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public PublicDtos.DrivingRouteResponse getDrivingRoute(double startLat, double startLng, double endLat, double endLng) {
        if (tmapAppKey == null || tmapAppKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TMAP_APP_KEY가 설정되지 않았습니다.");
        }

        try {
            String payload = objectMapper.writeValueAsString(new TmapRouteRequest(startLng, startLat, endLng, endLat));
            HttpRequest request = HttpRequest.newBuilder(URI.create(TMAP_ROUTE_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("appKey", tmapAppKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Tmap 경로 조회 실패: " + response.statusCode());
            }

            return parseRoute(response.body());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "경로 조회 중 오류가 발생했습니다.");
        }
    }

    private PublicDtos.DrivingRouteResponse parseRoute(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        JsonNode features = root.path("features");

        List<PublicDtos.RoutePoint> routeCoords = new ArrayList<>();
        Integer totalDistanceMeter = 0;
        Integer totalTimeSecond = 0;

        if (features.isArray()) {
            for (JsonNode feature : features) {
                JsonNode properties = feature.path("properties");
                if (properties.has("totalDistance") && totalDistanceMeter == 0) {
                    totalDistanceMeter = properties.path("totalDistance").asInt(0);
                }
                if (properties.has("totalTime") && totalTimeSecond == 0) {
                    totalTimeSecond = properties.path("totalTime").asInt(0);
                }

                JsonNode geometry = feature.path("geometry");
                if (!"LineString".equals(geometry.path("type").asText())) {
                    continue;
                }
                JsonNode coordinates = geometry.path("coordinates");
                if (!coordinates.isArray()) {
                    continue;
                }
                for (JsonNode coord : coordinates) {
                    if (coord.isArray() && coord.size() >= 2) {
                        double lng = coord.get(0).asDouble();
                        double lat = coord.get(1).asDouble();
                        routeCoords.add(PublicDtos.RoutePoint.builder().lat(lat).lng(lng).build());
                    }
                }
            }
        }

        if (routeCoords.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "경로 좌표를 찾지 못했습니다.");
        }

        return PublicDtos.DrivingRouteResponse.builder()
                .routeCoords(routeCoords)
                .totalDistanceMeter(totalDistanceMeter)
                .totalTimeSecond(totalTimeSecond)
                .build();
    }

    private record TmapRouteRequest(String startX, String startY, String endX, String endY,
                                    String reqCoordType, String resCoordType, String searchOption, String trafficInfo) {
        private TmapRouteRequest(double startX, double startY, double endX, double endY) {
            this(String.valueOf(startX), String.valueOf(startY), String.valueOf(endX), String.valueOf(endY),
                    "WGS84GEO", "WGS84GEO", "0", "N");
        }
    }
}
