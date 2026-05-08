import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PREDEFINED_SERVICES = [
  { name: "Saç Kesim", price: 700, duration: 30 },
  { name: "Sakal Kesim", price: 250, duration: 15 },
  { name: "Saç - Sakal Kesim", price: 900, duration: 45 },
];

export default function Profile() {
  const navigate = useNavigate();
  const shopName = localStorage.getItem("shopName");
  const shopId = localStorage.getItem("shopId");
  const shopSlug = localStorage.getItem("shopSlug"); // Link için slug'ı aldık

  const [myServices, setMyServices] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Müşteriye atılacak randevu linki (Frontend portuna göre 5173 veya 5174)
  const appointmentLink = `https://kuafor-backend.onrender.com:5173/randevu/${shopSlug}`;

  // 1. Dükkanın daha önce eklediği hizmetleri backend'den çekiyoruz
  useEffect(() => {
    if (!shopId) {
      navigate("/login");
      return;
    }
    fetchMyServices();
  }, [shopId]);

  const fetchMyServices = async () => {
    try {
      const res = await axios.get(
        `https://kuafor-backend.onrender.com/services/shop/${shopId}`,
      );
      setMyServices(res.data);
    } catch (error) {
      console.error("Hizmetler çekilemedi", error);
    }
  };

  // 2. Yeni Hizmet Ekleme İşlemi
  const handleAddService = async (service: (typeof PREDEFINED_SERVICES)[0]) => {
    try {
      const res = await axios.post(
        "https://kuafor-backend.onrender.com/services",
        {
          name: service.name,
          price: service.price,
          duration: service.duration,
          shopId: shopId,
        },
      );

      // Backend'den başarılı cevap gelince listeyi ANINDA güncelle (Sayfa yenilemeye gerek kalmaz)
      setMyServices([...myServices, res.data]);
    } catch (error) {
      alert("Hizmet eklenirken bir hata oluştu.");
    }
  };

  // 3. Link Kopyalama İşlemi
  const handleCopyLink = () => {
    navigator.clipboard.writeText(appointmentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // 2 saniye sonra kopyalandı yazısı gitsin
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    // Yanlışlıkla silmesin diye emin misin diye soruyoruz
    const isConfirmed = window.confirm(
      "Dükkanını, tüm hizmetlerini ve randevularını KALICI OLARAK silmek istediğine emin misin? Bu işlem geri alınamaz!",
    );

    if (isConfirmed) {
      try {
        await axios.delete(
          `https://kuafor-backend.onrender.com/auth/delete/${shopId}`,
        );
        localStorage.clear(); // Tarayıcı hafızasını sıfırla
        alert("Hesabın ve tüm verilerin başarıyla silindi. Elveda! 👋");
        navigate("/register"); // Kayıt ekranına postalıyoruz
      } catch (error) {
        alert("Silme işlemi sırasında bir hata oluştu.");
      }
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* --- ÜST BİLGİ VE ÇIKIŞ --- */}
        {/* --- ÜST BİLGİ VE ÇIKIŞ --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">
              Hoş Geldin, {shopName} ✂️
            </h1>
            <p className="text-zinc-500 mt-2 text-lg">
              İşletmeni büyütmek için her şey hazır.
            </p>
          </div>

          {/* BUTONLAR GRUBU */}
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {/* YENİ EKLENEN RANDEVULARIM BUTONU */}
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all"
            >
              📅 Randevularım
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition-all"
            >
              Çıkış Yap
            </button>

            <button
              onClick={handleDeleteAccount}
              className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:text-red-700 transition-all shadow-sm"
            >
              Kalıcı Olarak Sil
            </button>
          </div>
        </div>

        {/* --- PAYLAŞILABİLİR LİNK ALANI --- */}
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Randevu Linkin Hazır! 🚀</h2>
            <p className="text-indigo-200 text-sm">
              Aşağıdaki linki müşterilerine göndererek anında randevu
              alabilirsin.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto bg-indigo-800/50 p-2 rounded-2xl border border-indigo-500/30">
            <span className="px-4 text-indigo-100 truncate w-48 md:w-64 text-sm select-all">
              {appointmentLink}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-white text-indigo-600 hover:bg-indigo-50"}`}
            >
              {copied ? "✓ Kopyalandı" : "🔗 Kopyala"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- SOL: BENİM HİZMETLERİM --- */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              📋 Dükkanımın Hizmetleri
            </h2>

            {myServices.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
                Henüz bir hizmet eklemedin.
                <br />
                Sağ taraftan dükkanına uygun hizmetleri seçebilirsin.
              </div>
            ) : (
              <div className="space-y-4">
                {myServices.map((srv, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div>
                      <h3 className="font-bold text-zinc-800">{srv.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium mt-1">
                        ⏱ {srv.duration} Dk
                      </p>
                    </div>
                    <div className="text-xl font-black text-indigo-600">
                      {srv.price} ₺
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SAĞ: HİZMET EKLEME KATALOĞU --- */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              ➕ Hizmet Kataloğu
            </h2>

            <div className="space-y-4">
              {PREDEFINED_SERVICES.map((service, index) => {
                // Bu hizmet zaten eklenmiş mi kontrol et (isimden)
                const isAdded = myServices.some((s) => s.name === service.name);

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAdded ? "bg-green-50/50 border-green-100" : "bg-white border-slate-200 hover:border-indigo-300"}`}
                  >
                    <div>
                      <h3
                        className={`font-bold ${isAdded ? "text-zinc-400" : "text-zinc-800"}`}
                      >
                        {service.name}
                      </h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-sm font-bold text-zinc-500">
                          {service.price} ₺
                        </span>
                        <span className="text-sm font-medium text-zinc-400">
                          • {service.duration} Dk
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddService(service)}
                      disabled={isAdded}
                      className={`px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
                        isAdded
                          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                          : "bg-zinc-900 text-white hover:bg-indigo-600"
                      }`}
                    >
                      {isAdded ? "Eklendi" : "Ekle"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
