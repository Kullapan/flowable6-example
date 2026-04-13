package com.example.repository;

import com.example.entity.PolicyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PolicyRepository extends JpaRepository<PolicyRecord, Long> {
    Optional<PolicyRecord> findByAppNumber(String appNumber);
}
