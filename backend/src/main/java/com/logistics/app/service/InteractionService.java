package com.logistics.app.service;

import com.logistics.app.dto.InteractionDtos;
import com.logistics.app.dto.UserNotificationDtos;
import com.logistics.app.entity.BlockUser;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.repository.BlockUserRepository;
import com.logistics.app.repository.RatingRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class InteractionService {

    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final BlockUserRepository blockUserRepository;
    private final NotificationService notificationService;

    public InteractionService(UserRepository userRepository,
                              RatingRepository ratingRepository,
                              BlockUserRepository blockUserRepository,
                              NotificationService notificationService) {
        this.userRepository = userRepository;
        this.ratingRepository = ratingRepository;
        this.blockUserRepository = blockUserRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<InteractionDtos.PeerUserRow> getPeerUsers(User me) {
        UserRole targetRole = me.getRole() == UserRole.SHIPPER ? UserRole.DRIVER : UserRole.SHIPPER;
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(user -> user.getRole() == targetRole)
                .filter(user -> !user.getId().equals(me.getId()))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(user -> {
                    var ratings = ratingRepository.findByToUserOrderByCreatedAtDesc(user);
                    double avg = ratings.stream().mapToInt(r -> r.getScore() == null ? 0 : r.getScore()).average().orElse(0);
                    long count = ratingRepository.countByToUser(user);
                    return InteractionDtos.PeerUserRow.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .name(user.getName())
                            .companyName(user.getCompanyName())
                            .vehicleType(user.getVehicleType())
                            .role(user.getRole().name())
                            .averageRating(avg)
                            .ratingCount(count)
                            .blocked(blockUserRepository.existsByBlockerAndBlocked(me, user))
                            .build();
                })
                .toList();
    }

    public InteractionDtos.BlockToggleResponse toggleBlock(User me, Long targetUserId) {
        User target = userRepository.findById(targetUserId).orElseThrow(() -> new RuntimeException("대상 사용자를 찾을 수 없습니다."));
        if (target.getId().equals(me.getId())) {
            throw new RuntimeException("자기 자신은 차단할 수 없습니다.");
        }
        var existing = blockUserRepository.findByBlockerAndBlocked(me, target);
        boolean blocked;
        if (existing.isPresent()) {
            blockUserRepository.delete(existing.get());
            blocked = false;
        } else {
            blockUserRepository.save(BlockUser.builder().blocker(me).blocked(target).build());
            blocked = true;
            notificationService.notifyUser(target.getId(), "BLOCK", "거래 차단 알림", me.getName() + "님이 거래 차단을 설정했습니다.", "USER", me.getId());
        }
        return InteractionDtos.BlockToggleResponse.builder().blocked(blocked).build();
    }

    @Transactional(readOnly = true)
    public UserNotificationDtos.NotificationSummary getNotifications(User me) {
        return notificationService.getUnreadSummary(me.getId());
    }

    @Transactional(readOnly = true)
    public List<UserNotificationDtos.NotificationItem> getAllNotifications(User me) {
        return notificationService.getAllNotifications(me.getId());
    }

    public void readNotifications(User me) {
        notificationService.markAllRead(me.getId());
    }

    public void readNotification(User me, Long notificationId) {
        notificationService.markRead(me.getId(), notificationId);
    }
}
