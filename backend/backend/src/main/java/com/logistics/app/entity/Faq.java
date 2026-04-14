package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Faq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String question;

    @Column(nullable = false, length = 3000)
    private String answer;

    @Column(nullable = false)
    private int sortOrder;
}
