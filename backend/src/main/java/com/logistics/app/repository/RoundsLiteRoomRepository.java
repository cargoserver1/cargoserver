package com.logistics.app.repository;

import com.logistics.app.entity.RoundsLiteRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoundsLiteRoomRepository extends JpaRepository<RoundsLiteRoom, Long> {
    Optional<RoundsLiteRoom> findByRoomCode(String roomCode);
    List<RoundsLiteRoom> findByMatchmakingRoomTrueOrderByCreatedAtAsc();
}
