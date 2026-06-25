export interface Room {
  id: number;
  title: string;
  location: string;
  price: number;
  mainImage: string;
  images: string[];
  description: string;
  features: string[];
  rating: number;
  reviews: Review[];
  mapQuery: string;
  rentalTypes: string[];
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export const rooms: Room[] = [
  {
    id: 1,
    title: "Habitación en Sagrera",
    location: "Sagrera, Barcelona",
    price: 650,
    mapQuery: "Avinguda+Meridiana+Barcelona",
    rentalTypes: ["Por noches"],
    mainImage: "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778021/SagreraRoom1_apr713.jpg",
    images: [
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778021/SagreraRoom1_apr713.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778063/SagreraRoom2_ldv4yh.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778062/SagreraBano1_iaf1gu.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778063/SagreraBano2_wcizkt.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778064/SagreraSala_ct5w9q.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778064/SagreraTerraza_jzl1pt.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778063/SagreraCocina_rtxval.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1780778063/SagreraCocina2_olbi4p.jpg",
      "https://res.cloudinary.com/dxiiuefnk/video/upload/v1780778187/SagreraVideo2_shh1xn.mp4",
      "https://res.cloudinary.com/dxiiuefnk/video/upload/v1780778187/Sagreravideo3_afdxe6.mp4",
    ],
    description: "Habitación en un piso amplio en el barrio de Sagrera. Con terraza, salón compartido, cocina totalmente equipada y baño moderno. Bien conectado con metro y bus.",
    features: ["Habitación doble", "Baño privado", "Cocina equipada", "WiFi incluido", "Metro cercano"],
    rating: 5.0,
    reviews: [
      { id: 1, author: "María G.", rating: 5, comment: "¡Habitación increíble! El barrio es tranquilo y muy bien conectado.", date: "15 Mayo 2026" },
      { id: 2, author: "Carlos R.", rating: 5, comment: "Muy recomendable. Todo como en las fotos y muy bien ubicado.", date: "28 Abril 2026" },
      { id: 3, author: "Laura P.", rating: 5, comment: "Buen sitio, limpio y cómodo. El baño privado es un plus.", date: "10 Marzo 2026" }
    ]
  },
  {
    id: 2,
    title: "Habitación en el Born",
    location: "El Born, Barcelona",
    price: 750,
    mapQuery: "Carrer+de+Cervantes+Barcelona+Born",
    rentalTypes: ["Por noches", "Mensual"],
    mainImage: "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782258535/WhatsApp_Image_2026-06-24_at_01.48.03_efmgmd.jpg",
    images: [
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782258535/WhatsApp_Image_2026-06-24_at_01.48.03_efmgmd.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782258638/ok-plaza-sant-jaume_b8vqgh.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782258639/WhatsApp_Image_2026-06-24_at_01.50.00_stgrzr.jpg",
    ],
    description: "Habitación con encanto en el corazón del Born, uno de los barrios más vibrantes de Barcelona. Rodeada de galerías, restaurantes y a pasos del Parque de la Ciutadella. Disponemos de habitaciones medianas para estancia mensual y habitaciones dobles para días específicos.",
    features: ["3 hab. medianas · Renta mensual", "2 hab. dobles · Por días (consultar)", "Baño compartido", "Barrio con vida", "Metros y buses cercanos"],
    rating: 5.0,
    reviews: [
      { id: 1, author: "David M.", rating: 5, comment: "Piso perfecto, bastante amplio.", date: "2 Junio 2026" },
      { id: 2, author: "Ana L.", rating: 5, comment: "Excelente ubicación. 100% recomendable.", date: "20 Mayo 2026" },
      { id: 3, author: "Pedro S.", rating: 5, comment: "Muy buena habitación. A minutos de las Ramblas.", date: "5 Mayo 2026" }
    ]
  },
  {
    id: 3,
    title: "Habitación en Sagrada Família",
    location: "Sagrada Família, Barcelona",
    price: 700,
    mapQuery: "Carrer+de+Valencia+Barcelona+Eixample",
    rentalTypes: ["Por noches"],
    mainImage: "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256940/SagradaRoom_qrkzam.jpg",
    images: [
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256940/SagradaRoom_qrkzam.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256942/sagradaroom2_pmizrl.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256943/Sagradasala_rlvbe8.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256944/Sagradasala1_zfaos4.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256947/Sagradasala3_gaeael.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256939/Sagradabano1_dwvfoa.jpg",
      "https://res.cloudinary.com/dxiiuefnk/image/upload/v1782256949/sagradavista_gxpydi.jpg",
    ],
    description: "Habitación acogedora a pocos minutos de la Sagrada Família. Piso con salón amplio, baño moderno y muy buena conexión con el centro de Barcelona.",
    features: ["Excelente ubicación", "Baño compartido", "Salón compartido", "Cocina equipada", "Metro cercano"],
    rating: 4.9,
    reviews: [
      { id: 1, author: "Sofia T.", rating: 5, comment: "Ubicación increíble, a 5 minutos de la Sagrada Família.", date: "10 Junio 2026" },
      { id: 2, author: "Marco V.", rating: 5, comment: "Piso muy limpio y bien equipado. Muy recomendable.", date: "25 Mayo 2026" },
      { id: 3, author: "Elena F.", rating: 5, comment: "Muy buena relación calidad-precio para esta zona.", date: "15 Mayo 2026" }
    ]
  }
];