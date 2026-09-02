export const GIFT_ICONS = [
  "book",
  "flower",
  "gem",
  "gift",
  "heart",
  "map",
  "shopping-bag",
  "sparkles",
  "star",
  "ticket",
  "utensils",
] as const;

export type GiftIcon = (typeof GIFT_ICONS)[number];
export type AttendeeCategory = "adult" | "child";

export type GiftItem = {
  id: string;
  name: string;
  description: string;
  priceHint: string;
  icon: GiftIcon;
  order: number;
};

export type GiftReservation = {
  id: string;
  giftId: string;
  giftName: string;
  guestName: string;
  guestContact: string;
  reservedAt: string;
};

export type RsvpAttendee = {
  name: string;
  category: AttendeeCategory;
};

export type RsvpSubmission = {
  id: string;
  contactName: string;
  whatsapp: string;
  attendees: RsvpAttendee[];
  createdAt: string;
};

export type PartyConfig = {
  eventTitle: string;
  hostName: string;
  age: number;
  date: string;
  time: string;
  locationName: string;
  address: string;
  mapsUrl: string;
  invitationText: string;
  rsvpNote: string;
};

export const DEFAULT_PARTY_CONFIG: PartyConfig = {
  eventTitle: "Aniversário da Liene",
  hostName: "Liene",
  age: 31,
  date: "2026-09-10",
  time: "",
  locationName: "",
  address: "",
  mapsUrl: "",
  invitationText:
    "Vamos celebrar juntos os 31 anos da Liene. Confirme sua presença e venha fazer parte desse momento especial!",
  rsvpNote:
    "Informe todas as pessoas que irão com você e marque cada uma como adulto ou criança.",
};

export const DEFAULT_GIFTS: GiftItem[] = [
  {
    id: "bolsa-maria-milao",
    name: "Bolsa grande Maria Milão",
    description: "Modelo grande, nas cores preta ou off-white.",
    priceHint: "Preta ou off-white",
    icon: "shopping-bag",
    order: 1,
  },
  {
    id: "mochila-pequena",
    name: "Mochila pequena",
    description: "Nas cores rosa, verde-claro, bege ou azul-bebê.",
    priceHint: "Cores claras",
    icon: "shopping-bag",
    order: 2,
  },
  {
    id: "calca-pantalona-duna",
    name: "Calça pantalona em tecido Duna",
    description: "Modelo pantalona em tecido Duna, tamanho M.",
    priceHint: "Tamanho M",
    icon: "sparkles",
    order: 3,
  },
  {
    id: "vestido-longo",
    name: "Vestido longo soltinho",
    description: "Vestido longo, confortável e com caimento soltinho.",
    priceHint: "Modelo soltinho",
    icon: "sparkles",
    order: 4,
  },
  {
    id: "macacao-jardineira",
    name: "Macacão jardineira longo",
    description: "Macacão estilo jardineira, modelo longo.",
    priceHint: "Modelo longo",
    icon: "heart",
    order: 5,
  },
  {
    id: "sandalia-off-white",
    name: "Sandália off-white",
    description: "Sandália off-white com salto baixo.",
    priceHint: "Salto baixo",
    icon: "star",
    order: 6,
  },
  {
    id: "aneis-grandes",
    name: "Anéis quadrados ou grandes",
    description: "Modelos de anéis maiores, com desenho quadrado ou marcante.",
    priceHint: "Modelos grandes",
    icon: "gem",
    order: 7,
  },
  {
    id: "conjunto-joias",
    name: "Conjunto de joias",
    description: "Conjunto em acabamento prata ou dourado.",
    priceHint: "Prata ou dourado",
    icon: "gem",
    order: 8,
  },
  {
    id: "blush-vult-perola-gold",
    name: "Blush Vult Pérola Gold",
    description: "Blush Vult na versão Pérola Gold.",
    priceHint: "Pérola Gold",
    icon: "flower",
    order: 9,
  },
  {
    id: "tenis-vizzano-branco",
    name: "Tênis branco Vizzano",
    description: "Tênis casual branco da Vizzano.",
    priceHint: "Branco",
    icon: "star",
    order: 10,
  },
];

export const SURPRISE_REVEAL_AT = "2026-09-11T04:00:00.000Z";
