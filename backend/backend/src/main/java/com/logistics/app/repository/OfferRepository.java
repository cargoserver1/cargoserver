package com.logistics.app.repository;

import com.logistics.app.entity.Offer;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByShipment(Shipment shipment);
    List<Offer> findByDriver(User driver);
    boolean existsByShipmentAndDriver(Shipment shipment, User driver);
}
