import { NextResponse } from "next/server";

// Ahora la función se llama "proxy" en lugar de "middleware"
export default function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Si NO hay token y el usuario intenta entrar a cualquier cosa que NO sea la raíz (/)
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Si YA hay token e intenta entrar a la raíz (donde está el formulario)
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Vigilamos Dashboard e Inventario
  matcher: ["/dashboard/:path*", "/inventario/:path*", "/"],
};
