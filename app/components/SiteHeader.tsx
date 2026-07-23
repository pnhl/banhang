"use client";

import { FormEvent, useEffect, useState } from "react";
import { getCart } from "../lib/catalog";

export function SiteHeader() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("nova-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nova-cart-updated", sync);
    };
  }, []);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    window.location.href = `/?q=${encodeURIComponent(String(value ?? ""))}#products`;
  };

  return (
    <>
      <header className="site-header">
        <div className="site-header-main wrap">
          <a className="brand" href="/" aria-label="NOVA Market - Trang chủ">
            <span className="brand-mark">N</span>
            <span>NOVA<span>market</span></span>
          </a>
          <form className="site-search" onSubmit={search}>
            <span>⌕</span>
            <input name="q" aria-label="Tìm sản phẩm" placeholder="Tìm kiếm trong NOVA Market" />
            <button>Tìm kiếm</button>
          </form>
          <nav className="site-header-actions" aria-label="Tài khoản và giỏ hàng">
            <a href="/login"><span>♙</span><small>Đăng nhập</small></a>
            <a href="/cart" className="site-cart"><span>▱</span><small>Giỏ hàng</small>{count > 0 && <b>{count}</b>}</a>
          </nav>
        </div>
        <div className="site-subnav wrap">
          <nav><a href="/">Trang chủ</a><a href="/#products">Sản phẩm</a><a href="/policies/shipping">Giao hàng</a><a href="/policies/returns">Đổi trả</a></nav>
          <a href="/admin">Kênh quản trị →</a>
        </div>
      </header>
      <nav className="mobile-nav page-mobile-nav">
        <a href="/"><span>⌂</span>Trang chủ</a>
        <a href="/#products"><span>⌕</span>Sản phẩm</a>
        <a href="/cart"><span>▱</span>Giỏ hàng{count > 0 && <b>{count}</b>}</a>
        <a href="/login"><span>♙</span>Tài khoản</a>
      </nav>
    </>
  );
}
