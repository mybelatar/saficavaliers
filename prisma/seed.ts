import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const restaurantId = 'restaurant-1';

const categories = [
  { id: 'category-petit-dejeuner', name: 'Petit dejeuner' },
  { id: 'category-entrees', name: 'Entrees' },
  { id: 'category-salades', name: 'Salades' },
  { id: 'category-pastillas', name: 'Pastillas' },
  { id: 'category-supplements', name: 'Supplements' },
  { id: 'category-tagines', name: 'Tagines' },
  { id: 'category-tanjia', name: 'Tanjia' },
  { id: 'category-mechoui', name: 'Mechoui' },
  { id: 'category-plats', name: 'Couscous' },
  { id: 'category-desserts', name: 'Desserts' },
  { id: 'category-boissons', name: 'Boissons' }
];

function buildChickenPortionVariants(
  menuItemId: string,
  prices: { onePerson: number; twoPeople: number; fourPeople: number }
) {
  return [
    {
      id: `variant-${menuItemId}-1p`,
      menuItemId,
      name: '1 personne (1/4 poulet)',
      price: prices.onePerson,
      sortOrder: 0
    },
    {
      id: `variant-${menuItemId}-2p`,
      menuItemId,
      name: '2 personnes (1/2 poulet)',
      price: prices.twoPeople,
      sortOrder: 1
    },
    {
      id: `variant-${menuItemId}-4p`,
      menuItemId,
      name: '4 personnes (Poulet entier)',
      price: prices.fourPeople,
      sortOrder: 2
    }
  ];
}

function buildMeatPortionVariants(
  menuItemId: string,
  prices: { onePerson: number; twoPeople: number; fourPeople: number }
) {
  return [
    {
      id: `variant-${menuItemId}-1p`,
      menuItemId,
      name: '1 personne (1/4 kg)',
      price: prices.onePerson,
      sortOrder: 0
    },
    {
      id: `variant-${menuItemId}-2p`,
      menuItemId,
      name: '2 personnes (1/2 kg)',
      price: prices.twoPeople,
      sortOrder: 1
    },
    {
      id: `variant-${menuItemId}-4p`,
      menuItemId,
      name: '4 personnes (1 kg)',
      price: prices.fourPeople,
      sortOrder: 2
    }
  ];
}

function buildWeightVariants(
  menuItemId: string,
  prices: { quarterKg: number; halfKg: number; oneKg: number }
) {
  return [
    {
      id: `variant-${menuItemId}-quarter`,
      menuItemId,
      name: '1/4 kg',
      price: prices.quarterKg,
      sortOrder: 0
    },
    {
      id: `variant-${menuItemId}-half`,
      menuItemId,
      name: '1/2 kg',
      price: prices.halfKg,
      sortOrder: 1
    },
    {
      id: `variant-${menuItemId}-1kg`,
      menuItemId,
      name: '1 kg',
      price: prices.oneKg,
      sortOrder: 2
    }
  ];
}

const tables = [
  { id: 'table-1', number: 1, seats: 2 },
  { id: 'table-2', number: 2, seats: 4 },
  { id: 'table-3', number: 3, seats: 6 },
  { id: 'table-4', number: 4, seats: 2 },
  { id: 'table-5', number: 5, seats: 4 },
  { id: 'table-6', number: 6, seats: 8 }
];

const menuItems = [
  {
    id: 'menu-1',
    name: 'بسطيلة الدجاج - Pastilla au poulet',
    description: 'Feuillete croustillant garni de poulet, amandes, oeufs et epices marocaines.',
    price: 45,
    imageUrl: '/uploads/menu/pastilla-poulet.jpg',
    categoryId: 'category-pastillas'
  },
  {
    id: 'menu-2',
    name: 'حريرة - Harira',
    description: 'Soupe marocaine a la tomate, lentilles, pois chiches, coriandre et celeri.',
    price: 25,
    imageUrl: '/uploads/menu/harira.jpg',
    categoryId: 'category-entrees'
  },
  {
    id: 'menu-3',
    name: 'طاجين الدجاج المحمر بالزيتون و البطاطا المقلية - Tagine de poulet mhamar aux olives et frites',
    description: 'Poulet mhamar mijote aux olives et citron confit, servi avec frites croustillantes.',
    price: 45,
    imageUrl: '/uploads/menu/tagine-poulet-mhamer.jpg',
    categoryId: 'category-tagines'
  },
  {
    id: 'menu-4',
    name: 'طنجية الغنمي - Tanjia viande ghanmi (mouton)',
    description: 'Tanjia traditionnelle au mouton, confite lentement avec cumin, ail et citron confit.',
    price: 80,
    imageUrl: '/uploads/menu/tanjia-ghanmi.jpg',
    categoryId: 'category-tanjia'
  },
  {
    id: 'menu-5',
    name: 'كسكس ملكي - Couscous royal',
    description: 'Couscous aux legumes et viande, servi dans un esprit marocain traditionnel.',
    price: 75,
    imageUrl: '/uploads/menu/couscous-royal.jpg',
    categoryId: 'category-plats'
  },
  {
    id: 'menu-6',
    name: 'بسطيلة اللوز - Pastilla aux amandes',
    description: 'Pastilla sucree aux amandes, cannelle et sucre glace.',
    price: 35,
    imageUrl: '/uploads/menu/pastilla-amandes.jpg',
    categoryId: 'category-pastillas'
  },
  {
    id: 'menu-7',
    name: 'براد أتاي - The a la menthe',
    description: 'The traditionnel marocain servi en berad sghir, moyen ou kbir.',
    price: 10,
    imageUrl: '/uploads/menu/berad-atay-moyen.jpg',
    categoryId: 'category-boissons'
  },
  {
    id: 'menu-8',
    name: 'عصير لورانج - Jus d orange frais',
    description: 'Jus d orange frais presse, propose en plusieurs formats.',
    price: 20,
    imageUrl: '/uploads/menu/jus-orange.jpg',
    categoryId: 'category-boissons'
  },
  {
    id: 'menu-9',
    name: 'قهيوة - Cafe',
    description: 'Cafe servi selon votre choix: normal, italien, ristretto, noss noss et plus.',
    price: 12,
    imageUrl: '/uploads/menu/cafe-ristretto.jpg',
    categoryId: 'category-boissons'
  },
  {
    id: 'menu-10',
    name: 'حليب بالشوكولا - Lait au chocolat',
    description: 'Lait chaud ou froid au chocolat.',
    price: 20,
    imageUrl: '/uploads/menu/lait-chocolat.jpg',
    categoryId: 'category-boissons'
  },
  {
    id: 'menu-11',
    name: 'قهوة بالحليب - Cafe au lait',
    description: 'Lait melange avec cafe, onctueux et reconfortant.',
    price: 18,
    imageUrl: '/uploads/menu/lait-cafe.jpg',
    categoryId: 'category-boissons'
  },
  {
    id: 'menu-12',
    name: 'مسمن - Msemen',
    description: 'Galette marocaine traditionnelle, ideale au petit dejeuner.',
    price: 12,
    imageUrl: '/uploads/menu/msemen.jpg',
    categoryId: 'category-petit-dejeuner'
  },
  {
    id: 'menu-13',
    name: 'طاجين البقري بالبرقوق - Tagine bagri aux pruneaux',
    description: 'Boeuf mijote avec pruneaux, cannelle et amandes.',
    price: 70,
    imageUrl: '/uploads/menu/tagine-bagri-pruneaux.jpg',
    categoryId: 'category-tagines'
  },
  {
    id: 'menu-14',
    name: 'طنجية البقري - Tanjia viande bagri (boeuf)',
    description: 'Tanjia de boeuf cuite lentement avec epices de Marrakech.',
    price: 70,
    imageUrl: '/uploads/menu/tanjia-bagri.jpg',
    categoryId: 'category-tanjia'
  },
  {
    id: 'menu-15',
    name: 'طنجية الدجاج - Tanjia poulet',
    description: 'Poulet tendre cuit facon tanjia avec epices et citron confit.',
    price: 50,
    imageUrl: '/uploads/menu/tanjia-poulet.jpg',
    categoryId: 'category-tanjia'
  },
  {
    id: 'menu-16',
    name: 'طنجية الدجاج البلدي - Tanjia poulet beldi',
    description: 'Poulet beldi cuit lentement facon tanjia, gout plus riche et traditionnel.',
    price: 65,
    imageUrl: '/uploads/menu/tanjia-poulet-beldi.jpg',
    categoryId: 'category-tanjia'
  },
  {
    id: 'menu-17',
    name: 'طاجين الغنمي بالبرقوق - Tagine ghanmi aux pruneaux',
    description: 'Mouton mijote avec pruneaux, cannelle et amandes.',
    price: 80,
    imageUrl: '/uploads/menu/tagine-ghanmi-pruneaux.png',
    categoryId: 'category-tagines'
  },
  {
    id: 'menu-18',
    name: 'سلطة مغربية - Salade marocaine',
    description: 'Tomates, concombres, oignons et herbes fraiches assaisonnes a la marocaine.',
    price: 18,
    imageUrl: '/uploads/menu/salade-marocaine.jpg',
    categoryId: 'category-salades'
  },
  {
    id: 'menu-19',
    name: 'زعلوك - Zaalouk',
    description: 'Salade d aubergines grillees, tomates, ail, cumin et huile d olive.',
    price: 22,
    imageUrl: '/uploads/menu/zaalouk.jpg',
    categoryId: 'category-salades'
  },
  {
    id: 'menu-20',
    name: 'تكتوكة - Taktouka',
    description: 'Salade cuite de poivrons grilles et tomates avec ail et paprika.',
    price: 22,
    imageUrl: '/uploads/menu/taktouka.jpg',
    categoryId: 'category-salades'
  },
  {
    id: 'menu-21',
    name: 'سلطة الشمندر - Salade de betterave',
    description: 'Betterave assaisonnee au citron, cumin et herbes fraiches.',
    price: 20,
    imageUrl: '/uploads/menu/salade-betterave.webp',
    categoryId: 'category-salades'
  },
  {
    id: 'menu-22',
    name: 'حسوة البلبولة - Hssoua belboula',
    description: 'Bouillie chaude de belboula servie au petit dejeuner marocain.',
    price: 12,
    imageUrl: '/uploads/menu/hssoua.jpg',
    categoryId: 'category-petit-dejeuner'
  },
  {
    id: 'menu-23',
    name: 'فطور بلدي - Ftour beldi',
    description:
      'Composants: msemen, harcha, batbout, hssoua, zebda baldiya (beurre fermier), zit l3oud (huile d olive), 3ssal 7or (miel pur), olives et the a la menthe.',
    price: 45,
    imageUrl: '/uploads/menu/ftour-beldi.jpg',
    categoryId: 'category-petit-dejeuner'
  },
  {
    id: 'menu-24',
    name: 'فطور عادي - Ftour normal',
    description: 'Composants: msemen, pain ou batbout, beurre, confiture, fromage, boisson chaude et the.',
    price: 28,
    imageUrl: '/uploads/menu/ftour-normal.jpg',
    categoryId: 'category-petit-dejeuner'
  },
  {
    id: 'menu-25',
    name: 'فطور كامل - Petit dejeuner complet',
    description: 'Composants: msemen, harcha, batbout, oeufs, fromage, beurre, miel, jus d orange et boisson chaude.',
    price: 38,
    imageUrl: '/uploads/menu/petit-dejeuner-complet.jpg',
    categoryId: 'category-petit-dejeuner'
  },
  {
    id: 'menu-26',
    name: 'صحن بطاطا مقلية - Assiette de frites',
    description: 'Supplement frites a ajouter a vos plats.',
    price: 15,
    imageUrl: '/uploads/menu/assiette-frites.jpg',
    categoryId: 'category-supplements'
  },
  {
    id: 'menu-27',
    name: 'صحن زيتون - Assiette d olives',
    description: 'Supplement olives.',
    price: 10,
    imageUrl: '/uploads/menu/assiette-olives.jpg',
    categoryId: 'category-supplements'
  },
  {
    id: 'menu-28',
    name: 'هريسة حارة - Harissa (7ar)',
    description: 'Supplement harissa pimentee.',
    price: 4,
    imageUrl: '/uploads/menu/harissa.jpg',
    categoryId: 'category-supplements'
  },
  {
    id: 'menu-29',
    name: 'تمر - Tmar',
    description: 'Portion de dattes.',
    price: 10,
    imageUrl: '/uploads/menu/tmar.jpg',
    categoryId: 'category-supplements'
  },
  {
    id: 'menu-30',
    name: 'بسطيلة الحوت - Pastilla au poisson',
    description: 'Pastilla marocaine au poisson, herbes fraiches, citron confit et epices maison.',
    price: 65,
    imageUrl: '/uploads/menu/pastilla-poisson.webp',
    categoryId: 'category-pastillas'
  },
  {
    id: 'menu-31',
    name: 'بسطيلة فواكه البحر - Pastilla fruits de mer',
    description: 'Pastilla croustillante aux fruits de mer, crevettes et poisson, relevee d une chermoula marocaine.',
    price: 75,
    imageUrl: '/uploads/menu/pastilla-fruits-mer.jpg',
    categoryId: 'category-pastillas'
  },
  {
    id: 'menu-32',
    name: 'بسطيلة الحليب - Pastilla au lait',
    description: 'Pastilla sucree au lait et a la fleur d oranger, servie bien fraiche.',
    price: 32,
    imageUrl: '/uploads/menu/pastilla-lait.webp',
    categoryId: 'category-pastillas'
  },
  {
    id: 'menu-33',
    name: 'الخروف الملكي - Kharouf malaki',
    description: 'Mechoui d agneau facon Marrakech, cuisson lente en h ofra pour une viande fondante et fumee.',
    price: 95,
    imageUrl: '/uploads/menu/kharouf-malaki.webp',
    categoryId: 'category-mechoui'
  },
  {
    id: 'menu-34',
    name: 'الدجاج المدفون - Djaj medfoun',
    description: 'Poulet madfoun / mechoui cuit lentement comme dans la h ofra, parfume aux epices marocaines.',
    price: 55,
    imageUrl: '/uploads/menu/djaj-medfoun.jpg',
    categoryId: 'category-mechoui'
  },
  {
    id: 'menu-35',
    name: 'طاجين الدجاج البلدي المحمر بالزيتون و البطاطا المقلية - Tagine de poulet beldi mhamar aux olives et frites',
    description: 'Poulet beldi mhamar mijote aux olives et citron confit, servi avec frites croustillantes.',
    price: 60,
    imageUrl: '/uploads/menu/tagine-poulet-beldi-mhamar.jpg',
    categoryId: 'category-tagines'
  }
];

const menuItemVariants = [
  ...buildChickenPortionVariants('menu-3', { onePerson: 45, twoPeople: 85, fourPeople: 140 }),
  ...buildWeightVariants('menu-4', { quarterKg: 80, halfKg: 150, oneKg: 280 }),
  ...buildMeatPortionVariants('menu-5', { onePerson: 75, twoPeople: 140, fourPeople: 260 }),
  ...buildMeatPortionVariants('menu-13', { onePerson: 70, twoPeople: 130, fourPeople: 240 }),
  ...buildMeatPortionVariants('menu-17', { onePerson: 80, twoPeople: 150, fourPeople: 280 }),
  ...buildWeightVariants('menu-14', { quarterKg: 70, halfKg: 130, oneKg: 240 }),
  ...buildWeightVariants('menu-15', { quarterKg: 50, halfKg: 95, oneKg: 170 }),
  ...buildWeightVariants('menu-16', { quarterKg: 65, halfKg: 120, oneKg: 210 }),
  ...buildWeightVariants('menu-33', { quarterKg: 95, halfKg: 180, oneKg: 340 }),
  ...buildChickenPortionVariants('menu-34', { onePerson: 55, twoPeople: 100, fourPeople: 180 }),
  ...buildChickenPortionVariants('menu-35', { onePerson: 60, twoPeople: 110, fourPeople: 200 }),
  { id: 'variant-menu-8-1l', menuItemId: 'menu-8', name: '1L', price: 45, sortOrder: 0 },
  { id: 'variant-menu-8-50cl', menuItemId: 'menu-8', name: '50cl', price: 25, sortOrder: 1 },
  { id: 'variant-menu-8-can', menuItemId: 'menu-8', name: 'Canette', price: 18, sortOrder: 2 },
  { id: 'variant-menu-7-petit', menuItemId: 'menu-7', name: 'Petit (Berad sghir)', price: 10, sortOrder: 0 },
  { id: 'variant-menu-7-moyen', menuItemId: 'menu-7', name: 'Moyen (Berad moyen)', price: 15, sortOrder: 1 },
  { id: 'variant-menu-7-grand', menuItemId: 'menu-7', name: 'Grand (Berad kbir)', price: 22, sortOrder: 2 },
  { id: 'variant-menu-9-normal', menuItemId: 'menu-9', name: 'Normal', price: 12, sortOrder: 0 },
  { id: 'variant-menu-9-italien', menuItemId: 'menu-9', name: 'Italien', price: 16, sortOrder: 1 },
  { id: 'variant-menu-9-ristretto', menuItemId: 'menu-9', name: 'Ristretto', price: 16, sortOrder: 2 },
  { id: 'variant-menu-9-noss-noss', menuItemId: 'menu-9', name: 'Noss Noss', price: 14, sortOrder: 3 },
  { id: 'variant-menu-9-americain', menuItemId: 'menu-9', name: 'Americain', price: 14, sortOrder: 4 },
  { id: 'variant-menu-9-creme', menuItemId: 'menu-9', name: 'Cafe creme', price: 18, sortOrder: 5 },
  { id: 'variant-menu-9-cappuccino', menuItemId: 'menu-9', name: 'Cappuccino', price: 20, sortOrder: 6 }
];

const stockItems = [
  { id: 'stock-1', name: 'Tomates', quantity: 30, minQuantity: 12, unit: 'kg' },
  { id: 'stock-2', name: 'Pommes de terre', quantity: 50, minQuantity: 20, unit: 'kg' },
  { id: 'stock-3', name: 'Boeuf', quantity: 20, minQuantity: 10, unit: 'kg' },
  { id: 'stock-4', name: 'Coca-Cola', quantity: 100, minQuantity: 30, unit: 'bouteilles' }
];

async function main() {
  await prisma.restaurant.upsert({
    where: { id: restaurantId },
    update: {
      name: 'Dar Essalam - Restaurant Marocain'
    },
    create: {
      id: restaurantId,
      name: 'Dar Essalam - Restaurant Marocain'
    }
  });

  for (const category of categories) {
    await prisma.menuCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        restaurantId
      },
      create: {
        id: category.id,
        name: category.name,
        restaurantId
      }
    });
  }

  for (const table of tables) {
    await prisma.table.upsert({
      where: { id: table.id },
      update: {
        number: table.number,
        seats: table.seats,
        restaurantId
      },
      create: {
        id: table.id,
        number: table.number,
        seats: table.seats,
        restaurantId
      }
    });
  }

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: true,
        categoryId: item.categoryId,
        restaurantId
      },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: true,
        categoryId: item.categoryId,
        restaurantId
      }
    });
  }

  await prisma.menuItemVariant.deleteMany({
    where: {
      menuItemId: {
        in: [...new Set(menuItemVariants.map((variant) => variant.menuItemId))]
      }
    }
  });

  for (const variant of menuItemVariants) {
    await prisma.menuItemVariant.upsert({
      where: { id: variant.id },
      update: {
        name: variant.name,
        price: variant.price,
        available: true,
        sortOrder: variant.sortOrder,
        menuItemId: variant.menuItemId
      },
      create: {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        available: true,
        sortOrder: variant.sortOrder,
        menuItemId: variant.menuItemId
      }
    });
  }

  for (const stock of stockItems) {
    await prisma.stockItem.upsert({
      where: { id: stock.id },
      update: {
        name: stock.name,
        quantity: stock.quantity,
        minQuantity: stock.minQuantity,
        unit: stock.unit,
        restaurantId
      },
      create: {
        id: stock.id,
        name: stock.name,
        quantity: stock.quantity,
        minQuantity: stock.minQuantity,
        unit: stock.unit,
        restaurantId
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed termine.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
