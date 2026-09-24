"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

export type UploadMode = "blob" | "local" | "none";

const MAX_MB = 15;

/**
 * Photo list for a product. Files go straight from the browser to Vercel Blob (no server
 * size limits); in local development they are saved to public/uploads instead.
 * The ordered URLs are submitted with the form as repeated "image" fields.
 */
export default function ImagesField({ initial, mode }: { initial: string[]; mode: UploadMode }) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function send(file: File): Promise<string> {
    if (mode === "blob") {
      const blob = await upload(`products/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      return blob.url;
    }
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload-local", { method: "POST", body });
    if (!res.ok) throw new Error(await res.text());
    return ((await res.json()) as { url: string }).url;
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files].filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`${f.name}: больше ${MAX_MB} МБ`);
        return false;
      }
      return true;
    });
    setBusy((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await send(file);
        setImages((prev) => [...prev, url]);
      } catch (e) {
        setError(`${file.name}: не удалось загрузить (${e instanceof Error ? e.message : "ошибка"})`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  const move = (i: number, by: number) =>
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(Math.min(Math.max(i + by, 0), next.length), 0, item);
      return next;
    });

  return (
    <div>
      {images.map((url) => (
        <input key={url} type="hidden" name="image" value={url} />
      ))}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((url, i) => (
          <figure key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file */}
            <img src={url} alt="" className="aspect-[3/4] w-full bg-surface object-cover" />
            {i === 0 && <span className="label absolute left-1 top-1 bg-fg px-1.5 py-0.5 text-bg">Главное</span>}
            <figcaption className="mt-1 flex justify-between">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="label px-1 disabled:opacity-30" aria-label="Левее">
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="label px-1 disabled:opacity-30"
                  aria-label="Правее"
                >
                  →
                </button>
              </span>
              <button
                type="button"
                onClick={() => setImages(images.filter((u) => u !== url))}
                className="label text-muted hover:text-red-700"
              >
                Убрать
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {mode === "none" ? (
        <p className="mt-3 text-sm text-muted">Загрузка недоступна: не подключено хранилище Blob.</p>
      ) : (
        <label className="label mt-4 inline-flex cursor-pointer border border-line px-4 py-3 hover:border-fg">
          {busy > 0 ? `Загружаю… (${busy})` : "+ Добавить фото"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-muted">Фото сохранятся в товаре после нажатия «Сохранить».</p>
    </div>
  );
}
