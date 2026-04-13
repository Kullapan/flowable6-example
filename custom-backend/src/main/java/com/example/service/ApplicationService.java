package com.example.service;

import com.example.entity.ApplicationRecord;
import com.example.entity.PolicyRecord;
import com.example.repository.ApplicationRepository;
import com.example.repository.PolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Business logic for managing application and policy records in custom_app_db.
 *
 * Called by InternalApiController — which is invoked by the Flowable Java Delegates.
 */
@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final PolicyRepository policyRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                               PolicyRepository policyRepository) {
        this.applicationRepository = applicationRepository;
        this.policyRepository = policyRepository;
    }

    /**
     * Step 2 — called by PersistApplicationDelegate.
     * Inserts a new application record with status PENDING.
     */
    @Transactional
    public ApplicationRecord createPending(String appNumber,
                                            String customerName,
                                            String policyType,
                                            BigDecimal premiumAmount,
                                            String processInstanceId) {
        log.info("[ApplicationService] createPending appNumber={}", appNumber);

        ApplicationRecord record = new ApplicationRecord();
        record.setAppNumber(appNumber);
        record.setCustomerName(customerName);
        record.setPolicyType(policyType);
        record.setPremiumAmount(premiumAmount);
        record.setStatus("PENDING");
        record.setProcessInstanceId(processInstanceId);

        return applicationRepository.save(record);
    }

    /**
     * Step 5A — called by FinalizePolicyDelegate (happy path).
     * Inserts into policy_table and marks the application as COMPLETED.
     */
    @Transactional
    public PolicyRecord finalizePolicy(String appNumber,
                                        String customerName,
                                        String policyType,
                                        BigDecimal premiumAmount) {
        log.info("[ApplicationService] finalizePolicy appNumber={}", appNumber);

        // Update application status → COMPLETED
        ApplicationRecord app = applicationRepository.findByAppNumber(appNumber)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + appNumber));
        app.setStatus("COMPLETED");
        applicationRepository.save(app);

        // Insert into policy_table
        PolicyRecord policy = new PolicyRecord();
        policy.setAppNumber(appNumber);
        policy.setCustomerName(customerName);
        policy.setPolicyType(policyType);
        policy.setPremiumAmount(premiumAmount);

        return policyRepository.save(policy);
    }

    /**
     * Step 5B — called by UpdateRejectStatusDelegate (reject path).
     * Updates application_table with status REJECTED and saves the reject reason.
     */
    @Transactional
    public ApplicationRecord rejectApplication(String appNumber, String rejectReason) {
        log.info("[ApplicationService] rejectApplication appNumber={} reason={}", appNumber, rejectReason);

        ApplicationRecord app = applicationRepository.findByAppNumber(appNumber)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + appNumber));
        app.setStatus("REJECTED");
        app.setRejectReason(rejectReason != null ? rejectReason : "No reason provided");

        return applicationRepository.save(app);
    }
}
