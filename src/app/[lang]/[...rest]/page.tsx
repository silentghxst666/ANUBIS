import { notFound } from "next/navigation";

// Catches unknown URLs under /en or /ru so they render [lang]/not-found.tsx inside the site layout.
export default function CatchAll() {
  notFound();
}
