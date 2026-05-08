import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const shopId = localStorage.getItem("shopId");
  const shopName = localStorage.getItem("shopName");

  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, appointmentCount: 0 });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [shopId, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Randevuları çek
      const appRes = await axios.get(
        `http://localhost:3000/appointments/daily/${shopId}?date=${selectedDate}`,
      );
      setAppointments(appRes.data);

      // 2. İstatistikleri çek
      const statsRes = await axios.get(
        `http://localhost:3000/appointments/stats/${shopId}?date=${selectedDate}`,
      );
      setStats(statsRes.data);

      // 3. Hizmet isimlerini eşleştirmek için dükkan hizmetlerini çek
      const srvRes = await axios.get(
        `http://localhost:3000/services/shop/${shopId}`,
      );
      setServices(srvRes.data);
    } catch (err) {
      console.error("Veri çekilemedi", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    let confirmMessage = "";
    let successMessage = "";
    let rejectionReason = ""; // İptal sebebi değişkeni

    if (status === "APPROVED") {
      confirmMessage =
        "✅ Bu randevuyu ONAYLAMAK istediğine emin misin? (Müşteriye onay mesajı gidecek)";
      successMessage = "Randevu onaylandı!";
    } else if (status === "COMPLETED") {
      confirmMessage = "✂️ İşlem TAMAMLANDI olarak işaretlenecek. Emin misin?";
      successMessage = "Randevu tamamlandı olarak kaydedildi.";
    } else if (status === "CANCELLED") {
      // Prompt ile adama iptal sebebini soruyoruz (Opsiyonel)
      const reason = window.prompt(
        "⚠️ Randevuyu İPTAL EDİYORSUN.\nMüşteriye iletilmek üzere bir iptal sebebi yazabilirsin (Zorunlu değil):",
      );

      // Eğer adam iptal (cancel) tuşuna basarsa null döner, işlemi durdur.
      if (reason === null) return;

      rejectionReason = reason;
      successMessage = "Randevu iptal edildi ve müşteriye bildirildi!";

      // Prompt çıktığı için ekstra confirm'e gerek yok, bayrağı geçiyoruz
      confirmMessage = "SKIP";
    }

    if (confirmMessage !== "SKIP") {
      const isConfirmed = window.confirm(confirmMessage);
      if (!isConfirmed) return;
    }

    try {
      // Backend'e status ve varsa rejectionReason gönderiyoruz
      await axios.patch(`http://localhost:3000/appointments/${id}/status`, {
        status,
        rejectionReason,
      });
      alert(successMessage);
      fetchData();
    } catch (err) {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  // Hizmet ID'lerini isimlere çeviren yardımcı fonksiyon
  const getServiceNames = (ids: string[]) => {
    return ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Üst Bar */}
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {shopName} Yönetim Paneli
            </h1>
            <p className="text-zinc-500 text-sm">
              Randevularını buradan takip edebilirsin.
            </p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="px-5 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm"
          >
            Hizmet Ayarları
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-indigo-200">
            <p className="text-indigo-100 font-medium">Bugünkü Toplam Ciro</p>
            <h2 className="text-4xl font-black mt-2">{stats.totalRevenue} ₺</h2>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">Bugünkü Randevu Sayısı</p>
            <h2 className="text-4xl font-black mt-2 text-zinc-900">
              {stats.appointmentCount} Adet
            </h2>
          </div>
        </div>

        {/* Tarih Seçici ve Liste */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-zinc-800">Randevu Listesi</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border rounded-xl bg-slate-50 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-slate-400 font-medium">
                Yükleniyor...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-medium italic">
                Bu tarihte randevu bulunmuyor.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase">
                    <th className="p-4 font-bold">Saat</th>
                    <th className="p-4 font-bold">Müşteri</th>
                    <th className="p-4 font-bold">Hizmetler</th>
                    <th className="p-4 font-bold">Durum</th>
                    <th className="p-4 font-bold">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 transition-all"
                    >
                      <td className="p-4 font-black text-indigo-600">
                        {new Date(app.startTime).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">
                          {app.customerName}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {app.customerPhone}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-zinc-600 font-medium">
                        {getServiceNames(app.serviceIds)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            app.status === "APPROVED"
                              ? "bg-blue-100 text-blue-600"
                              : app.status === "COMPLETED"
                                ? "bg-green-100 text-green-600"
                                : app.status === "CANCELLED"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {app.status === "PENDING"
                            ? "Bekliyor"
                            : app.status === "COMPLETED"
                              ? "Tamamlandı"
                              : app.status === "CANCELLED"
                                ? "İptal"
                                : "Onaylı"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Bekleyen Randevu İçin ONAYLA ve İPTAL ET */}
                          {app.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(app.id, "APPROVED")}
                                className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all font-bold text-xs shadow-sm"
                              >
                                Onayla
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(app.id, "CANCELLED")
                                }
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold text-xs shadow-sm"
                              >
                                İptal Et
                              </button>
                            </>
                          )}

                          {/* Onaylanmış Randevu İçin TAMAMLANDI ve İPTAL ET */}
                          {app.status === "APPROVED" && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatus(app.id, "COMPLETED")
                                }
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-bold text-xs shadow-sm"
                              >
                                Tamamlandı
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(app.id, "CANCELLED")
                                }
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold text-xs shadow-sm"
                              >
                                İptal Et
                              </button>
                            </>
                          )}

                          {/* İptal edilenlerde sebebi gösterelim */}
                          {app.status === "CANCELLED" &&
                            app.rejectionReason && (
                              <span className="text-xs text-red-500 font-medium italic">
                                Sebep: {app.rejectionReason}
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
