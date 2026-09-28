import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AuthModal } from "./AuthModal";
import PerfilPage from "@/app/perfil/page";

vi.mock("@base-ui/react/dialog", () => ({
  Dialog: {
    Root: ({ children }: { children: React.ReactNode }) => children,
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Backdrop: () => null,
    Viewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Popup: ({ children }: { children: React.ReactNode }) => <div role="dialog" aria-modal="true">{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Close: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth: () => ({
  user: { id: "test", nombre: "Ana", email: "ana@example.com", rol: "cliente" },
  token: "test", isLoading: false, login: vi.fn(), updateUser: vi.fn(), logout: vi.fn(),
}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

it("auth modal fields and actions have accessible names", () => {
  const html = renderToStaticMarkup(<AuthModal isOpen onClose={() => {}} />);
  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-modal="true"');
  expect(html).toContain('aria-label="Cerrar ventana de acceso"');
  expect(html).toContain('aria-label="Mostrar contraseña"');
  expect(html).toContain('for="auth-email"');
  expect(html).toContain('for="auth-password"');
});

it("login permite introducir la contraseña completa sin un límite distinto del servidor", () => {
  const html = renderToStaticMarkup(<AuthModal isOpen onClose={() => {}} />);
  const password = html.match(/<input[^>]*type="password"[^>]*>/)?.[0];
  expect(password).toBeDefined();
  expect(password).toContain('autoComplete="current-password"');
  expect(password?.toLowerCase()).not.toContain("maxlength");
  expect(password?.toLowerCase()).not.toContain("minlength");
});

it("perfil permite la misma entrada completa para contraseña actual, nueva y confirmación", () => {
  const html = renderToStaticMarkup(<PerfilPage />);
  const passwords = html.match(/<input[^>]*type="password"[^>]*>/g) ?? [];
  expect(passwords).toHaveLength(3);
  for (const input of passwords) {
    expect(input.toLowerCase()).not.toContain("maxlength");
    expect(input).toContain('required=""');
  }
});
