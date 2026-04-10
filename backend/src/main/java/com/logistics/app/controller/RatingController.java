package com.logistics.app.controller;

import com.logistics.app.dto.RatingDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {
    private final RatingService ratingService;
    private final AuthService authService;

    @GetMapping("/dashboard")
    public RatingDtos.RatingDashboardResponse dashboard(Authentication authentication) {
        return ratingService.getDashboard(currentUser(authentication));
    }

    @PostMapping("/shipments/{shipmentId}")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public RatingDtos.RatingRow create(@PathVariable Long shipmentId,
                                       @Valid @RequestBody RatingDtos.CreateRatingRequest request,
                                       Authentication authentication) {
        return ratingService.createRating(shipmentId, request, currentUser(authentication));
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RatingDtos.RatingRow> adminRecent() {
        return ratingService.getAdminRecentRatings();
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
