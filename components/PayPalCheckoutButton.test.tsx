import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { PayPalButtons } from "@paypal/react-paypal-js";
import { apiFetch } from "@/lib/api";
import Button from "./PayPalCheckoutButton";

let callbacks: ComponentProps<typeof PayPalButtons>;
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@paypal/react-paypal-js", () => ({
  FUNDING: { PAYPAL: "paypal" },
  usePayPalScriptReducer: () => [{ isPending: false, isRejected: false }],
  usePayPalCardFields: () => ({ cardFieldsForm: null }),
  PayPalButtons: (props: ComponentProps<typeof PayPalButtons>) => { callbacks = props; return null; },
  PayPalCardFieldsProvider: ({ children }: { children: React.ReactNode }) => children,
  PayPalCardFieldsForm: () => null,
}));
const api = vi.mocked(apiFetch);
const confirmation = { confirmed: true, status: "COMPLETED", pagoEstado: "aprobado", pedidoId: "7",
  paypalOrderId: "ORDER1", captureId: "CAPTURE1", total: "650.00", currency: "MXN" };
const pedido = { id: "7", estado: "pendiente_pago", metodo_pago: "paypal" };
const create = () => callbacks.createOrder!({} as never, {} as never);
const approve = () => callbacks.onApprove!({ orderID: "ORDER1" } as never, {} as never);
const render = () => {
  const onSuccess = vi.fn(); const onError = vi.fn();
  renderToString(<Button productId="15" userId="user1" onSuccess={onSuccess} onError={onError} />);
  return { onSuccess, onError };
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "sandbox-client");
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_ENV", "sandbox");
  api.mockReset();
  vi.stubGlobal("sessionStorage", { setItem: vi.fn(), getItem: vi.fn() });
  vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("acepta modo Live y bloquea PayPal sin client ID", () => {
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_ENV", "live");
  expect(renderToString(<Button productId="15" userId="user1" onSuccess={() => {}} />)).not.toContain("PayPal no");
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "");
  expect(renderToString(<Button productId="15" userId="user1" onSuccess={() => {}} />)).toContain("PayPal no");
});

it("crea pedido antes de orden backend, sin precios ni compra SDK", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce(pedido).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  expect(await create()).toBe("ORDER1");
  expect(api.mock.calls).toEqual([
    ["/pedidos", { method: "POST", body: JSON.stringify({
      request_id: "11111111-1111-4111-8111-111111111111",
      metodo_pago: "paypal",
      productos: [{ producto_id: "15", cantidad: 1 }],
    }) }],
    ["/paypal/crear-orden", { method: "POST", body: JSON.stringify({ pedidoId: "7" }) }],
  ]);
  expect(onSuccess).not.toHaveBeenCalled();
});

it("un error del botón al cargar no se reporta como pago fallido", async () => {
  const { onError } = render();
  callbacks.onError!({ message: "SDK" });
  expect(onError).not.toHaveBeenCalled();

  api.mockResolvedValueOnce(pedido).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create();
  callbacks.onError!({ message: "PayPal rechazó el intento" });
  expect(onError).toHaveBeenCalledOnce();
});

it("no muestra éxito hasta recibir confirmación válida del backend", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce(pedido).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
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
  api.mockResolvedValueOnce(pedido).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create(); api.mockResolvedValueOnce(response); await approve();
  expect(onSuccess).not.toHaveBeenCalled(); expect(onError).toHaveBeenCalledOnce();
});

it("fallo backend tras aprobación no muestra éxito y reintenta el mismo pedido", async () => {
  const { onSuccess } = render();
  api.mockResolvedValueOnce(pedido).mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  await create(); api.mockRejectedValueOnce(new Error("503")); await approve();
  expect(onSuccess).not.toHaveBeenCalled();
  api.mockResolvedValueOnce(confirmation); await approve();
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(api.mock.calls.filter(([url]) => url === "/pedidos")).toHaveLength(1);
});

it("doble creación concurrente comparte pedido y reintento reutiliza referencia", async () => {
  render();
  api.mockResolvedValueOnce(pedido).mockRejectedValueOnce(new Error("503"));
  await Promise.allSettled([create(), create()]);
  api.mockResolvedValueOnce({ id: "ORDER1", pedidoId: "7" });
  expect(await create()).toBe("ORDER1");
  expect(api.mock.calls.filter(([url]) => url === "/pedidos")).toHaveLength(1);
});
