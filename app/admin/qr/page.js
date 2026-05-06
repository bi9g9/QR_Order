"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import styles from "./qr.module.css";

export default function QRPage() {
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState("");
  const [qrUrls, setQrUrls] = useState({});
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data);
  };

  useEffect(() => {
    if (!baseUrl || tables.length === 0) return;
    const generate = async () => {
      const urls = {};
      for (const t of tables) {
        urls[t] = await QRCode.toDataURL(`${baseUrl}/table/${t}`, { width: 200, margin: 2 });
      }
      setQrUrls(urls);
    };
    generate();
  }, [tables, baseUrl]);

  const addTable = async () => {
    const t = newTable.trim().toUpperCase();
    if (!t || tables.includes(t)) return;
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: t }),
    });
    if (res.ok) {
      setTables((prev) => [...prev, t]);
      setNewTable("");
    }
  };

  const removeTable = async (t) => {
    await fetch("/api/tables", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: t }),
    });
    setTables((prev) => prev.filter((x) => x !== t));
  };

  const downloadQR = (tableId, url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-Table-${tableId}.png`;
    a.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📱 QR Code โต๊ะ</h1>
        <Link href="/admin" className={styles.back}>← กลับ</Link>
      </header>

      <div className={styles.addBar}>
        <input
          placeholder="เพิ่มโต๊ะ เช่น C1"
          value={newTable}
          onChange={(e) => setNewTable(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTable()}
        />
        <button onClick={addTable}>+ เพิ่ม</button>
      </div>

      <div className={styles.grid}>
        {tables.map((t) => (
          <div key={t} className={styles.card}>
            <div className={styles.tableLabel}>โต๊ะ {t}</div>
            {qrUrls[t] && <img src={qrUrls[t]} alt={`QR โต๊ะ ${t}`} className={styles.qrImg} />}
            <p className={styles.url}>{baseUrl}/table/{t}</p>
            <div className={styles.cardBtns}>
              <button className={styles.dlBtn} onClick={() => downloadQR(t, qrUrls[t])}>⬇ ดาวน์โหลด</button>
              <button className={styles.rmBtn} onClick={() => removeTable(t)}>ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
