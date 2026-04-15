package com.logistics.app.repository;

import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByShipmentOrderByCreatedAtAsc(Shipment shipment);
}
