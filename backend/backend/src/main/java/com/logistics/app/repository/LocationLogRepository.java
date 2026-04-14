package com.logistics.app.repository;

import com.logistics.app.entity.LocationLog;
import com.logistics.app.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LocationLogRepository extends JpaRepository<LocationLog, Long> {
    Optional<LocationLog> findTopByShipmentOrderByCreatedAtDesc(Shipment shipment);
}
