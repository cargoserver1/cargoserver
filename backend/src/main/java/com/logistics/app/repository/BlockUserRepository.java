package com.logistics.app.repository;

import com.logistics.app.entity.BlockUser;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockUserRepository extends JpaRepository<BlockUser, Long> {
    boolean existsByBlockerAndBlocked(User blocker, User blocked);
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    Optional<BlockUser> findByBlockerAndBlocked(User blocker, User blocked);
    List<BlockUser> findByBlockerOrderByCreatedAtDesc(User blocker);
}
