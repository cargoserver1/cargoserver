package com.logistics.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AssistantDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String message;
        private List<HistoryItem> history;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryItem {
        private String role;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NavigationAction {
        private String label;
        private String targetKey;
        private String description;
    }

    @Data
    @Builder
    public static class ChatResponse {
        private Long logId;
        private String answer;
        private boolean usedAi;
        private String mode;
        private List<String> quickActions;
        private List<String> matchedKnowledge;
        private List<NavigationAction> navigationActions;
    }
}
