"use client";

import { Issue, categoryConfig } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { timeAgo } from "@/utils/timeAgo";
import {
  MapPin,
  ThumbsUp,
  Clock,
  AlertTriangle,
  Trash2,
  Zap,
  Droplets,
  Wind,
  Flag,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const icons = {
  AlertTriangle,
  Trash2,
  Zap,
  Droplets,
  Wind,
  Flag,
};

interface IssueCardProps {
  issue: Issue;
  index?: number;
}

export const IssueCard = ({
  issue: initialIssue,
  index = 0,
}: IssueCardProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [issue, setIssue] = useState(initialIssue);
  const [upvoting, setUpvoting] = useState(false);

  const config =
    categoryConfig[issue.category as keyof typeof categoryConfig] ||
    categoryConfig.other;
  const CategoryIcon = config.Icon;

  const hasUpvoted = user ? (issue.upvotes || []).includes(user.id) : false;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }

    setUpvoting(true);
    try {
      const { data } = await api.patch(`/issues/${issue._id}/upvote`);
      setIssue((prev) => ({
        ...prev,
        upvotes: hasUpvoted
          ? prev.upvotes.filter((id) => id !== user.id)
          : [...prev.upvotes, user.id],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/issues/${issue._id}`)}
      className="card p-5 cursor-pointer fade-up flex flex-col h-full bg-white group hover:border-blue-300"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 ${config.color}`}>
            <CategoryIcon size={16} />
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {config.label}
          </span>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      <div className="flex-1 flex gap-4">
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {issue.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {issue.description}
          </p>
        </div>

        {issue.photos && issue.photos.length > 0 && (
          <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative">
            <img
              src={issue.photos[0]}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[50%]">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{issue.location.address}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              hasUpvoted
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {upvoting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ThumbsUp
                size={14}
                className={hasUpvoted ? "fill-blue-600" : ""}
              />
            )}
            <span className={hasUpvoted ? "font-bold" : ""}>
              {(issue.upvotes || []).length}
            </span>
          </button>

          <div className="flex items-center gap-1.5 ml-2">
            <Clock size={14} />
            <span>{timeAgo(issue.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
