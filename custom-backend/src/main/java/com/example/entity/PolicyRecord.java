package com.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * JPA Entity for policy_table in custom_app_db.
 * Populated only on the APPROVED (happy) path — represents an active policy.
 */
@Entity
@Table(name = "policy_table")
public class PolicyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "app_number", nullable = false, unique = true, length = 100)
    private String appNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "policy_type", nullable = false, length = 100)
    private String policyType;

    @Column(name = "premium_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal premiumAmount;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    // ─── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getAppNumber() { return appNumber; }
    public void setAppNumber(String appNumber) { this.appNumber = appNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPolicyType() { return policyType; }
    public void setPolicyType(String policyType) { this.policyType = policyType; }

    public BigDecimal getPremiumAmount() { return premiumAmount; }
    public void setPremiumAmount(BigDecimal premiumAmount) { this.premiumAmount = premiumAmount; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
}
