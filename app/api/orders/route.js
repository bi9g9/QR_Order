import { connectDB } from "@/lib/mongodb";
import { Order, Table } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");
  const status = searchParams.get("status");

  const filter = {};
  if (tableId) filter.tableId = tableId;
  if (status) filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const total = body.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ดึง groupId ปัจจุบันจาก Table
  const table = await Table.findOne({ tableId: body.tableId });
  const groupId = table?.groupId || Date.now().toString();

  const order = await Order.create({ ...body, total, groupId });
  return NextResponse.json(order, { status: 201 });
}
