package com.logistics.app.repository;

import com.logistics.app.entity.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, Long> {
    List<CustomerInquiry> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
