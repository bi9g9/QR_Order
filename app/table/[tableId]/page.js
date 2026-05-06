"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import styles from "./table.module.css";

export default function TablePage() {
  const { tableId } = useParams();
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("menu");
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [valid, setValid] = useState(null); // null=loading, true=valid, false=invalid

  const fetchMenus = useCallback(async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setMenus(data.filter((m) => m.available));
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/orders?tableId=${tableId}`);
    const data = await res.json();
    setOrders(data.filter((o) => o.status !== "paid"));
  }, [tableId]);

  useEffect(() => {
    fetch("/api/tables").then((r) => r.json()).then((tables) => {
      setValid(tables.includes(tableId.toUpperCase()) || tables.includes(tableId));
    });
  }, [tableId]);

  useEffect(() => {
    if (!valid) return;
    fetchMenus();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [valid, fetchMenus, fetchOrders]);

  if (valid === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#94a3b8" }}>กำลังโหลด...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", gap: "12px" }}>
        <div style={{ fontSize: "3rem" }}>🚫</div>
        <h2 style={{ color: "#1e293b", margin: 0 }}>ไม่พบโต๊ะนี้</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>กรุณาสแกน QR Code จากโต๊ะของท่าน</p>
      </div>
    );
  }

  // เพิ่มในตะกร้า
  const addToCart = (menu) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.menuId === menu._id);
      if (exist) return prev.map((i) => i.menuId === menu._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuId: menu._id, name: menu.name, price: menu.price, image: menu.image || "", quantity: 1, note: "" }];
    });
  };

  const decreaseCart = (menuId) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.menuId === menuId);
      if (exist?.quantity === 1) return prev.filter((i) => i.menuId !== menuId);
      return prev.map((i) => i.menuId === menuId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const removeFromCart = (menuId) => setCart((prev) => prev.filter((i) => i.menuId !== menuId));

  const updateNote = (menuId, note) => {
    setCart((prev) => prev.map((i) => i.menuId === menuId ? { ...i, note } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const billTotal = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, items: cart }),
    });
    setCart([]);
    setMsg("สั่งอาหารเรียบร้อยแล้ว");
    setTimeout(() => setMsg(""), 3000);
    fetchOrders();
    setTab("bill");
    setLoading(false);
  };

  const requestBill = async () => {
    setLoading(true);
    for (const o of orders) {
      if (o.status !== "request_bill" && o.status !== "paid") {
        await fetch(`/api/orders/${o._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "request_bill" }),
        });
      }
    }
    setMsg("แจ้งพนักงานแล้ว กรุณารอสักครู่");
    setTimeout(() => setMsg(""), 4000);
    fetchOrders();
    setLoading(false);
  };

  const categories = [...new Set(menus.map((m) => m.category))];
  const displayCategory = activeCategory || categories[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🍽️ โต๊ะ {tableId}</h1>
        <div className={styles.tabs}>
          <button className={tab === "menu" ? styles.activeTab : ""} onClick={() => setTab("menu")}>เมนู</button>
          <button className={tab === "bill" ? styles.activeTab : ""} onClick={() => setTab("bill")}>
            บิล {billTotal > 0 && <span className={styles.badge}>฿{billTotal.toLocaleString()}</span>}
          </button>
        </div>
      </header>

      {msg && <div className={styles.toast}>{msg}</div>}

      {/* ===== TAB: เมนู ===== */}
      {tab === "menu" && (
        <div className={styles.menuSection}>
          {/* แถบหมวดหมู่ */}
          <div className={styles.categoryBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={activeCategory === cat || (!activeCategory && cat === categories[0]) ? styles.activeCat : styles.catBtn}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.menuGrid}>
            {menus.filter((m) => m.category === displayCategory).map((menu) => {
                  const inCart = cart.find((i) => i.menuId === menu._id);
                  return (
                    <div key={menu._id} className={styles.menuCard}>
                      {menu.image
                        ? <img src={menu.image} alt={menu.name} className={styles.menuImg} />
                        : <div className={styles.menuImgPlaceholder}>🍽️</div>
                      }
                      <div className={styles.menuInfo}>
                        <span className={styles.menuName}>{menu.name}</span>
                        <span className={styles.menuPrice}>฿{menu.price}</span>
                      </div>
                      <div className={styles.qtyControl}>
                        {inCart ? (
                          <>
                            <button onClick={() => decreaseCart(menu._id)}>−</button>
                            <span>{inCart.quantity}</span>
                            <button onClick={() => addToCart(menu)}>+</button>
                          </>
                        ) : (
                          <button className={styles.addBtn} onClick={() => addToCart(menu)}>+ เพิ่ม</button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {cartCount > 0 && (
            <div className={styles.cartFloating} onClick={() => setTab("cart")}>
              <span>🛒 ดูตะกร้า ({cartCount} รายการ)</span>
              <span>฿{cartTotal.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: ตะกร้า ===== */}
      {tab === "cart" && (
        <div className={styles.cartSection}>
          <h2>🛒 ตะกร้าของฉัน</h2>

          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>ยังไม่มีรายการ</p>
              <button className={styles.goMenuBtn} onClick={() => setTab("menu")}>← กลับไปเลือกเมนู</button>
            </div>
          ) : (
            <>
              <div className={styles.cartList}>
                {cart.map((item) => (
                  <div key={item.menuId} className={styles.cartItem}>
                    <div className={styles.cartItemTop}>
                      {item.image
                        ? <img src={item.image} alt={item.name} className={styles.cartItemImg} />
                        : <div className={styles.cartItemImgEmpty}>🍽️</div>
                      }
                      <span className={styles.cartItemName}>{item.name}</span>
                      <button className={styles.removeBtn} onClick={() => removeFromCart(item.menuId)}>✕</button>
                    </div>
                    <div className={styles.cartItemMid}>
                      <div className={styles.qtyControl}>
                        <button onClick={() => decreaseCart(item.menuId)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => addToCart({ _id: item.menuId, name: item.name, price: item.price })}>+</button>
                      </div>
                      <span className={styles.cartItemPrice}>฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <input
                      className={styles.noteInput}
                      placeholder="หมายเหตุ เช่น ไม่เผ็ด, ไม่ใส่ผัก..."
                      value={item.note}
                      onChange={(e) => updateNote(item.menuId, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.cartSummary}>
                <span>รวม</span>
                <span className={styles.cartSummaryTotal}>฿{cartTotal.toLocaleString()}</span>
              </div>

              <button className={styles.orderBtn} onClick={submitOrder} disabled={loading}>
                {loading ? "กำลังส่ง..." : "✅ สั่งอาหาร"}
              </button>
              <button className={styles.backMenuBtn} onClick={() => setTab("menu")}>← เพิ่มรายการ</button>
            </>
          )}
        </div>
      )}

      {/* ===== TAB: บิล ===== */}
      {tab === "bill" && (
        <div className={styles.billSection}>
          <h2>🧾 รายการที่สั่ง</h2>
          {orders.length === 0 ? (
            <p className={styles.empty}>ยังไม่มีรายการ</p>
          ) : (
            orders.map((order) => (
              <div key={order._id} className={`${styles.orderCard} ${order.status === "cancelled" ? styles.cancelledCard : ""}`}>
                <div className={styles.orderMeta}>
                  <span className={styles[`status_${order.status}`]}>{statusLabel(order.status)}</span>
                  <span className={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString("th-TH")}</span>
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className={`${styles.billItem} ${item.cancelled ? styles.cancelledItem : ""}`}>
                    <div>
                      <span>{item.name} × {item.quantity}{item.cancelled && " (ยกเลิก)"}</span>
                      {item.note && <p className={styles.itemNote}>📝 {item.note}</p>}
                    </div>
                    <span>
                      {item.cancelled
                        ? <s>฿{(item.price * item.quantity).toLocaleString()}</s>
                        : `฿${(item.price * item.quantity).toLocaleString()}`}
                    </span>
                  </div>
                ))}
                {order.status !== "cancelled" && (
                  <div className={styles.orderSubtotal}>รวม ฿{order.total.toLocaleString()}</div>
                )}
              </div>
            ))
          )}

          <div className={styles.billTotal}>
            <span>ยอดรวมทั้งหมด</span>
            <span>฿{billTotal.toLocaleString()}</span>
          </div>

          {orders.some((o) => o.status !== "request_bill" && o.status !== "paid" && o.status !== "cancelled") && orders.length > 0 && (
            <button className={styles.billBtn} onClick={requestBill} disabled={loading}>
              🧾 เรียกพนักงานคิดเงิน
            </button>
          )}
          {orders.length > 0 && orders.every((o) => o.status === "request_bill" || o.status === "cancelled") && (
            <p className={styles.waitMsg}>⏳ แจ้งพนักงานแล้ว กรุณารอสักครู่...</p>
          )}
        </div>
      )}
    </div>
  );
}

function statusLabel(status) {
  const map = {
    pending: "⏳ รอรับออเดอร์",
    preparing: "👨‍🍳 กำลังทำ",
    ready: "✅ พร้อมเสิร์ฟ",
    request_bill: "🧾 ขอชำระเงิน",
    paid: "💚 ชำระแล้ว",
    cancelled: "❌ ยกเลิกแล้ว",
  };
  return map[status] || status;
}
