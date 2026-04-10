package com.logistics.app.repository;

import com.logistics.app.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findTop6ByOrderByPinnedDescPublishedAtDesc();
    List<Notice> findAllByOrderByPinnedDescPublishedAtDesc();
}
