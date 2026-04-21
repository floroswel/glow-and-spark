import { ProductCard } from "./ProductCard";
import productVanilla from "@/assets/product-vanilla.jpg";
import productGiftset from "@/assets/product-giftset.jpg";
import productPilar from "@/assets/product-pilar.jpg";
import productDiffuser from "@/assets/product-diffuser.jpg";

const products = [
  {
    image: productVanilla,
    title: "Lumânare Pahar Vanilla & Santal Premium",
    description: "Ceară de soia • 180g • Aromă lemnoasă",
    price: 149,
    oldPrice: 189,
    rating: 4,
    reviews: 142,
    badge: "-20%",
    badgeType: "sale" as const,
  },
  {
    image: productGiftset,
    title: 'Set Cadou "Trandafir de Damasc" 3 Bucăți',
    description: "Cutie premium • Aromă florală delicată",
    price: 249,
    rating: 5,
    reviews: 89,
    badge: "BESTSELLER",
    badgeType: "bestseller" as const,
  },
  {
    image: productPilar,
    title: "Lumânare Pilar Cedru & Eucalipt",
    description: "Ceară vegetală • 300g • Aromă fresh",
    price: 179,
    rating: 4,
    reviews: 56,
    badge: "STOC LIMITAT",
    badgeType: "limited" as const,
  },
  {
    image: productDiffuser,
    title: "Diffuzor Aromat Lavandă & Mușcată",
    description: "Bambus • 100ml • Relaxare",
    price: 89,
    rating: 5,
    reviews: 210,
    badge: "NOU",
    badgeType: "new" as const,
  },
];

export function ProductGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">Preferatele clienților</h2>
        <p className="mt-2 text-muted-foreground">
          Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={i} {...p} />
        ))}
      </div>
    </section>
  );
}
