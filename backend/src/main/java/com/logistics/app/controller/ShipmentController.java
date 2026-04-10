package com.logistics.app.controller;

import com.logistics.app.dto.ShipmentDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.ShipmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuthService authService;

    public ShipmentController(ShipmentService shipmentService, AuthService authService) {
        this.shipmentService = shipmentService;
        this.authService = authService;
    }

    @GetMapping
    public List<ShipmentDtos.ShipmentResponse> list(Authentication authentication) {
        return shipmentService.listForUser(currentUser(authentication));
    }

    @GetMapping("/bookmarks")
    public List<ShipmentDtos.ShipmentResponse> bookmarks(Authentication authentication) {
        return shipmentService.listBookmarks(currentUser(authentication));
    }

    @GetMapping("/{shipmentId}")
    public ShipmentDtos.ShipmentResponse get(@PathVariable Long shipmentId, Authentication authentication) {
        return shipmentService.getShipment(shipmentId, currentUser(authentication));
    }

    @PostMapping
    @PreAuthorize("hasRole('SHIPPER')")
    public ShipmentDtos.ShipmentResponse create(@Valid @RequestBody ShipmentDtos.CreateShipmentRequest request,
                                                Authentication authentication) {
        return shipmentService.createShipment(currentUser(authentication), request);
    }

    @PostMapping("/{shipmentId}/offers")
    @PreAuthorize("hasRole('DRIVER')")
    public ShipmentDtos.OfferResponse createOffer(@PathVariable Long shipmentId,
                                                  @Valid @RequestBody ShipmentDtos.CreateOfferRequest request,
                                                  Authentication authentication) {
        return shipmentService.createOffer(shipmentId, currentUser(authentication), request);
    }

    @PostMapping("/offers/{offerId}/accept")
    @PreAuthorize("hasRole('SHIPPER')")
    public ShipmentDtos.ShipmentResponse acceptOffer(@PathVariable Long offerId, Authentication authentication) {
        return shipmentService.acceptOffer(offerId, currentUser(authentication));
    }

    @PostMapping("/{shipmentId}/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ShipmentDtos.ShipmentResponse start(@PathVariable Long shipmentId, Authentication authentication) {
        return shipmentService.startTrip(shipmentId, currentUser(authentication));
    }

    @PostMapping("/{shipmentId}/locations")
    @PreAuthorize("hasRole('DRIVER')")
    public ShipmentDtos.TrackingResponse updateLocation(@PathVariable Long shipmentId,
                                                        @Valid @RequestBody ShipmentDtos.LocationUpdateRequest request,
                                                        Authentication authentication) {
        return shipmentService.updateLocation(shipmentId, currentUser(authentication), request);
    }

    @PostMapping("/{shipmentId}/complete")
    @PreAuthorize("hasRole('DRIVER')")
    public ShipmentDtos.ShipmentResponse complete(@PathVariable Long shipmentId,
                                                  @Valid @RequestBody ShipmentDtos.CompleteShipmentRequest request,
                                                  Authentication authentication) {
        return shipmentService.completeTrip(shipmentId, currentUser(authentication), request);
    }

    @PostMapping("/{shipmentId}/cancel")
    public ShipmentDtos.ShipmentResponse cancelShipment(@PathVariable Long shipmentId,
                                                        @Valid @RequestBody ShipmentDtos.CancelShipmentRequest request,
                                                        Authentication authentication) {
        return shipmentService.cancelShipment(shipmentId, currentUser(authentication), request);
    }

    @PostMapping("/{shipmentId}/bookmark")
    public ShipmentDtos.ToggleBookmarkResponse toggleBookmark(@PathVariable Long shipmentId, Authentication authentication) {
        return shipmentService.toggleBookmark(shipmentId, currentUser(authentication));
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
