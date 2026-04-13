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
 * Step 2 — Persist Application (Service Task: persistApplicationTask)
 *
 * Runs ASYNC + EXCLUSIVE. If the HTTP call to the custom-backend fails, the job
 * lands in the Dead-Letter Queue and can be retried via the admin UI.
 *
 * Variables consumed: appNumber, customerName, policyType, premiumAmount
 * Variables produced: systemStatus = "IN_PROGRESS"
 */
@Component
public class PersistApplicationDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(PersistApplicationDelegate.class);

    @Value("${app.custom-backend.url:http://localhost:8080}")
    private String backendUrl;

    @Override
    public void execute(DelegateExecution execution) {
        String appNumber      = (String) execution.getVariable("appNumber");
        String customerName   = (String) execution.getVariable("customerName");
        String policyType     = (String) execution.getVariable("policyType");
        Object premiumRaw     = execution.getVariable("premiumAmount");
        long   premiumAmount  = premiumRaw instanceof Number ? ((Number) premiumRaw).longValue() : 0L;
        String processId      = execution.getProcessInstanceId();

        log.info("[PersistApplicationDelegate] persisting appNumber={} processId={}", appNumber, processId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("appNumber",          appNumber);
        payload.put("customerName",        customerName);
        payload.put("policyType",          policyType);
        payload.put("premiumAmount",       premiumAmount);
        payload.put("processInstanceId",   processId);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        String url = backendUrl + "/api/internal/applications";
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, typeRef);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("[PersistApplicationDelegate] backend returned " + response.getStatusCode());
        }

        execution.setVariable("systemStatus", "IN_PROGRESS");
        log.info("[PersistApplicationDelegate] done — systemStatus=IN_PROGRESS");
    }
}
