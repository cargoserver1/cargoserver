package com.logistics.app.repository;

import com.logistics.app.entity.ChatMessage;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomKeyOrderByCreatedAtAscIdAsc(String roomKey);

    List<ChatMessage> findBySenderOrReceiverOrderByCreatedAtDescIdDesc(User sender, User receiver);

    long countByRoomKeyAndReceiverAndReadAtIsNull(String roomKey, User receiver);

    @Modifying
    @Query("update ChatMessage m set m.readAt = :readAt where m.roomKey = :roomKey and m.receiver = :receiver and m.readAt is null")
    int markRoomAsRead(@Param("roomKey") String roomKey,
                       @Param("receiver") User receiver,
                       @Param("readAt") LocalDateTime readAt);
}
