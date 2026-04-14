package com.logistics.app.repository;

import com.logistics.app.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
