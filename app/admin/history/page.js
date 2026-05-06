"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./history.module.css";

export default function HistoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const toggle = (date) => setExpanded((prev) => ({ ...prev, [date]: !prev[date] }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📊 รายงานรายวัน</h1>
        <Link href="/admin" className={styles.back}>← กลับ</Link>
      </header>

      <div className={styles.content}>
        {loading && <p className={styles.empty}>กำลังโหลด...</p>}
        {!loading && data.length === 0 && <p className={styles.empty}>ยังไม่มีข้อมูล</p>}

        {data.map((day) => (
          <div key={day.date} className={styles.card}>
            <div className={styles.cardHeader} onClick={() => toggle(day.date)}>
              <div>
                <div className={styles.date}>{day.date}</div>
                <div className={styles.summary}>{day.orders} ออเดอร์</div>
              </div>
              <div className={styles.right}>
                <span className={styles.total}>฿{day.total.toLocaleString()}</span>
                <span className={styles.arrow}>{expanded[day.date] ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded[day.date] && (
              <div className={styles.items}>
                <div className={styles.itemHeader}>
                  <span>เมนู</span>
                  <span>จำนวน</span>
                  <span>รายได้</span>
                </div>
                {day.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <span>{item.name}</span>
                    <span>{item.quantity} ชิ้น</span>
                    <span>฿{item.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
