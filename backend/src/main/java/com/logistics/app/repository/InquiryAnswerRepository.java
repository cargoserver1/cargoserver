package com.logistics.app.repository;

import com.logistics.app.entity.InquiryAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InquiryAnswerRepository extends JpaRepository<InquiryAnswer, Long> {
    Optional<InquiryAnswer> findByInquiryId(Long inquiryId);
    List<InquiryAnswer> findTop20ByOrderByCreatedAtDesc();
}
