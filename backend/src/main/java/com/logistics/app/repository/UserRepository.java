package com.logistics.app.repository;

import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRole(UserRole role);
    long countByStatus(UserStatus status);
    List<User> findAllByOrderByCreatedAtDesc();
    List<User> findByRoleAndStatusOrderByCreatedAtDesc(UserRole role, UserStatus status);
}

