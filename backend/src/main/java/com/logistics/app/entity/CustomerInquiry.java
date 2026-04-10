package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contactName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String inquiryType;

    @Column(nullable = false, length = 3000)
    private String message;

    @Column(nullable = false)
    private String status;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "RECEIVED";
        }
    }
}
