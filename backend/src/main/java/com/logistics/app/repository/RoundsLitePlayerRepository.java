package com.logistics.app.repository;

import com.logistics.app.entity.RoundsLitePlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoundsLitePlayerRepository extends JpaRepository<RoundsLitePlayer, Long> {
    Optional<RoundsLitePlayer> findByUserId(Long userId);
    List<RoundsLitePlayer> findByRoomRoomCodeOrderBySeatAsc(String roomCode);
}
