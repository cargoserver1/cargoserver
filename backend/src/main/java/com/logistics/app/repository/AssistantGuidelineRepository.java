package com.logistics.app.repository;

import com.logistics.app.entity.AssistantGuideline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssistantGuidelineRepository extends JpaRepository<AssistantGuideline, Long> {
    List<AssistantGuideline> findAllByOrderBySortOrderAscIdAsc();
    List<AssistantGuideline> findByActiveTrueOrderBySortOrderAscIdAsc();
}
