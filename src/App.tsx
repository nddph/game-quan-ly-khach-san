import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  GuestAvatar,
  HotelMark,
  HotelScene,
  RoomArt,
} from "./components/CozyAssets";
import {
  acceptCounterOffer,
  checkoutGuest,
  createNewGame,
  declineGuest,
  evaluatePrice,
  formatGameTime,
  formatVnd,
  getActiveGuests,
  getAvailableRooms,
  getFeatureLabel,
  getGuestTypeLabel,
  getRepairCost,
  getRoomTypeLabel,
  getStayServiceCharge,
  getTakeHomeVND,
  getUnsettledRevenueVND,
  getViewLabel,
  getWaivedTotalVND,
  processArrivals,
  proposeOffer,
  repairRoom,
  replyToReview,
  resolveCompensation,
  settleDay,
  type GameState,
  type Guest,
  type Room,
  type RoomFeature,
  type RoomState,
  type RoomType,
  type ServiceChargeDecision,
  type ViewType,
} from "./domain/game";
import { useGameClock } from "./hooks/useGameClock";
import {
  clearSnapshot,
  initializePersistence,
  loadSnapshot,
  saveSnapshot,
} from "./infra/sqliteClient";

type Screen = "today" | "guests" | "stays" | "rooms" | "finance";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type Notice = {
  title: string;
  body: string;
  tone: "success" | "warning" | "info";
};

function App() {
  const initialState = useMemo(() => createNewGame("Khách sạn"), []);
  const transformClock = useCallback(
    (current: GameState, advanced: GameState) => {
      const next =
        advanced.day > current.day
          ? settleDay(advanced, current.day)
          : advanced;
      return processArrivals(next);
    },
    [],
  );
  const clock = useGameClock(initialState, transformClock);
  const [screen, setScreen] = useState<Screen>("today");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [extraBed, setExtraBed] = useState(false);
  const [checkoutStayId, setCheckoutStayId] = useState<string | null>(null);
  const [chargeDecision, setChargeDecision] =
    useState<ServiceChargeDecision>("collect");
  const [hotelNameDraft, setHotelNameDraft] = useState("");
  const [setupOpen, setSetupOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [showShiftConfirm, setShowShiftConfirm] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<{
    roomId?: string;
    guestId?: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const stateRef = useRef(clock.state);

  const persist = useCallback(async (state: GameState) => {
    setSaveStatus("saving");
    try {
      const snapshot = await saveSnapshot(state);
      setLastSavedAt(snapshot.savedAt);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const initialize = async () => {
      try {
        await initializePersistence();
        const snapshot = await loadSnapshot();
        if (snapshot) {
          clock.setState(snapshot.state);
          setLastSavedAt(snapshot.savedAt);
          setSetupOpen(false);
          setNotice({
            title: "Đã mở lại khách sạn",
            body: "Khách sạn của bạn đã được khôi phục.",
            tone: "info",
          });
        } else {
          setSetupOpen(true);
          setNotice({
            title: "Chào mừng bạn",
            body: "Đặt tên khách sạn để bắt đầu hành trình khởi nghiệp của mình.",
            tone: "info",
          });
        }
        setReady(true);
      } catch (error) {
        setNotice({
          title: "Không thể mở sổ lưu trú",
          body: error instanceof Error ? error.message : "Vui lòng thử lại.",
          tone: "warning",
        });
        setReady(true);
      }
    };

    void initialize();
  }, [clock]);

  useEffect(() => {
    stateRef.current = clock.state;
  }, [clock.state]);

  useEffect(() => {
    if (!ready || setupOpen) {
      return;
    }
    const saveOnHide = () => {
      if (document.visibilityState === "hidden") {
        void persist(stateRef.current);
      }
    };
    document.addEventListener("visibilitychange", saveOnHide);
    return () => document.removeEventListener("visibilitychange", saveOnHide);
  }, [persist, ready, setupOpen]);

  useEffect(() => {
    if (!ready || setupOpen) {
      return;
    }
    const timer = window.setInterval(() => {
      void persist(stateRef.current);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [persist, ready, setupOpen]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeGuests = useMemo(
    () => getActiveGuests(clock.state),
    [clock.state],
  );
  const pendingGuests = useMemo(
    () => activeGuests.filter((guest) => guest.state === "ConsideringOffer"),
    [activeGuests],
  );
  const inHouseGuests = useMemo(
    () =>
      activeGuests.filter(
        (guest) => guest.state === "CheckedIn" || guest.state === "Staying",
      ),
    [activeGuests],
  );
  const waitingCheckoutGuests = useMemo(
    () => activeGuests.filter((guest) => guest.state === "WaitingCheckout"),
    [activeGuests],
  );
  const availableRooms = useMemo(
    () => getAvailableRooms(clock.state),
    [clock.state],
  );
  const selectedGuest = useMemo(
    () =>
      pendingGuests.find((guest) => guest.id === selectedGuestId) ??
      pendingGuests[0],
    [pendingGuests, selectedGuestId],
  );
  const selectedRoom = useMemo(
    () => clock.state.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [clock.state.rooms, selectedRoomId],
  );
  const selectedOffer = useMemo(
    () =>
      clock.state.offers.find((offer) => offer.guestId === selectedGuest?.id),
    [clock.state.offers, selectedGuest],
  );
  const pendingCompensation = useMemo(
    () =>
      clock.state.compensationRequests.find(
        (request) => request.status === "Pending",
      ),
    [clock.state.compensationRequests],
  );
  const compensationGuest = useMemo(
    () =>
      pendingCompensation
        ? clock.state.guests.find(
            (guest) => guest.id === pendingCompensation.guestId,
          )
        : undefined,
    [clock.state.guests, pendingCompensation],
  );
  const compensationRoom = useMemo(
    () =>
      pendingCompensation
        ? clock.state.rooms.find(
            (room) => room.id === pendingCompensation.roomId,
          )
        : undefined,
    [clock.state.rooms, pendingCompensation],
  );
  const detailRoom = useMemo(
    () =>
      detailTarget?.roomId
        ? clock.state.rooms.find((room) => room.id === detailTarget.roomId)
        : undefined,
    [clock.state.rooms, detailTarget],
  );
  const detailGuest = useMemo(() => {
    if (detailTarget?.guestId) {
      return clock.state.guests.find(
        (guest) => guest.id === detailTarget.guestId,
      );
    }
    if (detailTarget?.roomId) {
      return clock.state.guests.find(
        (guest) =>
          guest.roomId === detailTarget.roomId &&
          (guest.state === "CheckedIn" || guest.state === "Staying"),
      );
    }
    return undefined;
  }, [clock.state.guests, detailTarget]);
  const detailAssignedRoom = useMemo(
    () =>
      detailRoom ??
      (detailGuest?.roomId
        ? clock.state.rooms.find((room) => room.id === detailGuest.roomId)
        : undefined),
    [detailRoom, detailGuest, clock.state.rooms],
  );
  const checkoutStay = useMemo(
    () =>
      checkoutStayId
        ? clock.state.stays.find((stay) => stay.id === checkoutStayId)
        : undefined,
    [checkoutStayId, clock.state.stays],
  );
  const checkoutStayGuest = useMemo(
    () =>
      checkoutStay
        ? clock.state.guests.find((guest) => guest.id === checkoutStay.guestId)
        : undefined,
    [checkoutStay, clock.state.guests],
  );
  const checkoutStayRoom = useMemo(
    () =>
      checkoutStay
        ? clock.state.rooms.find((room) => room.id === checkoutStay.roomId)
        : undefined,
    [checkoutStay, clock.state.rooms],
  );
  const checkoutReservation = useMemo(
    () =>
      checkoutStay
        ? clock.state.reservations.find(
            (item) => item.id === checkoutStay.reservationId,
          )
        : undefined,
    [checkoutStay, clock.state.reservations],
  );
  const checkoutCharge = useMemo(
    () => (checkoutStay ? getStayServiceCharge(clock.state, checkoutStay.id) : undefined),
    [checkoutStay, clock.state],
  );
  const checkoutRoomChargeVND =
    checkoutReservation && checkoutStayGuest
      ? checkoutReservation.nightlyRateVND * checkoutStayGuest.nights
      : 0;
  const checkoutExtraVND =
    chargeDecision === "collect" && checkoutCharge?.guestWillingToPay
      ? checkoutCharge.amountVND
      : chargeDecision === "force" && checkoutCharge
        ? checkoutCharge.amountVND
        : 0;
  const shiftPreview = useMemo(() => {
    let waitingCount = 0;
    clock.state.stays.forEach((stay) => {
      if (stay.status !== "Active") {
        return;
      }
      const guest = clock.state.guests.find((item) => item.id === stay.guestId);
      if (guest && stay.nightsCompleted + 1 >= guest.nights) {
        waitingCount += 1;
      }
    });
    const revenueVND = getUnsettledRevenueVND(clock.state);
    const operatingCostVND = 800_000;
    const profitBeforeTaxVND = revenueVND - operatingCostVND;
    const taxVND =
      profitBeforeTaxVND > 0 ? Math.round(profitBeforeTaxVND * 0.2) : 0;
    return {
      waitingCount,
      revenueVND,
      operatingCostVND,
      taxVND,
      netCashChangeVND: profitBeforeTaxVND - taxVND,
    };
  }, [clock.state]);

  const handleStart = () => {
    const next = createNewGame(hotelNameDraft);
    clock.setState(next);
    setSetupOpen(false);
    setScreen("today");
    void persist(next);
  };

  const handleReset = async () => {
    await clearSnapshot();
    clock.setState(createNewGame("Khách sạn"));
    setSetupOpen(true);
    setShowResetConfirm(false);
    setShowOfferModal(false);
    setSelectedGuestId(null);
    setSelectedRoomId(null);
    setLastSavedAt(null);
    setNotice({
      title: "Đã tạo sổ lưu trú mới",
      body: "Khách sạn đã trở về ngày đầu tiên.",
      tone: "info",
    });
  };

  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuestId(guest.id);
    setSelectedRoomId(null);
    setPriceDraft("");
    setExtraBed(false);
    setShowOfferModal(false);
  };

  const inspectGuest = (guest: Guest) => {
    setDetailTarget({ guestId: guest.id });
  };

  const inspectRoom = (roomId: string) => {
    setDetailTarget({ roomId });
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    setExtraBed(false);
    setShowOfferModal(true);
    if (selectedGuest) {
      setPriceDraft(
        String(
          evaluatePrice(selectedGuest, room, room.basePriceVND, false)
            .fairPriceVND,
        ),
      );
    }
  };

  const handleExtraBedChange = (checked: boolean) => {
    setExtraBed(checked);
    if (selectedGuest && selectedRoom) {
      setPriceDraft(
        String(
          evaluatePrice(
            selectedGuest,
            selectedRoom,
            selectedRoom.basePriceVND,
            checked,
          ).fairPriceVND,
        ),
      );
    }
  };

  const handlePropose = () => {
    if (!selectedGuest || !selectedRoom) {
      return;
    }
    const rate = Number(priceDraft);
    if (!Number.isFinite(rate) || rate <= 0) {
      setNotice({
        title: "Chưa thể gửi deal",
        body: "Bạn cần nhập một mức giá hợp lệ trước khi gửi cho khách.",
        tone: "warning",
      });
      return;
    }
    const next = proposeOffer(
      clock.state,
      selectedGuest.id,
      selectedRoom.id,
      Math.round(rate),
      extraBed,
    );
    if (next === clock.state) {
      setNotice({
        title: "Phòng không còn trống",
        body: "Vui lòng chọn phòng khác để gửi deal.",
        tone: "warning",
      });
      return;
    }
    clock.setState(next);
    void persist(next);
    const offer = next.offers.find((item) => item.guestId === selectedGuest.id);
    if (offer?.status === "Negotiating") {
      setNotice({
        title: "Khách muốn thương lượng",
        body: "Bạn có thể sửa giá và gửi lại deal cho đến khi khách đồng ý.",
        tone: "info",
      });
      setShowOfferModal(true);
    } else if (offer?.status === "Accepted") {
      setNotice({
        title: "Khách đã nhận phòng",
        body: `${selectedGuest.dialogue} Phòng ${selectedRoom.number} đã sẵn sàng cho khách.`,
        tone: "success",
      });
      setShowOfferModal(false);
    } else {
      const nextGuest = next.guests.find(
        (guest) => guest.id === selectedGuest.id,
      );
      if (nextGuest?.state === "ConsideringOffer") {
        setNotice({
          title: "Khách chưa đồng ý",
          body: "Bạn có thể sửa giá hoặc chọn phòng khác rồi gửi lại deal.",
          tone: "warning",
        });
        setShowOfferModal(true);
      } else {
        setNotice({
          title: "Khách đã rời đi",
          body: "Khách đã từ chối quá nhiều deal và không còn ở sảnh.",
          tone: "warning",
        });
        setShowOfferModal(false);
      }
    }
  };

  const handleAcceptCounter = () => {
    if (!selectedOffer) {
      return;
    }
    const next = acceptCounterOffer(clock.state, selectedOffer.id);
    clock.setState(next);
    void persist(next);
    setNotice({
      title: "Đã chốt được giá",
      body: "Khách đồng ý với mức giá mới và chuẩn bị nhận phòng.",
      tone: "success",
    });
    setShowOfferModal(false);
  };

  const handleDecline = () => {
    if (!selectedGuest) {
      return;
    }
    const next = declineGuest(clock.state, selectedGuest.id);
    clock.setState(next);
    void persist(next);
    setShowOfferModal(false);
    setNotice({
      title: "Khách đã rời đi",
      body: "Bạn đã từ chối khách đang chờ.",
      tone: "warning",
    });
  };

  const handleSettle = () => {
    setShowShiftConfirm(true);
  };

  const confirmSettle = () => {
    const settled = settleDay(clock.state, clock.state.day);
    clock.setState(settled);
    setShowShiftConfirm(false);
    void persist(settled);
    setNotice({
      title: "Đã kết thúc ca",
      body: settled.lastEvent,
      tone: "info",
    });
  };

  const openCheckout = (stayId: string) => {
    setCheckoutStayId(stayId);
    setChargeDecision("collect");
  };

  const confirmCheckout = () => {
    if (!checkoutStayId) {
      return;
    }
    const next = checkoutGuest(clock.state, checkoutStayId, chargeDecision);
    if (next === clock.state) {
      setNotice({
        title: "Chưa thể checkout",
        body: "Lưu trú này chưa đủ đêm hoặc đã được checkout.",
        tone: "warning",
      });
      setCheckoutStayId(null);
      return;
    }
    clock.setState(next);
    setCheckoutStayId(null);
    void persist(next);
    setNotice({ title: "Đã checkout", body: next.lastEvent, tone: "success" });
  };

  const handleCompensation = (accept: boolean) => {
    if (!pendingCompensation) {
      return;
    }
    const next = resolveCompensation(
      clock.state,
      pendingCompensation.id,
      accept,
    );
    clock.setState(next);
    void persist(next);
    setNotice({
      title: accept ? "Đã bồi thường khách" : "Đã từ chối bồi thường",
      body: next.lastEvent,
      tone: accept ? "info" : "warning",
    });
  };

  const handleRepair = (roomId: string) => {
    const next = repairRoom(clock.state, roomId);
    if (next === clock.state) {
      setNotice({
        title: "Chưa thể sửa phòng",
        body: "Phòng đang có khách hoặc không cần sửa.",
        tone: "warning",
      });
      return;
    }
    clock.setState(next);
    void persist(next);
    setNotice({
      title: "Đã cập nhật phòng",
      body: next.lastEvent,
      tone: "success",
    });
  };

  const handleReply = (reviewId: string, reply: string) => {
    const next = replyToReview(clock.state, reviewId, reply);
    if (next === clock.state) {
      return;
    }
    clock.setState(next);
    void persist(next);
    setNotice({
      title: "Đã gửi phản hồi",
      body: "Khách sạn đã trả lời đánh giá của khách.",
      tone: "success",
    });
  };

  const handleFastForward = () => {
    clock.fastForward(60);
    setNotice({
      title: "Đã tua nhanh",
      body: "Thêm 1 giờ đã trôi qua trong game.",
      tone: "info",
    });
  };

  const saveLabel =
    saveStatus === "saving"
      ? "Đang lưu"
      : saveStatus === "saved"
        ? "Đã lưu"
        : saveStatus === "error"
          ? "Lỗi lưu"
          : "Chưa lưu";
  const occupancy =
    clock.state.rooms.length === 0
      ? 0
      : Math.round((inHouseGuests.length / clock.state.rooms.length) * 100);

  return (
    <main className="cozy-shell">
      <header className="cozy-header">
        <div className="brand-lockup">
          <HotelMark className="brand-mark" />
          <div>
            <p className="brand-kicker">KHÁCH SẠN CỦA BẠN</p>
            <h1>{clock.state.hotelName}</h1>
            <p className="brand-subtitle">
              {clock.state.locationName} · 3 sao
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="reset-button"
            onClick={() => setShowResetConfirm(true)}
          >
            Chơi lại
          </button>
          <div className="save-chip">
            <span className={`save-dot ${saveStatus}`} />
            {saveLabel}
          </div>
        </div>
      </header>

      <nav className="main-nav" aria-label="Điều hướng chính">
        {(
          [
            ["today", "Tổng quan"],
            ["guests", "Khách"],
            ["stays", "Lưu trú"],
            ["rooms", "Phòng"],
            ["finance", "Tài chính"],
          ] as [Screen, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={screen === value ? "active" : ""}
            onClick={() => setScreen(value)}
          >
            {label}
            {value === "guests" && pendingGuests.length > 0 && (
              <span className="nav-count">{pendingGuests.length}</span>
            )}
          </button>
        ))}
      </nav>

      {setupOpen ? (
        <section className="setup-card">
          <HotelScene className="setup-scene" />
          <div className="setup-copy">
            <span className="soft-label">CHÀO MỪNG BẠN</span>
            <h2>Đặt tên cho khách sạn</h2>
            <p>Một nơi nhỏ để bắt đầu hành trình làm chủ.</p>
            <input
              value={hotelNameDraft}
              onChange={(event) => setHotelNameDraft(event.target.value)}
              placeholder="Ví dụ: Khách sạn Bình Minh"
              aria-label="Tên khách sạn"
            />
            <button
              type="button"
              className="primary-button"
              onClick={handleStart}
            >
              Mở khách sạn
            </button>
          </div>
        </section>
      ) : (
        <>
          {screen === "today" && (
            <TodayScreen
              state={clock.state}
              pendingGuests={pendingGuests}
              inHouseGuests={inHouseGuests}
              waitingCheckoutGuests={waitingCheckoutGuests}
              occupancy={occupancy}
              onOpenGuests={() => setScreen("guests")}
              onInspectGuest={inspectGuest}
              onCheckout={openCheckout}
              onSettle={handleSettle}
              onFastForward={handleFastForward}
            />
          )}
          {screen === "guests" && (
            <GuestsScreen
              pendingGuests={pendingGuests}
              selectedGuest={selectedGuest}
              selectedRoom={selectedRoom}
              availableRooms={availableRooms}
              onSelectGuest={handleSelectGuest}
              onSelectRoom={handleSelectRoom}
            />
          )}
          {screen === "stays" && (
            <StaysScreen
              state={clock.state}
              inHouseGuests={inHouseGuests}
              waitingCheckoutGuests={waitingCheckoutGuests}
              onSettle={handleSettle}
              onInspectGuest={inspectGuest}
              onCheckout={openCheckout}
            />
          )}
          {screen === "rooms" && (
            <RoomsScreen
              state={clock.state}
              onRepair={handleRepair}
              onInspectRoom={inspectRoom}
            />
          )}
          {screen === "finance" && (
            <FinanceScreen
              state={clock.state}
              lastSavedAt={lastSavedAt}
              onReply={handleReply}
            />
          )}
        </>
      )}

      {showShiftConfirm && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shift-confirm-title"
          >
            <span className="soft-label">KẾT THÚC CA</span>
            <h2 id="shift-confirm-title">Kết thúc ngày {clock.state.day}?</h2>
            <p>
              Khách đủ đêm sẽ chuyển sang danh sách chờ checkout. Bạn cần thu
              tiền ở tab Lưu trú trước khi kết ca.
            </p>
            <div className="confirm-summary">
              <div>
                <span>Khách chờ checkout</span>
                <strong>{shiftPreview.waitingCount}</strong>
              </div>
              <div>
                <span>Doanh thu chưa chốt</span>
                <strong>{formatVnd(shiftPreview.revenueVND)}</strong>
              </div>
              <div>
                <span>Chi phí vận hành</span>
                <strong>− {formatVnd(shiftPreview.operatingCostVND)}</strong>
              </div>
              <div>
                <span>Thuế dự kiến</span>
                <strong>− {formatVnd(shiftPreview.taxVND)}</strong>
              </div>
              <div>
                <span>Thay đổi tiền mặt</span>
                <strong>{formatVnd(shiftPreview.netCashChangeVND)}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setShowShiftConfirm(false)}
              >
                Tự xem lại
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={confirmSettle}
              >
                Xác nhận kết ca
              </button>
            </div>
          </div>
        </div>
      )}

      {showOfferModal && selectedGuest && selectedRoom && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal offer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
          >
            <span className="soft-label">GỬI DEAL CHO KHÁCH</span>
            <h2 id="offer-title">
              Phòng {selectedRoom.number} ·{" "}
              {getRoomTypeLabel(selectedRoom.type)}
            </h2>
            <p>
              {getViewLabel(selectedRoom.view)} · {selectedRoom.size}m² ·{" "}
              {selectedRoom.features
                .map(getFeatureLabel)
                .slice(0, 3)
                .join(" · ")}
            </p>
            <div className="confirm-summary">
              <div>
                <span>Giá niêm yết</span>
                <strong>{formatVnd(selectedRoom.basePriceVND)} / đêm</strong>
              </div>
              <div>
                <span>Sức chứa</span>
                <strong>
                  {selectedRoom.capacity} người
                  {selectedRoom.extraBedAvailable
                    ? " · có thể thêm giường"
                    : ""}
                </strong>
              </div>
              <div>
                <span>Khách nói</span>
                <strong>“{selectedGuest.dialogue}”</strong>
              </div>
            </div>
            {selectedRoom.extraBedAvailable &&
              selectedGuest.partyAdults + selectedGuest.partyChildren >
                selectedRoom.capacity && (
                <label className="extra-bed-toggle">
                  <input
                    type="checkbox"
                    checked={extraBed}
                    onChange={(event) =>
                      handleExtraBedChange(event.target.checked)
                    }
                  />{" "}
                  Thêm giường phụ (+{formatVnd(selectedRoom.extraBedFeeVND)} /
                  đêm)
                </label>
              )}
            <label className="modal-price-label">
              Giá đề xuất (bạn có thể sửa)
              <input
                type="number"
                min="100000"
                step="10000"
                value={priceDraft}
                onChange={(event) => setPriceDraft(event.target.value)}
              />
            </label>
            {selectedOffer?.status === "Negotiating" && (
              <div className="negotiation-note">
                <span>Khách đề nghị mức giá khác.</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={handleAcceptCounter}
                >
                  Nhận{" "}
                  {selectedOffer.counterRateVND
                    ? formatVnd(selectedOffer.counterRateVND)
                    : "giá đề nghị"}
                </button>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setShowOfferModal(false)}
              >
                Để sau
              </button>
              <button
                type="button"
                className="soft-button"
                onClick={handleDecline}
              >
                Từ chối
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handlePropose}
              >
                {selectedOffer?.status === "Negotiating" ||
                selectedOffer?.status === "Rejected"
                  ? "Gửi lại giá"
                  : "Gửi deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <span className="soft-label">BẮT ĐẦU LẠI</span>
            <h2 id="reset-title">Xóa tiến trình hiện tại?</h2>
            <p>
              Khách sạn, khách lưu trú, review và tiền mặt sẽ trở về ngày đầu
              tiên.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setShowResetConfirm(false)}
              >
                Giữ tiến trình
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleReset()}
              >
                Chơi lại từ đầu
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingCompensation && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compensation-title"
          >
            <span className="soft-label">YÊU CẦU TỪ KHÁCH</span>
            <h2 id="compensation-title">Khách muốn được bồi thường</h2>
            <p>
              {compensationGuest
                ? getGuestTypeLabel(compensationGuest.type)
                : "Khách"}{" "}
              đang yêu cầu bồi thường vì{" "}
              {pendingCompensation.reason.toLowerCase()}.
            </p>
            <div className="confirm-summary">
              <div>
                <span>Phòng</span>
                <strong>
                  {compensationRoom ? `Phòng ${compensationRoom.number}` : "—"}
                </strong>
              </div>
              <div>
                <span>Số tiền đề nghị</span>
                <strong>{formatVnd(pendingCompensation.amountVND)}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => handleCompensation(false)}
              >
                Từ chối
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleCompensation(true)}
              >
                Đền khách
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutStay && checkoutStayGuest && checkoutStayRoom && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <span className="soft-label">QUẦY LỄ TÂN</span>
            <h2 id="checkout-title">
              Checkout {getGuestTypeLabel(checkoutStayGuest.type)}
            </h2>
            <div className="detail-guest">
              <GuestAvatar
                type={checkoutStayGuest.type}
                className="guest-avatar hero-avatar"
              />
              <div>
                <strong>
                  Phòng {checkoutStayRoom.number} ·{" "}
                  {getRoomTypeLabel(checkoutStayRoom.type)}
                </strong>
                <p>“{checkoutStayGuest.lastEvent}”</p>
                <small>
                  {checkoutStayGuest.nights} đêm ·{" "}
                  {getViewLabel(checkoutStayRoom.view)}
                </small>
              </div>
            </div>
            <div className="confirm-summary">
              <div>
                <span>Tiền phòng</span>
                <strong>{formatVnd(checkoutRoomChargeVND)}</strong>
              </div>
              <div>
                <span>Dịch vụ thêm</span>
                <strong>{formatVnd(checkoutExtraVND)}</strong>
              </div>
              <div>
                <span>Khách phải trả</span>
                <strong>
                  {formatVnd(checkoutRoomChargeVND + checkoutExtraVND)}
                </strong>
              </div>
            </div>
            <label className="field-label">Dịch vụ thêm ghi nhận</label>
            {checkoutCharge ? (
              <div className="charge-card">
                <div className="charge-head">
                  <strong>{formatVnd(checkoutCharge.amountVND)}</strong>
                  <span className={checkoutCharge.guestWillingToPay ? "chip-ok" : "chip-warn"}>
                    {checkoutCharge.guestWillingToPay
                      ? "Khách chịu trả"
                      : "Khách từ chối trả"}
                  </span>
                </div>
                <p>{checkoutCharge.note}</p>
                <div className="room-filter-chips">
                  {checkoutCharge.guestWillingToPay ? (
                    <button
                      type="button"
                      className={chargeDecision === "collect" ? "active" : ""}
                      onClick={() => setChargeDecision("collect")}
                    >
                      Thu {formatVnd(checkoutCharge.amountVND)}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={chargeDecision === "waive" ? "active" : ""}
                        onClick={() => setChargeDecision("waive")}
                      >
                        Miễn phí
                      </button>
                      <button
                        type="button"
                        className={chargeDecision === "force" ? "active" : ""}
                        onClick={() => setChargeDecision("force")}
                      >
                        Vẫn thu tiền
                      </button>
                    </>
                  )}
                </div>
                {!checkoutCharge.guestWillingToPay && chargeDecision === "force" && (
                  <small className="warn-note">
                    Ép thu sẽ làm hài lòng giảm mạnh, uy tín giảm và khách chắc chắn đánh giá thấp.
                  </small>
                )}
              </div>
            ) : (
              <p className="muted-note">Khách không dùng dịch vụ thêm nào trong lưu trú.</p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setCheckoutStayId(null)}
              >
                Để sau
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={confirmCheckout}
              >
                Xác nhận thu tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTarget && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <span className="soft-label">CHI TIẾT</span>
            <h2 id="detail-title">
              {detailAssignedRoom
                ? `Phòng ${detailAssignedRoom.number}`
                : "Khách lưu trú"}
            </h2>
            {detailGuest ? (
              <div className="detail-guest">
                <GuestAvatar
                  type={detailGuest.type}
                  className="guest-avatar hero-avatar"
                />
                <div>
                  <strong>{getGuestTypeLabel(detailGuest.type)}</strong>
                  <p>“{detailGuest.dialogue}”</p>
                  <small>
                    {detailAssignedRoom
                      ? `Phòng ${detailAssignedRoom.number} · `
                      : ""}
                    {detailGuest.nightsCompleted}/{detailGuest.nights} đêm ·{" "}
                    {detailGuest.state === "ReviewCompleted"
                      ? "Đã checkout"
                      : "Đang ở"}
                  </small>
                </div>
              </div>
            ) : (
              <p>Phòng đang trống, chưa có khách lưu trú.</p>
            )}
            {detailAssignedRoom && (
              <div className="confirm-summary">
                <div>
                  <span>Loại phòng</span>
                  <strong>{getRoomTypeLabel(detailAssignedRoom.type)}</strong>
                </div>
                <div>
                  <span>Tình trạng</span>
                  <strong>{detailAssignedRoom.condition}%</strong>
                </div>
                <div>
                  <span>Sức chứa</span>
                  <strong>{detailAssignedRoom.capacity} người</strong>
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setDetailTarget(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className={`notice-popup ${notice.tone}`} role="status">
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      {!ready && <div className="loading-toast">Đang mở khách sạn...</div>}
    </main>
  );
}

function TodayScreen({
  state,
  pendingGuests,
  inHouseGuests,
  waitingCheckoutGuests,
  occupancy,
  onOpenGuests,
  onInspectGuest,
  onCheckout,
  onSettle,
  onFastForward,
}: {
  state: GameState;
  pendingGuests: Guest[];
  inHouseGuests: Guest[];
  waitingCheckoutGuests: Guest[];
  occupancy: number;
  onOpenGuests: () => void;
  onInspectGuest: (guest: Guest) => void;
  onCheckout: (stayId: string) => void;
  onSettle: () => void;
  onFastForward: () => void;
}) {
  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="soft-label">
            NGÀY {state.day} · {state.locationName}
          </span>
          <div className="hero-clock">
            <strong>{formatGameTime(state.minuteOfDay)}</strong>
            <small>1 phút thật = 10 phút game</small>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={onSettle}>
              Kết ca
            </button>
            <button
              type="button"
              className="soft-button"
              onClick={onFastForward}
            >
              Tua nhanh 1 giờ
            </button>
          </div>
        </div>
        <HotelScene className="today-scene" />
      </section>

      <section className="metric-grid">
        <MetricCard
          label="Tiền mặt"
          value={formatVnd(state.cashVND)}
          tone="gold"
        />
        <MetricCard label="Công suất" value={`${occupancy}%`} tone="mint" />
        <MetricCard
          label="Khách đang ở"
          value={String(inHouseGuests.length)}
          tone="coral"
        />
        <MetricCard
          label="Uy tín"
          value={`${state.reputation}/100`}
          tone="rose"
        />
      </section>

      <section className="content-grid">
        <div className="paper-panel">
          <div className="panel-title-row">
            <div>
              <span className="soft-label">KHÁCH ĐẾN</span>
              <h3>Sảnh khách sạn</h3>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={onOpenGuests}
            >
              Xem tất cả
            </button>
          </div>
          {pendingGuests.length === 0 ? (
            <EmptyState text="Sảnh đang yên tĩnh. Hãy tận hưởng khoảng nghỉ nhỏ." />
          ) : (
            <div className="guest-list">
              {pendingGuests.slice(0, 3).map((guest) => (
                <button
                  type="button"
                  className="guest-row"
                  key={guest.id}
                  onClick={() => onInspectGuest(guest)}
                >
                  <GuestAvatar type={guest.type} className="guest-avatar" />
                  <span className="guest-row-copy">
                    <strong>Khách vừa đến</strong>
                    <small>“{guest.dialogue}”</small>
                  </span>
                  <span className="guest-budget">Còn ở sảnh</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="paper-panel">
          <div className="panel-title-row">
            <div>
              <span className="soft-label">CHỜ THANH TOÁN</span>
              <h3>Khách cần checkout</h3>
            </div>
          </div>
          {waitingCheckoutGuests.length === 0 ? (
            <EmptyState text="Chưa có khách nào chờ thanh toán." />
          ) : (
            <div className="guest-list">
              {waitingCheckoutGuests.map((guest) => {
                const stay = state.stays.find(
                  (item) =>
                    item.guestId === guest.id &&
                    item.status === "AwaitingCheckout",
                );
                const room = state.rooms.find(
                  (item) => item.id === guest.roomId,
                );
                return (
                  <button
                    type="button"
                    className="guest-row"
                    key={guest.id}
                    onClick={() => stay && onCheckout(stay.id)}
                  >
                    <GuestAvatar type={guest.type} className="guest-avatar" />
                    <span className="guest-row-copy">
                      <strong>
                        {getGuestTypeLabel(guest.type)} · Phòng{" "}
                        {room?.number ?? "—"}
                      </strong>
                      <small>Đủ {guest.nights} đêm · bấm để thu tiền</small>
                    </span>
                    <span className="night-count">Checkout</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="paper-panel">
          <div className="panel-title-row">
            <div>
              <span className="soft-label">ĐANG LƯU TRÚ</span>
              <h3>Phòng có người</h3>
            </div>
          </div>
          {inHouseGuests.length === 0 ? (
            <EmptyState text="Chưa có khách đang ở trong khách sạn." />
          ) : (
            <div className="guest-list">
              {inHouseGuests.map((guest) => (
                <div className="guest-row" key={guest.id}>
                  <GuestAvatar type={guest.type} className="guest-avatar" />
                  <span className="guest-row-copy">
                    <strong>{getGuestTypeLabel(guest.type)}</strong>
                    <small>{guest.lastEvent}</small>
                  </span>
                  <span className="night-count">
                    {guest.nightsCompleted}/{guest.nights} đêm
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="paper-panel review-panel">
        <div className="panel-title-row">
          <div>
            <span className="soft-label">NHẬT KÝ KHÁCH SẠN</span>
            <h3>Điều khách nói về chúng ta</h3>
          </div>
        </div>
        {state.reviews.length === 0 ? (
          <EmptyState text="Những đánh giá đầu tiên sẽ xuất hiện sau khi có khách checkout." />
        ) : (
          <div className="review-strip">
            {state.reviews
              .slice(-3)
              .reverse()
              .map((review) => (
                <div className="review-card" key={review.id}>
                  <div className="stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                  <p>“{review.text}”</p>
                  <small>
                    {getGuestTypeLabel(review.guestType)} · Ngày {review.day}
                  </small>
                </div>
              ))}
          </div>
        )}
      </section>
    </>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <span>☼</span>
      <p>{text}</p>
    </div>
  );
}

function GuestsScreen({
  pendingGuests,
  selectedGuest,
  selectedRoom,
  availableRooms,
  onSelectGuest,
  onSelectRoom,
}: {
  pendingGuests: Guest[];
  selectedGuest?: Guest;
  selectedRoom: Room | null;
  availableRooms: Room[];
  onSelectGuest: (guest: Guest) => void;
  onSelectRoom: (room: Room) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | RoomType>("all");
  const [viewFilter, setViewFilter] = useState<"all" | ViewType>("all");
  const [featureFilters, setFeatureFilters] = useState<RoomFeature[]>([]);
  const filteredRooms = availableRooms.filter((room) => {
    const typeMatches = typeFilter === "all" || room.type === typeFilter;
    const viewMatches = viewFilter === "all" || room.view === viewFilter;
    const featureMatches = featureFilters.every((feature) =>
      room.features.includes(feature),
    );
    return typeMatches && viewMatches && featureMatches;
  });
  const toggleFeature = (feature: RoomFeature) => {
    setFeatureFilters((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
  };

  return (
    <section className="guest-workspace">
      <div className="paper-panel guest-inbox">
        <div className="panel-title-row">
          <div>
            <span className="soft-label">SẢNH KHÁCH SẠN</span>
            <h3>Khách đang tìm phòng</h3>
          </div>
          <span className="count-badge">{pendingGuests.length}</span>
        </div>
        {pendingGuests.length === 0 ? (
          <EmptyState text="Không còn khách đang chờ." />
        ) : (
          <div className="inbox-list">
            {pendingGuests.map((guest) => (
              <button
                type="button"
                className={`inbox-card ${selectedGuest?.id === guest.id ? "selected" : ""}`}
                key={guest.id}
                onClick={() => onSelectGuest(guest)}
              >
                <GuestAvatar type={guest.type} className="guest-avatar large" />
                <span>
                  <strong>Khách vừa đến</strong>
                  <small>
                    {guest.partyAdults + guest.partyChildren} khách ·{" "}
                    {guest.nights} đêm
                  </small>
                  <small>“{guest.dialogue}”</small>
                </span>
                <b className="guest-budget">Chờ xử lý</b>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="paper-panel matching-panel">
        {!selectedGuest ? (
          <EmptyState text="Chọn một vị khách để bắt đầu." />
        ) : (
          <>
            <div className="matching-header">
              <div>
                <span className="soft-label">LỜI THOẠI KHÁCH</span>
                <h3>“{selectedGuest.dialogue}”</h3>
                <p>
                  Người khách sẽ nói rõ điều họ cần. Hãy chọn phòng và đặt giá
                  phù hợp.
                </p>
              </div>
              <GuestAvatar
                type={selectedGuest.type}
                className="guest-avatar hero-avatar"
              />
            </div>
            <div className="room-picker-header">
              <div>
                <span className="soft-label">CHỌN PHÒNG</span>
                <h4>Lọc phòng còn trống</h4>
              </div>
              <span>
                {filteredRooms.length}/{availableRooms.length} phòng
              </span>
            </div>
            <div className="room-filter-chips">
              <button
                type="button"
                className={typeFilter === "all" ? "active" : ""}
                onClick={() => setTypeFilter("all")}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={typeFilter === "standard" ? "active" : ""}
                onClick={() => setTypeFilter("standard")}
              >
                Standard
              </button>
              <button
                type="button"
                className={typeFilter === "deluxe" ? "active" : ""}
                onClick={() => setTypeFilter("deluxe")}
              >
                Deluxe
              </button>
              <button
                type="button"
                className={viewFilter === "city" ? "active" : ""}
                onClick={() => setViewFilter("city")}
              >
                City
              </button>
              <button
                type="button"
                className={viewFilter === "sea" ? "active" : ""}
                onClick={() => setViewFilter("sea")}
              >
                Sea
              </button>
              {(
                [
                  "wifi_good",
                  "desk",
                  "balcony",
                  "kitchenette",
                  "bathtub",
                  "sofa",
                  "quiet",
                ] as RoomFeature[]
              ).map((feature) => (
                <button
                  type="button"
                  className={featureFilters.includes(feature) ? "active" : ""}
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                >
                  {getFeatureLabel(feature)}
                </button>
              ))}
            </div>
            <div className="room-picker">
              {filteredRooms.length === 0 ? (
                <EmptyState text="Không có phòng phù hợp bộ lọc." />
              ) : (
                filteredRooms.map((room) => (
                  <button
                    type="button"
                    className={`room-option ${selectedRoom?.id === room.id ? "selected" : ""}`}
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                  >
                    <RoomArt
                      type={room.type}
                      view={room.view}
                      className="room-art"
                    />
                    <span className="room-option-copy">
                      <strong>
                        Phòng {room.number} · {getRoomTypeLabel(room.type)}
                      </strong>
                      <small>
                        {getViewLabel(room.view)} · {room.size}m² · Chứa{" "}
                        {room.capacity} người ·{" "}
                        {room.features
                          .map(getFeatureLabel)
                          .slice(0, 2)
                          .join(" · ")}
                      </small>
                      <small>
                        Giá gốc {formatVnd(room.basePriceVND)} / đêm
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StaysScreen({
  state,
  inHouseGuests,
  waitingCheckoutGuests,
  onSettle,
  onInspectGuest,
  onCheckout,
}: {
  state: GameState;
  inHouseGuests: Guest[];
  waitingCheckoutGuests: Guest[];
  onSettle: () => void;
  onInspectGuest: (guest: Guest) => void;
  onCheckout: (stayId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "active" | "checkout">("all");
  const visibleGuests =
    filter === "active"
      ? inHouseGuests
      : filter === "checkout"
        ? waitingCheckoutGuests
        : [...inHouseGuests, ...waitingCheckoutGuests];
  return (
    <section className="paper-panel">
      <div className="panel-title-row">
        <div>
          <span className="soft-label">QUẢN LÝ LƯU TRÚ</span>
          <h3>Check-in và checkout</h3>
        </div>
        <button type="button" className="text-button" onClick={onSettle}>
          Kết ca để cập nhật đêm
        </button>
      </div>
      <div className="room-filter-chips">
        <button
          type="button"
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          Đang ở ({inHouseGuests.length})
        </button>
        <button
          type="button"
          className={filter === "checkout" ? "active" : ""}
          onClick={() => setFilter("checkout")}
        >
          Chờ checkout ({waitingCheckoutGuests.length})
        </button>
      </div>
      <div className="stay-list">
        {visibleGuests.length === 0 ? (
          <EmptyState text="Chưa có lưu trú nào." />
        ) : (
          visibleGuests.map((guest) => {
            const room = state.rooms.find((item) => item.id === guest.roomId);
            const stay = state.stays.find(
              (item) =>
                item.guestId === guest.id && item.status === "AwaitingCheckout",
            );
            const isWaiting = guest.state === "WaitingCheckout";
            return (
              <button
                type="button"
                className="stay-row"
                key={guest.id}
                onClick={() =>
                  isWaiting && stay
                    ? onCheckout(stay.id)
                    : onInspectGuest(guest)
                }
              >
                <GuestAvatar type={guest.type} className="guest-avatar" />
                <div>
                  <strong>
                    {getGuestTypeLabel(guest.type)} · Phòng{" "}
                    {room?.number ?? "—"}
                  </strong>
                  <small>
                    {isWaiting
                      ? "Đủ đêm · mở để checkout"
                      : `${guest.nightsCompleted}/${guest.nights} đêm · ${guest.lastEvent}`}
                  </small>
                </div>
                <span className={isWaiting ? "stay-done" : "stay-active"}>
                  {isWaiting ? "Checkout" : "Đang ở"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function RoomsScreen({
  state,
  onRepair,
  onInspectRoom,
}: {
  state: GameState;
  onRepair: (roomId: string) => void;
  onInspectRoom: (roomId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"All" | RoomState>("All");
  const [featureFilter, setFeatureFilter] = useState<"all" | RoomFeature>(
    "all",
  );
  const filteredRooms = state.rooms.filter((room) => {
    const statusMatches = statusFilter === "All" || room.state === statusFilter;
    const featureMatches =
      featureFilter === "all" || room.features.includes(featureFilter);
    return statusMatches && featureMatches;
  });

  return (
    <section className="paper-panel">
      <div className="panel-title-row">
        <div>
          <span className="soft-label">DANH SÁCH PHÒNG</span>
          <h3>{state.rooms.length} phòng của khách sạn</h3>
        </div>
        <span className="count-badge">
          {state.rooms.filter((room) => room.state === "Available").length}{" "}
          trống
        </span>
      </div>
      <div className="room-filters">
        <label>
          Trạng thái
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "All" | RoomState)
            }
          >
            <option value="All">Tất cả</option>
            <option value="Available">Trống</option>
            <option value="Occupied">Có khách</option>
            <option value="NeedsCleaning">Cần dọn</option>
            <option value="Maintenance">Bảo trì</option>
            <option value="Locked">Đã khóa</option>
          </select>
        </label>
        <label>
          Tiện nghi
          <select
            value={featureFilter}
            onChange={(event) =>
              setFeatureFilter(event.target.value as "all" | RoomFeature)
            }
          >
            <option value="all">Tất cả</option>
            <option value="wifi_good">WiFi tốt</option>
            <option value="desk">Bàn làm việc</option>
            <option value="balcony">Ban công</option>
            <option value="kitchenette">Bếp nhỏ</option>
            <option value="bathtub">Bồn tắm</option>
            <option value="sofa">Sofa</option>
            <option value="quiet">Yên tĩnh</option>
          </select>
        </label>
      </div>
      <div className="room-grid">
        {filteredRooms.length === 0 ? (
          <EmptyState text="Không có phòng phù hợp bộ lọc." />
        ) : (
          filteredRooms.map((room) => (
            <div
              className={`room-tile ${room.state.toLowerCase()}`}
              key={room.id}
              role="button"
              tabIndex={0}
              onClick={() => onInspectRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  onInspectRoom(room.id);
              }}
            >
              <RoomArt type={room.type} view={room.view} className="room-art" />
              <div className="room-tile-copy">
                <strong>Phòng {room.number}</strong>
                <span>
                  {getRoomTypeLabel(room.type)} · {getViewLabel(room.view)}
                </span>
                <small>
                  Chứa {room.capacity} người ·{" "}
                  {room.features.map(getFeatureLabel).slice(0, 2).join(" · ")}
                </small>
                <small>Tình trạng: {room.condition}%</small>
              </div>
              <div className="room-tile-footer">
                <span className="room-state">
                  {room.state === "Available"
                    ? "Trống"
                    : room.state === "Occupied"
                      ? "Có khách"
                      : room.state}
                </span>
                {room.condition < 100 &&
                  room.state !== "Occupied" &&
                  room.state !== "Reserved" && (
                    <button
                      type="button"
                      className="repair-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRepair(room.id);
                      }}
                    >
                      Sửa {formatVnd(getRepairCost(room))}
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FinanceScreen({
  state,
  lastSavedAt,
  onReply,
}: {
  state: GameState;
  lastSavedAt: number | null;
  onReply: (reviewId: string, reply: string) => void;
}) {
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const submitReply = (reviewId: string) => {
    onReply(reviewId, replyDraft);
    setReplyingReviewId(null);
    setReplyDraft("");
  };
  return (
    <section className="finance-layout">
      <div className="paper-panel">
        <div className="panel-title-row">
          <div>
            <span className="soft-label">SỔ CASH</span>
            <h3>Tiền của khách sạn</h3>
          </div>
          <span className="gold-badge">VND</span>
        </div>
        <div className="finance-total">
          <span>Cash hiện tại</span>
          <strong>{formatVnd(state.cashVND)}</strong>
        </div>
        {state.lastSettlement && (
          <div className="settlement-card">
            <div className="settlement-heading">
              <span>Kết ca gần nhất · Ngày {state.lastSettlement.day}</span>
              <strong>
                {formatVnd(state.lastSettlement.netCashChangeVND)}
              </strong>
            </div>
            <div className="finance-rows">
              <div>
                <span>Doanh thu checkout</span>
                <b>{formatVnd(state.lastSettlement.revenueVND)}</b>
              </div>
              <div>
                <span>Chi phí vận hành</span>
                <b>− {formatVnd(state.lastSettlement.operatingCostVND)}</b>
              </div>
              <div>
                <span>Thuế</span>
                <b>− {formatVnd(state.lastSettlement.taxVND)}</b>
              </div>
              <div>
                <span>Bồi thường</span>
                <b>− {formatVnd(state.lastSettlement.compensationVND)}</b>
              </div>
              <div>
                <span>Sửa phòng</span>
                <b>− {formatVnd(state.lastSettlement.repairVND)}</b>
              </div>
              <div className="finance-total-row">
                <span>Thực nhận kỳ này</span>
                <b>{formatVnd(state.lastSettlement.takeHomeVND)}</b>
              </div>
            </div>
          </div>
        )}
        <div className="finance-rows">
          <div className="finance-total-row">
            <span>Thực nhận tích lũy</span>
            <b>{formatVnd(getTakeHomeVND(state))}</b>
          </div>
          <div>
            <span>Đã thực thu tích lũy</span>
            <b>{formatVnd(state.totalRevenueVND)}</b>
          </div>
          <div>
            <span>Tổng tiền phòng</span>
            <b>
              {formatVnd(
                state.payments.reduce(
                  (sum, payment) => sum + payment.roomChargeVND,
                  0,
                ),
              )}
            </b>
          </div>
          <div>
            <span>Tổng dịch vụ thêm</span>
            <b>
              {formatVnd(
                state.payments.reduce(
                  (sum, payment) => sum + payment.extraChargesVND,
                  0,
                ),
              )}
            </b>
          </div>
          <div>
            <span>Tổng chi phí vận hành</span>
            <b>{formatVnd(state.totalCostsVND)}</b>
          </div>
          <div>
            <span>Thuế đã đóng</span>
            <b>{formatVnd(state.taxPaidVND)}</b>
          </div>
          <div>
            <span>Phí dịch vụ đã miễn</span>
            <b>{formatVnd(getWaivedTotalVND(state))}</b>
          </div>
          <div>
            <span>Đánh giá đã nhận</span>
            <b>{state.reviewCount}</b>
          </div>
          <div>
            <span>Lưu gần nhất</span>
            <b>
              {lastSavedAt
                ? new Date(lastSavedAt).toLocaleTimeString("vi-VN")
                : "—"}
            </b>
          </div>
        </div>
        {state.payments.length > 0 && (
          <div className="payment-list">
            <span className="soft-label">BIÊN NHẬN GẦN NHẤT</span>
            {state.payments
              .slice(-5)
              .reverse()
              .map((payment) => {
                const room = state.rooms.find(
                  (item) => item.id === payment.roomId,
                );
                const guest = state.guests.find(
                  (item) => item.id === payment.guestId,
                );
                return (
                  <div className="payment-row" key={payment.id}>
                    <div>
                      <strong>
                        Ngày {payment.day} · Phòng {room?.number ?? "—"}
                      </strong>
                      <small>
                        {guest ? getGuestTypeLabel(guest.type) : "Khách"}
                        {payment.extraChargesVND > 0
                          ? ` · +${formatVnd(payment.extraChargesVND)} dịch vụ`
                          : ""}
                        {payment.waivedVND > 0
                          ? ` · miễn ${formatVnd(payment.waivedVND)}`
                          : ""}
                      </small>
                      <small className="payment-note">
                        {payment.extraChargesNote}
                      </small>
                    </div>
                    <b>{formatVnd(payment.totalVND)}</b>
                  </div>
                );
              })}
          </div>
        )}
        <div className="finance-note">
          Thực nhận = doanh thu checkout − chi phí vận hành − thuế − bồi thường −
          sửa phòng. Phí dịch vụ bị khách từ chối và quầy miễn sẽ không vào doanh
          thu.
        </div>
      </div>
      <div className="paper-panel">
        <div className="panel-title-row">
          <div>
            <span className="soft-label">PHẢN HỒI KHÁCH</span>
            <h3>Trả lời review</h3>
          </div>
        </div>
        {state.reviews.length === 0 ? (
          <EmptyState text="Chưa có review để phản hồi." />
        ) : (
          <div className="review-inbox">
            {state.reviews
              .slice(-5)
              .reverse()
              .map((review) => (
                <div className="review-inbox-row" key={review.id}>
                  <div className="stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                  <p>“{review.text}”</p>
                  {review.reply ? (
                    <small>Đã phản hồi: {review.reply}</small>
                  ) : replyingReviewId === review.id ? (
                    <div className="reply-editor">
                      <input
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        placeholder="Viết phản hồi..."
                      />
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => submitReply(review.id)}
                      >
                        Gửi
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setReplyingReviewId(review.id)}
                    >
                      Phản hồi khách
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
