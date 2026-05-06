import { connectDB } from "@/lib/mongodb";
import { Order, Table } from "@/lib/models";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  await connectDB();
  const body = await req.json();

  // ยกเลิกทีละ item: { cancelItemIndex: 2 }
  if (body.cancelItemIndex !== undefined) {
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
    order.items[body.cancelItemIndex].cancelled = true;
    order.total = order.items
      .filter((i) => !i.cancelled)
      .reduce((s, i) => s + i.price * i.quantity, 0);
    await order.save();
    return NextResponse.json(order);
  }

  // แก้จำนวน item: { updateItemIndex: 2, quantity: 1 }
  if (body.updateItemIndex !== undefined) {
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
    order.items[body.updateItemIndex].quantity = body.quantity;
    order.total = order.items
      .filter((i) => !i.cancelled)
      .reduce((s, i) => s + i.price * i.quantity, 0);
    await order.save();
    return NextResponse.json(order);
  }

  const order = await Order.findByIdAndUpdate(params.id, { $set: body }, { new: true });

  // ถ้า paid — เช็คว่าทุกออเดอร์ใน group นี้ paid/cancelled หมดแล้วไหม
  if (body.status === "paid" && order?.groupId) {
    const remaining = await Order.countDocuments({
      groupId: order.groupId,
      status: { $nin: ["paid", "cancelled"] },
    });
    if (remaining === 0) {
      // reset groupId ใน Table = พร้อมรับลูกค้าใหม่
      await Table.updateOne(
        { tableId: order.tableId },
        { groupId: Date.now().toString() }
      );
    }
  }

  return NextResponse.json(order);
}

export async function DELETE(_, { params }) {
  await connectDB();
  await Order.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
