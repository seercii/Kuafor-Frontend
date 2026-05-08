import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Sadece rakam
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://kuafor-backend.onrender.com//auth/login",
        formData,
      );
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("shopId", res.data.shopId);
      localStorage.setItem("shopName", res.data.name);
      localStorage.setItem("shopSlug", res.data.slug); // BU SATIR ÇOK ÖNEMLİ
      navigate("/profile");
    } catch (err) {
      alert("Giriş başarısız! Telefon veya şifre hatalı.");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sol Taraf - Fotoğraf (Klas Adam Resmi) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="text-5xl font-extrabold mb-4">✂️ Kuaförüm</h1>
          <p className="text-xl text-zinc-300">
            Hoş geldin! Dükkanını yönetmek için giriş yap.
          </p>
        </div>
      </div>

      {/* Sağ Taraf - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-zinc-900 mb-2">Giriş Yap</h2>
          <p className="text-zinc-500 mb-8">Müşterilerin seni bekliyor.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Telefon Numarası
              </label>
              <input
                type="text"
                placeholder="05XX XXX XX XX"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={11}
                className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg"
            >
              Giriş Yap
            </button>
          </form>

          <p className="text-center mt-8 text-zinc-600">
            Dükkanın yok mu?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-zinc-900 font-bold cursor-pointer underline"
            >
              Kayıt Ol
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
