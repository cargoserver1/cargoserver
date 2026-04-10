package com.logistics.app.service;

import com.logistics.app.entity.*;
import com.logistics.app.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final OfferRepository offerRepository;
    private final LocationLogRepository locationLogRepository;
    private final NoticeRepository noticeRepository;
    private final FaqRepository faqRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final CustomerInquiryRepository customerInquiryRepository;
    private final ReportRepository reportRepository;
    private final DisputeRepository disputeRepository;
    private final MoneyTransactionRepository moneyTransactionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ShipmentRepository shipmentRepository,
                           OfferRepository offerRepository,
                           LocationLogRepository locationLogRepository,
                           NoticeRepository noticeRepository,
                           FaqRepository faqRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           CustomerInquiryRepository customerInquiryRepository,
                           ReportRepository reportRepository,
                           DisputeRepository disputeRepository,
                           MoneyTransactionRepository moneyTransactionRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
        this.offerRepository = offerRepository;
        this.locationLogRepository = locationLogRepository;
        this.noticeRepository = noticeRepository;
        this.faqRepository = faqRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.customerInquiryRepository = customerInquiryRepository;
        this.reportRepository = reportRepository;
        this.disputeRepository = disputeRepository;
        this.moneyTransactionRepository = moneyTransactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail("admin@test.com").orElseGet(() -> userRepository.save(User.builder()
                .email("admin@test.com")
                .password(passwordEncoder.encode("1111"))
                .name("운영 관리자")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .phone("02-1234-5678")
                .companyName("hallym-cargo 운영센터")
                .build()));
        if (noticeRepository.count() == 0) {
            noticeRepository.save(Notice.builder().category("플랫폼 공지").title("신규 운영 콘솔 v4가 적용되었습니다.").summary("관리자 회원 관리, 문의 답변, 공지/FAQ 관리, 분쟁 처리 기능이 추가되었습니다.").pinned(true).build());
            noticeRepository.save(Notice.builder().category("운영 안내").title("공개 배차 보드 UI가 재정비되었습니다.").summary("가독성을 높이기 위해 게시판형 테이블과 상태 배지가 개선되었습니다.").pinned(true).build());
            noticeRepository.save(Notice.builder().category("서비스 점검").title("실시간 위치 전파 성능이 개선되었습니다.").summary("WebSocket 갱신 빈도와 관리자 모니터링 구조를 보강했습니다.").pinned(false).build());
        }
        if (faqRepository.count() == 0) {
            faqRepository.save(Faq.builder().category("이용 문의").question("회원가입 없이도 배차 현황을 볼 수 있나요?").answer("네. 공개 배차 보드에서 주요 배차 흐름과 공지를 로그인 없이 확인할 수 있습니다.").sortOrder(1).build());
            faqRepository.save(Faq.builder().category("운송 운영").question("입찰 확정 후 차주는 언제 운반 시작을 누를 수 있나요?").answer("화주가 제안을 확정하면 즉시 운반 시작이 가능하며, 예상 도착 시간이 자동 계산됩니다.").sortOrder(2).build());
            faqRepository.save(Faq.builder().category("관리자 기능").question("운영자가 공지나 FAQ를 바로 수정할 수 있나요?").answer("관리자 계정으로 로그인하면 공지, FAQ, 문의, 회원 상태를 직접 관리할 수 있습니다.").sortOrder(3).build());
        }
        if (shipmentRepository.count() == 0) {
            User shipper = userRepository.findByEmail("shipper@test.com").orElseGet(() -> userRepository.save(User.builder()
                    .email("shipper@test.com")
                    .password(passwordEncoder.encode("1111"))
                    .name("샘플 화주")
                    .role(UserRole.SHIPPER)
                    .status(UserStatus.ACTIVE)
                    .companyName("샘플물류")
                    .phone("010-1234-5678")
                    .build()));
            User driver = userRepository.findByEmail("driver@test.com").orElseGet(() -> userRepository.save(User.builder()
                    .email("driver@test.com")
                    .password(passwordEncoder.encode("1111"))
                    .name("샘플 차주")
                    .role(UserRole.DRIVER)
                    .status(UserStatus.ACTIVE)
                    .vehicleType("1톤 탑차")
                    .phone("010-9876-5432")
                    .build()));

            Shipment bidding = shipmentRepository.save(Shipment.builder()
                    .shipper(shipper)
                    .title("냉장 식자재 오전 배송")
                    .cargoType("냉장 식품")
                    .weightKg(450.0)
                    .description("매장 오픈 전 입고 요청")
                    .originAddress("서울특별시 송파구 문정동")
                    .originLat(37.4849)
                    .originLng(127.1229)
                    .destinationAddress("경기도 성남시 분당구 정자동")
                    .destinationLat(37.3676)
                    .destinationLng(127.1076)
                    .estimatedMinutes(38)
                    .estimatedDistanceKm(18.7)
                    .status(ShipmentStatus.BIDDING)
                    .build());
            statusHistoryRepository.save(StatusHistory.builder().shipment(bidding).fromStatus(ShipmentStatus.REQUESTED).toStatus(ShipmentStatus.BIDDING).actorEmail(shipper.getEmail()).note("샘플 화물 등록").build());
            offerRepository.save(Offer.builder().shipment(bidding).driver(driver).price(72000).message("냉장차량 즉시 배차 가능").build());

            Shipment completed = shipmentRepository.save(Shipment.builder()
                    .shipper(shipper)
                    .assignedDriver(driver)
                    .title("생활용품 야간 납품 완료")
                    .cargoType("생활용품")
                    .weightKg(520.0)
                    .description("완료 정산 샘플 데이터")
                    .originAddress("경기도 하남시 풍산동")
                    .originLat(37.5505)
                    .originLng(127.1888)
                    .destinationAddress("서울특별시 강동구 성내동")
                    .destinationLat(37.5287)
                    .destinationLng(127.1257)
                    .estimatedMinutes(32)
                    .estimatedDistanceKm(14.2)
                    .status(ShipmentStatus.COMPLETED)
                    .startedAt(java.time.LocalDateTime.now().minusHours(4))
                    .estimatedArrivalAt(java.time.LocalDateTime.now().minusHours(3).minusMinutes(25))
                    .completedAt(java.time.LocalDateTime.now().minusHours(3).minusMinutes(20))
                    .build());
            Offer completedOffer = offerRepository.save(Offer.builder().shipment(completed).driver(driver).price(91000).message("야간 배송 완료 가능").status(OfferStatus.ACCEPTED).build());
            completed.setAcceptedOfferId(completedOffer.getId());
            shipmentRepository.save(completed);
            statusHistoryRepository.save(StatusHistory.builder().shipment(completed).fromStatus(ShipmentStatus.BIDDING).toStatus(ShipmentStatus.CONFIRMED).actorEmail(shipper.getEmail()).note("샘플 차주 확정").build());
            statusHistoryRepository.save(StatusHistory.builder().shipment(completed).fromStatus(ShipmentStatus.CONFIRMED).toStatus(ShipmentStatus.IN_TRANSIT).actorEmail(driver.getEmail()).note("운반 시작").build());
            statusHistoryRepository.save(StatusHistory.builder().shipment(completed).fromStatus(ShipmentStatus.IN_TRANSIT).toStatus(ShipmentStatus.COMPLETED).actorEmail(driver.getEmail()).note("운반 완료").build());
            if (moneyTransactionRepository.count() == 0) {
                int fee = (int) Math.floor(completedOffer.getPrice() * 0.03);
                int net = completedOffer.getPrice() - fee;
                moneyTransactionRepository.save(MoneyTransaction.builder().user(shipper).shipment(completed).type(TransactionType.SPEND).grossAmount(completedOffer.getPrice()).feeAmount(0).netAmount(completedOffer.getPrice()).description("배차 완료 결제").build());
                moneyTransactionRepository.save(MoneyTransaction.builder().user(driver).shipment(completed).type(TransactionType.EARN).grossAmount(completedOffer.getPrice()).feeAmount(fee).netAmount(net).description("운행 완료 정산").build());
                moneyTransactionRepository.save(MoneyTransaction.builder().user(admin).shipment(completed).type(TransactionType.FEE).grossAmount(completedOffer.getPrice()).feeAmount(fee).netAmount(fee).description("플랫폼 수수료 수익").build());
            }

            Shipment transit = shipmentRepository.save(Shipment.builder()
                    .shipper(shipper)
                    .assignedDriver(driver)
                    .title("전자부품 정시 납품")
                    .cargoType("전자부품")
                    .weightKg(280.0)
                    .description("파손 주의, 하역장 사전 연락 필요")
                    .originAddress("인천광역시 연수구 송도동")
                    .originLat(37.3826)
                    .originLng(126.6563)
                    .destinationAddress("서울특별시 금천구 가산동")
                    .destinationLat(37.4811)
                    .destinationLng(126.8828)
                    .estimatedMinutes(64)
                    .estimatedDistanceKm(33.8)
                    .status(ShipmentStatus.IN_TRANSIT)
                    .startedAt(java.time.LocalDateTime.now().minusMinutes(20))
                    .estimatedArrivalAt(java.time.LocalDateTime.now().plusMinutes(44))
                    .build());
            Offer transitOffer = offerRepository.save(Offer.builder().shipment(transit).driver(driver).price(88000).message("즉시 픽업 가능합니다").status(OfferStatus.ACCEPTED).build());
            transit.setAcceptedOfferId(transitOffer.getId());
            shipmentRepository.save(transit);
            statusHistoryRepository.save(StatusHistory.builder().shipment(transit).fromStatus(ShipmentStatus.BIDDING).toStatus(ShipmentStatus.CONFIRMED).actorEmail(shipper.getEmail()).note("샘플 차주 확정").build());
            statusHistoryRepository.save(StatusHistory.builder().shipment(transit).fromStatus(ShipmentStatus.CONFIRMED).toStatus(ShipmentStatus.IN_TRANSIT).actorEmail(driver.getEmail()).note("운반 시작").build());
            locationLogRepository.save(LocationLog.builder().shipment(transit).driver(driver).latitude(37.4442).longitude(126.8787).roughLocation("안양 인근 이동중").remainingMinutes(27).build());

            if (customerInquiryRepository.count() == 0) {
                customerInquiryRepository.save(CustomerInquiry.builder().companyName("가람유통").contactName("김도형").email("ops@garam.co.kr").phone("010-5555-1111").inquiryType("도입 문의").message("화주/차주/관리자 분리 권한 구조와 운송 상태 모니터링 기능 도입을 검토하고 있습니다.").status("RECEIVED").build());
                customerInquiryRepository.save(CustomerInquiry.builder().companyName("진성물류").contactName("박주임").email("hello@jinsung.co.kr").phone("010-5555-2222").inquiryType("기술 협의").message("기존 ERP와 연동 가능한 REST API 범위를 확인하고 싶습니다.").status("ANSWERED").build());
            }
            if (reportRepository.count() == 0) {
                reportRepository.save(Report.builder().reporter(shipper).targetUser(driver).shipment(transit).reason("위치 갱신 지연").description("운반 중 위치 업데이트가 예상보다 늦어 고객 문의가 발생했습니다.").status("OPEN").build());
            }
            if (disputeRepository.count() == 0) {
                disputeRepository.save(Dispute.builder().shipment(transit).shipper(shipper).driver(driver).reason("하차 지연").detail("도착 이후 하차 시간이 예상보다 길어져 정산 전 확인이 필요합니다.").status("OPEN").build());
            }
        }
    }
}
