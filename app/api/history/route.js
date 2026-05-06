import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models";

export async function GET() {
  await connectDB();

  // ดึงเฉพาะออเดอร์ที่ชำระแล้ว
  const orders = await Order.find({ status: "paid" }).sort({ createdAt: -1 });

  // จัดกลุ่มตามวัน
  const grouped = {};
  for (const order of orders) {
    const date = new Date(order.createdAt).toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
    });
    if (!grouped[date]) grouped[date] = { date, total: 0, orders: 0, items: {} };
    grouped[date].total += order.total;
    grouped[date].orders += 1;

    for (const item of order.items) {
      if (item.cancelled) continue;
      if (!grouped[date].items[item.name]) {
        grouped[date].items[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      grouped[date].items[item.name].quantity += item.quantity;
      grouped[date].items[item.name].revenue += item.price * item.quantity;
    }
  }

  // แปลง items เป็น array เรียงจากขายมากไปน้อย
  const result = Object.values(grouped).map((day) => ({
    ...day,
    items: Object.values(day.items).sort((a, b) => b.quantity - a.quantity),
  }));

  return NextResponse.json(result);
}
