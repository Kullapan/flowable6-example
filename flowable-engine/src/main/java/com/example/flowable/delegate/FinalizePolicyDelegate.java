package com.example.flowable.delegate;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Step 5A — Finalize Policy (Service Task: finalizePolicyTask) — HAPPY PATH
 *
 * Runs ASYNC + EXCLUSIVE.
 * Calls custom-backend to:
 *   1. INSERT into policy_table
 *   2. UPDATE application_table.status = 'COMPLETED'
 *
 * Variables consumed: appNumber, customerName, policyType, premiumAmount
 * Variables produced: systemStatus = "COMPLETED"
 */
@Component
public class FinalizePolicyDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(FinalizePolicyDelegate.class);

    @Value("${app.custom-backend.url:http://localhost:8080}")
    private String backendUrl;

    @Override
    public void execute(DelegateExecution execution) {
        String appNumber    = (String) execution.getVariable("appNumber");
        String customerName = (String) execution.getVariable("customerName");
        String policyType   = (String) execution.getVariable("policyType");
        Object premiumRaw   = execution.getVariable("premiumAmount");
        long   premiumAmount = premiumRaw instanceof Number ? ((Number) premiumRaw).longValue() : 0L;

        log.info("[FinalizePolicyDelegate] finalizing appNumber={}", appNumber);

        Map<String, Object> payload = new HashMap<>();
        payload.put("appNumber",      appNumber);
        payload.put("customerName",    customerName);
        payload.put("policyType",      policyType);
        payload.put("premiumAmount",   premiumAmount);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        String url = backendUrl + "/api/internal/policies/finalize";
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, typeRef);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("[FinalizePolicyDelegate] backend returned " + response.getStatusCode());
        }

        execution.setVariable("systemStatus", "COMPLETED");
        log.info("[FinalizePolicyDelegate] done — systemStatus=COMPLETED");
    }
}
