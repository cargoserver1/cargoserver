package com.logistics.app.service;

import com.logistics.app.dto.UserNotificationDtos;
import com.logistics.app.entity.UserNotification;
import com.logistics.app.repository.UserNotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final UserNotificationRepository userNotificationRepository;

    public NotificationService(UserNotificationRepository userNotificationRepository) {
        this.userNotificationRepository = userNotificationRepository;
    }

    public void notifyUser(Long userId, String type, String title, String message, String linkKey, Long linkId) {
        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setLinkKey(linkKey);
        notification.setLinkId(linkId);

        userNotificationRepository.save(notification);
    }

    public UserNotificationDtos.NotificationSummary getUnreadSummary(Long userId) {
        List<UserNotificationDtos.NotificationItem> items =
                userNotificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                        .stream()
                        .map(this::toItem)
                        .toList();

        long unreadCount = userNotificationRepository.countByUserIdAndIsReadFalse(userId);

        return UserNotificationDtos.NotificationSummary.builder()
                .unreadCount(unreadCount)
                .items(items)
                .build();
    }

    public List<UserNotificationDtos.NotificationItem> getAllNotifications(Long userId) {
        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toItem)
                .toList();
    }

    public void markRead(Long userId, Long notificationId) {
        UserNotification notification = userNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("해당 알림에 접근할 수 없습니다.");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            userNotificationRepository.save(notification);
        }
    }

    public void markAllRead(Long userId) {
        List<UserNotification> notifications = userNotificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        for (UserNotification notification : notifications) {
            notification.setRead(true);
        }

        userNotificationRepository.saveAll(notifications);
    }

    private UserNotificationDtos.NotificationItem toItem(UserNotification notification) {
        return UserNotificationDtos.NotificationItem.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .linkKey(notification.getLinkKey())
                .linkId(notification.getLinkId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}