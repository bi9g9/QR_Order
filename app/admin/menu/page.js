"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./menu.module.css";

const EMPTY = { name: "", price: "", category: "อาหาร", image: "", available: true };

export default function MenuAdmin() {
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");

  const fetchMenus = async () => {
    const res = await fetch("/api/menu");
    setMenus(await res.json());
  };

  useEffect(() => { fetchMenus(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price) };
    if (editId) {
      await fetch(`/api/menu/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showMsg("แก้ไขเมนูแล้ว");
      setEditId(null);
    } else {
      await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showMsg("เพิ่มเมนูแล้ว");
    }
    setForm(EMPTY);
    fetchMenus();
  };

  const handleEdit = (menu) => {
    setEditId(menu._id);
    setForm({ name: menu.name, price: menu.price, category: menu.category, image: menu.image || "", available: menu.available });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบเมนูนี้?")) return;
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    showMsg("ลบเมนูแล้ว");
    fetchMenus();
  };

  const toggleAvailable = async (menu) => {
    await fetch(`/api/menu/${menu._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...menu, available: !menu.available }),
    });
    fetchMenus();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🍜 จัดการเมนู</h1>
        <Link href="/admin" className={styles.back}>← กลับ</Link>
      </header>

      {msg && <div className={styles.toast}>{msg}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>{editId ? "✏️ แก้ไขเมนู" : "➕ เพิ่มเมนูใหม่"}</h2>

        <input required placeholder="ชื่อเมนู" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="number" placeholder="ราคา (บาท)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="หมวดหมู่ เช่น อาหาร, เครื่องดื่ม" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />

        <div className={styles.imageRow}>
          <input
            placeholder="URL รูปภาพ เช่น https://..."
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          {form.image && (
            <img src={form.image} alt="preview" className={styles.preview}
              onError={(e) => e.target.style.display = "none"}
              onLoad={(e) => e.target.style.display = "block"}
            />
          )}
        </div>

        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          มีให้สั่ง
        </label>

        <div className={styles.formBtns}>
          <button type="submit" className={styles.saveBtn}>{editId ? "💾 บันทึก" : "➕ เพิ่มเมนู"}</button>
          {editId && (
            <button type="button" className={styles.cancelBtn} onClick={() => { setEditId(null); setForm(EMPTY); }}>
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {menus.map((menu) => (
          <div key={menu._id} className={`${styles.menuRow} ${!menu.available ? styles.unavailable : ""}`}>
            {menu.image
              ? <img src={menu.image} alt={menu.name} className={styles.thumb} />
              : <div className={styles.thumbEmpty}>🍽️</div>
            }
            <div className={styles.menuInfo}>
              <span className={styles.menuName}>{menu.name}</span>
              <span className={styles.menuCat}>{menu.category}</span>
            </div>
            <span className={styles.menuPrice}>฿{menu.price}</span>
            <div className={styles.actions}>
              <button className={styles.toggleBtn} onClick={() => toggleAvailable(menu)}>
                {menu.available ? "ปิด" : "เปิด"}
              </button>
              <button className={styles.editBtn} onClick={() => handleEdit(menu)}>แก้ไข</button>
              <button className={styles.delBtn} onClick={() => handleDelete(menu._id)}>ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
