package com.logistics.app.repository;

import com.logistics.app.entity.QuickDrawParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuickDrawParticipantRepository extends JpaRepository<QuickDrawParticipantEntity, Long> {

    @Query("""
            select p
            from QuickDrawParticipantEntity p
            join fetch p.room r
            join fetch p.user u
            where u.id = :userId and r.active = true
            """)
    List<QuickDrawParticipantEntity> findAllActiveByUserId(@Param("userId") Long userId);
}
