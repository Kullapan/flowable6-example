package com.example.controller;

import com.example.service.ApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Internal REST API — consumed by Flowable Java Delegates only.
 *
 * These endpoints are NOT exposed to the frontend.  They should be
 * secured (e.g. network policy / API key) in production.
 *
 * POST /api/internal/applications          → PersistApplicationDelegate  (Step 2)
 * POST /api/internal/policies/finalize     → FinalizePolicyDelegate      (Step 5A)
 * POST /api/internal/applications/reject   → UpdateRejectStatusDelegate  (Step 5B)
 */
@RestController
@RequestMapping("/api/internal")
public class InternalApiController {

    private final ApplicationService applicationService;

    public InternalApiController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Step 2 — PersistApplicationDelegate
     * Body: { appNumber, customerName, policyType, premiumAmount, processInstanceId }
     */
    @PostMapping("/applications")
    public ResponseEntity<Map<String, String>> persistApplication(@RequestBody Map<String, Object> body) {
        String appNumber        = str(body, "appNumber");
        String customerName      = str(body, "customerName");
        String policyType        = str(body, "policyType");
        BigDecimal premiumAmount = new BigDecimal(String.valueOf(body.getOrDefault("premiumAmount", 0)));
        String processInstanceId = str(body, "processInstanceId");

        applicationService.createPending(appNumber, customerName, policyType, premiumAmount, processInstanceId);
        return ResponseEntity.ok(Map.of("status", "PENDING", "appNumber", appNumber));
    }

    /**
     * Step 5A — FinalizePolicyDelegate (happy path)
     * Body: { appNumber, customerName, policyType, premiumAmount }
     */
    @PostMapping("/policies/finalize")
    public ResponseEntity<Map<String, String>> finalizePolicy(@RequestBody Map<String, Object> body) {
        String appNumber        = str(body, "appNumber");
        String customerName      = str(body, "customerName");
        String policyType        = str(body, "policyType");
        BigDecimal premiumAmount = new BigDecimal(String.valueOf(body.getOrDefault("premiumAmount", 0)));

        applicationService.finalizePolicy(appNumber, customerName, policyType, premiumAmount);
        return ResponseEntity.ok(Map.of("status", "COMPLETED", "appNumber", appNumber));
    }

    /**
     * Step 5B — UpdateRejectStatusDelegate (reject path)
     * Body: { appNumber, rejectReason }
     */
    @PostMapping("/applications/reject")
    public ResponseEntity<Map<String, String>> rejectApplication(@RequestBody Map<String, Object> body) {
        String appNumber    = str(body, "appNumber");
        String rejectReason = str(body, "rejectReason");

        applicationService.rejectApplication(appNumber, rejectReason);
        return ResponseEntity.ok(Map.of("status", "REJECTED", "appNumber", appNumber));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }
}
