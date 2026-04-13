package com.example.controller;

import com.example.service.InsurancePolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/policies")
public class InsurancePolicyController {

    private final InsurancePolicyService policyService;

    public InsurancePolicyController(InsurancePolicyService policyService) {
        this.policyService = policyService;
    }

    /**
     * POST /api/policies
     * Starts the policy_submission_v1 process.
     * Body: { appNumber, customerName, policyType, premiumAmount }
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> submitPolicy(@RequestBody Map<String, Object> payload) {
        String appNumber     = (String) payload.getOrDefault("appNumber", "");
        String customerName  = (String) payload.getOrDefault("customerName", "Unknown");
        String policyType    = (String) payload.getOrDefault("policyType", "Life Insurance");
        Object premiumRaw    = payload.getOrDefault("premiumAmount", 0);
        long   premiumAmount = premiumRaw instanceof Number ? ((Number) premiumRaw).longValue() : 0L;

        String result = policyService.submitPolicy(appNumber, customerName, policyType, premiumAmount);

        // Return 500 if the service reported an error
        if (result.startsWith("Error") || result.startsWith("Failed")) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", result, "appNumber", appNumber));
        }
        return ResponseEntity.ok(Map.of("status", "success", "message", result, "appNumber", appNumber));
    }


    /**
     * GET /api/policies/tasks
     * Retrieves pending underwriter review tasks (candidate group: underwriter_group).
     */
    @GetMapping("/tasks")
    public List<Map<String, Object>> getUnderwriterTasks() {
        return policyService.getUnderwriterTasks();
    }

    /**
     * POST /api/policies/tasks/{taskId}/complete
     * Complete the underwriter review task.
     * Body: { decision: boolean, rejectReason?: string }
     */
    @PostMapping("/tasks/{taskId}/complete")
    public Map<String, String> completeTask(@PathVariable String taskId,
                                             @RequestBody Map<String, Object> payload) {
        boolean decision     = (Boolean) payload.getOrDefault("decision", false);
        String rejectReason  = (String)  payload.getOrDefault("rejectReason", "");
        policyService.completeTask(taskId, decision, rejectReason);
        return Map.of("status", "success", "message", "Task completed");
    }
}

