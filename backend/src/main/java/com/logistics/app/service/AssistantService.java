package com.logistics.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logistics.app.dto.AssistantDtos;
import com.logistics.app.dto.UserDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.AssistantChatLogRepository;
import com.logistics.app.repository.AssistantGuidelineRepository;
import com.logistics.app.repository.FaqRepository;
import com.logistics.app.repository.NoticeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    private final FaqRepository faqRepository;
    private final NoticeRepository noticeRepository;
    private final UserService userService;
    private final AssistantChatLogRepository assistantChatLogRepository;
    private final AssistantGuidelineRepository assistantGuidelineRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${app.ai.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    public AssistantService(
            FaqRepository faqRepository,
            NoticeRepository noticeRepository,
            UserService userService,
            AssistantChatLogRepository assistantChatLogRepository,
            AssistantGuidelineRepository assistantGuidelineRepository,
            ObjectMapper objectMapper
    ) {
        this.faqRepository = faqRepository;
        this.noticeRepository = noticeRepository;
        this.userService = userService;
        this.assistantChatLogRepository = assistantChatLogRepository;
        this.assistantGuidelineRepository = assistantGuidelineRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Transactional
    public AssistantDtos.ChatResponse chat(User user, AssistantDtos.ChatRequest request) {
        String question = safe(request.getMessage());
        if (question.isBlank()) {
            throw new RuntimeException("질문 내용을 입력해 주세요.");
        }

        AssistantKnowledge knowledge;
        try {
            knowledge = buildKnowledge(user, question);
        } catch (Exception e) {
            knowledge = new AssistantKnowledge(null, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }

        AssistantDtos.ChatResponse response;
        try {
            RuleAnswer ruleAnswer = resolveRuleAnswer(user, question, knowledge);
            AssistantDtos.ChatResponse.ChatResponseBuilder builder;

            if (ruleAnswer != null) {
                builder = AssistantDtos.ChatResponse.builder()
                        .answer(ruleAnswer.answer())
                        .usedAi(false)
                        .mode("RULE")
                        .quickActions(ruleAnswer.quickActions())
                        .navigationActions(ruleAnswer.navigationActions())
                        .matchedKnowledge(knowledge.matchedKnowledge());
            } else if (hasOpenAiKey()) {
                String aiAnswer = askOpenAi(user, request, knowledge);
                if (!safe(aiAnswer).isBlank()) {
                    builder = AssistantDtos.ChatResponse.builder()
                            .answer(aiAnswer)
                            .usedAi(true)
                            .mode("OPENAI")
                            .quickActions(defaultQuickActions(user))
                            .navigationActions(resolveNavigationActions(user, question, knowledge, aiAnswer))
                            .matchedKnowledge(knowledge.matchedKnowledge());
                } else {
                    String fallbackAnswer = buildFallbackAnswer(user, knowledge);
                    builder = AssistantDtos.ChatResponse.builder()
                            .answer(fallbackAnswer)
                            .usedAi(false)
                            .mode("FALLBACK")
                            .quickActions(defaultQuickActions(user))
                            .navigationActions(resolveNavigationActions(user, question, knowledge, fallbackAnswer))
                            .matchedKnowledge(knowledge.matchedKnowledge());
                }
            } else {
                String fallbackAnswer = buildFallbackAnswer(user, knowledge);
                builder = AssistantDtos.ChatResponse.builder()
                        .answer(fallbackAnswer)
                        .usedAi(false)
                        .mode("FALLBACK")
                        .quickActions(defaultQuickActions(user))
                        .navigationActions(resolveNavigationActions(user, question, knowledge, fallbackAnswer))
                        .matchedKnowledge(knowledge.matchedKnowledge());
            }

            response = builder.build();
        } catch (Exception e) {
            response = AssistantDtos.ChatResponse.builder()
                    .answer(buildEmergencyAnswer(user, question))
                    .usedAi(false)
                    .mode("EMERGENCY")
                    .quickActions(defaultQuickActions(user))
                    .navigationActions(resolveNavigationActions(user, question, knowledge, question))
                    .matchedKnowledge(knowledge.matchedKnowledge())
                    .build();
        }

        try {
            String responseMode = safe(response.getMode());
            if (responseMode.isBlank()) {
                responseMode = "FALLBACK";
            }

            AssistantChatLog savedLog = assistantChatLogRepository.saveAndFlush(AssistantChatLog.builder()
                    .user(user)
                    .question(question)
                    .answer(response.getAnswer())
                    .mode(responseMode)
                    .responseMode(responseMode)
                    .usedAi(response.isUsedAi())
                    .fallbackUsed(isFallbackMode(responseMode))
                    .matchedKnowledge(String.join("\n", response.getMatchedKnowledge() == null ? List.of() : response.getMatchedKnowledge()))
                    .reviewStatus("NEW")
                    .build());
            response.setLogId(savedLog.getId());
            log.info("assistant chat log saved. logId={}, userId={}, mode={}", savedLog.getId(), user != null ? user.getId() : null, response.getMode());
        } catch (Exception e) {
            log.error("assistant chat log save failed. userId={}, question={}", user != null ? user.getId() : null, question, e);
        }
        return response;
    }

    private String buildEmergencyAnswer(User user, String question) {
        String q = normalize(question);
        if (containsAny(q, "수수료", "fee")) {
            return "안녕하세요. 현재 플랫폼 수수료 안내는 돈 관리 또는 공지/FAQ에서 확인하실 수 있습니다.";
        }
        if (containsAny(q, "차량")) {
            return "안녕하세요. 차량 등록 정보는 로그인 후 마이페이지의 회원정보 수정에서 변경하실 수 있습니다.";
        }
        if (containsAny(q, "화물", "등록")) {
            return "안녕하세요. 화물 등록은 로그인 후 대시보드의 화물 등록 메뉴에서 진행하실 수 있습니다.";
        }
        if (containsAny(q, "배차", "보드", "입찰")) {
            return "안녕하세요. 배차 보드는 로그인 후 대시보드의 배차 보드에서 확인하실 수 있습니다.";
        }
        if (containsAny(q, "결제")) {
            return "안녕하세요. 결제와 정산 관련 내용은 돈 관리 화면에서 확인하실 수 있습니다.";
        }
        return "안녕하세요. 현재 AI 비서 연결이 불안정하여 기본 안내로 도와드리고 있습니다. 아래 이동 버튼을 눌러 관련 화면으로 바로 이동해 주세요.";
    }

    private AssistantKnowledge buildKnowledge(User user, String question) {
        String normalizedQuestion = normalize(question);
        List<Faq> faqs = safeFetchFaqs();
        List<Notice> notices = safeFetchNotices();
        UserDtos.ProfileResponse profile = safeFetchProfile(user);

        List<AssistantGuideline> activeGuidelines = safeFetchGuidelines();
        List<AssistantChatLog> reviewedExamples = safeFetchReviewedExamples();

        List<Faq> matchedFaqs = faqs.stream()
                .map(faq -> Map.entry(faq, scoreFaq(faq, normalizedQuestion)))
                .filter(entry -> entry.getValue() > 0)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(4)
                .map(Map.Entry::getKey)
                .toList();

        List<String> matchedKnowledge = new ArrayList<>();
        if (containsAny(normalizedQuestion, "수수료", "fee", "정산", "플랫폼 수익")) {
            matchedKnowledge.add("현재 플랫폼 수수료율은 " + FinanceService.SERVICE_FEE_RATE + "%입니다.");
        }
        if (containsAny(normalizedQuestion, "차량", "차종", "vehicle")) {
            matchedKnowledge.add("차량 정보는 로그인 후 마이페이지 > 회원정보 수정에서 변경할 수 있습니다.");
        }
        if (containsAny(normalizedQuestion, "화물", "등록", "shipment", "cargo")) {
            matchedKnowledge.add("화물 등록은 로그인 후 사이드바의 화물 등록 메뉴에서 진행합니다.");
        }
        if (containsAny(normalizedQuestion, "배차", "보드", "입찰", "offer", "bid")) {
            matchedKnowledge.add("배차와 입찰 관련 내용은 로그인 후 배차 보드에서 확인하실 수 있습니다.");
        }
        if (profile != null && safe(profile.getPaymentMethod()).length() > 0 && containsAny(normalizedQuestion, "결제", "payment", "결제수단")) {
            matchedKnowledge.add("현재 프로필에 등록된 결제수단은 " + profile.getPaymentMethod() + " 입니다.");
        }

        matchedFaqs.forEach(faq -> matchedKnowledge.add("FAQ: " + faq.getQuestion() + " - " + faq.getAnswer()));
        notices.stream().limit(2).forEach(notice -> matchedKnowledge.add("공지: " + safe(notice.getTitle()) + " - " + safe(notice.getSummary())));
        activeGuidelines.stream().limit(6).forEach(guideline -> matchedKnowledge.add("운영가이드: " + safe(guideline.getTitle()) + " - " + safe(guideline.getInstruction())));
        reviewedExamples.stream().limit(6).forEach(example -> matchedKnowledge.add("학습된답변: 질문=" + safe(example.getQuestion()) + " / 권장답변=" + safe(example.getRecommendedAnswer())));

        return new AssistantKnowledge(profile, faqs, matchedFaqs, notices, activeGuidelines, reviewedExamples, matchedKnowledge.stream().distinct().toList());
    }

    private List<Faq> safeFetchFaqs() {
        try {
            return faqRepository.findAllByOrderBySortOrderAsc();
        } catch (Exception e) {
            log.error("assistant faq knowledge load failed", e);
            return List.of();
        }
    }

    private List<Notice> safeFetchNotices() {
        try {
            return noticeRepository.findTop6ByOrderByPinnedDescPublishedAtDesc();
        } catch (Exception e) {
            log.error("assistant notice knowledge load failed", e);
            return List.of();
        }
    }

    private UserDtos.ProfileResponse safeFetchProfile(User user) {
        try {
            return user == null ? null : userService.getMyProfile(user);
        } catch (Exception e) {
            log.error("assistant profile knowledge load failed. userId={}", user != null ? user.getId() : null, e);
            return null;
        }
    }

    private List<AssistantGuideline> safeFetchGuidelines() {
        try {
            return assistantGuidelineRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
        } catch (Exception e) {
            log.error("assistant guideline knowledge load failed", e);
            return List.of();
        }
    }

    private List<AssistantChatLog> safeFetchReviewedExamples() {
        try {
            return assistantChatLogRepository
                    .findTop50ByReviewStatusInAndRecommendedAnswerIsNotNullOrderByUpdatedAtDesc(List.of("APPROVED", "IMPROVE"))
                    .stream()
                    .filter(item -> !safe(item.getRecommendedAnswer()).isBlank())
                    .toList();
        } catch (Exception e) {
            log.error("assistant reviewed examples load failed", e);
            return List.of();
        }
    }

    private RuleAnswer resolveGuidelineRuleAnswer(User user, String question, AssistantKnowledge knowledge) {
        String normalizedQuestion = normalize(question);

        for (AssistantGuideline guideline : knowledge.guidelines()) {
            String title = safe(guideline.getTitle());
            String instruction = safe(guideline.getInstruction());
            if (title.isBlank() && instruction.isBlank()) continue;

            if (matchesGuideline(normalizedQuestion, title, instruction)) {
                String answer = extractGuidelineAnswer(title, instruction);
                if (!answer.isBlank()) {
                    return new RuleAnswer(
                            answer,
                            defaultQuickActions(user),
                            resolveNavigationActions(user, question + " " + title + " " + instruction, knowledge, answer)
                    );
                }
            }
        }

        return null;
    }

    private boolean matchesGuideline(String normalizedQuestion, String title, String instruction) {
        String normalizedTitle = normalize(title);
        String normalizedInstruction = normalize(instruction);

        double similarity = guidelineSimilarityScore(normalizedQuestion, normalizedTitle, normalizedInstruction);
        if (similarity >= 0.48d) {
            return true;
        }

        if (containsAny(normalizedQuestion, "이름", "name", "누구", "너 이름", "ai 이름", "정체")
                && (normalizedTitle.contains("이름") || normalizedInstruction.contains("이름")
                || normalizedTitle.contains("누구") || normalizedInstruction.contains("누구"))) {
            return true;
        }

        if (containsAny(normalizedQuestion, "결제", "카드", "결제수단")
                && (normalizedTitle.contains("결제") || normalizedInstruction.contains("결제")
                || normalizedTitle.contains("카드") || normalizedInstruction.contains("카드"))) {
            return true;
        }

        return false;
    }

    private String extractGuidelineAnswer(String title, String instruction) {
        String source = safe(instruction);
        if (source.isBlank()) {
            source = safe(title);
        }

        String[] directPatterns = {
                "(?i).*(?:내용에|답변은|응답은|앞으로는)?\\s*(.+?)\\s*(?:라고\\s*)?(?:대답해줘|답변해줘|말해줘|안내해줘|응답해줘).*",
                "(?i).*(?:질문에는|질문엔|물어보면)\\s*(.+?)\\s*(?:라고\\s*)?(?:대답|답변|응답).*"
        };
        for (String pattern : directPatterns) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(pattern).matcher(source);
            if (matcher.matches()) {
                String candidate = safe(matcher.group(1));
                candidate = candidate.replaceFirst("^(앞으로는\\s*)", "");
                candidate = candidate.replaceFirst("^(내용에\\s*)", "");
                candidate = candidate.replaceFirst("^(반드시\\s*)", "");
                candidate = candidate.replaceFirst("^(질문에는\\s*)", "");
                candidate = candidate.replaceFirst("(라고)$", "");
                if (!candidate.isBlank()) {
                    return normalizeGuidelineAnswer(candidate);
                }
            }
        }

        String[] markers = {"대답해줘", "답변해줘", "말해줘", "안내해줘", "응답해줘"};
        for (String marker : markers) {
            int idx = source.indexOf(marker);
            if (idx > 0) {
                String candidate = source.substring(0, idx).trim();
                candidate = candidate.replaceFirst("^(앞으로는\\s*)?", "");
                candidate = candidate.replaceFirst("^(내용에\\s*)?", "");
                candidate = candidate.replaceFirst("^(반드시\\s*)?", "");
                candidate = candidate.replaceFirst("(라고)$", "");
                if (!candidate.isBlank()) {
                    return normalizeGuidelineAnswer(candidate);
                }
            }
        }

        return normalizeGuidelineAnswer(source);
    }

    private String normalizeGuidelineAnswer(String answer) {
        String cleaned = safe(answer)
                .replaceAll("^['\"]+|['\"]+$", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.isBlank()) return "";
        if (!cleaned.endsWith(".") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
            cleaned += ".";
        }
        return cleaned;
    }

    private RuleAnswer resolveReviewedAnswerRule(User user, String question, AssistantKnowledge knowledge) {
        String normalizedQuestion = normalize(question);
        AssistantChatLog bestMatch = null;
        double bestScore = 0.0d;

        for (AssistantChatLog item : knowledge.reviewedExamples()) {
            String learnedQuestion = normalize(item.getQuestion());
            if (learnedQuestion.isBlank()) {
                continue;
            }

            double score = sentenceSimilarity(normalizedQuestion, learnedQuestion);
            if (containsIntentKeyword(normalizedQuestion, learnedQuestion)) {
                score += 0.12d;
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }

        if (bestMatch != null && bestScore >= 0.46d) {
            String answer = normalizeGuidelineAnswer(bestMatch.getRecommendedAnswer());
            if (!answer.isBlank()) {
                log.info("assistant reviewed answer matched. score={}, question={}, learnedQuestion={}", bestScore, normalizedQuestion, normalize(bestMatch.getQuestion()));
                return new RuleAnswer(
                        answer,
                        defaultQuickActions(user),
                        resolveNavigationActions(user, question + " " + bestMatch.getQuestion() + " " + bestMatch.getRecommendedAnswer(), knowledge, answer)
                );
            }
        }

        return null;
    }

    private RuleAnswer resolveRuleAnswer(User user, String question, AssistantKnowledge knowledge) {
        RuleAnswer guidelineRule = resolveGuidelineRuleAnswer(user, question, knowledge);
        if (guidelineRule != null) {
            return guidelineRule;
        }

        RuleAnswer reviewedRule = resolveReviewedAnswerRule(user, question, knowledge);
        if (reviewedRule != null) {
            return reviewedRule;
        }

        String q = normalize(question);
        UserDtos.ProfileResponse profile = knowledge.profile();

        if (containsAny(q, "수수료", "fee")) {
            String answer = "안녕하세요. 현재 플랫폼 수수료율은 " + FinanceService.SERVICE_FEE_RATE + "%입니다. "
                    + "화주는 확정된 운임 총액을 결제하고, 차주는 거래 원금에서 " + FinanceService.SERVICE_FEE_RATE + "%가 차감된 금액으로 정산됩니다.";
            return new RuleAnswer(
                    answer,
                    List.of("수수료 알려줘", "돈 관리 어디야?", "영수증은 어디서 봐?"),
                    List.of(
                            nav("돈 관리 열기", "user-finance", "정산과 결제 내역을 확인합니다."),
                            nav("메인 공지 보기", "main-notice-faq", "정책 공지와 FAQ를 확인합니다.")
                    )
            );
        }

        if (containsAny(q, "차량등록", "차량 등록", "차량수정", "차량 수정", "차종 수정", "vehicle")) {
            String currentVehicle = safe(profile != null ? profile.getVehicleType() : "");
            String answer = "안녕하세요. 차량 정보는 로그인 후 마이페이지의 회원정보 수정에서 변경하실 수 있습니다. "
                    + "차주 계정이라면 차량 종류 항목에서 보유 차량을 선택하거나 수정한 뒤 저장하시면 됩니다."
                    + (currentVehicle.isBlank() ? " 현재 등록된 차량 정보가 없다면 같은 화면에서 처음 등록하시면 됩니다." : " 현재 등록된 차량 정보는 '" + currentVehicle + "' 입니다.");
            return new RuleAnswer(
                    answer,
                    List.of("차량등록 어디서 수정해?", "결제수단 어디서 바꿔?", "마이페이지로 보내줘"),
                    List.of(
                            nav("마이페이지 열기", "user-overview", "회원정보 수정 화면으로 이동합니다."),
                            nav("돈 관리 열기", "user-finance", "결제수단도 같은 계정 영역에서 함께 확인합니다.")
                    )
            );
        }

        if (containsAny(q, "화물등록", "화물 등록", "짐 등록", "shipment", "cargo") && containsAny(q, "어떻게", "방법", "where", "어디", "등록")) {
            String answer = "안녕하세요. 화주 계정으로 로그인하신 뒤 사이드바의 화물 등록 메뉴에서 진행하시면 됩니다. "
                    + "배차명, 화물 종류, 중량, 상세 설명, 운송 시작 예정 시각을 입력하고, 필요하면 화물 사진을 첨부한 다음 출발지와 도착지를 지도에서 선택하신 후 등록 버튼을 누르시면 됩니다.";
            return new RuleAnswer(
                    answer,
                    List.of("화물 등록은 어떻게 해?", "배차 보드 어디야?", "즐겨찾기는 어디서 봐?"),
                    List.of(
                            nav("화물 등록 열기", "user-register", "화물 등록 화면으로 바로 이동합니다."),
                            nav("배차 보드 열기", "user-board", "등록 후 배차 현황을 확인합니다.")
                    )
            );
        }

        if (containsAny(q, "결제수단", "결제 수단", "payment method", "카드 등록")) {
            String paymentMethod = safe(profile != null ? profile.getPaymentMethod() : "");
            String answer = paymentMethod.isBlank()
                    ? "안녕하세요. 결제수단은 로그인 후 마이페이지의 회원정보 수정에서 입력해 두시면 결제 단계에서 등록된 결제수단으로 바로 사용할 수 있습니다. 현재 등록된 결제수단은 없습니다."
                    : "안녕하세요. 결제수단은 로그인 후 마이페이지의 회원정보 수정에서 변경하실 수 있습니다. 현재 등록된 결제수단은 '" + paymentMethod + "' 입니다.";
            return new RuleAnswer(
                    answer,
                    List.of("결제수단 어디서 바꿔?", "돈 관리 어디야?", "마이페이지 열기"),
                    List.of(
                            nav("마이페이지 열기", "user-overview", "회원정보 수정에서 결제수단을 관리합니다."),
                            nav("돈 관리 열기", "user-finance", "결제 내역과 정산을 함께 확인합니다.")
                    )
            );
        }

        if (containsAny(q, "배차", "보드", "입찰", "offer", "bid")) {
            String answer = "안녕하세요. 배차 확인과 입찰 관련 기능은 로그인 후 배차 보드에서 확인하실 수 있습니다. "
                    + (user.getRole() == UserRole.DRIVER
                    ? "차주 계정에서는 원하는 화물을 선택한 뒤 금액과 메시지를 입력하여 입찰하시면 됩니다."
                    : "화주 계정에서는 등록된 화물의 입찰 제안과 진행 상태를 배차 보드에서 확인하실 수 있습니다.");
            return new RuleAnswer(
                    answer,
                    List.of("배차 보드는 어디야?", "화물 등록은 어떻게 해?", "채팅은 어디서 열어?"),
                    List.of(
                            nav("배차 보드 열기", "user-board", "입찰과 진행 상태를 확인합니다."),
                            nav(user.getRole() == UserRole.SHIPPER ? "화물 등록 열기" : "마이페이지 열기", user.getRole() == UserRole.SHIPPER ? "user-register" : "user-overview", "관련 작업 화면으로 이동합니다.")
                    )
            );
        }

        if (containsAny(q, "채팅", "문의", "알림", "메뉴", "버튼")) {
            String answer = "안녕하세요. 로그인 후 오른쪽 하단 빠른 메뉴에서 AI 비서, 채팅, 알림을 바로 여실 수 있습니다. "
                    + "필요한 항목을 누르시면 최근 대화, 알림 확인, 서비스 안내를 빠르게 이용하실 수 있습니다.";
            return new RuleAnswer(
                    answer,
                    List.of("채팅은 어디서 열어?", "알림은 어디서 봐?", "AI 비서 다시 열어줘"),
                    List.of(
                            nav("채팅 열기", "chat-inbox", "최근 채팅 목록을 엽니다."),
                            nav("알림 열기", "notification-panel", "최근 알림 패널을 엽니다.")
                    )
            );
        }

        if (!knowledge.matchedFaqs().isEmpty()) {
            Faq faq = knowledge.matchedFaqs().get(0);
            String answer = "안녕하세요. 문의하신 내용과 가장 가까운 안내를 기준으로 답변드리겠습니다. "
                    + faq.getAnswer();
            return new RuleAnswer(
                    answer,
                    defaultQuickActions(user),
                    resolveNavigationActions(user, question + " " + faq.getQuestion() + " " + faq.getAnswer(), knowledge, answer)
            );
        }

        return null;
    }


    private double guidelineSimilarityScore(String normalizedQuestion, String normalizedTitle, String normalizedInstruction) {
        Set<String> questionTokens = extractMeaningfulTokens(normalizedQuestion);
        Set<String> titleTokens = extractMeaningfulTokens(normalizedTitle);
        Set<String> instructionTokens = extractMeaningfulTokens(normalizedInstruction);
        Set<String> guideTokens = new LinkedHashSet<>();
        guideTokens.addAll(titleTokens);
        guideTokens.addAll(instructionTokens);

        if (guideTokens.isEmpty()) {
            return 0.0d;
        }

        double score = tokenOverlapScore(questionTokens, guideTokens);

        if (!normalizedTitle.isBlank()) {
            score = Math.max(score, sentenceSimilarity(normalizedQuestion, normalizedTitle));
        }
        if (!normalizedInstruction.isBlank()) {
            score = Math.max(score, sentenceSimilarity(normalizedQuestion, normalizedInstruction) * 0.92d);
        }

        if (!normalizedTitle.isBlank() && normalizedQuestion.contains(normalizedTitle)) {
            score += 0.18d;
        }

        for (String token : guideTokens) {
            if (token.length() < 2) {
                continue;
            }
            if (normalizedQuestion.contains(token)) {
                score += 0.06d;
            }
        }

        if (containsIntentKeyword(normalizedQuestion, normalizedTitle + " " + normalizedInstruction)) {
            score += 0.12d;
        }

        return Math.min(score, 1.0d);
    }

    private double sentenceSimilarity(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);
        if (normalizedLeft.isBlank() || normalizedRight.isBlank()) {
            return 0.0d;
        }
        if (normalizedLeft.equals(normalizedRight)) {
            return 1.0d;
        }

        Set<String> leftTokens = extractMeaningfulTokens(normalizedLeft);
        Set<String> rightTokens = extractMeaningfulTokens(normalizedRight);
        double score = tokenOverlapScore(leftTokens, rightTokens);

        if (normalizedLeft.contains(normalizedRight) || normalizedRight.contains(normalizedLeft)) {
            score += 0.2d;
        }

        for (String lt : leftTokens) {
            if (lt.length() < 2) continue;
            for (String rt : rightTokens) {
                if (rt.length() < 2) continue;
                if (lt.equals(rt)) {
                    score += 0.03d;
                } else if (lt.contains(rt) || rt.contains(lt)) {
                    score += 0.02d;
                }
            }
        }

        return Math.min(score, 1.0d);
    }

    private double tokenOverlapScore(Set<String> leftTokens, Set<String> rightTokens) {
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) {
            return 0.0d;
        }

        int intersection = 0;
        for (String token : leftTokens) {
            if (rightTokens.contains(token)) {
                intersection++;
            }
        }

        int union = new LinkedHashSet<String>() {{ addAll(leftTokens); addAll(rightTokens); }}.size();
        if (union == 0) {
            return 0.0d;
        }

        double jaccard = (double) intersection / union;
        double coverage = (double) intersection / Math.max(1, Math.min(leftTokens.size(), rightTokens.size()));
        return Math.max(jaccard, coverage * 0.85d);
    }

    private boolean containsIntentKeyword(String question, String target) {
        String q = normalize(question);
        String t = normalize(target);

        if (containsAny(q, "이름", "누구", "정체") && containsAny(t, "이름", "누구", "정체")) return true;
        if (containsAny(q, "결제", "카드", "결제수단") && containsAny(t, "결제", "카드", "결제수단")) return true;
        if (containsAny(q, "수수료", "정산") && containsAny(t, "수수료", "정산")) return true;
        if (containsAny(q, "차량", "차종") && containsAny(t, "차량", "차종")) return true;
        if (containsAny(q, "화물", "등록") && containsAny(t, "화물", "등록")) return true;
        if (containsAny(q, "배차", "보드", "입찰") && containsAny(t, "배차", "보드", "입찰")) return true;
        if (containsAny(q, "채팅", "문의") && containsAny(t, "채팅", "문의")) return true;
        if (containsAny(q, "알림", "공지") && containsAny(t, "알림", "공지")) return true;
        return false;
    }

    private String askOpenAi(User user, AssistantDtos.ChatRequest request, AssistantKnowledge knowledge) {
        try {
            List<Map<String, Object>> input = new ArrayList<>();
            input.add(Map.of(
                    "role", "system",
                    "content", List.of(Map.of(
                            "type", "input_text",
                            "text", buildSystemPrompt(user, knowledge)
                    ))
            ));

            List<AssistantDtos.HistoryItem> history = request.getHistory() == null ? List.of() : request.getHistory();
            history.stream().skip(Math.max(0, history.size() - 8)).forEach(item -> {
                String role = "assistant".equalsIgnoreCase(item.getRole()) ? "assistant" : "user";
                input.add(Map.of(
                        "role", role,
                        "content", List.of(Map.of("type", "input_text", "text", safe(item.getContent())))
                ));
            });

            input.add(Map.of(
                    "role", "user",
                    "content", List.of(Map.of("type", "input_text", "text", safe(request.getMessage())))
            ));

            Map<String, Object> payload = Map.of(
                    "model", openAiModel,
                    "input", input,
                    "temperature", 0.2,
                    "max_output_tokens", 500
            );

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(openAiBaseUrl + "/responses"))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(25))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "";
            }

            JsonNode root = objectMapper.readTree(response.body());
            String outputText = safe(root.path("output_text").asText());
            if (!outputText.isBlank()) {
                return outputText.trim();
            }

            JsonNode output = root.path("output");
            if (output.isArray()) {
                for (JsonNode item : output) {
                    JsonNode content = item.path("content");
                    if (!content.isArray()) continue;
                    for (JsonNode contentItem : content) {
                        String text = safe(contentItem.path("text").asText());
                        if (!text.isBlank()) {
                            return text.trim();
                        }
                    }
                }
            }
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        } catch (IOException ignored) {
        } catch (Exception ignored) {
        }
        return "";
    }

    private String buildSystemPrompt(User user, AssistantKnowledge knowledge) {
        String faqContext = knowledge.matchedKnowledge().stream().limit(8).collect(Collectors.joining("\n- ", "- ", ""));
        String profileSummary = knowledge.profile() == null ? "없음" : String.format(Locale.ROOT,
                "이름=%s, 역할=%s, 회사=%s, 차량=%s, 결제수단=%s",
                safe(knowledge.profile().getName()),
                user.getRole().name(),
                safe(knowledge.profile().getCompanyName()),
                safe(knowledge.profile().getVehicleType()),
                safe(knowledge.profile().getPaymentMethod())
        );

        return "당신은 물류 플랫폼 WANT의 AI 비서입니다. 답변은 항상 한국어로, 존댓말로, 친절하고 간결하게 작성하세요. "
                + "모르는 내용을 지어내지 말고, 확실한 정보와 현재 시스템 기준으로만 안내하세요. "
                + "경로 안내가 필요하면 화면 이동 순서를 단계별로 알려주세요. "
                + "버튼은 프론트에서 따로 보여주므로 답변 안에는 버튼 문구를 길게 반복하지 않아도 됩니다. "
                + "수수료는 반드시 현재 값인 " + FinanceService.SERVICE_FEE_RATE + "%로 설명하세요.\n\n"
                + "사용자 정보:\n" + profileSummary + "\n\n"
                + "현재 참고 지식:\n" + faqContext + "\n\n"
                + "답변 규칙:\n"
                + "1. 첫 문장은 정중하게 시작하세요.\n"
                + "2. 화면 경로가 있으면 '로그인 후 > ...' 형식으로 써 주세요.\n"
                + "3. 불확실하면 '현재 확인된 기준으로는' 이라고 분명히 말하세요.\n"
                + "4. 너무 길게 늘어놓지 말고, 바로 실행할 수 있게 답하세요.";
    }

    private String buildFallbackAnswer(User user, AssistantKnowledge knowledge) {
        StringBuilder sb = new StringBuilder();
        sb.append("안녕하세요. 문의하신 내용을 바로 확인할 수 있도록 도와드리겠습니다. ");
        if (!knowledge.matchedKnowledge().isEmpty()) {
            sb.append("현재 확인된 기준으로 가장 가까운 안내는 다음과 같습니다. ");
            sb.append(knowledge.matchedKnowledge().stream().limit(2).collect(Collectors.joining(" ")));
        } else {
            sb.append("현재 등록된 FAQ와 운영 정보를 기준으로는 정확히 일치하는 항목을 찾지 못했습니다. ");
            sb.append("질문에 '수수료', '차량 등록', '화물 등록', '결제수단', '알림', '채팅', '배차 보드'처럼 핵심 단어를 조금 더 넣어 주시면 더 정확하게 안내해 드릴 수 있습니다.");
        }
        return sb.toString();
    }

    private List<String> defaultQuickActions(User user) {
        List<String> actions = new ArrayList<>();
        actions.add("수수료 알려줘");
        actions.add("차량등록 어디서 수정해?");
        if (user.getRole() == UserRole.SHIPPER) {
            actions.add("화물 등록은 어떻게 해?");
        } else {
            actions.add("배차 보드는 어디야?");
        }
        actions.add("결제수단 어디서 바꿔?");
        return actions;
    }

    private List<AssistantDtos.NavigationAction> resolveNavigationActions(User user, String question, AssistantKnowledge knowledge, String answer) {
        String source = normalize(question + " " + safe(answer) + " " + String.join(" ", knowledge.matchedKnowledge()));
        Map<String, AssistantDtos.NavigationAction> actions = new LinkedHashMap<>();

        if (containsAny(source, "차량", "회원정보", "프로필", "마이페이지", "차종")) {
            actions.put("user-overview", nav("마이페이지 열기", "user-overview", "회원정보 수정 화면으로 이동합니다."));
        }
        if (containsAny(source, "결제", "수수료", "정산", "영수증", "finance", "payment")) {
            actions.put("user-finance", nav("돈 관리 열기", "user-finance", "정산과 결제 내역을 확인합니다."));
        }
        if (containsAny(source, "화물", "등록", "shipment", "cargo")) {
            actions.put("user-register", nav(user.getRole() == UserRole.SHIPPER ? "화물 등록 열기" : "입찰 가이드 열기", "user-register", "등록 또는 입찰 가이드를 확인합니다."));
        }
        if (containsAny(source, "배차", "보드", "입찰", "offer", "bid", "운송", "status")) {
            actions.put("user-board", nav("배차 보드 열기", "user-board", "배차와 진행 상태를 확인합니다."));
        }
        if (containsAny(source, "즐겨찾기", "bookmark")) {
            actions.put("user-bookmarks", nav("즐겨찾기 열기", "user-bookmarks", "저장한 화물을 확인합니다."));
        }
        if (containsAny(source, "평점", "rating", "후기")) {
            actions.put("user-ratings", nav("평점 관리 열기", "user-ratings", "평점 내역을 확인합니다."));
        }
        if (containsAny(source, "패널티", "penalty")) {
            actions.put("user-penalty", nav("패널티 관리 열기", "user-penalty", "패널티 내역을 확인합니다."));
        }
        if (containsAny(source, "채팅", "메시지", "문의")) {
            actions.put("chat-inbox", nav("채팅 열기", "chat-inbox", "채팅 목록을 엽니다."));
        }
        if (containsAny(source, "알림", "notification")) {
            actions.put("notification-panel", nav("알림 열기", "notification-panel", "최근 알림을 확인합니다."));
        }
        if (containsAny(source, "공지", "faq", "도움말", "자주 묻는 질문")) {
            actions.put("main-notice-faq", nav("공지 / FAQ 보기", "main-notice-faq", "메인 페이지의 공지와 FAQ 영역으로 이동합니다."));
        }
        if (containsAny(source, "화주", "shipper")) {
            actions.put("public-shippers", nav("화주 목록 보기", "public-shippers", "공개 화주 목록으로 이동합니다."));
        }
        if (containsAny(source, "차주", "driver")) {
            actions.put("public-drivers", nav("차주 목록 보기", "public-drivers", "공개 차주 목록으로 이동합니다."));
        }
        if (containsAny(source, "메인", "홈")) {
            actions.put("main-home", nav("메인으로 이동", "main-home", "서비스 메인 화면으로 이동합니다."));
        }

        if (actions.isEmpty()) {
            actions.put(user.getRole() == UserRole.ADMIN ? "admin-assistant" : "user-overview",
                    nav(user.getRole() == UserRole.ADMIN ? "AI 비서 관리 열기" : "마이페이지 열기",
                            user.getRole() == UserRole.ADMIN ? "admin-assistant" : "user-overview",
                            "가장 가까운 관련 화면으로 이동합니다."));
        }

        return actions.values().stream().limit(3).toList();
    }

    private AssistantDtos.NavigationAction nav(String label, String targetKey, String description) {
        return AssistantDtos.NavigationAction.builder()
                .label(label)
                .targetKey(targetKey)
                .description(description)
                .build();
    }

    private boolean isFallbackMode(String mode) {
        String normalizedMode = safe(mode).toUpperCase(Locale.ROOT);
        return normalizedMode.equals("FALLBACK") || normalizedMode.equals("LOCAL_FALLBACK") || normalizedMode.equals("EMERGENCY");
    }

    private boolean hasOpenAiKey() {
        return openAiApiKey != null && !openAiApiKey.isBlank();
    }

    private Set<String> extractMeaningfulTokens(String text) {
        Set<String> tokens = new LinkedHashSet<>();
        String normalized = normalize(text);
        if (normalized.isBlank()) {
            return tokens;
        }
        for (String token : normalized.split("\s+")) {
            String cleaned = token.trim();
            if (cleaned.length() < 2) {
                continue;
            }
            tokens.add(cleaned);
            if (cleaned.contains("이름")) tokens.add("이름");
            if (cleaned.contains("결제")) tokens.add("결제");
            if (cleaned.contains("수수료")) tokens.add("수수료");
            if (cleaned.contains("차량")) tokens.add("차량");
            if (cleaned.contains("화물")) tokens.add("화물");
            if (cleaned.contains("배차")) tokens.add("배차");
            if (cleaned.contains("채팅")) tokens.add("채팅");
            if (cleaned.contains("알림")) tokens.add("알림");
        }
        return tokens;
    }

    private int scoreFaq(Faq faq, String question) {
        int score = 0;
        String hay = normalize(faq.getQuestion() + " " + faq.getAnswer() + " " + faq.getCategory());
        for (String token : tokenize(question)) {
            if (token.length() < 2) continue;
            if (hay.contains(token)) score += 2;
        }
        if (question.contains(normalize(faq.getQuestion()))) {
            score += 5;
        }
        return score;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(normalize(keyword))) return true;
        }
        return false;
    }

    private List<String> tokenize(String text) {
        return List.of(normalize(text).split("\\s+"));
    }

    private String normalize(String text) {
        return safe(text)
                .toLowerCase(Locale.ROOT)
                .replace("?", " ")
                .replace("!", " ")
                .replace(",", " ")
                .replace(".", " ")
                .replace("/", " ")
                .replace(">", " ")
                .replace("-", " ")
                .replace("_", " ")
                .replace(":", " ")
                .replace("(", " ")
                .replace(")", " ")
                .replaceAll("\s+", " ")
                .trim();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private record AssistantKnowledge(
            UserDtos.ProfileResponse profile,
            List<Faq> allFaqs,
            List<Faq> matchedFaqs,
            List<Notice> notices,
            List<AssistantGuideline> guidelines,
            List<AssistantChatLog> reviewedExamples,
            List<String> matchedKnowledge
    ) {}

    private record RuleAnswer(String answer, List<String> quickActions, List<AssistantDtos.NavigationAction> navigationActions) {}
}
