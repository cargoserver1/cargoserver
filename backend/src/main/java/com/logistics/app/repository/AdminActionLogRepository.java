package com.logistics.app.repository;

import com.logistics.app.entity.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    List<AdminActionLog> findTop20ByOrderByCreatedAtDesc();
}
