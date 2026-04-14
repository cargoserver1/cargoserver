import { useEffect, useMemo, useState } from "react";
import PublicSectionLoading from "../../../components/common/PublicSectionLoading";
import PublicHeader from "../components/PublicHeader";
import ShipperHeader from "../components/ShipperHeader";
import DriverHeader from "../components/DriverHeader";
import { resolveMediaUrl } from "../../../utils/formatters";

const FAVORITE_STORAGE_KEY = "public-user-favorites";

function readFavoriteMap() {
  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function writeFavoriteMap(nextValue) {
  try {
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(nextValue));
  } catch (error) {
    console.error(error);
  }
}

function getFavoriteKey(user, role, authUserId) {
  return `${authUserId || "guest"}:${role}:${user.id}`;
}

function BookmarkIcon({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="public-directory-card__bookmarkIcon"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4.75C6 3.78 6.78 3 7.75 3h8.5C17.22 3 18 3.78 18 4.75V21l-6-3.6L6 21V4.75z" />
    </svg>
  );
}

export default function PublicUserSearchPage({ controller, role }) {
  const isDriver = role === "DRIVER";
  const users = controller.publicUsers;
  const keyword = controller.publicUserKeyword;
  const isLoading = controller.publicUserLoading;
  const authUserId = controller.auth?.id || localStorage.getItem("userId") || "guest";
  const [favoriteMap, setFavoriteMap] = useState(() => readFavoriteMap());

  useEffect(() => {
    setFavoriteMap(readFavoriteMap());
  }, [role, authUserId]);

  const handleOpenProfile = (user) => {
    controller.openUserProfile(user.id, user);
  };

  const getProfileImage = (user) => {
    const imageUrl = user?.profileImageUrl?.trim();
    return resolveMediaUrl(imageUrl) || "/images/default-profile.png";
  };

  const isFavoriteUser = (user) => {
    return !!favoriteMap[getFavoriteKey(user, role, authUserId)];
  };

  const sortedUsers = useMemo(() => {
    const favoriteUsers = [];
    const normalUsers = [];

    users.forEach((user) => {
      if (isFavoriteUser(user)) {
        favoriteUsers.push(user);
      } else {
        normalUsers.push(user);
      }
    });

    return [...favoriteUsers, ...normalUsers];
  }, [users, favoriteMap, role, authUserId]);

  const toggleFavoriteUser = (user) => {
    const storageKey = getFavoriteKey(user, role, authUserId);

    setFavoriteMap((prev) => {
      const next = { ...prev };

      if (next[storageKey]) {
        delete next[storageKey];
      } else {
        next[storageKey] = {
          id: user.id,
          role,
          name: user.name,
          savedAt: Date.now(),
        };
      }

      writeFavoriteMap(next);
      return next;
    });
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

  const getSubtitle = (user) => {
    if (user.role === "DRIVER") {
      return `차주 / ${user.vehicleType?.trim() || "등록된 차종 없음"}`;
    }
    return `화주 / ${user.companyName?.trim() || "회사 이름 없음"}`;
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
              <strong>{isDriver ? "차주 목록" : "화주 목록"}</strong>
              <small>
                {isLoading ? "목록을 갱신하는 중입니다." : `총 ${users.length}명`}
              </small>
            </div>

            <div className="public-directory-search__controls">
              <input
                type="text"
                placeholder={isDriver ? "차주 이름 검색" : "화주 이름 검색"}
                value={keyword}
                onChange={(e) => controller.setPublicUserKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    controller.searchPublicUsers(role, controller.publicUserKeyword);
                  }
                }}
              />
              <button
                className="landing-btn landing-btn--primary"
                onClick={() =>
                  controller.searchPublicUsers(role, controller.publicUserKeyword)
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

          <div className={`public-directory-results ${isLoading ? "is-loading" : ""}`}>
            {isLoading && (
              <PublicSectionLoading
                text={`${isDriver ? "차주" : "화주"} 데이터를 불러오는 중입니다...`}
              />
            )}

            <div className="public-directory-grid" aria-busy={isLoading}>
              {!isLoading && sortedUsers.length ? (
                sortedUsers.map((user) => {
                  const isFavorite = isFavoriteUser(user);

                  return (
                    <article
                      key={user.id}
                      className={`public-directory-card surface ${isFavorite ? "is-favorite" : ""}`}
                    >
                      <div className="public-directory-card__topRow">
                        <button
                          type="button"
                          className="public-directory-card__profileTrigger"
                          onClick={() => handleOpenProfile(user)}
                        >
                          {renderAvatar(user)}
                          <div className="public-directory-card__profileText">
                            <h3>{user.name}</h3>
                            <span>{getSubtitle(user)}</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={
                            isFavorite
                              ? "public-directory-card__favoriteBtn is-active"
                              : "public-directory-card__favoriteBtn"
                          }
                          onClick={() => toggleFavoriteUser(user)}
                          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                          <BookmarkIcon active={isFavorite} />
                        </button>
                      </div>

                      <p className="public-directory-card__bio">
                        {user.bio ||
                          (isDriver
                            ? "등록된 차주 소개가 없습니다."
                            : "등록된 화주 소개가 없습니다.")}
                      </p>

                      <div className="public-directory-card__summaryStats">
                        <div>
                          <span>거래 횟수</span>
                          <strong>{user.completedCount || 0}건</strong>
                        </div>
                        <div>
                          <span>평점</span>
                          <strong>
                            {user.averageRating && Number(user.averageRating) > 0
                              ? `${Number(user.averageRating).toFixed(1)}점`
                              : "0점"}
                          </strong>
                        </div>
                        <div>
                          <span>패널티 점수</span>
                          <strong>{user.penaltyScore || 0}점</strong>
                        </div>
                      </div>
                    </article>
                  );
                })
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