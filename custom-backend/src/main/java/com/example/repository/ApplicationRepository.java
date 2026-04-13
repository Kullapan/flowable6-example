package com.example.repository;

import com.example.entity.ApplicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<ApplicationRecord, Long> {
    Optional<ApplicationRecord> findByAppNumber(String appNumber);
}
