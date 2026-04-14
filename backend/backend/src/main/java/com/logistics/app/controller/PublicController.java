package com.logistics.app.controller;

import com.logistics.app.dto.PublicDtos;
import com.logistics.app.service.PublicService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public")
public class PublicController {

    private final PublicService publicService;
    private final com.logistics.app.service.RouteService routeService;

    public PublicController(PublicService publicService, com.logistics.app.service.RouteService routeService) {
        this.publicService = publicService;
        this.routeService = routeService;
    }

    @GetMapping("/overview")
    public PublicDtos.PublicOverviewResponse overview() {
        return publicService.getOverview();
    }

    @GetMapping("/shipments")
    public List<PublicDtos.PublicShipmentCard> shipments() {
        return publicService.getPublicShipments();
    }

    @GetMapping("/notices")
    public List<PublicDtos.NoticeResponse> notices() {
        return publicService.getNotices();
    }

    @GetMapping("/faqs")
    public List<PublicDtos.FaqResponse> faqs() {
        return publicService.getFaqs();
    }

    @PostMapping("/inquiries")
    public PublicDtos.InquiryResponse createInquiry(@Valid @RequestBody PublicDtos.CreateInquiryRequest request) {
        return publicService.createInquiry(request);
    }

    @GetMapping("/routes/driving")
    public PublicDtos.DrivingRouteResponse drivingRoute(@RequestParam double startLat,
                                                        @RequestParam double startLng,
                                                        @RequestParam double endLat,
                                                        @RequestParam double endLng) {
        return routeService.getDrivingRoute(startLat, startLng, endLat, endLng);
    }
}
