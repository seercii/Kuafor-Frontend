import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// 15 dakikalık dilim üretici
const generateSlots = () => {
  const slots = [];
  let current = new Date();
  current.setHours(9, 0, 0, 0);
  const end = new Date();
  end.setHours(20, 0, 0, 0);
  while (current <= end) {
    slots.push(
      current.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
    current = new Date(current.getTime() + 15 * 60000);
  }
  return slots;
};
const ALL_SLOTS = generateSlots();

export default function Appointment() {
  const params = useParams();
  const slug = params.slug || params.kuaforId;
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

  const [shopInfo, setShopInfo] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Müşteri Bilgileri
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Müşteri Geçmişi State'leri
  const [historyPhone, setHistoryPhone] = useState("");
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`http://localhost:3000/appointments/shop/${slug}`).then((res) => {
      setShopInfo(res.data);
      setServices(res.data.services);
    });
  }, [slug]);

  useEffect(() => {
    if (!shopInfo?.id || !selectedDate) return;
    axios
      .get(
        `http://localhost:3000/appointments/busy-slots?shopId=${shopInfo.id}&date=${selectedDate}`,
      )
      .then((res) => setBookedSlots(res.data));
  }, [selectedDate, shopInfo]);

  // Geçmişi Sorgula
  const fetchHistory = async () => {
    if (historyPhone.length < 10)
      return alert("Lütfen geçerli bir telefon girin.");
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/appointments/customer-history/${slug}/${historyPhone}`,
      );
      setCustomerHistory(res.data);
    } catch (err) {
      alert("Randevu geçmişi bulunamadı.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Müşteri Tarafından İptal
  const handleCustomerCancel = async (id: string) => {
    if (!window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?"))
      return;
    try {
      await axios.patch(`http://localhost:3000/appointments/${id}/status`, {
        status: "CANCELLED",
        rejectionReason: "Müşteri tarafından iptal edildi.",
      });
      alert("Randevunuz iptal edildi.");
      fetchHistory(); // Listeyi tazele
    } catch (err) {
      alert("İptal işlemi başarısız.");
    }
  };

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, id) => sum + (services.find((s) => s.id === id)?.duration || 0),
        0,
      ),
    [selectedServices, services],
  );

  const isSlotDisabled = (slot: string) => {
    if (totalDuration === 0) return bookedSlots.includes(slot);
    const [h, m] = slot.split(":").map(Number);
    const startMins = h * 60 + m;
    if (startMins + totalDuration > 20 * 60) return true;
    for (let i = 0; i < totalDuration; i += 15) {
      const checkMins = startMins + i;
      const checkH = Math.floor(checkMins / 60)
        .toString()
        .padStart(2, "0");
      const checkM = (checkMins % 60).toString().padStart(2, "0");
      if (bookedSlots.includes(`${checkH}:${checkM}`)) return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startTime = new Date(
        `${selectedDate}T${selectedTime}:00`,
      ).toISOString();
      await axios.post("http://localhost:3000/appointments", {
        shopSlug: slug,
        startTime,
        serviceIds: selectedServices,
        customerName,
        customerPhone: phone,
      });
      alert("Randevunuz başarıyla oluşturuldu! 🚀");
      setCustomerName("");
      setPhone("");
      setSelectedServices([]);
      setSelectedTime("");
    } catch (error) {
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- EKSİK OLAN HİZMET SEÇME FONKSİYONU ---
  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id];
      setSelectedTime(""); // Hizmet değişirse saati sıfırla ki süreler karışmasın
      return newSelection;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden mt-6 border border-slate-100">
        {/* HEADER */}
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h1 className="text-3xl font-black">
            {shopInfo?.name || "Yükleniyor..."}
          </h1>
          <div className="flex bg-indigo-800/40 p-1 rounded-xl mt-6">
            <button
              onClick={() => setActiveTab("book")}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === "book" ? "bg-white text-indigo-600 shadow-md" : "text-white/60"}`}
            >
              Randevu Al
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === "history" ? "bg-white text-indigo-600 shadow-md" : "text-white/60"}`}
            >
              Randevularım
            </button>
          </div>
        </div>

        {/* --- RANDEVU ALMA FORMU --- */}
        {activeTab === "book" ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-lg">
                👤 Bilgileriniz
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Ad Soyad"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <input
                  placeholder="Telefon"
                  value={phone}
                  maxLength={11}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                  className="p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-lg flex justify-between">
                ✂️ Hizmetler{" "}
                {totalDuration > 0 && (
                  <span className="text-xs text-indigo-600 underline">
                    {totalDuration} Dk
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer flex justify-between transition-all ${selectedServices.includes(s.id) ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"}`}
                  >
                    <span className="font-bold">{s.name}</span>
                    <span className="font-black text-indigo-600">
                      {s.price} ₺
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-lg">
                📅 Saat Seçimi
              </h3>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 border rounded-xl bg-slate-50 outline-none"
              />
              <div className="grid grid-cols-4 gap-2">
                {ALL_SLOTS.map((slot) => {
                  const disabled = isSlotDisabled(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedTime(slot)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${disabled ? "bg-slate-50 text-slate-200" : selectedTime === slot ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700"
            >
              {loading ? "Onaylanıyor..." : "Randevuyu Onayla 🚀"}
            </button>
          </form>
        ) : (
          /* --- MÜŞTERİ GEÇMİŞİ --- */
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">
                Randevularımı Sorgula
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Telefon numaranızı girin"
                  value={historyPhone}
                  onChange={(e) =>
                    setHistoryPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  onClick={fetchHistory}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl"
                >
                  Sorgula
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {historyLoading ? (
                <p className="text-center text-slate-400">Yükleniyor...</p>
              ) : customerHistory.length === 0 ? (
                <p className="text-center text-slate-400 italic">
                  Henüz bir randevu bulunamadı.
                </p>
              ) : (
                customerHistory.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <div className="font-black text-indigo-600">
                        {new Date(app.startTime).toLocaleDateString("tr-TR")} -{" "}
                        {new Date(app.startTime).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className={`text-xs font-bold mt-1 uppercase ${app.status === "CANCELLED" ? "text-red-500" : "text-green-500"}`}
                      >
                        {app.status === "PENDING"
                          ? "Bekliyor"
                          : app.status === "APPROVED"
                            ? "Onaylı"
                            : app.status === "COMPLETED"
                              ? "Tamamlandı"
                              : "İptal Edildi"}
                      </div>
                    </div>
                    {(app.status === "PENDING" ||
                      app.status === "APPROVED") && (
                      <button
                        onClick={() => handleCustomerCancel(app.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
