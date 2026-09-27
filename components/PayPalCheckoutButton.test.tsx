import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { PayPalButtons } from "@paypal/react-paypal-js";
import { apiFetch } from "@/lib/api";
import Button from "./PayPalCheckoutButton";

let callbacks: ComponentProps<typeof PayPalButtons>;
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@paypal/react-paypal-js", () => ({
  usePayPalScriptReducer: () => [{ isPending: false, isRejected: false }],
  PayPalButtons: (props: ComponentProps<typeof PayPalButtons>) => { callbacks = props; return null; },
}));
const api = vi.mocked(apiFetch);
const confirmation = { confirmed: true, status: "COMPLETED", pagoEstado: "completado", pedidoId: "7",
  paypalOrderId: "ORDER1", captureId: "CAPTURE1", total: "650.00", currency: "MXN" };
const create = () => callbacks.createOrder!({} as never, {} as never);
const approve = () => callbacks.onApprove!({ orderID: "ORDER1" } as never, {} as never);
const render = () => {
  const onSuccess = vi.fn(); const onError = vi.fn();
  renderToString(<Button productId="3" userId="user1" onSuccess={onSuccess} onError={onError} />);
  return { onSuccess, onError };
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "sandbox-client");
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_ENV", "sandbox");
  api.mockReset();
  vi.stubGlobal("sessionStorage", { setItem: vi.fn(), getItem: vi.fn() });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("no habilita PayPal sin cliente o fuera de Sandbox", () => {
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_ENV", "production");
  expect(renderToString(<Button productId="3" userId="user1" onSuccess={() => {}} />)).toContain("PayPal no");
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_ENV", "sandbox"); vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "");
  expect(renderToString(<Button productId="3" userId="user1" onSuccess={() => {}} />)).toContain("PayPal no");
});

it("crea pedido antes de orden backend, sin precios ni compra SDK", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce({ id: "7", estado: "pendiente_pago" }).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  expect(await create()).toBe("ORDER1");
  expect(api.mock.calls).toEqual([
    ["/pedidos", { method: "POST", body: JSON.stringify({ productos: [{ producto_id: "3", cantidad: 1 }] }) }],
    ["/paypal/crear-orden", { method: "POST", body: JSON.stringify({ pedidoId: "7" }) }],
  ]);
  expect(onSuccess).not.toHaveBeenCalled();
});

it("no muestra éxito hasta recibir confirmación válida del backend", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce({ id: "7", estado: "pendiente_pago" }).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create();
  let resolve!: (value: unknown) => void;
  api.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const pending = approve();
  expect(onSuccess).not.toHaveBeenCalled();
  resolve(confirmation); await pending;
  expect(onSuccess).toHaveBeenCalledExactlyOnceWith(confirmation);
});

it.each([
  null, {}, { status: "COMPLETED" }, { ...confirmation, confirmed: false },
  { ...confirmation, pedidoId: "8" }, { ...confirmation, paypalOrderId: "OTHER" },
  { ...confirmation, captureId: "" }, { ...confirmation, pagoEstado: "pendiente" },
])("rechaza confirmación incompleta o ajena: %j", async (response) => {
  const { onSuccess, onError } = render();
  api.mockResolvedValueOnce({ id: "7", estado: "pendiente_pago" }).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create(); api.mockResolvedValueOnce(response); await approve();
  expect(onSuccess).not.toHaveBeenCalled(); expect(onError).toHaveBeenCalledOnce();
});

it("fallo backend tras aprobación no muestra éxito y reintenta el mismo pedido", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce({ id: "7", estado: "pendiente_pago" }).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create(); api.mockRejectedValueOnce(new Error("503")); await approve();
  expect(onSuccess).not.toHaveBeenCalled();
  api.mockResolvedValueOnce(confirmation); await approve();
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(api.mock.calls.filter(([url]) => url === "/pedidos")).toHaveLength(1);
});

it("doble creación concurrente comparte pedido y reintento reutiliza referencia", async () => {
  render();
  api.mockResolvedValueOnce({ id: "7", estado: "pendiente_pago" }).mockRejectedValueOnce(new Error("503"));
  await Promise.allSettled([create(), create()]);
  api.mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  expect(await create()).toBe("ORDER1");
  expect(api.mock.calls.filter(([url]) => url === "/pedidos")).toHaveLength(1);
});
