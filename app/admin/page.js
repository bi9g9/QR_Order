"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

const STATUS_FLOW = {
  pending: "preparing",
  preparing: "ready",
  ready: "paid",
  request_bill: "paid",
};

const STATUS_LABEL = {
  pending: "⏳ รอรับ",
  preparing: "👨‍🍳 กำลังทำ",
  ready: "✅ พร้อมเสิร์ฟ",
  request_bill: "🧾 ขอชำระ",
  paid: "💚 ชำระแล้ว",
  cancelled: "❌ ยกเลิกแล้ว",
};

const STATUS_COLOR = {
  pending: "#f59e0b",
  preparing: "#3b82f6",
  ready: "#10b981",
  request_bill: "#7c3aed",
  paid: "#9ca3af",
  cancelled: "#ef4444",
};

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <p className={styles.modalMsg}>{message}</p>
        <div className={styles.modalBtns}>
          <button className={styles.modalCancel} onClick={onCancel}>ยกเลิก</button>
          <button className={styles.modalConfirm} onClick={onConfirm}>ยืนยัน</button>
        </div>
      </div>
    </div>
  );
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function sendBrowserNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("🍳 ออเดอร์ใหม่", { body: message, icon: "/favicon.ico" });
  }
}

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("active");
  const knownIds = useRef(null);
  const [modal, setModal] = useState(null); // { message, onConfirm }

  const confirm = (message, onConfirm) => setModal({ message, onConfirm });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/admin/login");
  }, [status, router]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (knownIds.current !== null) {
      const newOrders = data.filter((o) => !knownIds.current.has(o._id));
      if (newOrders.length > 0) {
        playBeep();
        const tables = [...new Set(newOrders.map((o) => o.tableId))].join(", ");
        sendBrowserNotification(`โต๊ะ ${tables} สั่งอาหารใหม่`);
      }
    }
    knownIds.current = new Set(data.map((o) => o._id));
    setOrders(data);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (status === "loading" || status === "unauthenticated") return null;

  const updateStatus = async (id, nextStatus) => {
    if (nextStatus === "paid") {
      confirm("ยืนยันการชำระเงินออเดอร์นี้?", async () => {
        await fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        fetchOrders();
      });
      return;
    }
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchOrders();
  };

  const cancelOrder = async (id) => {
    confirm("ยืนยันการยกเลิกออเดอร์นี้?", async () => {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      fetchOrders();
    });
  };

  const cancelItem = async (orderId, itemIndex) => {
    confirm("ยืนยันการยกเลิกรายการนี้?", async () => {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelItemIndex: itemIndex }),
      });
      fetchOrders();
    });
  };

  const updateItemQty = async (orderId, itemIndex, newQty) => {
    if (newQty < 1) return;
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateItemIndex: itemIndex, quantity: newQty }),
    });
    fetchOrders();
  };

  const filtered = orders.filter((o) => {
    if (filter === "active") return o.status !== "paid" && o.status !== "cancelled";
    if (filter === "paid") return o.status === "paid";
    return true;
  });

  // จัดกลุ่มตาม tableId + groupId
  const grouped = filtered.reduce((acc, o) => {
    const key = `${o.tableId}__${o.groupId || o._id}`;
    if (!acc[key]) acc[key] = { tableId: o.tableId, groupId: o.groupId, orders: [] };
    acc[key].orders.push(o);
    return acc;
  }, {});

  const requestBillTables = [...new Set(
    orders.filter((o) => o.status === "request_bill").map((o) => o.tableId)
  )];

  return (
    <div className={styles.container}>
      {modal && (
        <ConfirmModal
          message={modal.message}
          onConfirm={() => { modal.onConfirm(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
      <header className={styles.header}>
        <h1>🍳 Kitchen / Admin</h1>
        <div className={styles.headerLinks}>
          <Link href="/admin/menu" className={styles.menuLink}>จัดการเมนู</Link>
          <Link href="/admin/qr" className={styles.menuLink}>QR Code</Link>
          <Link href="/admin/history" className={styles.menuLink}>รายงาน</Link>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/admin/login", redirect: true })}>ออกจากระบบ</button>
        </div>
      </header>
      {requestBillTables.length > 0 && (
        <div className={styles.alertBar}>
          🧾 โต๊ะขอชำระเงิน: {requestBillTables.join(", ")}
        </div>
      )}

      <div className={styles.content}>
        {Object.keys(grouped).length === 0 && (
          <p className={styles.empty}>ไม่มีออเดอร์</p>
        )}
        {Object.entries(grouped).map(([key, group]) => {
          const { tableId, orders: tableOrders } = group;
          const tableTotal = tableOrders.filter(o => o.status !== "paid" && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
          const hasRequestBill = tableOrders.some((o) => o.status === "request_bill");
          const groupTimestamp = group.groupId ? parseInt(group.groupId) : null;
          const seatedSince = groupTimestamp && !isNaN(groupTimestamp)
            ? new Date(groupTimestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
            : null;
          return (
            <div key={key} className={`${styles.tableGroup} ${hasRequestBill ? styles.highlight : ""}`}>
              <div className={styles.tableHeader}>
                <div>
                  <span className={styles.tableId}>โต๊ะ {tableId}</span>
                  {seatedSince && <span className={styles.seatedTime}>🕐 นั่งตั้งแต่ {seatedSince}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {tableTotal > 0 && <span className={styles.tableTotal}>฿{tableTotal.toLocaleString()}</span>}
                  {hasRequestBill && <span className={styles.billBadge}>ขอชำระเงิน</span>}
                </div>
              </div>
              {tableOrders.map((order) => (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <span
                      className={styles.statusBadge}
                      style={{ background: STATUS_COLOR[order.status] }}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                    <span className={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleTimeString("th-TH")}
                    </span>
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} className={`${styles.item} ${item.cancelled ? styles.itemCancelled : ""}`}>
                      <span className={styles.itemName}>{item.name}{item.cancelled && " (ยกเลิก)"}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!item.cancelled && order.status !== "paid" && order.status !== "cancelled" ? (
                          <div className={styles.qtyControl}>
                            <button onClick={() => updateItemQty(order._id, i, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateItemQty(order._id, i, item.quantity + 1)}>+</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>× {item.quantity}</span>
                        )}
                        <span className={styles.itemPrice}>
                          {item.cancelled ? <s>฿{(item.price * item.quantity).toLocaleString()}</s> : `฿${(item.price * item.quantity).toLocaleString()}`}
                        </span>
                        {!item.cancelled && order.status !== "paid" && order.status !== "cancelled" && (
                          <button className={styles.itemCancelBtn} onClick={() => cancelItem(order._id, i)}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {order.note && <p className={styles.note}>📝 {order.note}</p>}
                  <div className={styles.orderActions}>
                    {STATUS_FLOW[order.status] && (
                      <button
                        className={styles.nextBtn}
                        style={{ background: STATUS_COLOR[STATUS_FLOW[order.status]] }}
                        onClick={() => updateStatus(order._id, STATUS_FLOW[order.status])}
                      >
                        → {STATUS_LABEL[STATUS_FLOW[order.status]]}
                      </button>
                    )}
                    {order.status !== "paid" && order.status !== "cancelled" && (
                      <button className={styles.cancelBtn} onClick={() => cancelOrder(order._id)}>
                        ✕ ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
