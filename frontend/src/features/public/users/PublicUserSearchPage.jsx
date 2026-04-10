import PublicSectionLoading from "../../../components/common/PublicSectionLoading";
import PublicHeader from "../components/PublicHeader";
import ShipperHeader from "../components/ShipperHeader";
import DriverHeader from "../components/DriverHeader";
import {
  formatRatingSummary,
  resolveMediaUrl,
  roleText,
} from "../../../utils/formatters";

export default function PublicUserSearchPage({ controller, role }) {
  const isDriver = role === "DRIVER";
  const users = controller.publicUsers;
  const keyword = controller.publicUserKeyword;
  const isLoading = controller.publicUserLoading;

  const handleOpenProfile = (user) => {
    controller.openUserProfile(user.id, user);
  };

  const getProfileImage = (user) => {
    const imageUrl = user?.profileImageUrl?.trim();
    return resolveMediaUrl(imageUrl) || "/images/default-profile.png";
  };

  const renderAvatar = (user) => {
    return (
      <img
        src={getProfileImage(user)}
        alt={user.name}
        className="public-directory-card__avatar"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/default-profile.png";
        }}
      />
    );
  };

  return (
    <div className="public-shell landing-shell public-directory-shell">
      {controller.isLoggedIn ? (
        controller.auth.role === "DRIVER" ? (
          <DriverHeader controller={controller} />
        ) : controller.auth.role === "SHIPPER" ? (
          <ShipperHeader controller={controller} />
        ) : controller.auth?.role === "ADMIN" ? (
          <PublicHeader controller={controller} />
        ) : (
          <PublicHeader
            isLoggedIn={controller.isLoggedIn}
            authMode={controller.authMode}
            setAuthMode={controller.setAuthMode}
            setDashboardTab={controller.setDashboardTab}
            logout={controller.logout}
            controller={controller}
          />
        )
      ) : (
        <PublicHeader
          isLoggedIn={controller.isLoggedIn}
          authMode={controller.authMode}
          setAuthMode={controller.setAuthMode}
          setDashboardTab={controller.setDashboardTab}
          logout={controller.logout}
          controller={controller}
        />
      )}

      <section className="landing-info public-directory-hero">
        <div className="landing-info__inner">
          <div className="landing-sectionHead">
            <span>{isDriver ? "DRIVER DIRECTORY" : "SHIPPER DIRECTORY"}</span>
            <h2>
              {isDriver
                ? "가입된 차주를 한 번에 보고 이름으로 바로 찾을 수 있습니다."
                : "가입된 화주를 한 번에 보고 이름으로 바로 찾을 수 있습니다."}
            </h2>
            <p>
              헤더는 그대로 유지하고, 아래 탭에서 화주와 차주를 바로 전환할 수
              있도록 구성했습니다.
            </p>
          </div>

          <div
            className="public-directory-tabs"
            role="tablist"
            aria-label="공개 사용자 역할 전환"
          >
            <button
              className={
                role === "SHIPPER"
                  ? "landing-filterChip active"
                  : "landing-filterChip"
              }
              onClick={() => controller.openPublicUserPage("SHIPPER")}
              role="tab"
              aria-selected={role === "SHIPPER"}
            >
              화주 찾기
            </button>
            <button
              className={
                role === "DRIVER"
                  ? "landing-filterChip active"
                  : "landing-filterChip"
              }
              onClick={() => controller.openPublicUserPage("DRIVER")}
              role="tab"
              aria-selected={role === "DRIVER"}
            >
              차주 찾기
            </button>
          </div>

          <div className="public-directory-search surface">
            <div className="public-directory-search__meta">
              <strong>{roleText(role)} 목록</strong>
              <small>
                {isLoading
                  ? "목록을 갱신하는 중입니다."
                  : `총 ${users.length}명`}
              </small>
            </div>
            <div className="public-directory-search__controls">
              <input
                type="text"
                placeholder={isDriver ? "차주 이름 검색" : "화주 이름 검색"}
                value={keyword}
                onChange={(e) =>
                  controller.setPublicUserKeyword(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    controller.searchPublicUsers(
                      role,
                      controller.publicUserKeyword,
                    );
                }}
              />
              <button
                className="landing-btn landing-btn--primary"
                onClick={() =>
                  controller.searchPublicUsers(
                    role,
                    controller.publicUserKeyword,
                  )
                }
              >
                검색
              </button>
              <button
                className="landing-btn landing-btn--light"
                onClick={() => controller.resetPublicUserSearch(role)}
              >
                전체 보기
              </button>
            </div>
          </div>

          <div
            className={`public-directory-results ${isLoading ? "is-loading" : ""}`}
          >
            {isLoading && (
              <PublicSectionLoading
                text={`${isDriver ? "차주" : "화주"} 데이터를 불러오는 중입니다...`}
              />
            )}

            <div className="public-directory-grid" aria-busy={isLoading}>
              {!isLoading && users.length ? (
                users.map((user) => (
                  <article
                    key={user.id}
                    className="public-directory-card surface"
                  >
                    <div className="public-directory-card__head">
                      <button
                        type="button"
                        className="public-directory-card__profileTrigger"
                        onClick={() => handleOpenProfile(user)}
                      >
                        {renderAvatar(user)}
                        <div className="public-directory-card__profileText">
                          <span>{roleText(user.role)}</span>
                          <h3>{user.name}</h3>
                          <small>프로필 보기</small>
                        </div>
                      </button>
                      <strong>
                        {formatRatingSummary(
                          user.averageRating,
                          user.ratingCount,
                        )}
                      </strong>
                    </div>

                    <div className="public-directory-card__stats">
                      <div>
                        <span>{isDriver ? "차량 정보" : "회사명"}</span>
                        <strong>
                          {isDriver
                            ? user.vehicleType || "-"
                            : user.companyName || "-"}
                        </strong>
                      </div>
                      <div>
                        <span>완료 건수</span>
                        <strong>{user.completedCount || 0}건</strong>
                      </div>
                    </div>

                    <dl className="public-directory-card__info">
                      <div>
                        <dt>연락 이메일</dt>
                        <dd>{user.contactEmail || "-"}</dd>
                      </div>
                      <div>
                        <dt>연락처</dt>
                        <dd>{user.contactPhone || "-"}</dd>
                      </div>
                    </dl>

                    <p>
                      {user.bio ||
                        (isDriver
                          ? "등록된 차주 소개가 없습니다."
                          : "등록된 화주 소개가 없습니다.")}
                    </p>
                  </article>
                ))
              ) : !isLoading ? (
                <div className="public-directory-empty surface">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
