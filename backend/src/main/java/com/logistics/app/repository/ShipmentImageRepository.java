package com.logistics.app.repository;

import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.ShipmentImage;
import com.logistics.app.entity.ShipmentImageType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentImageRepository extends JpaRepository<ShipmentImage, Long> {
    List<ShipmentImage> findByShipmentOrderByCreatedAtAsc(Shipment shipment);
    List<ShipmentImage> findByShipmentAndTypeOrderByCreatedAtAsc(Shipment shipment, ShipmentImageType type);
    Optional<ShipmentImage> findTopByShipmentAndTypeOrderByCreatedAtDesc(Shipment shipment, ShipmentImageType type);
}
