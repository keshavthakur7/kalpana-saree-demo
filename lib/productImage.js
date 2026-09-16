const LOCAL_IMAGES = {
  "Banarasi Silk Saree": "/products/banarasi-silk.jpg",
  "Kanjivaram Silk Saree": "/products/kanjivaram-silk.jpg",
  "Organza Floral Saree": "/products/organza-floral.jpg",
  "Chiffon Party Wear Saree": "/products/chiffon-party.jpg",
  "Georgette Embroidery Saree": "/products/georgette-embroidery.jpg",
  "Tussar Silk Saree": "/products/tussar-silk.jpg",
  "Linen Saree": "/products/linen-saree.jpg",
  "Cotton Handloom Saree": "/products/cotton-handloom.jpg",
  "Wedding Collection Saree": "/products/wedding-collection.jpg",
  "Digital Print Saree": "/products/digital-print.jpg",
  "Kasturi Kanjivaram Silk Saree": "/products/kanjivaram-silk.jpg",
  "Meera Banarasi Silk Saree": "/products/banarasi-silk.jpg",
  "Noor Silk Organza Saree": "/products/organza-floral.jpg",
  "Gul Brocade Silk Saree": "/products/wedding-collection.jpg"
};

export function getProductImage(product) {
  return LOCAL_IMAGES[product?.name] || product?.image_url || "/hero-kalpana.jpg";
}
