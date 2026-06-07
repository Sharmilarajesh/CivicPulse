"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/axios";
import { StatusBadge } from "@/components/StatusBadge";
import { timeAgo } from "@/utils/timeAgo";
import { useAuth } from "@/context/AuthContext";
import { categoryConfig } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Building2,
  UserCheck,
  ThumbsUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Zap,
  Droplets,
  Wind,
  Flag,
} from "lucide-react";

const IssueMap = dynamic(() => import("@/components/IssueMap"), { ssr: false });

const icons = { AlertTriangle, Trash2, Zap, Droplets, Wind, Flag };

export default function IssueDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignedOfficerId, setAssignedOfficerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const { data } = await api.get(`/issues/${params.id}`);
        setIssue(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [params.id]);

  const handleUpvote = async () => {
    if (!user || user.role !== "citizen") return;
    setUpvoting(true);
    try {
      const { data } = await api.patch(`/issues/${params.id}/upvote`);
      setIssue((prev: any) => ({
        ...prev,
        upvotes: prev.upvotes.includes(user.id)
          ? prev.upvotes.filter((id: string) => id !== user.id)
          : [...prev.upvotes, user.id],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleFetchOfficers = async () => {
    try {
      const { data } = await api.get('/users/officers');
      setOfficers(Array.isArray(data) ? data : data.officers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    if (officers.length === 0) handleFetchOfficers();
  };

  const handleAssign = async (officerId: string) => {
    setAssigning(true);
    try {
      const { data } = await api.patch(`/issues/${params.id}/assign`, { officerId });
      setIssue(data.issue);
      setAssignedOfficerId(officerId);
      setTimeout(() => {
        setAssignedOfficerId(null);
        setShowAssignModal(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Error assigning officer. The issue might already be resolved.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 max-w-3xl mx-auto space-y-6">
        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse mb-8" />
        <div className="w-3/4 h-10 rounded bg-slate-200 animate-pulse mb-4" />
        <div className="w-1/4 h-6 rounded bg-slate-200 animate-pulse mb-8" />
        <div className="w-full h-64 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );

  if (!issue) return <div className="p-10 text-center">Issue not found</div>;

  const config =
    categoryConfig[issue.category as keyof typeof categoryConfig] ||
    categoryConfig.other;
  const CategoryIcon = config.Icon;
  const hasUpvoted = user && (issue.upvotes || []).includes(user.id);

  const statuses = [
    "reported",
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
  ];
  const currentIndex = statuses.indexOf(issue.status);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto fade-in">
      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 modal-in">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-red-400"
          >
            <X size={32} />
          </button>
          <img
            src={activePhoto}
            alt="Full screen"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex gap-3">
          {(user?.role === 'admin' || user?.role === 'super_admin') && issue.status !== 'resolved' && (
            <button
              onClick={handleOpenAssignModal}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <UserCheck size={16} /> Assign Officer
            </button>
          )}
          
          {user?.role === 'officer' && (
            <button
              onClick={() => router.push('/officer')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckCircle2 size={16} /> Update Status in Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="card p-6 md:p-8 mb-8 fade-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] pointer-events-none" />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge status={issue.status} />
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
            <CategoryIcon size={14} /> {config.label}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {issue.title}
        </h1>

        <p className="text-slate-500 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
            {issue.reportedBy?.name?.charAt(0) || '?'}
          </span>
          Reported by{" "}
          <span className="font-semibold text-slate-700">
            {issue.reportedBy?.name || 'Unknown Citizen'}
          </span>{" "}
          • {timeAgo(issue.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Details */}
          <div
            className="card p-6 md:p-8 fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Description
            </h3>
            <p className="text-slate-600 leading-relaxed mb-8 whitespace-pre-wrap">
              {issue.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={18} className="text-slate-400" />
                <span className="text-sm font-medium">
                  Area: <span className="text-slate-800">{issue.ward}</span>
                </span>
              </div>

              {issue.assignedTo && (
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck size={18} className="text-blue-500" />
                  <span className="text-sm font-medium">
                    Officer:{" "}
                    <span className="text-slate-800">
                      {issue.assignedTo.name}
                    </span>
                  </span>
                </div>
              )}

              <button
                onClick={handleUpvote}
                disabled={upvoting || user?.role !== "citizen"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ml-auto
                  ${hasUpvoted ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
                  ${user?.role !== "citizen" ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <ThumbsUp
                  size={16}
                  className={hasUpvoted ? "fill-blue-500 text-blue-500" : ""}
                />
                {(issue.upvotes || []).length} Upvotes
              </button>
            </div>
          </div>

          {/* Photos */}
          {issue.photos && issue.photos.length > 0 && (
            <div className="fade-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Photos</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {issue.photos.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    onClick={() => {
                      setActivePhoto(url);
                      setLightboxOpen(true);
                    }}
                    className="w-48 h-48 object-cover rounded-2xl cursor-pointer border border-slate-200 hover:scale-105 hover:shadow-lg transition-all shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolution Note */}
          {issue.status === "resolved" && issue.resolutionNote && (
            <div
              className="bg-green-50 border border-green-200 p-6 md:p-8 rounded-2xl fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-900">
                  Resolution Details
                </h3>
              </div>
              <p className="text-green-800 mb-6">{issue.resolutionNote}</p>
              {issue.resolutionPhoto && (
                <img
                  src={issue.resolutionPhoto}
                  alt="Resolution"
                  onClick={() => {
                    setActivePhoto(issue.resolutionPhoto);
                    setLightboxOpen(true);
                  }}
                  className="w-full max-w-sm rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                />
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Status Timeline */}
          <div className="card p-6 fade-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-base font-bold text-slate-800 mb-6">
              Live Tracking
            </h3>
            <div className="space-y-0">
              {statuses.map((status, index) => {
                const statusLabels = [
                  "Issue Reported",
                  "Under Review",
                  "Officer Assigned",
                  "Work In Progress",
                  "Resolved",
                ];
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isPending = index > currentIndex;
                const isLast = index === statuses.length - 1;

                return (
                  <div key={status} className="relative flex gap-4">
                    {/* Icon & Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shrink-0 transition-all duration-500
                        ${isCompleted ? "border-emerald-500 bg-emerald-50 text-emerald-600" : ""}
                        ${isCurrent ? "border-blue-600 bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]" : ""}
                        ${isPending ? "border-slate-200 bg-slate-50" : ""}
                      `}
                      >
                        {isCompleted && <CheckCircle2 size={16} />}
                        {isCurrent && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
                        {isPending && <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                      </div>
                      
                      {!isLast && (
                        <div 
                          className={`w-0.5 h-8 my-0.5 rounded-full transition-all duration-500
                          ${isCompleted ? "bg-emerald-500" : "bg-slate-100"}`}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <div className="pt-1 pb-3 flex-1">
                      <p
                        className={`font-bold transition-all text-sm
                          ${isCompleted ? "text-slate-800" : ""}
                          ${isCurrent ? "text-blue-700 text-base" : ""}
                          ${isPending ? "text-slate-400" : ""}
                        `}
                      >
                        {statusLabels[index]}
                      </p>
                      {isCurrent && (
                        <p className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">
                          Current Status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map */}
          <div
            className="card overflow-hidden fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <IssueMap
              center={[issue.location.lat, issue.location.lng]}
              zoom={15}
              height="250px"
              issues={[issue]}
            />
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-700">
                {issue.location.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm modal-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-1 text-slate-800">Assign Officer</h2>
            <p className="text-sm text-slate-500 mb-6 truncate">{issue.title}</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {officers.map(off => {
                const isAssigned = assignedOfficerId === off._id || issue.assignedTo?._id === off._id;
                return (
                  <div key={off._id} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${isAssigned ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{off.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{off.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          Area: <span className="px-2.5 py-0.5 bg-blue-100/80 text-blue-800 rounded-lg font-extrabold border border-blue-200 text-xs shadow-sm">{off.ward}</span>
                        </p>
                      </div>
                    </div>
                    {isAssigned ? (
                      <button disabled className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 size={16} /> Assigned
                      </button>
                    ) : (
                      <button onClick={() => { if(window.confirm(`Are you sure you want to assign this issue to ${off.name}?`)) handleAssign(off._id) }} disabled={assigning} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
                        Assign
                      </button>
                    )}
                  </div>
                )
              })}
              {officers.length === 0 && (
                <div className="text-center p-6 text-slate-500 font-medium">Loading officers...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Adding an X import locally since it's missing from lucide-react import
import { X } from "lucide-react";
