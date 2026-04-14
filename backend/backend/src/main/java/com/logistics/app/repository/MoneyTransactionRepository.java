package com.logistics.app.repository;

import com.logistics.app.entity.MoneyTransaction;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.logistics.app.entity.TransactionType;

public interface MoneyTransactionRepository extends JpaRepository<MoneyTransaction, Long> {
    List<MoneyTransaction> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByShipment(Shipment shipment);

    Optional<MoneyTransaction> findFirstByUserAndShipmentIdOrderByCreatedAtDesc(User user, Long shipmentId);

    Optional<MoneyTransaction> findFirstByShipmentIdOrderByCreatedAtDesc(Long shipmentId);
    boolean existsByShipmentAndType(Shipment shipment, TransactionType type);
}

