"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  FilePlus,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { categoryConfig } from "@/types";

const IssueMap = dynamic(() => import("@/components/IssueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-150 bg-slate-100 rounded-xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  ),
});

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationTab, setLocationTab] = useState<"map" | "manual">("map");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reverseGeocode = async (la: number, ln: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${ln}&format=json`,
      );
      const data = await res.json();
      const addr = data.address;
      setAddress(data.display_name?.split(",").slice(0, 3).join(",") ?? "");
      setCity(addr.city ?? addr.town ?? addr.village ?? addr.county ?? "");
      setState(addr.state ?? "");
    } catch {}
  };

  const useMyLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        await reverseGeocode(latitude, longitude);
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
        setError("Could not get location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleMapClick = useCallback(async (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    await reverseGeocode(la, ln);
  }, []);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).slice(0, 3 - photos.length);
    const valid = allowed.filter(
      (f) =>
        f.size <= 5 * 1024 * 1024 &&
        ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    setPhotos((p) => [...p, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (locationTab === "map") {
      if (!lat || !lng) {
        setError("Please pin your location on the map or use GPS.");
        return;
      }
      if (!address.trim()) {
        setError("Please enter an address.");
        return;
      }
    } else {
      if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        setError("Please enter your complete address.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("category", category);
      fd.append("address", address);
      fd.append("city", city);
      fd.append("state", state);

      if (locationTab === "manual") {
        fd.append("lat", "0");
        fd.append("lng", "0");
        fd.append("pincode", pincode);
      } else {
        fd.append("lat", String(lat));
        fd.append("lng", String(lng));
      }

      photos.forEach((f) => fd.append("photos", f));

      await api.post("/issues", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => router.push("/my-reports"), 2000);
    } catch (err: any) {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.message ?? "Failed to submit.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="h-full flex items-center justify-center p-6 fade-in">
        <div className="card p-12 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 fade-up">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2
            className="text-2xl font-bold text-slate-800 mb-3 fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Issue Submitted!
          </h2>
          <p
            className="text-slate-500 fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            Redirecting you to your reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-350 mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
          <FilePlus size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Report a <span className="gradient-text">Civic Issue</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Provide details and pin the exact location
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: FORM */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 shadow-lg shake">
                <AlertCircle size={18} className="shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Wait a moment!</span>
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-2 p-1 hover:bg-red-100 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="card p-6 space-y-6">
              {/* Title & Desc */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Large pothole near bus stand"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                />
                <p className="text-xs text-slate-400 text-right mt-2 font-medium">
                  {description.length}/1000
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(categoryConfig).map(([val, conf]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCategory(val)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                        ${
                          category === val
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      <span className={`text-xl ${category === val ? 'text-blue-600' : conf.color}`}><conf.Icon size={24} /></span>
                      <span className="text-xs font-bold">{conf.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Location Details <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-4 border-b border-slate-200 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationTab("map");
                      setLat(null);
                      setLng(null);
                      setAddress("");
                      setCity("");
                      setState("");
                      setPincode("");
                    }}
                    className={`pb-2 text-sm transition-colors ${locationTab === "map" ? "border-b-2 border-primary text-primary-dark font-semibold" : "text-[#64748b] hover:text-[#334155]"}`}
                  >
                    <MapPin size={16} className="inline mr-1 -mt-0.5" /> Pin on Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationTab("manual");
                      setLat(null);
                      setLng(null);
                      setAddress("");
                      setCity("");
                      setState("Tamil Nadu");
                      setPincode("");
                    }}
                    className={`pb-2 text-sm transition-colors ${locationTab === "manual" ? "border-b-2 border-primary text-primary-dark font-semibold" : "text-[#64748b] hover:text-[#334155]"}`}
                  >
                    <Pencil size={16} className="inline mr-1 -mt-0.5" /> Enter Manually
                  </button>
                </div>

                {locationTab === "map" ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {locLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <MapPin size={16} />
                        )}
                        Use My GPS
                      </button>
                      <span className="text-sm text-slate-500 font-medium">
                        or click on the map →
                      </span>
                    </div>

                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street Address (auto-filled from map)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all mb-3"
                    />

                    {lat && lng && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <p className="text-xs text-green-700 font-medium">
                          {address
                            ? `Location pinned: ${address}`
                            : `Location pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Address / Street
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full address or landmark"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          District <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="">Select District</option>
                          {TAMIL_NADU_DISTRICTS.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. Tamil Nadu"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 600001"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Upload Photos{" "}
                  <span className="text-slate-400 font-normal">
                    (optional, max 3)
                  </span>
                </label>

                {photos.length < 3 && (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload
                        size={20}
                        className="text-slate-500 group-hover:text-blue-500"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Drag & drop or{" "}
                      <span className="text-blue-600">browse</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      JPG, PNG, WEBP — max 5MB
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePhotos(e.target.files)}
                    />
                  </label>
                )}

                {previews.length > 0 && (
                  <div className="flex gap-4 mt-4 flex-wrap">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt={`preview ${i}`}
                          className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold bg-amber hover:bg-warning hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:hover:scale-100 transition-all"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Submit Issue"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: MAP */}
        <div className="lg:col-span-7">
          <div className="sticky top-6 flex flex-col gap-4">
            <div className="card overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-125">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {locationTab === "map" ? "Interactive Map" : "Map View"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {locationTab === "map"
                      ? "Click anywhere to pin exact location"
                      : "Visual reference only"}
                  </span>
                </div>
              </div>
              <div className="flex-1 relative z-0">
                <IssueMap
                  height="100%"
                  center={lat && lng ? [lat, lng] : [13.0827, 80.2707]}
                  zoom={lat && lng ? 15 : 10}
                  onMapClick={
                    locationTab === "map" ? handleMapClick : undefined
                  }
                  selectedPin={
                    locationTab === "map" && lat && lng ? [lat, lng] : null
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
