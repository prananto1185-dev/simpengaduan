import React from "react";
import { Bell, X, Sparkles, CheckCircle2, AlertOctagon, Flame } from "lucide-react";
import { PushNotification } from "../types";

interface NotificationToastProps {
  notification: PushNotification | null;
  onClose: () => void;
  onClick: (complaintId?: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in">
      <div
        onClick={() => onClick(notification.complaintId)}
        className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 cursor-pointer hover:border-blue-500 transition relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500" />
        
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
              {notification.type === "urgent_case" ? (
                <Flame className="w-5 h-5 text-rose-500" />
              ) : notification.type === "ai_alert" ? (
                <Sparkles className="w-5 h-5 text-amber-400" />
              ) : (
                <Bell className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div className="space-y-0.5">
              <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-400 transition">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {notification.message}
              </p>
              <span className="text-[10px] text-slate-400 font-mono block pt-1">
                {notification.timestamp} • Klik untuk melihat
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
