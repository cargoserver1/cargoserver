package com.logistics.app.repository;

import com.logistics.app.entity.ShipmentCancelHistory;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShipmentCancelHistoryRepository extends JpaRepository<ShipmentCancelHistory, Long> {
    List<ShipmentCancelHistory> findByCanceledByAndCanceledAtAfterOrderByCanceledAtDesc(User canceledBy, LocalDateTime after);
    long countByCanceledByAndCanceledAtAfter(User canceledBy, LocalDateTime after);
}
