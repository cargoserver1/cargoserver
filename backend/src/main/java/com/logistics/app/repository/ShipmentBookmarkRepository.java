package com.logistics.app.repository;

import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.ShipmentBookmark;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentBookmarkRepository extends JpaRepository<ShipmentBookmark, Long> {
    Optional<ShipmentBookmark> findByUserAndShipment(User user, Shipment shipment);
    List<ShipmentBookmark> findByUserOrderByCreatedAtDesc(User user);
}
