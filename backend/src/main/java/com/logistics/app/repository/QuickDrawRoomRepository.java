package com.logistics.app.repository;

import com.logistics.app.entity.QuickDrawRoomEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QuickDrawRoomRepository extends JpaRepository<QuickDrawRoomEntity, Long> {

    boolean existsByRoomCode(String roomCode);

    @Query("""
            select distinct r
            from QuickDrawRoomEntity r
            left join fetch r.participants p
            left join fetch p.user
            where r.roomCode = :roomCode and r.active = true
            """)
    Optional<QuickDrawRoomEntity> findActiveRoom(@Param("roomCode") String roomCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select distinct r
            from QuickDrawRoomEntity r
            left join fetch r.participants p
            left join fetch p.user
            where r.roomCode = :roomCode and r.active = true
            """)
    Optional<QuickDrawRoomEntity> findActiveRoomForUpdate(@Param("roomCode") String roomCode);
}
