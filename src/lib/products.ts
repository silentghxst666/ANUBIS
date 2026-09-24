import type { Locale } from "@/i18n/config";

// Stage 1: the catalog lives in code. Stage 2 moves it to the database + admin panel,
// keeping the same Product shape so pages don't need to change.

export type Category = "outerwear" | "tops" | "bottoms" | "accessories";
export type Color = "black" | "white";
type Localized = Record<Locale, string>;

export type Product = {
  slug: string;
  sku: string;
  name: Localized;
  description: Localized;
  features: Localized[];
  category: Category;
  color: Color;
  /** Price in tenge (KZT), whole units. */
  price: number;
  /** Size -> units in stock. */
  stock: Record<string, number>;
  /** Paths under /public, e.g. "/products/shell-jacket-01/1.jpg". Empty = placeholder. */
  images: string[];
  isNew?: boolean;
};

const products: Product[] = [
  {
    slug: "shell-jacket-01",
    sku: "ANB-OW-001",
    name: { en: "Shell Jacket 01", ru: "Куртка Shell 01" },
    description: {
      en: "A three-layer hardshell cut for the city. Fully taped, laser-cut vents, hood that turns with your head.",
      ru: "Трёхслойная мембранная куртка городского кроя. Полностью проклеенные швы, лазерная вентиляция, капюшон, поворачивающийся вместе с головой.",
    },
    features: [
      { en: "3-layer waterproof membrane, 20 000 mm", ru: "3-слойная мембрана, 20 000 мм" },
      { en: "Fully taped seams", ru: "Полностью проклеенные швы" },
      { en: "Water-repellent zippers", ru: "Водоотталкивающие молнии" },
    ],
    category: "outerwear",
    color: "black",
    price: 189000,
    stock: { S: 3, M: 5, L: 4, XL: 2 },
    images: [],
    isNew: true,
  },
  {
    slug: "storm-parka",
    sku: "ANB-OW-002",
    name: { en: "Storm Parka", ru: "Парка Storm" },
    description: {
      en: "Insulated long parka for Almaty winters. Synthetic fill that stays warm when wet, two-way zip, storm collar.",
      ru: "Утеплённая длинная парка для алматинской зимы. Синтетический утеплитель, греющий даже во влажном состоянии, двусторонняя молния, штормовой воротник.",
    },
    features: [
      { en: "Synthetic insulation, 200 g/m²", ru: "Синтетический утеплитель, 200 г/м²" },
      { en: "Windproof outer shell", ru: "Ветрозащитная внешняя ткань" },
      { en: "Rated to −25 °C", ru: "Комфорт до −25 °C" },
    ],
    category: "outerwear",
    color: "black",
    price: 249000,
    stock: { S: 1, M: 3, L: 3, XL: 0 },
    images: [],
  },
  {
    slug: "insulated-vest",
    sku: "ANB-OW-003",
    name: { en: "Insulated Vest", ru: "Утеплённый жилет" },
    description: {
      en: "A lightweight layer for transitional weather. Packs into its own chest pocket.",
      ru: "Лёгкий слой для межсезонья. Складывается в собственный нагрудный карман.",
    },
    features: [
      { en: "Packable into chest pocket", ru: "Складывается в карман" },
      { en: "DWR finish", ru: "Водоотталкивающая пропитка DWR" },
    ],
    category: "outerwear",
    color: "white",
    price: 98000,
    stock: { S: 2, M: 4, L: 4, XL: 1 },
    images: [],
  },
  {
    slug: "thermal-mid-layer",
    sku: "ANB-TP-001",
    name: { en: "Thermal Mid-Layer", ru: "Термо мидлеер" },
    description: {
      en: "Grid fleece that traps heat and vents moisture. Flatlock seams sit flat under a shell.",
      ru: "Флис с сеточной структурой: держит тепло и отводит влагу. Плоские швы не давят под курткой.",
    },
    features: [
      { en: "Grid fleece, 230 g/m²", ru: "Сеточный флис, 230 г/м²" },
      { en: "Flatlock seams", ru: "Плоские швы flatlock" },
    ],
    category: "tops",
    color: "black",
    price: 79000,
    stock: { S: 4, M: 6, L: 5, XL: 3 },
    images: [],
    isNew: true,
  },
  {
    slug: "tech-hoodie",
    sku: "ANB-TP-002",
    name: { en: "Tech Hoodie", ru: "Худи Tech" },
    description: {
      en: "Heavyweight hoodie in a technical double-knit. Hidden zip pocket, bonded cuffs.",
      ru: "Плотное худи из технического двойного трикотажа. Скрытый карман на молнии, бондированные манжеты.",
    },
    features: [
      { en: "Double-knit, 380 g/m²", ru: "Двойной трикотаж, 380 г/м²" },
      { en: "Hidden zip pocket", ru: "Скрытый карман на молнии" },
    ],
    category: "tops",
    color: "white",
    price: 59000,
    stock: { S: 5, M: 8, L: 6, XL: 4 },
    images: [],
  },
  {
    slug: "base-tee",
    sku: "ANB-TP-003",
    name: { en: "Base Tee", ru: "Футболка Base" },
    description: {
      en: "Merino-blend tee that regulates temperature and resists odour. The base of every layer.",
      ru: "Футболка из смеси мериноса: регулирует температуру и не впитывает запах. Основа любого слоя.",
    },
    features: [
      { en: "Merino / Tencel blend", ru: "Смесь мериноса и тенселя" },
      { en: "Odour-resistant", ru: "Не впитывает запах" },
    ],
    category: "tops",
    color: "black",
    price: 29000,
    stock: { S: 10, M: 12, L: 10, XL: 6 },
    images: [],
  },
  {
    slug: "utility-cargo-pant",
    sku: "ANB-BT-001",
    name: { en: "Utility Cargo Pant", ru: "Карго Utility" },
    description: {
      en: "Articulated knees and a gusseted crotch in a 4-way stretch weave. Six pockets, none of them loud.",
      ru: "Анатомические колени и ластовица, ткань 4-way stretch. Шесть карманов — ни одного броского.",
    },
    features: [
      { en: "4-way stretch, DWR", ru: "4-way stretch с пропиткой DWR" },
      { en: "Articulated knees", ru: "Анатомические колени" },
      { en: "Magnetic cargo closures", ru: "Магнитные застёжки карманов" },
    ],
    category: "bottoms",
    color: "black",
    price: 69000,
    stock: { S: 3, M: 5, L: 5, XL: 2 },
    images: [],
    isNew: true,
  },
  {
    slug: "sling-bag",
    sku: "ANB-AC-001",
    name: { en: "Sling Bag", ru: "Сумка Sling" },
    description: {
      en: "Waterproof cross-body bag with a magnetic buckle and a padded device sleeve.",
      ru: "Водонепроницаемая сумка через плечо с магнитной пряжкой и мягким отделением для устройств.",
    },
    features: [
      { en: "Welded waterproof seams", ru: "Сварные водонепроницаемые швы" },
      { en: "Magnetic buckle", ru: "Магнитная пряжка" },
    ],
    category: "accessories",
    color: "white",
    price: 45000,
    stock: { OS: 8 },
    images: [],
  },
];

export const categories: Category[] = ["outerwear", "tops", "bottoms", "accessories"];

export async function getProducts(category?: Category): Promise<Product[]> {
  return category ? products.filter((p) => p.category === category) : products;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return products.find((p) => p.slug === slug);
}

export function isCategory(value: string | undefined): value is Category {
  return categories.includes(value as Category);
}

export function totalStock(product: Product): number {
  return Object.values(product.stock).reduce((a, b) => a + b, 0);
}
