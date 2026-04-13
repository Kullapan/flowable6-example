package com.example.service;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Orchestration service — bridges the public REST API with the Flowable engine.
 *
 * Process key: policy_submission_v1
 * Business key: appNumber
 * Candidate group for review: underwriter_group
 *
 * Variable names aligned with BPMN spec:
 *   appNumber, customerName, policyType, premiumAmount  (Step 1 form data)
 *   decision (boolean), rejectReason (string)           (Step 3 form data)
 */
@Service
public class InsurancePolicyService {

    private static final String PROCESS_KEY = "policy_submission_v1";
    private static final String CANDIDATE_GROUP = "underwriter_group";

    private final RestTemplate restTemplate;
    private final String flowableUrl;

    public InsurancePolicyService(RestTemplateBuilder restTemplateBuilder,
                                  @org.springframework.beans.factory.annotation.Value("${flowable.engine.url:http://localhost:8081}") String url,
                                  @org.springframework.beans.factory.annotation.Value("${flowable.engine.username:admin}") String username,
                                  @org.springframework.beans.factory.annotation.Value("${flowable.engine.password:test}") String password) {
        this.restTemplate = restTemplateBuilder
                .basicAuthentication(username, password)
                .build();
        // Since the process instances endpoint is /process-api/runtime/process-instances
        // we'll append /process-api/runtime to whatever the base URL is.
        this.flowableUrl = url + "/process-api/runtime";
    }

    // ─── Step 1: Start the process ─────────────────────────────────────────

    public String submitPolicy(String appNumber,
                                String customerName,
                                String policyType,
                                long premiumAmount) {
        String url = flowableUrl + "/process-instances";

        Map<String, Object> body = new HashMap<>();
        body.put("processDefinitionKey", PROCESS_KEY);
        body.put("businessKey", appNumber);

        List<Map<String, Object>> vars = new ArrayList<>();
        vars.add(Map.of("name", "appNumber",      "value", appNumber));
        vars.add(Map.of("name", "customerName",    "value", customerName));
        vars.add(Map.of("name", "policyType",      "value", policyType));
        vars.add(Map.of("name", "premiumAmount",   "value", premiumAmount));
        vars.add(Map.of("name", "systemStatus",    "value", "SUBMITTED"));
        body.put("variables", vars);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, typeRef);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String processId = (String) response.getBody().get("id");
                
                // ─── Auto-complete the initial "Submit Policy Request" User Task ───
                try {
                    String queryUrl = flowableUrl + "/tasks?processInstanceId=" + processId;
                    ResponseEntity<Map<String, Object>> taskResponse =
                            restTemplate.exchange(queryUrl, HttpMethod.GET, null, typeRef);
                    if (taskResponse.getStatusCode().is2xxSuccessful() && taskResponse.getBody() != null) {
                        Object data = taskResponse.getBody().get("data");
                        if (data instanceof List<?> list && !list.isEmpty()) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> tasks = (List<Map<String, Object>>) list;
                            String taskId = (String) tasks.get(0).get("id");
                            
                            // Complete it
                            String completeUrl = flowableUrl + "/tasks/" + taskId;
                            Map<String, Object> completeBody = new HashMap<>();
                            completeBody.put("action", "complete");
                            HttpHeaders completeHeaders = new HttpHeaders();
                            completeHeaders.setContentType(MediaType.APPLICATION_JSON);
                            HttpEntity<Map<String, Object>> completeEntity = new HttpEntity<>(completeBody, completeHeaders);
                            restTemplate.postForEntity(completeUrl, completeEntity, Void.class);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Warning: Could not auto-complete initial task: " + e.getMessage());
                }
                
                return "Policy submitted. App No: " + appNumber + ", Process ID: " + processId;
            }
            return "Failed: HTTP " + response.getStatusCode();
        } catch (Exception e) {
            return "Error interacting with Flowable: " + e.getMessage();
        }
    }

    // ─── Step 3: Fetch underwriter tasks ───────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getUnderwriterTasks() {
        String url = flowableUrl + "/tasks?candidateGroup=" + CANDIDATE_GROUP + "&includeProcessVariables=true";
        try {
            ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response =
                    restTemplate.exchange(url, HttpMethod.GET, null, typeRef);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object data = response.getBody().get("data");
                if (data instanceof List<?> list) {
                    return (List<Map<String, Object>>) list;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    // ─── Step 3 complete: Submit decision ──────────────────────────────────

    public void completeTask(String taskId, boolean decision, String rejectReason) {
        String url = flowableUrl + "/tasks/" + taskId;

        List<Map<String, Object>> vars = new ArrayList<>();
        vars.add(Map.of("name", "decision",     "value", decision));
        vars.add(Map.of("name", "rejectReason", "value",
                rejectReason != null ? rejectReason : ""));

        Map<String, Object> body = new HashMap<>();
        body.put("action", "complete");
        body.put("variables", vars);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        restTemplate.postForEntity(url, entity, Void.class);
    }
}

