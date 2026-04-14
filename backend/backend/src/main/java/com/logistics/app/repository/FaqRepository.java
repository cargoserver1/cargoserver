package com.logistics.app.repository;

import com.logistics.app.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findAllByOrderBySortOrderAsc();
}
