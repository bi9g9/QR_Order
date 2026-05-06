import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Table } from "@/lib/models";

export async function GET() {
  await connectDB();
  const tables = await Table.find().sort({ createdAt: 1 });
  return NextResponse.json(tables.map((t) => t.tableId));
}

export async function POST(req) {
  const { tableId } = await req.json();
  if (!tableId) return NextResponse.json({ error: "tableId required" }, { status: 400 });
  await connectDB();
  try {
    await Table.create({ tableId: tableId.trim().toUpperCase() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "มีโต๊ะนี้แล้ว" }, { status: 400 });
  }
}

export async function DELETE(req) {
  const { tableId } = await req.json();
  await connectDB();
  await Table.deleteOne({ tableId });
  return NextResponse.json({ ok: true });
}
