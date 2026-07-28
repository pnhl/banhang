"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackCommerceEvent } from "../lib/analytics";
import { getProfile, getWishlistIds } from "../lib/account";
import { getCart } from "../lib/catalog";
import {
  COMPARE_UPDATED_EVENT,
  getCompareIds,
} from "../lib/engagement";

export function SiteHeader() {
  const [count, setCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const sync = () => {
      setCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
      setWishlistCount(getWishlistIds().length);
      setCompareCount(getCompareIds().length);
      setSignedIn(Boolean(getProfile()));
    };
    const syncIdentity = () => {
      void fetch("/api/me", { cache: "no-store" })
        .then(async (response) =>
          response.ok
            ? ((await response.json()) as {
              authenticated?: boolean;
              unreadNotifications?: number;
            })
            : null,
        )
        .then((result) => {
            if (!result) return;
            setSignedIn(Boolean(result.authenticated));
            setUnreadNotifications(Number(result.unreadNotifications ?? 0));
          },
        )
        .catch(() => undefined);
    };
    sync();
    syncIdentity();
    window.addEventListener("storage", sync);
    window.addEventListener("nova-cart-updated", sync);
    window.addEventListener("nova-wishlist-updated", sync);
    window.addEventListener("nova-account-updated", sync);
    window.addEventListener(COMPARE_UPDATED_EVENT, sync);
    window.addEventListener("lopa-notifications-updated", syncIdentity);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nova-cart-updated", sync);
      window.removeEventListener("nova-wishlist-updated", sync);
      window.removeEventListener("nova-account-updated", sync);
      window.removeEventListener(COMPARE_UPDATED_EVENT, sync);
      window.removeEventListener("lopa-notifications-updated", syncIdentity);
    };
  }, []);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    trackCommerceEvent("search", {
      search_term: String(value ?? ""),
    });
    window.location.href = `/search?q=${encodeURIComponent(String(value ?? ""))}`;
  };

  return (
    <>
      <header className="site-header">
        <div className="site-header-main wrap">
          <a className="brand" href="/" aria-label="LOPA MARKET - Trang chủ">
            <span className="brand-mark">L</span>
            <span>LOPA<span>MARKET</span></span>
          </a>
          <form className="site-search" onSubmit={search}>
            <span>⌕</span>
            <input name="q" aria-label="Tìm sản phẩm" placeholder="Tìm kiếm trong LOPA MARKET" />
            <button>Tìm kiếm</button>
          </form>
          <nav className="site-header-actions" aria-label="Tài khoản và giỏ hàng">
            <a href="/wishlist" className="site-wishlist"><span>♡</span><small>Yêu thích</small>{wishlistCount > 0 && <b>{wishlistCount}</b>}</a>
            <a href={signedIn ? "/account" : "/login"} className="site-notifications"><span>♙</span><small>{signedIn ? "Tài khoản" : "Đăng nhập"}</small>{unreadNotifications > 0 && <b>{unreadNotifications}</b>}</a>
            <a href="/cart" className="site-cart"><span>▱</span><small>Giỏ hàng</small>{count > 0 && <b>{count}</b>}</a>
          </nav>
        </div>
        <div className="site-subnav wrap">
          <nav><a href="/">Trang chủ</a><a href="/#products">Sản phẩm</a><a href="/stores">Gian hàng</a><a href="/compare">So sánh{compareCount > 0 ? ` (${compareCount})` : ""}</a>{signedIn && <a href="/notifications">Thông báo{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}</a>}<a href="/policies/shipping">Giao hàng</a><a href="/policies/returns">Đổi trả</a><a href="/support">Trợ giúp</a></nav>
          <a href="/seller">Kênh người bán →</a>
        </div>
      </header>
      <nav className="mobile-nav page-mobile-nav">
        <a href="/"><span>⌂</span>Trang chủ</a>
        <a href="/#products"><span>⌕</span>Sản phẩm</a>
        <a href="/cart"><span>▱</span>Giỏ hàng{count > 0 && <b>{count}</b>}</a>
        <a href={signedIn ? "/account" : "/login"}><span>♙</span>Tài khoản</a>
      </nav>
    </>
  );
}
