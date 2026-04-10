package com.logistics.app.service;

import com.logistics.app.dto.ChatDtos;
import com.logistics.app.entity.ChatMessage;
import com.logistics.app.entity.User;
import com.logistics.app.repository.ChatMessageRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public ChatService(ChatMessageRepository chatMessageRepository, UserRepository userRepository, UserService userService) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.ChatRoomSummaryRow> getRooms(User currentUser) {
        List<ChatMessage> sorted = chatMessageRepository.findBySenderOrReceiverOrderByCreatedAtDescIdDesc(currentUser, currentUser);
        Map<String, ChatDtos.ChatRoomSummaryRow> summaries = new LinkedHashMap<>();

        for (ChatMessage message : sorted) {
            if (summaries.containsKey(message.getRoomKey())) {
                continue;
            }

            User target = resolveTarget(message, currentUser);
            summaries.put(message.getRoomKey(), ChatDtos.ChatRoomSummaryRow.builder()
                    .roomKey(message.getRoomKey())
                    .targetProfile(userService.toPublicProfile(target))
                    .lastMessage(message.getContent())
                    .lastMessageAt(message.getCreatedAt())
                    .unreadCount(chatMessageRepository.countByRoomKeyAndReceiverAndReadAtIsNull(message.getRoomKey(), currentUser))
                    .build());
        }

        return summaries.values().stream().toList();
    }

    @Transactional(readOnly = true)
    public ChatDtos.ChatRoomResponse getRoom(User currentUser, Long targetUserId) {
        User target = getTargetUser(currentUser, targetUserId);
        String roomKey = roomKey(currentUser.getId(), target.getId());
        return ChatDtos.ChatRoomResponse.builder()
                .roomKey(roomKey)
                .meId(currentUser.getId())
                .targetProfile(userService.toPublicProfile(target))
                .messages(chatMessageRepository.findByRoomKeyOrderByCreatedAtAscIdAsc(roomKey).stream()
                        .map(message -> toMessageRow(message, currentUser))
                        .toList())
                .build();
    }

    public void markRoomAsRead(User currentUser, Long targetUserId) {
        User target = getTargetUser(currentUser, targetUserId);
        String roomKey = roomKey(currentUser.getId(), target.getId());
        chatMessageRepository.markRoomAsRead(roomKey, currentUser, LocalDateTime.now());
    }

    public ChatDtos.ChatMessageRow sendMessage(User currentUser, Long targetUserId, String content) {
        User target = getTargetUser(currentUser, targetUserId);
        String normalized = content == null ? "" : content.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("메시지를 입력해 주세요.");
        }

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .roomKey(roomKey(currentUser.getId(), target.getId()))
                .sender(currentUser)
                .receiver(target)
                .content(normalized)
                .build());

        return toMessageRow(saved, currentUser);
    }

    private User getTargetUser(User currentUser, Long targetUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("대상 사용자를 찾을 수 없습니다.");
        }
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신과는 채팅할 수 없습니다.");
        }
        return userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다."));
    }

    private User resolveTarget(ChatMessage message, User currentUser) {
        if (message.getSender().getId().equals(currentUser.getId())) {
            return message.getReceiver();
        }
        return message.getSender();
    }

    private ChatDtos.ChatMessageRow toMessageRow(ChatMessage message, User currentUser) {
        return ChatDtos.ChatMessageRow.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .senderProfileImageUrl(message.getSender().getProfileImageUrl())
                .receiverId(message.getReceiver().getId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .mine(message.getSender().getId().equals(currentUser.getId()))
                .read(message.getReadAt() != null)
                .build();
    }

    private String roomKey(Long a, Long b) {
        long first = Math.min(a, b);
        long second = Math.max(a, b);
        return first + "_" + second;
    }
}
