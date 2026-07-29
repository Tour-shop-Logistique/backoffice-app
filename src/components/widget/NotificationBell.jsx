import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, Wallet } from "lucide-react";
import {
  selectInAppNotifications,
  selectInAppUnreadCount,
  notificationRead,
  allNotificationsRead,
} from "../../redux/slices/inAppNotificationsSlice";

const ICONS_BY_ACTION = {
  payment_confirmed: Wallet,
};

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const notifications = useSelector(selectInAppNotifications);
  const unreadCount = useSelector(selectInAppUnreadCount);

  const handleRowClick = (item) => {
    if (!item.read) dispatch(notificationRead(item.id));
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
              <span className="text-[10px] font-semibold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(allNotificationsRead())}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucune notification pour le moment</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = ICONS_BY_ACTION[item.action] || Bell;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !item.read ? "bg-indigo-50/50" : ""
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{item.title}</span>
                          {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(item.createdAt)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
