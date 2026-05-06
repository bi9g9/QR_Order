import { connectDB } from "@/lib/mongodb";
import { Menu } from "@/lib/models";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const menu = await Menu.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(menu);
}

export async function DELETE(_, { params }) {
  await connectDB();
  await Menu.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
