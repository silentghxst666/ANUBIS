import type { ReactNode } from "react";
import Link from "next/link";
import { databaseMode } from "@/db";
import { requireAdmin } from "@/lib/admin-session";
import { blobAuth } from "@/lib/blob";
import { formatPrice } from "@/lib/format";
import { getAllProducts, totalStock } from "@/lib/products";
import { logout, setPublished } from "./actions";

export const metadata = { title: "Товары" };

const CATEGORY_RU = { outerwear: "Верхняя одежда", tops: "Верх", bottoms: "Низ", accessories: "Аксессуары" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const saved = (await searchParams).saved === "1";
  const products = await getAllProducts();
  const blobReady = blobAuth() !== null || databaseMode === "local";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-display text-sm font-medium tracking-[0.28em]">ANUBIS</p>
          <h1 className="mt-3 text-2xl font-semibold">Товары</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="label text-muted hover:text-fg" target="_blank">
            Открыть сайт ↗
          </Link>
          <form action={logout}>
            <button className="label border border-line px-4 py-3 hover:border-fg">Выйти</button>
          </form>
          {databaseMode !== "none" && (
            <Link href="/admin/products/new" className="label bg-fg px-5 py-3 text-bg hover:opacity-85">
              + Новый товар
            </Link>
          )}
        </div>
      </header>

      {databaseMode === "none" && (
        <Notice>
          База данных не подключена, поэтому на сайте показаны демо-товары и изменять их нельзя. Подключите
          Neon в Vercel → Storage и сделайте Redeploy.
        </Notice>
      )}
      {databaseMode === "local" && (
        <Notice>Локальный режим: товары и фото хранятся только на этом компьютере (папки .data и public/uploads).</Notice>
      )}
      {databaseMode === "neon" && !blobReady && (
        <Notice>Хранилище фото не подключено — загрузка фото не заработает. Подключите Blob в Vercel → Storage.</Notice>
      )}
      {saved && <Notice>Сохранено. Сайт обновится в течение нескольких секунд.</Notice>}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="label text-muted">
            <tr className="border-b border-line">
              <th className="py-3 pr-4 font-normal">Фото</th>
              <th className="py-3 pr-4 font-normal">Название</th>
              <th className="py-3 pr-4 font-normal">Категория</th>
              <th className="py-3 pr-4 font-normal">Цена</th>
              <th className="py-3 pr-4 font-normal">Остаток</th>
              <th className="py-3 pr-4 font-normal">На сайте</th>
              <th className="py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = totalStock(p);
              return (
                <tr key={p.slug} className="border-b border-line align-middle">
                  <td className="py-3 pr-4">
                    <div className={`relative h-14 w-11 overflow-hidden ${p.color === "black" ? "bg-[#141414]" : "bg-[#ececec]"}`}>
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail
                        <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{p.name.ru}</p>
                    <p className="label mt-1 text-muted">{p.sku}</p>
                  </td>
                  <td className="py-3 pr-4 text-muted">{CATEGORY_RU[p.category]}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatPrice(p.price)}</td>
                  <td className={`py-3 pr-4 tabular-nums ${stock === 0 ? "text-red-700" : ""}`}>
                    {stock} шт.
                    <span className="label ml-2 text-muted">
                      {Object.entries(p.stock)
                        .map(([s, q]) => `${s}:${q}`)
                        .join(" ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {p.id !== undefined ? (
                      <form action={setPublished}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="published" value={String(!p.published)} />
                        <button className={`label px-3 py-2 ${p.published ? "bg-fg text-bg" : "border border-line text-muted"}`}>
                          {p.published ? "Показан" : "Скрыт"}
                        </button>
                      </form>
                    ) : (
                      <span className="label text-muted">Демо</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {p.id !== undefined && (
                      <Link href={`/admin/products/${p.id}`} className="label underline underline-offset-4 hover:opacity-60">
                        Изменить
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="py-16 text-center text-muted">Товаров пока нет.</p>}
      </div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="mt-6 border border-line bg-surface p-4 text-sm leading-relaxed">{children}</p>;
}
