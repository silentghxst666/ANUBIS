"use client";

import { startTransition, useActionState, useState, type ReactNode } from "react";
import { saveProduct } from "@/app/admin/actions";
import type { Product } from "@/lib/products";
import ImagesField, { type UploadMode } from "./ImagesField";

const input = "mt-2 h-11 w-full border border-line bg-bg px-3 outline-none focus:border-fg";
const area = "mt-2 min-h-24 w-full border border-line bg-bg px-3 py-2 outline-none focus:border-fg";

export default function ProductForm({ product, upload }: { product: Product; upload: UploadMode }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const errors = state?.fieldErrors ?? {};
  const [stock, setStock] = useState(() => Object.entries(product.stock).map(([size, qty]) => ({ size, qty })));
  const [features, setFeatures] = useState(product.features);

  return (
    <form
      // Submitted by hand rather than via `action`: React resets a form after an action, which
      // would wipe everything the owner typed whenever validation sends it back with an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="mt-8 space-y-10"
    >
      {product.id && <input type="hidden" name="id" value={product.id} />}

      <Section title="Основное">
        <Grid>
          <Field label="Название (EN)" error={errors.nameEn}>
            <input name="nameEn" defaultValue={product.name.en} className={input} required />
          </Field>
          <Field label="Название (RU)" error={errors.nameRu}>
            <input name="nameRu" defaultValue={product.name.ru} className={input} required />
          </Field>
          <Field label="Цена, ₸" error={errors.price} hint="Цена в $ посчитается сама">
            <input name="price" inputMode="numeric" defaultValue={product.price || ""} className={input} required />
          </Field>
          <Field label="Адрес страницы" error={errors.slug} hint="sibuna.net/ru/product/…">
            <input name="slug" defaultValue={product.slug} className={input} placeholder="storm-parka" required />
          </Field>
          <Field label="Категория" error={errors.category}>
            <select name="category" defaultValue={product.category} className={input}>
              <option value="outerwear">Верхняя одежда</option>
              <option value="tops">Верх</option>
              <option value="bottoms">Низ</option>
              <option value="accessories">Аксессуары</option>
            </select>
          </Field>
          <Field label="Цвет" error={errors.color}>
            <select name="color" defaultValue={product.color} className={input}>
              <option value="black">Чёрный</option>
              <option value="white">Белый</option>
            </select>
          </Field>
          <Field label="Артикул" hint="Необязательно">
            <input name="sku" defaultValue={product.sku} className={input} placeholder="ANB-OW-004" />
          </Field>
          <Field label="Коллекция">
            <input name="collection" defaultValue={product.collection} className={input} />
          </Field>
        </Grid>
        <div className="mt-6 flex flex-wrap gap-6">
          <Check name="published" defaultChecked={product.published} label="Показывать на сайте" />
          <Check name="isNew" defaultChecked={product.isNew ?? false} label="Отметка «Новинка»" />
        </div>
      </Section>

      <Section title="Фото" hint="Вертикальные 3:4, от 1200×1600 px. Первое фото — главное. Перетаскивать не нужно: стрелками меняется порядок.">
        <ImagesField initial={product.images} mode={upload} />
      </Section>

      <Section title="Размеры и остатки" error={errors.stock}>
        <div className="space-y-2">
          {stock.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                name="size"
                value={row.size}
                onChange={(e) => setStock(stock.map((r, j) => (j === i ? { ...r, size: e.target.value } : r)))}
                className="h-11 w-24 border border-line bg-bg px-3 uppercase outline-none focus:border-fg"
                placeholder="M"
                aria-label="Размер"
              />
              <input
                name="qty"
                type="number"
                min={0}
                value={row.qty}
                onChange={(e) => setStock(stock.map((r, j) => (j === i ? { ...r, qty: Number(e.target.value) } : r)))}
                className="h-11 w-28 border border-line bg-bg px-3 outline-none focus:border-fg"
                aria-label="Остаток, шт."
              />
              <span className="label text-muted">шт.</span>
              <button
                type="button"
                onClick={() => setStock(stock.filter((_, j) => j !== i))}
                className="label ml-2 text-muted hover:text-red-700"
              >
                Убрать
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStock([...stock, { size: "", qty: 0 }])}
          className="label mt-3 border border-line px-4 py-2 hover:border-fg"
        >
          + Размер
        </button>
      </Section>

      <Section title="Описание">
        <Grid>
          <Field label="Описание (EN)">
            <textarea name="descriptionEn" defaultValue={product.description.en} className={area} />
          </Field>
          <Field label="Описание (RU)">
            <textarea name="descriptionRu" defaultValue={product.description.ru} className={area} />
          </Field>
          <Field label="Материал (EN)">
            <input name="materialEn" defaultValue={product.material.en} className={input} />
          </Field>
          <Field label="Материал (RU)">
            <input name="materialRu" defaultValue={product.material.ru} className={input} />
          </Field>
          <Field label="Плотность" hint="Например 480 GSM">
            <input name="weight" defaultValue={product.weight ?? ""} className={input} />
          </Field>
          <Field label="Порядок в коллекции" hint="Меньше — выше">
            <input name="position" type="number" defaultValue={product.position} className={input} />
          </Field>
          <Field label="Уход (EN)">
            <textarea name="careEn" defaultValue={product.care.en} className={area} />
          </Field>
          <Field label="Уход (RU)">
            <textarea name="careRu" defaultValue={product.care.ru} className={area} />
          </Field>
        </Grid>
      </Section>

      <Section title="Технологии" hint="Короткие пункты, например «Водонепроницаемость 20 000 мм»">
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                name="featureEn"
                value={f.en}
                onChange={(e) => setFeatures(features.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))}
                className="h-11 border border-line bg-bg px-3 outline-none focus:border-fg"
                placeholder="EN"
              />
              <input
                name="featureRu"
                value={f.ru}
                onChange={(e) => setFeatures(features.map((x, j) => (j === i ? { ...x, ru: e.target.value } : x)))}
                className="h-11 border border-line bg-bg px-3 outline-none focus:border-fg"
                placeholder="RU"
              />
              <button
                type="button"
                onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                className="label px-2 text-muted hover:text-red-700"
              >
                Убрать
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFeatures([...features, { en: "", ru: "" }])}
          className="label mt-3 border border-line px-4 py-2 hover:border-fg"
        >
          + Пункт
        </button>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="submit"
          disabled={pending}
          className="label h-12 bg-fg px-8 text-bg transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {pending ? "Сохраняю…" : "Сохранить"}
        </button>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}

function Section({ title, hint, error, children }: { title: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="label">{title}</h2>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-red-700">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-black" />
      {label}
    </label>
  );
}
