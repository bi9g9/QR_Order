import mongoose from "mongoose";

// Menu Model
const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: "อาหาร" },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true },
}, { timestamps: true });

// Order Model
const OrderItemSchema = new mongoose.Schema({
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
  name: String,
  price: Number,
  quantity: Number,
  note: { type: String, default: "" },
  cancelled: { type: Boolean, default: false },
});

const OrderSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  groupId: { type: String, default: "" },
  items: [OrderItemSchema],
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "paid", "request_bill", "cancelled"],
    default: "pending",
  },
  note: { type: String, default: "" },
}, { timestamps: true });

// User Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Table Model
const TableSchema = new mongoose.Schema({
  tableId: { type: String, required: true, unique: true },
  groupId: { type: String, default: () => Date.now().toString() },
}, { timestamps: true });

export const Menu = mongoose.models.Menu || mongoose.model("Menu", MenuSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Table = mongoose.models.Table || mongoose.model("Table", TableSchema);
