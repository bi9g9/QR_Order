import { connectDB } from "@/lib/mongodb";
import { Menu } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const menus = await Menu.find({}).sort({ category: 1, name: 1 });
  return NextResponse.json(menus);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const menu = await Menu.create(body);
  return NextResponse.json(menu, { status: 201 });
}
