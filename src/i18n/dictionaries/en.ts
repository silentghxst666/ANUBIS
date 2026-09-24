const en = {
  meta: {
    description:
      "ANUBIS — designer technical apparel. Not made for everyone. Collection 001 / Origin. Almaty.",
  },
  nav: {
    shop: "Collection",
    cart: "Cart",
    language: "Language",
    menu: "Main navigation",
    skip: "Skip to content",
  },
  home: {
    kicker: "Collection 001 / Origin",
    // Brand line stays in English in both languages.
    heroTitle: "Not made for everyone.",
    heroText: "Technical apparel, engineered in silence. Made for the few who notice the difference.",
    heroCta: "Enter the collection",
    scroll: "Scroll",
    collectionTitle: "Origin",
    viewAll: "View all objects",
    manifestoKicker: "Manifesto",
    manifestoTitle: "Designed in silence. Worn with intent.",
    manifesto:
      "Every ANUBIS piece starts with a problem — wind, rain, heat, movement — and ends when nothing else can be removed. No season. No crowd. Only the object and the person who wears it.",
    pillars: [
      { title: "Materials", text: "Membranes, merino blends, heavyweight knits, 4-way stretch weaves." },
      { title: "Construction", text: "Taped seams, bonded hems, articulated patterns." },
      { title: "Limited", text: "Small runs. When an object is gone, it is gone." },
    ],
  },
  shop: {
    title: "Collection",
    all: "All",
    categories: {
      outerwear: "Outerwear",
      tops: "Tops",
      bottoms: "Bottoms",
      accessories: "Accessories",
    },
    empty: "Nothing here yet.",
    items: "objects",
  },
  product: {
    size: "Size",
    selectSize: "Select a size",
    soldOut: "Sold out",
    addToCart: "Add to cart",
    added: "Added to cart",
    viewCart: "View cart",
    inStock: "In stock",
    limited: "Limited — {n} left",
    features: "Technology",
    material: "Material",
    care: "Care",
    delivery: "Delivery",
    deliveryText:
      "Delivery across Almaty. Delivery options and timing are confirmed after you place the order.",
    color: "Color",
    colors: { black: "Black", white: "White" },
    new: "New",
    priceNote: "Charged in ₸. $ price is indicative.",
    view: "View",
  },
  cart: {
    title: "Cart",
    empty: "Your cart is empty.",
    continue: "Continue shopping",
    size: "Size",
    remove: "Remove",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    subtotal: "Subtotal",
    checkout: "Checkout",
    checkoutSoon: "Online checkout is coming soon.",
    deliveryNote: "Delivery across Almaty. Cost calculated at checkout.",
  },
  footer: {
    rights: "All rights reserved.",
    city: "Almaty, Kazakhstan",
    tagline: "Not made for everyone.",
  },
};

export default en;
export type Dictionary = typeof en;
