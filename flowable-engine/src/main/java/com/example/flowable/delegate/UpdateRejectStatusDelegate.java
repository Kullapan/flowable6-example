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
 * Step 5B — Update Reject Status (Service Task: updateRejectStatusTask) — REJECT PATH
 *
 * Runs ASYNC + EXCLUSIVE.
 * Calls custom-backend to:
 *   UPDATE application_table SET status='REJECTED', reject_reason=? WHERE app_number=?
 *
 * Variables consumed: appNumber, rejectReason
 * Variables produced: systemStatus = "REJECTED"
 */
@Component
public class UpdateRejectStatusDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(UpdateRejectStatusDelegate.class);

    @Value("${app.custom-backend.url:http://localhost:8080}")
    private String backendUrl;

    @Override
    public void execute(DelegateExecution execution) {
        String appNumber    = (String) execution.getVariable("appNumber");
        String rejectReason = (String) execution.getVariable("rejectReason");

        log.info("[UpdateRejectStatusDelegate] rejecting appNumber={} reason={}", appNumber, rejectReason);

        Map<String, Object> payload = new HashMap<>();
        payload.put("appNumber",    appNumber);
        payload.put("rejectReason", rejectReason != null ? rejectReason : "No reason provided");

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        String url = backendUrl + "/api/internal/applications/reject";
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, typeRef);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("[UpdateRejectStatusDelegate] backend returned " + response.getStatusCode());
        }

        execution.setVariable("systemStatus", "REJECTED");
        log.info("[UpdateRejectStatusDelegate] done — systemStatus=REJECTED");
    }
}
