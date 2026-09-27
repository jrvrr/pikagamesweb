import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(["", "test-client-id"])("renders checkout with client ID %j", async (clientId) => {
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", clientId);
  const { default: Provider } = await import("./PayPalProviderWrapper");
  const { default: Button } = await import("./PayPalCheckoutButton");
  const html = renderToString(
    <Provider>
      <Button amount={650} description="Juego de prueba" onSuccess={() => {}} />
    </Provider>,
  );

  expect(html).toContain(clientId ? "Cargando PayPal" : "PayPal no está disponible");
});
