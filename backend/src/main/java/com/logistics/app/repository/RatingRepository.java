package com.logistics.app.repository;

import com.logistics.app.entity.Rating;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByShipmentAndFromUser(Shipment shipment, User fromUser);
    List<Rating> findByToUserOrderByCreatedAtDesc(User toUser);
    long countByToUser(User toUser);
    List<Rating> findTop20ByOrderByCreatedAtDesc();
}
