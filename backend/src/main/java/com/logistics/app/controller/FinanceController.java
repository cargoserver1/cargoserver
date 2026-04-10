package com.logistics.app.controller;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.FinanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;
    private final AuthService authService;

    public FinanceController(FinanceService financeService, AuthService authService) {
        this.financeService = financeService;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public FinanceDtos.FinanceSummaryResponse summary(Authentication authentication) {
        return financeService.getSummary(currentUser(authentication));
    }

    @GetMapping("/receipt/{shipmentId}")
    public FinanceDtos.ReceiptResponse getReceiptLegacyAlias(@PathVariable("shipmentId") Long shipmentId,
                                                             Authentication authentication) {
        return financeService.getReceipt(currentUser(authentication), shipmentId);
    }

    @GetMapping("/transactions")
    public List<FinanceDtos.MoneyTransactionResponse> transactions(Authentication authentication) {
        return financeService.getTransactions(currentUser(authentication));
    }

    @GetMapping("/receipts/{shipmentId}")
    public FinanceDtos.ReceiptResponse getReceipt(@PathVariable("shipmentId") Long shipmentId,
                                                  Authentication authentication) {
        return financeService.getReceipt(currentUser(authentication), shipmentId);
    }

    @PostMapping("/shipments/{shipmentId}/pay")
    public FinanceDtos.ShipmentPaymentResponse payForShipment(@PathVariable("shipmentId") Long shipmentId,
                                                              @RequestBody(required = false) FinanceDtos.ShipmentPaymentRequest request,
                                                              Authentication authentication) {
        return financeService.payForShipment(shipmentId, currentUser(authentication), request);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return authService.getCurrentUser(authentication.getName());
    }
}
