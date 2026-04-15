package com.logistics.app.repository;

import com.logistics.app.entity.AssistantChatLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssistantChatLogRepository extends JpaRepository<AssistantChatLog, Long> {
    List<AssistantChatLog> findTop200ByOrderByCreatedAtDesc();
    List<AssistantChatLog> findTop50ByReviewStatusInAndRecommendedAnswerIsNotNullOrderByUpdatedAtDesc(List<String> reviewStatuses);
}
