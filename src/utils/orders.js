import { statusLabels } from "../config";

export function asList(value) {
  return Array.isArray(value) ? value : [];
}

export function money(value) {
  if (typeof value === "string" && value.toLowerCase().includes("rs")) return value;
  const number = Number(value || 0);
  return `Rs ${number.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function normalizeOrder(raw) {
  const order = raw || {};
  const customer = order.customer || order.customer_detail || {};
  const pickup = order.pickup || order.restaurant || {};
  const items = order.items || order.order_items || order.orderItems || [];
  const status = order.delivery_status || order.status || "assigned";

  return {
    ...order,
    id: order.id || order.order_id || order.order,
    order_code: order.order_code || order.code || (order.id ? `#${order.id}` : "Order"),
    grand_total_formatted: order.grand_total_formatted || money(order.grand_total || order.total),
    eta_text: order.eta_text || "",
    distance_text: order.distance_text || "",
    delivery_status: status,
    delivery_status_label: order.delivery_status_label || statusLabels[status] || "Assigned",
    customer,
    pickup,
    items,
    timeline: order.timeline || []
  };
}
