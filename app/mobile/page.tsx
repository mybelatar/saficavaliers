'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import { StatCard } from './components/StatCard';
import { AccountingCard } from './components/AccountingCard';
import { StockItem } from './components/StockItem';
import { SimpleChart } from './components/SimpleChart';
import { ManagementModal } from './components/ManagementModal';
import { BilingualMenuName } from '../components/BilingualMenuName';
import { BrandSignature } from '../components/BrandSignature';
import { ROLE_STORAGE_KEY } from '../../lib/roles';
import { playNotificationSound, primeNotificationAudio } from '../../lib/notification-sound';
import { getStockLevelStatus } from '../../lib/stock';

type Trend = 'up' | 'down' | 'neutral';
type StockStatus = 'good' | 'warning' | 'critical';
type ManagerTab = 'stats' | 'accounting' | 'stock' | 'manage';
type ManageSection = 'articles' | 'payments' | 'stock' | 'tables' | 'reservations' | 'restaurant';
type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELED';
type SettlementStatus = 'PENDING' | 'PAID' | 'WAIVED' | 'CREDIT';
type SettlementCategory = 'CUSTOMER' | 'STAFF' | 'FAMILY' | 'FRIEND' | 'OTHER';

interface StatData {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

interface AccountingData {
  title: string;
  amount: number;
  subtitle?: string;
  trend?: Trend;
}

interface StockData {
  name: string;
  currentStock: number;
  minStock?: number;
  unit: string;
  status: StockStatus;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface DashboardSummary {
  monthRevenue: number;
  monthOrders: number;
  monthCompletedOrders: number;
  averageOrderValue: number;
}

interface DashboardPayload {
  stats: StatData[];
  accounting: AccountingData[];
  stock: StockData[];
  salesChart: ChartData[];
  popularItems: ChartData[];
  summary: DashboardSummary;
}

interface RestaurantInfo {
  id: string;
  name: string;
}

interface ManageCategory {
  id: string;
  name: string;
  menuItemCount: number;
}

interface ManageMenuItemVariant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  sortOrder: number;
}

interface ManageMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
  categoryName: string;
  variants: ManageMenuItemVariant[];
}

interface ManageStockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

interface ManageReservation {
  id: string;
  customerName: string;
  phone: string | null;
  partySize: number;
  reservedAt: string;
  status: ReservationStatus;
  notes: string | null;
  createdAt: string;
}

interface ManageTable {
  id: string;
  number: number;
  seats: number;
  orderCount: number;
}

interface ManageOrder {
  id: string;
  tableId: string | null;
  tableNumber: number | null;
  status: OrderStatus;
  settlementStatus: SettlementStatus;
  settlementCategory: SettlementCategory;
  settlementReference: string | null;
  settlementNote: string | null;
  creditDueAt: string | null;
  paidAt: string | null;
  total: number;
  placedAt: string;
  itemCount: number;
}

interface OrderSettlementDraft {
  settlementStatus: SettlementStatus;
  settlementCategory: SettlementCategory;
  settlementReference: string;
  settlementNote: string;
  creditDueAt: string;
}

interface ManagementPayload {
  restaurant: RestaurantInfo | null;
  categories: ManageCategory[];
  menuItems: ManageMenuItem[];
  stockItems: ManageStockItem[];
  reservations: ManageReservation[];
  tables: ManageTable[];
  orders: ManageOrder[];
}

interface ManagerNotification {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS' | 'STOCK_ALERT' | 'RESERVATION_UPDATE';
  message: string;
  createdAt: string;
  status?: string;
}

interface MenuFormState {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  available: boolean;
  categoryId: string;
  variants: MenuVariantFormState[];
}

interface MenuVariantFormState {
  id?: string;
  name: string;
  price: string;
  available: boolean;
  sortOrder: number;
}

interface StockFormState {
  name: string;
  quantity: string;
  minQuantity: string;
  unit: string;
}

interface TableFormState {
  number: string;
  seats: string;
}

interface ReservationFormState {
  customerName: string;
  phone: string;
  partySize: string;
  reservedAt: string;
  status: ReservationStatus;
  notes: string;
}

const INITIAL_MENU_FORM: MenuFormState = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  available: true,
  categoryId: '',
  variants: []
};

const CHICKEN_PORTION_PRESET = [
  '1 personne (1/4 poulet)',
  '2 personnes (1/2 poulet)',
  '4 personnes (Poulet entier)'
];

const MEAT_PORTION_PRESET = [
  '1 personne (1/4 kg)',
  '2 personnes (1/2 kg)',
  '4 personnes (1 kg)'
];

function createEmptyVariantForm(sortOrder = 0): MenuVariantFormState {
  return {
    name: '',
    price: '',
    available: true,
    sortOrder
  };
}

const INITIAL_STOCK_FORM: StockFormState = {
  name: '',
  quantity: '',
  minQuantity: '',
  unit: 'kg'
};

const INITIAL_TABLE_FORM: TableFormState = {
  number: '',
  seats: ''
};

const INITIAL_RESERVATION_FORM: ReservationFormState = {
  customerName: '',
  phone: '',
  partySize: '',
  reservedAt: '',
  status: 'PENDING',
  notes: ''
};

const MANAGE_SECTIONS: Array<{ key: ManageSection; label: string }> = [
  { key: 'articles', label: 'Articles' },
  { key: 'payments', label: 'Paiements' },
  { key: 'stock', label: 'Stock' },
  { key: 'tables', label: 'Tables' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'restaurant', label: 'Restaurant' }
];

const RESERVATION_STATUSES: ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW'
];
const SETTLEMENT_STATUSES: SettlementStatus[] = ['PENDING', 'PAID', 'WAIVED', 'CREDIT'];
const SETTLEMENT_CATEGORIES: SettlementCategory[] = ['CUSTOMER', 'STAFF', 'FAMILY', 'FRIEND', 'OTHER'];

function reservationStatusLabel(status: ReservationStatus) {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'CONFIRMED':
      return 'Confirmee';
    case 'SEATED':
      return 'Installee';
    case 'COMPLETED':
      return 'Terminee';
    case 'CANCELED':
      return 'Annulee';
    case 'NO_SHOW':
      return 'Absente';
    default:
      return status;
  }
}

function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'IN_PROGRESS':
      return 'En preparation';
    case 'READY':
      return 'Pret';
    case 'COMPLETED':
      return 'Termine';
    case 'CANCELED':
      return 'Annule';
    default:
      return status;
  }
}

function reservationStatusClass(status: ReservationStatus) {
  switch (status) {
    case 'CONFIRMED':
    case 'SEATED':
    case 'COMPLETED':
      return 'theme-text-success';
    case 'CANCELED':
    case 'NO_SHOW':
      return 'theme-text-danger';
    case 'PENDING':
    default:
      return 'theme-text-warning';
  }
}

function settlementStatusLabel(status: SettlementStatus) {
  switch (status) {
    case 'PENDING':
      return 'Non regle';
    case 'PAID':
      return 'Paye';
    case 'WAIVED':
      return 'Offert';
    case 'CREDIT':
      return 'Credit';
    default:
      return status;
  }
}

function settlementStatusClass(status: SettlementStatus) {
  switch (status) {
    case 'PAID':
      return 'theme-badge-success';
    case 'WAIVED':
      return 'theme-badge-info';
    case 'CREDIT':
      return 'theme-badge-warning';
    case 'PENDING':
    default:
      return 'theme-badge-danger';
  }
}

function settlementCategoryLabel(category: SettlementCategory) {
  switch (category) {
    case 'CUSTOMER':
      return 'Client';
    case 'STAFF':
      return 'Personnel';
    case 'FAMILY':
      return 'Famille';
    case 'FRIEND':
      return 'Ami';
    case 'OTHER':
      return 'Autre';
    default:
      return category;
  }
}

function toDatetimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoFromDatetimeLocal(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function parseApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function formatCategoryDeleteError(message: string) {
  if (message.includes('Cannot delete category with menu items')) {
    return 'Impossible de supprimer cette categorie car elle contient encore des articles. Reaffecte ou supprime d abord les articles du menu.';
  }

  if (message.includes('Category not found')) {
    return 'Categorie introuvable.';
  }

  return 'Echec suppression categorie.';
}

function toSettlementDraft(order: ManageOrder): OrderSettlementDraft {
  return {
    settlementStatus: order.settlementStatus,
    settlementCategory: order.settlementCategory,
    settlementReference: order.settlementReference ?? '',
    settlementNote: order.settlementNote ?? '',
    creditDueAt: toDatetimeLocalValue(order.creditDueAt ?? '')
  };
}

const textCollator = new Intl.Collator('fr-MA', {
  numeric: true,
  sensitivity: 'base'
});

function sortCategories(items: ManageCategory[]) {
  return [...items].sort((left, right) => textCollator.compare(left.name, right.name));
}

function sortMenuItems(items: ManageMenuItem[]) {
  return [...items].sort((left, right) => {
    const categoryComparison = textCollator.compare(left.categoryName, right.categoryName);
    if (categoryComparison !== 0) {
      return categoryComparison;
    }

    return textCollator.compare(left.name, right.name);
  });
}

function sortStockItems(items: ManageStockItem[]) {
  return [...items].sort((left, right) => textCollator.compare(left.name, right.name));
}

function sortReservations(items: ManageReservation[]) {
  return [...items].sort((left, right) => {
    const reservationDiff = new Date(left.reservedAt).getTime() - new Date(right.reservedAt).getTime();
    if (reservationDiff !== 0) {
      return reservationDiff;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function sortTables(items: ManageTable[]) {
  return [...items].sort((left, right) => left.number - right.number);
}

function sortOrders(items: ManageOrder[]) {
  return [...items].sort(
    (left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime()
  );
}

function toDashboardStockItem(item: ManageStockItem): StockData {
  return {
    name: item.name,
    currentStock: item.quantity,
    minStock: item.minQuantity,
    unit: item.unit,
    status: getStockLevelStatus(item.quantity, item.minQuantity)
  };
}

function normalizeManageOrder(
  order: Omit<ManageOrder, 'itemCount'> & { itemCount?: number; items?: unknown[] }
): ManageOrder {
  return {
    id: order.id,
    tableId: order.tableId ?? null,
    tableNumber: typeof order.tableNumber === 'number' ? order.tableNumber : null,
    status: order.status,
    settlementStatus: order.settlementStatus,
    settlementCategory: order.settlementCategory,
    settlementReference: order.settlementReference ?? null,
    settlementNote: order.settlementNote ?? null,
    creditDueAt: order.creditDueAt ?? null,
    paidAt: order.paidAt ?? null,
    total: order.total,
    placedAt: order.placedAt,
    itemCount:
      typeof order.itemCount === 'number' ? order.itemCount : Array.isArray(order.items) ? order.items.length : 0
  };
}

export default function MobilePage() {
  const soundPreferenceKey = 'restaurant_notification_sound_manager';

  const [activeTab, setActiveTab] = useState<ManagerTab>('stats');
  const [activeManageSection, setActiveManageSection] = useState<ManageSection>('articles');
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [accountingData, setAccountingData] = useState<AccountingData[]>([]);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [popularItemsData, setPopularItemsData] = useState<ChartData[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    monthRevenue: 0,
    monthOrders: 0,
    monthCompletedOrders: 0,
    averageOrderValue: 0
  });

  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<ManageCategory[]>([]);
  const [menuItems, setMenuItems] = useState<ManageMenuItem[]>([]);
  const [stockItems, setStockItems] = useState<ManageStockItem[]>([]);
  const [reservations, setReservations] = useState<ManageReservation[]>([]);
  const [tables, setTables] = useState<ManageTable[]>([]);
  const [orders, setOrders] = useState<ManageOrder[]>([]);
  const [orderSettlementDrafts, setOrderSettlementDrafts] = useState<Record<string, OrderSettlementDraft>>({});
  const [notifications, setNotifications] = useState<ManagerNotification[]>([]);

  const [restaurantNameDraft, setRestaurantNameDraft] = useState('');
  const [categoryNameDraft, setCategoryNameDraft] = useState('');
  const [menuForm, setMenuForm] = useState<MenuFormState>(INITIAL_MENU_FORM);
  const [stockForm, setStockForm] = useState<StockFormState>(INITIAL_STOCK_FORM);
  const [tableForm, setTableForm] = useState<TableFormState>(INITIAL_TABLE_FORM);
  const [reservationForm, setReservationForm] = useState<ReservationFormState>(INITIAL_RESERVATION_FORM);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [editingStockItemId, setEditingStockItemId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [managementLoading, setManagementLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasManagerProfile, setHasManagerProfile] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to fetch dashboard'));
      }

      const payload = (await response.json()) as DashboardPayload;
      setStatsData(payload.stats);
      setAccountingData(payload.accounting);
      setStockData(payload.stock);
      setSalesChartData(payload.salesChart);
      setPopularItemsData(payload.popularItems);
      setSummary(payload.summary);
      setDashboardError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setDashboardError('Impossible de charger les statistiques en temps reel.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManagement = useCallback(async () => {
    setManagementLoading(true);

    try {
      const response = await fetch('/api/admin/management', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to fetch management data'));
      }

      const payload = (await response.json()) as ManagementPayload;
      setRestaurantInfo(payload.restaurant);
      setRestaurantNameDraft(payload.restaurant?.name ?? '');
      setCategories(payload.categories);
      setMenuItems(payload.menuItems);
      setStockItems(payload.stockItems);
      setReservations(payload.reservations);
      setTables(payload.tables);
      setOrders(payload.orders);
      setOrderSettlementDrafts(
        payload.orders.reduce<Record<string, OrderSettlementDraft>>((accumulator, order) => {
          accumulator[order.id] = toSettlementDraft(order);
          return accumulator;
        }, {})
      );
      setMenuForm((previous) => ({
        ...previous,
        categoryId: previous.categoryId || payload.categories[0]?.id || ''
      }));
      setManagementError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setManagementError('Impossible de charger les donnees de gestion.');
    } finally {
      setManagementLoading(false);
    }
  }, []);

  const playSoundForNotification = useCallback(
    (notification: ManagerNotification) => {
      if (!soundEnabled) {
        return;
      }

      if (notification.type === 'STOCK_ALERT') {
        void playNotificationSound('STOCK_ALERT');
        return;
      }

      if (notification.type === 'RESERVATION_UPDATE') {
        void playNotificationSound('RESERVATION');
        return;
      }

      if (notification.type === 'NEW_ORDER') {
        void playNotificationSound('NEW_ORDER');
        return;
      }

      if (notification.type === 'ORDER_STATUS' && notification.status === 'READY') {
        void playNotificationSound('ORDER_READY');
        return;
      }

      void playNotificationSound('STATUS_CHANGED');
    },
    [soundEnabled]
  );

  useEffect(() => {
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    setHasManagerProfile(role === 'MANAGER');
    const savedSound = localStorage.getItem(soundPreferenceKey);
    if (savedSound === 'false') {
      setSoundEnabled(false);
    }
    setProfileChecked(true);
  }, []);

  useEffect(() => {
    if (!hasManagerProfile) {
      return;
    }

    void loadDashboard();
  }, [hasManagerProfile, loadDashboard]);

  useEffect(() => {
    if (!hasManagerProfile || activeTab !== 'manage') {
      return;
    }

    void loadManagement();
  }, [activeTab, hasManagerProfile, loadManagement]);

  useEffect(() => {
    if (!hasManagerProfile || !soundEnabled) {
      return;
    }

    void primeNotificationAudio();

    const unlockAudio = () => {
      void primeNotificationAudio();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [hasManagerProfile, soundEnabled]);

  useEffect(() => {
    if (!hasManagerProfile) {
      return;
    }

    const eventSource = new EventSource('/api/notifications/stream?role=MANAGER');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ManagerNotification;
        setNotifications((previous) => [payload, ...previous].slice(0, 6));
        playSoundForNotification(payload);
      } catch (parseError) {
        console.error('Invalid manager notification payload:', parseError);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [hasManagerProfile, playSoundForNotification]);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    setMenuForm((previous) => {
      if (previous.categoryId) {
        return previous;
      }

      return {
        ...previous,
        categoryId: categories[0].id
      };
    });
  }, [categories]);

  const toggleSound = () => {
    setSoundEnabled((previous) => {
      const nextValue = !previous;
      localStorage.setItem(soundPreferenceKey, String(nextValue));
      if (nextValue) {
        void primeNotificationAudio();
      }
      return nextValue;
    });
  };

  const updateStockCollections = (nextStockItems: ManageStockItem[]) => {
    const sortedStockItems = sortStockItems(nextStockItems);
    setStockItems(sortedStockItems);
    setStockData(sortedStockItems.map(toDashboardStockItem));
  };

  const resetCategoryForm = () => {
    setCategoryNameDraft('');
    setEditingCategoryId(null);
  };

  const openRestaurantModal = () => {
    setRestaurantNameDraft(restaurantInfo?.name ?? '');
    setIsRestaurantModalOpen(true);
  };

  const closeRestaurantModal = (force = false) => {
    if (!force && actionLoading) {
      return;
    }

    setRestaurantNameDraft(restaurantInfo?.name ?? '');
    setIsRestaurantModalOpen(false);
  };

  const openCreateCategoryModal = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: ManageCategory) => {
    setEditingCategoryId(category.id);
    setCategoryNameDraft(category.name);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = (force = false) => {
    if (!force && actionLoading) {
      return;
    }

    resetCategoryForm();
    setIsCategoryModalOpen(false);
  };

  const resetMenuForm = (fallbackCategoryId?: string) => {
    setMenuForm({
      ...INITIAL_MENU_FORM,
      categoryId: fallbackCategoryId ?? categories[0]?.id ?? ''
    });
    setEditingMenuItemId(null);
  };

  const openCreateMenuModal = () => {
    resetMenuForm(categories[0]?.id ?? '');
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item: ManageMenuItem) => {
    setEditingMenuItemId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      imageUrl: item.imageUrl ?? '',
      available: item.available,
      categoryId: item.categoryId,
      variants: item.variants.map((variant, index) => ({
        id: variant.id,
        name: variant.name,
        price: String(variant.price),
        available: variant.available,
        sortOrder: variant.sortOrder ?? index
      }))
    });
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = (force = false) => {
    if (!force && (actionLoading || uploadingPhoto)) {
      return;
    }

    resetMenuForm();
    setIsMenuModalOpen(false);
  };

  const addVariantToMenuForm = () => {
    setMenuForm((previous) => ({
      ...previous,
      variants: [...previous.variants, createEmptyVariantForm(previous.variants.length)]
    }));
  };

  const applyVariantPreset = (presetNames: string[]) => {
    setMenuForm((previous) => ({
      ...previous,
      variants: presetNames.map((name, index) => ({
        ...createEmptyVariantForm(index),
        name
      }))
    }));
  };

  const updateVariantInMenuForm = <K extends keyof Omit<MenuVariantFormState, 'id'>>(
    index: number,
    field: K,
    value: Omit<MenuVariantFormState, 'id'>[K]
  ) => {
    setMenuForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariantFromMenuForm = (index: number) => {
    setMenuForm((previous) => ({
      ...previous,
      variants: previous.variants
        .filter((_, variantIndex) => variantIndex !== index)
        .map((variant, variantIndex) => ({
          ...variant,
          sortOrder: variantIndex
        }))
    }));
  };

  const resetStockForm = () => {
    setStockForm(INITIAL_STOCK_FORM);
    setEditingStockItemId(null);
  };

  const openCreateStockModal = () => {
    resetStockForm();
    setIsStockModalOpen(true);
  };

  const openEditStockModal = (item: ManageStockItem) => {
    setEditingStockItemId(item.id);
    setStockForm({
      name: item.name,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      unit: item.unit
    });
    setIsStockModalOpen(true);
  };

  const closeStockModal = (force = false) => {
    if (!force && actionLoading) {
      return;
    }

    resetStockForm();
    setIsStockModalOpen(false);
  };

  const resetTableForm = () => {
    setTableForm(INITIAL_TABLE_FORM);
    setEditingTableId(null);
  };

  const openCreateTableModal = () => {
    resetTableForm();
    setIsTableModalOpen(true);
  };

  const openEditTableModal = (table: ManageTable) => {
    setEditingTableId(table.id);
    setTableForm({
      number: String(table.number),
      seats: String(table.seats)
    });
    setIsTableModalOpen(true);
  };

  const closeTableModal = (force = false) => {
    if (!force && actionLoading) {
      return;
    }

    resetTableForm();
    setIsTableModalOpen(false);
  };

  const resetReservationForm = () => {
    setReservationForm(INITIAL_RESERVATION_FORM);
    setEditingReservationId(null);
  };

  const openCreateReservationModal = () => {
    resetReservationForm();
    setIsReservationModalOpen(true);
  };

  const openEditReservationModal = (reservation: ManageReservation) => {
    setEditingReservationId(reservation.id);
    setReservationForm({
      customerName: reservation.customerName,
      phone: reservation.phone ?? '',
      partySize: String(reservation.partySize),
      reservedAt: toDatetimeLocalValue(reservation.reservedAt),
      status: reservation.status,
      notes: reservation.notes ?? ''
    });
    setIsReservationModalOpen(true);
  };

  const closeReservationModal = (force = false) => {
    if (!force && actionLoading) {
      return;
    }

    resetReservationForm();
    setIsReservationModalOpen(false);
  };

  const saveRestaurantInfo = async () => {
    const name = restaurantNameDraft.trim();
    if (!name) {
      alert('Le nom du restaurant est obligatoire.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/restaurant', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurantInfo?.id,
          name
        })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save restaurant info'));
      }

      const payload = (await response.json()) as { restaurant: RestaurantInfo };
      setRestaurantInfo(payload.restaurant);
      setRestaurantNameDraft(payload.restaurant.name);
      closeRestaurantModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec de sauvegarde des informations du restaurant.');
    } finally {
      setActionLoading(false);
    }
  };

  const saveCategory = async () => {
    const name = categoryNameDraft.trim();
    if (!name) {
      alert('Le nom de categorie est obligatoire.');
      return;
    }

    setActionLoading(true);
    try {
      const response = editingCategoryId
        ? await fetch(`/api/admin/categories/${editingCategoryId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          })
        : await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: restaurantInfo?.id,
              name
            })
          });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save category'));
      }

      const payload = (await response.json()) as { id: string; name: string };
      const previousCategory = editingCategoryId
        ? categories.find((category) => category.id === editingCategoryId) ?? null
        : null;
      const nextCategory: ManageCategory = {
        id: payload.id,
        name: payload.name,
        menuItemCount: previousCategory?.menuItemCount ?? 0
      };

      setCategories((previous) =>
        sortCategories(
          editingCategoryId
            ? previous.map((category) => (category.id === nextCategory.id ? nextCategory : category))
            : [...previous, nextCategory]
        )
      );

      if (editingCategoryId) {
        setMenuItems((previous) =>
          sortMenuItems(
            previous.map((item) =>
              item.categoryId === nextCategory.id ? { ...item, categoryName: nextCategory.name } : item
            )
          )
        );
      }

      closeCategoryModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec sauvegarde categorie.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Supprimer cette categorie ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        alert(formatCategoryDeleteError(await parseApiError(response, 'Failed to delete category')));
        return;
      }

      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }

      const nextCategories = categories.filter((category) => category.id !== categoryId);
      setCategories(sortCategories(nextCategories));
      if (menuForm.categoryId === categoryId) {
        setMenuForm((previous) => ({
          ...previous,
          categoryId: nextCategories[0]?.id ?? ''
        }));
      }
    } catch (deleteError) {
      console.error('Unexpected category deletion error:', deleteError);
      alert('Echec suppression categorie.');
    } finally {
      setActionLoading(false);
    }
  };

  const saveMenuItem = async () => {
    const name = menuForm.name.trim();
    const hasTypedPrice = menuForm.price.trim() !== '';
    const parsedPrice = hasTypedPrice ? Number(menuForm.price) : null;
    const variants = menuForm.variants
      .map((variant, index) => ({
        name: variant.name.trim(),
        priceRaw: variant.price.trim(),
        available: variant.available,
        sortOrder: index
      }))
      .filter((variant) => variant.name !== '' || variant.priceRaw !== '');

    if (!name || !menuForm.categoryId) {
      alert('Nom et categorie sont obligatoires.');
      return;
    }

    if (hasTypedPrice && (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      alert('Le prix de base doit etre un nombre valide (>= 0).');
      return;
    }

    const normalizedVariants: Array<{
      name: string;
      price: number;
      available: boolean;
      sortOrder: number;
    }> = [];

    for (const variant of variants) {
      if (!variant.name || variant.priceRaw === '') {
        alert('Chaque option doit avoir un nom et un prix.');
        return;
      }

      const variantPrice = Number(variant.priceRaw);
      if (!Number.isFinite(variantPrice) || variantPrice < 0) {
        alert('Le prix de chaque option doit etre un nombre valide (>= 0).');
        return;
      }

      normalizedVariants.push({
        name: variant.name,
        price: variantPrice,
        available: variant.available,
        sortOrder: variant.sortOrder
      });
    }

    if (normalizedVariants.length === 0 && (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      alert('Ajoutez un prix de base ou au moins une option avec prix.');
      return;
    }

    setActionLoading(true);
    try {
      const fallbackPriceFromVariants =
        normalizedVariants.length > 0
          ? normalizedVariants.reduce((min, variant) => Math.min(min, variant.price), normalizedVariants[0].price)
          : null;

      const payload = {
        name,
        description: menuForm.description.trim() || null,
        price: parsedPrice ?? fallbackPriceFromVariants,
        imageUrl: menuForm.imageUrl.trim() || null,
        available: menuForm.available,
        categoryId: menuForm.categoryId,
        restaurantId: restaurantInfo?.id,
        variants: normalizedVariants
      };

      const response = editingMenuItemId
        ? await fetch(`/api/admin/menu-items/${editingMenuItemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/admin/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save menu item'));
      }

      const savedItem = (await response.json()) as ManageMenuItem;
      const previousItem = editingMenuItemId
        ? menuItems.find((item) => item.id === editingMenuItemId) ?? null
        : null;

      setMenuItems((previous) =>
        sortMenuItems(
          editingMenuItemId
            ? previous.map((item) => (item.id === savedItem.id ? savedItem : item))
            : [...previous, savedItem]
        )
      );

      setCategories((previous) =>
        sortCategories(
          previous.map((category) => {
            let menuItemCount = category.menuItemCount;

            if (!previousItem && category.id === savedItem.categoryId) {
              menuItemCount += 1;
            }

            if (previousItem && previousItem.categoryId !== savedItem.categoryId) {
              if (category.id === previousItem.categoryId) {
                menuItemCount = Math.max(0, menuItemCount - 1);
              }

              if (category.id === savedItem.categoryId) {
                menuItemCount += 1;
              }
            }

            return {
              ...category,
              menuItemCount
            };
          })
        )
      );

      closeMenuModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec sauvegarde article menu.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMenuItem = async (menuItemId: string) => {
    if (!confirm('Supprimer cet article du menu ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/menu-items/${menuItemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to delete menu item'));
      }

      const payload = (await response.json()) as {
        deleted?: boolean;
        deactivated?: boolean;
      };
      const previousItem = menuItems.find((item) => item.id === menuItemId) ?? null;

      if (editingMenuItemId === menuItemId) {
        resetMenuForm();
      }

      if (payload.deleted === false && payload.deactivated) {
        setMenuItems((previous) =>
          sortMenuItems(
            previous.map((item) => (item.id === menuItemId ? { ...item, available: false } : item))
          )
        );
      } else {
        setMenuItems((previous) => sortMenuItems(previous.filter((item) => item.id !== menuItemId)));
        if (previousItem) {
          setCategories((previous) =>
            sortCategories(
              previous.map((category) =>
                category.id === previousItem.categoryId
                  ? { ...category, menuItemCount: Math.max(0, category.menuItemCount - 1) }
                  : category
              )
            )
          );
        }
      }
    } catch (deleteError) {
      console.error(deleteError);
      alert('Echec suppression article menu.');
    } finally {
      setActionLoading(false);
    }
  };

  const uploadMenuPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to upload photo'));
      }

      const payload = (await response.json()) as { url: string };
      setMenuForm((previous) => ({
        ...previous,
        imageUrl: payload.url
      }));
    } catch (uploadError) {
      console.error(uploadError);
      alert('Echec upload photo article.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveStockItem = async () => {
    const name = stockForm.name.trim();
    const unit = stockForm.unit.trim();
    const quantity = Number(stockForm.quantity);
    const minQuantity = Number(stockForm.minQuantity || 0);

    if (
      !name ||
      !unit ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isFinite(minQuantity) ||
      minQuantity < 0
    ) {
      alert('Nom, unite, quantite et seuil mini valides sont obligatoires.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name,
        unit,
        quantity,
        minQuantity,
        restaurantId: restaurantInfo?.id
      };

      const response = editingStockItemId
        ? await fetch(`/api/admin/stock-items/${editingStockItemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/admin/stock-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save stock item'));
      }

      const savedStockItem = (await response.json()) as ManageStockItem;
      const previousStockItem = editingStockItemId
        ? stockItems.find((item) => item.id === editingStockItemId) ?? null
        : null;
      updateStockCollections(
        editingStockItemId
          ? stockItems.map((item) =>
              item.id === savedStockItem.id
                ? {
                    ...savedStockItem,
                    minQuantity: savedStockItem.minQuantity ?? previousStockItem?.minQuantity ?? 0
                  }
                : item
            )
          : [...stockItems, savedStockItem]
      );

      closeStockModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec sauvegarde article stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteStockItem = async (stockItemId: string) => {
    if (!confirm('Supprimer cet article stock ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/stock-items/${stockItemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to delete stock item'));
      }

      if (editingStockItemId === stockItemId) {
        resetStockForm();
      }

      updateStockCollections(stockItems.filter((item) => item.id !== stockItemId));
    } catch (deleteError) {
      console.error(deleteError);
      alert('Echec suppression article stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const saveTable = async () => {
    const number = Number(tableForm.number);
    const seats = Number(tableForm.seats);

    if (!Number.isInteger(number) || number <= 0 || !Number.isInteger(seats) || seats <= 0) {
      alert('Numero de table et nombre de places doivent etre des entiers positifs.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        restaurantId: restaurantInfo?.id,
        number,
        seats
      };

      const response = editingTableId
        ? await fetch(`/api/admin/tables/${editingTableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/admin/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save table'));
      }

      const tableResponse = (await response.json()) as { id: string; number: number; seats: number };
      const previousTable = editingTableId ? tables.find((table) => table.id === editingTableId) ?? null : null;
      const savedTable: ManageTable = {
        id: tableResponse.id,
        number: tableResponse.number,
        seats: tableResponse.seats,
        orderCount: previousTable?.orderCount ?? 0
      };

      setTables((previous) =>
        sortTables(
          editingTableId
            ? previous.map((table) => (table.id === savedTable.id ? savedTable : table))
            : [...previous, savedTable]
        )
      );

      closeTableModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec sauvegarde table.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Supprimer cette table ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to delete table'));
      }

      if (editingTableId === tableId) {
        resetTableForm();
      }

      setTables((previous) => sortTables(previous.filter((table) => table.id !== tableId)));
    } catch (deleteError) {
      console.error(deleteError);
      alert('Echec suppression table.');
    } finally {
      setActionLoading(false);
    }
  };

  const saveReservation = async () => {
    const customerName = reservationForm.customerName.trim();
    const phone = reservationForm.phone.trim();
    const notes = reservationForm.notes.trim();
    const partySize = Number(reservationForm.partySize);
    const reservedAt = toIsoFromDatetimeLocal(reservationForm.reservedAt);

    if (!customerName || !Number.isInteger(partySize) || partySize <= 0 || !reservedAt) {
      alert('Nom client, nombre de personnes et date de reservation valides sont obligatoires.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        restaurantId: restaurantInfo?.id,
        customerName,
        phone: phone || null,
        partySize,
        reservedAt,
        status: reservationForm.status,
        notes: notes || null
      };

      const response = editingReservationId
        ? await fetch(`/api/admin/reservations/${editingReservationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/admin/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to save reservation'));
      }

      const reservationResponse = (await response.json()) as {
        id: string;
        customerName: string;
        phone: string | null;
        partySize: number;
        reservedAt: string;
        status: ReservationStatus;
        notes: string | null;
        createdAt?: string;
      };
      const previousReservation = editingReservationId
        ? reservations.find((reservation) => reservation.id === editingReservationId) ?? null
        : null;
      const savedReservation: ManageReservation = {
        id: reservationResponse.id,
        customerName: reservationResponse.customerName,
        phone: reservationResponse.phone,
        partySize: reservationResponse.partySize,
        reservedAt: reservationResponse.reservedAt,
        status: reservationResponse.status,
        notes: reservationResponse.notes,
        createdAt: reservationResponse.createdAt ?? previousReservation?.createdAt ?? new Date().toISOString()
      };

      setReservations((previous) =>
        sortReservations(
          editingReservationId
            ? previous.map((reservation) => (reservation.id === savedReservation.id ? savedReservation : reservation))
            : [...previous, savedReservation]
        )
      );

      closeReservationModal(true);
    } catch (saveError) {
      console.error(saveError);
      alert('Echec sauvegarde reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('Supprimer cette reservation ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to delete reservation'));
      }

      if (editingReservationId === reservationId) {
        resetReservationForm();
      }

      setReservations((previous) => sortReservations(previous.filter((reservation) => reservation.id !== reservationId)));
    } catch (deleteError) {
      console.error(deleteError);
      alert('Echec suppression reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateReservationStatus = async (reservation: ManageReservation, status: ReservationStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to update reservation status'));
      }

      const payload = (await response.json()) as {
        id: string;
        customerName: string;
        phone: string | null;
        partySize: number;
        reservedAt: string;
        status: ReservationStatus;
        notes: string | null;
        createdAt?: string;
      };
      const updatedReservation: ManageReservation = {
        id: payload.id,
        customerName: payload.customerName,
        phone: payload.phone,
        partySize: payload.partySize,
        reservedAt: payload.reservedAt,
        status: payload.status,
        notes: payload.notes,
        createdAt: payload.createdAt ?? reservation.createdAt
      };

      setReservations((previous) =>
        sortReservations(
          previous.map((currentReservation) =>
            currentReservation.id === updatedReservation.id ? updatedReservation : currentReservation
          )
        )
      );
    } catch (updateError) {
      console.error(updateError);
      alert('Echec mise a jour statut reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderSettlementDraft = <K extends keyof OrderSettlementDraft>(
    orderId: string,
    field: K,
    value: OrderSettlementDraft[K]
  ) => {
    setOrderSettlementDrafts((previous) => ({
      ...previous,
      [orderId]: {
        ...(previous[orderId] ?? {
          settlementStatus: 'PENDING',
          settlementCategory: 'CUSTOMER',
          settlementReference: '',
          settlementNote: '',
          creditDueAt: ''
        }),
        [field]: value
      }
    }));
  };

  const saveOrderSettlement = async (orderId: string) => {
    const draft = orderSettlementDrafts[orderId];
    if (!draft) {
      return;
    }

    const creditDueAtIso = draft.settlementStatus === 'CREDIT' ? toIsoFromDatetimeLocal(draft.creditDueAt) : null;
    if (draft.settlementStatus === 'CREDIT' && !creditDueAtIso) {
      alert('Pour un credit, indiquez une date limite de paiement valide.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        orderId,
        settlementStatus: draft.settlementStatus,
        settlementCategory: draft.settlementCategory,
        settlementReference: draft.settlementReference.trim() || null,
        settlementNote: draft.settlementNote.trim() || null,
        creditDueAt: draft.settlementStatus === 'CREDIT' ? creditDueAtIso : null
      };

      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to update order settlement'));
      }

      const orderResponse = (await response.json()) as Omit<ManageOrder, 'itemCount'> & {
        itemCount?: number;
        items?: unknown[];
      };
      const updatedOrder = normalizeManageOrder(orderResponse);

      setOrders((previous) =>
        sortOrders(previous.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
      );
      setOrderSettlementDrafts((previous) => ({
        ...previous,
        [updatedOrder.id]: toSettlementDraft(updatedOrder)
      }));

      await loadDashboard();
    } catch (updateError) {
      console.error(updateError);
      alert('Echec mise a jour reglement commande.');
    } finally {
      setActionLoading(false);
    }
  };

  const criticalStockCount = stockData.filter((item) => item.status === 'critical').length;

  if (!profileChecked) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)]">
        <p>Chargement du profil...</p>
      </main>
    );
  }

  if (!hasManagerProfile) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)]">
        <div className="theme-card max-w-md rounded-3xl p-8 text-center">
          <h1 className="theme-card-strong font-display mb-3 text-4xl">Profil manager requis</h1>
          <p className="theme-card-soft-text mb-6">
            Cette vue est reservee au suivi global. Selectionnez le profil Manager sur cette tablette.
          </p>
          <Link href="/" className="theme-action inline-flex rounded-xl px-4 py-2 text-white">
            Choisir un profil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell px-4 py-4 text-[var(--ink-950)]">
      <div className="mx-auto max-w-5xl">
        <section className="page-hero mb-5 rounded-[1.6rem] p-4 text-center sm:p-5">
          <div className="relative z-10 space-y-3">
            <BrandSignature center compact />
            <div className="flex justify-center">
              <span className="section-kicker">Manager</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl text-[var(--ink-950)] sm:text-4xl">Pilotage du restaurant</h1>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-700)]">Ventes, stock, reservations</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="theme-chip">Operations</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={toggleSound}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  soundEnabled ? 'theme-action' : 'theme-action-secondary'
                }`}
              >
                Son {soundEnabled ? 'ON' : 'OFF'}
              </button>
              <Link href="/" className="theme-action-secondary rounded-full px-4 py-2 text-xs">
                Changer profil
              </Link>
            </div>
          </div>
        </section>

        <div className="text-center mb-5">
          <h2 className="font-display text-3xl text-[var(--ink-950)] sm:text-4xl">Tableau de bord manager</h2>
        </div>

        {notifications.length > 0 && (
          <div className="space-y-2 mb-6">
            {notifications.map((notification) => (
              <div key={notification.id} className="theme-card-soft rounded-xl p-3">
                <p className="theme-card-strong text-sm">{notification.message}</p>
                <p className="theme-card-muted text-xs">
                  {new Date(notification.createdAt).toLocaleTimeString('fr-MA')}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="theme-tabbar mb-6 grid grid-cols-2 gap-2 rounded-3xl p-2 sm:grid-cols-4">
          {[
            { key: 'stats', label: 'Stats' },
            { key: 'accounting', label: 'Compta' },
            { key: 'stock', label: 'Stock' },
            { key: 'manage', label: 'Gestion' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ManagerTab)}
              className={`py-3 px-3 rounded-2xl text-xs font-medium transition-colors ${
                activeTab === tab.key ? 'theme-tab-active' : 'theme-tab hover:text-[var(--ink-950)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && activeTab !== 'manage' ? (
          <div className="text-center py-12">
            <p className="text-[var(--ink-700)]">Chargement des donnees...</p>
          </div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {dashboardError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                    <p className="theme-text-danger">{dashboardError}</p>
                    <button onClick={() => void loadDashboard()} className="theme-text-danger mt-2 text-sm underline">
                      Reessayer
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {statsData.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                  ))}
                </div>

                <SimpleChart title="Ventes 7 derniers jours" data={salesChartData} type="bar" />
                <SimpleChart title="Plats les plus commandes" data={popularItemsData} type="bar" />
              </div>
            )}

            {activeTab === 'accounting' && (
              <div className="space-y-6">
                {dashboardError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                    <p className="theme-text-danger">{dashboardError}</p>
                    <button onClick={() => void loadDashboard()} className="theme-text-danger mt-2 text-sm underline">
                      Reessayer
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {accountingData.map((item, index) => (
                    <AccountingCard key={index} {...item} />
                  ))}
                </div>

                <div className="theme-card rounded-3xl p-6">
                  <h3 className="theme-panel-title mb-4">Resume mensuel</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="theme-card-soft-text">Commandes du mois</span>
                      <span className="theme-card-strong">{summary.monthOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="theme-card-soft-text">Commandes terminees</span>
                      <span className="theme-text-success">{summary.monthCompletedOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="theme-card-soft-text">Chiffre d affaires</span>
                      <span className="theme-card-strong">{summary.monthRevenue.toLocaleString('fr-MA')} MAD</span>
                    </div>
                    <div className="mt-3 border-t border-[rgba(215,175,105,0.12)] pt-3">
                      <div className="flex justify-between font-semibold">
                        <span className="theme-card-strong">Ticket moyen</span>
                        <span className="theme-text-success">
                          {summary.averageOrderValue.toLocaleString('fr-MA')} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <div className="space-y-6">
                {dashboardError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                    <p className="theme-text-danger">{dashboardError}</p>
                    <button onClick={() => void loadDashboard()} className="theme-text-danger mt-2 text-sm underline">
                      Reessayer
                    </button>
                  </div>
                )}
                {criticalStockCount > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-3xl p-4">
                    <div>
                      <h3 className="theme-text-danger font-semibold">Alerte stock critique</h3>
                      <p className="theme-text-danger text-sm">
                        {criticalStockCount} ingredient(s) necessitent un reapprovisionnement urgent.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {stockData.map((item, index) => (
                    <StockItem key={index} {...item} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-6">
                {managementError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                    <p className="theme-text-danger">{managementError}</p>
                    <button onClick={() => void loadManagement()} className="theme-text-danger mt-2 text-sm underline">
                      Reessayer
                    </button>
                  </div>
                )}

                {managementLoading ? (
                  <div className="text-center py-12">
                    <p className="text-[var(--ink-700)]">Chargement des donnees de gestion...</p>
                  </div>
                ) : (
                  <>
                    <div className="theme-tabbar rounded-3xl p-3">
                      <p className="theme-panel-soft px-2 pb-3 text-xs uppercase tracking-wide">
                        Sous-menu de gestion
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {MANAGE_SECTIONS.map((section) => (
                          <button
                            key={section.key}
                            onClick={() => setActiveManageSection(section.key)}
                            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                              activeManageSection === section.key
                                ? 'theme-tab-active'
                                : 'theme-tab theme-action-secondary'
                            }`}
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeManageSection === 'restaurant' && (
                      <div className="theme-panel-surface rounded-3xl p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="theme-panel-strong text-lg font-semibold">Informations restaurant</h3>
                            <p className="theme-panel-muted mt-1 text-sm">
                              {restaurantInfo?.name || 'Nom du restaurant non renseigne.'}
                            </p>
                          </div>
                          <button
                            disabled={actionLoading}
                            onClick={openRestaurantModal}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Modifier
                          </button>
                        </div>
                      </div>
                    )}

                    {activeManageSection === 'articles' && (
                      <>
                        <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="theme-panel-strong text-lg font-semibold">Categories menu</h3>
                            <button
                              disabled={actionLoading}
                              onClick={openCreateCategoryModal}
                              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Ajouter categorie
                            </button>
                          </div>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <div key={category.id} className="theme-panel-item rounded-xl p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="theme-panel-strong font-medium">{category.name}</p>
                                    <p className="theme-panel-muted text-xs">{category.menuItemCount} article(s)</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openEditCategoryModal(category)}
                                      className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => void deleteCategory(category.id)}
                                      disabled={category.menuItemCount > 0}
                                      className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                                {category.menuItemCount > 0 && (
                                  <p className="theme-text-warning mt-2 text-[11px]">
                                    Suppression bloquee: cette categorie contient encore des articles.
                                  </p>
                                )}
                              </div>
                            ))}
                            {categories.length === 0 && <p className="theme-panel-soft text-sm">Aucune categorie.</p>}
                          </div>
                        </div>

                        <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="theme-panel-strong text-lg font-semibold">Articles menu</h3>
                            <button
                              disabled={actionLoading}
                              onClick={openCreateMenuModal}
                              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Ajouter article
                            </button>
                          </div>

                          <div className="space-y-2">
                            {menuItems.map((item) => (
                              <div key={item.id} className="theme-panel-item rounded-xl p-3">
                                <div className="flex gap-3">
                                  {item.imageUrl ? (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className="h-16 w-16 rounded-lg object-cover border border-slate-600"
                                    />
                                  ) : (
                                    <div className="theme-surface-placeholder h-16 w-16 rounded-lg" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <BilingualMenuName
                                      name={item.name}
                                      frenchClassName="theme-panel-strong font-medium"
                                      arabicClassName="theme-text-warning font-medium"
                                    />
                                    <p className="theme-panel-muted text-xs">{item.categoryName}</p>
                                    <p className="theme-panel-soft text-xs">
                                      {item.price.toLocaleString('fr-MA', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}{' '}
                                      MAD
                                    </p>
                                    <p className={`text-xs ${item.available ? 'theme-text-success' : 'theme-text-danger'}`}>
                                      {item.available ? 'Disponible' : 'Indisponible'}
                                    </p>
                                    {item.variants.length > 0 && (
                                      <p className="theme-panel-soft mt-1 text-xs">
                                        Options:{' '}
                                        {item.variants
                                          .map((variant) => `${variant.name} (${variant.price.toFixed(2)} MAD)`)
                                          .join(' | ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => openEditMenuModal(item)}
                                    className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => void deleteMenuItem(item.id)}
                                    className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            ))}
                            {menuItems.length === 0 && <p className="theme-panel-soft text-sm">Aucun article menu.</p>}
                          </div>
                        </div>
                      </>
                    )}

                    {activeManageSection === 'stock' && (
                      <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="theme-panel-strong text-lg font-semibold">Articles stock</h3>
                          <button
                            disabled={actionLoading}
                            onClick={openCreateStockModal}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Ajouter stock
                          </button>
                        </div>
                        <div className="space-y-2">
                          {stockItems.map((item) => (
                            <div key={item.id} className="theme-panel-item rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="theme-panel-strong font-medium">{item.name}</p>
                                  <p className="theme-panel-muted text-xs">
                                    {item.quantity} {item.unit} (min {item.minQuantity})
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditStockModal(item)}
                                  className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                >
                                  Modifier
                                </button>
                                  <button
                                    onClick={() => void deleteStockItem(item.id)}
                                    className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {stockItems.length === 0 && <p className="theme-panel-soft text-sm">Aucun article stock.</p>}
                        </div>
                      </div>
                    )}

                    {activeManageSection === 'tables' && (
                      <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="theme-panel-strong text-lg font-semibold">Tables</h3>
                          <button
                            disabled={actionLoading}
                            onClick={openCreateTableModal}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Ajouter table
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tables.map((table) => (
                            <div key={table.id} className="theme-panel-item rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="theme-panel-strong font-medium">Table {table.number}</p>
                                  <p className="theme-panel-muted text-xs">
                                    {table.seats} places - {table.orderCount} commande(s) liee(s)
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditTableModal(table)}
                                  className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                >
                                  Modifier
                                </button>
                                  <button
                                    onClick={() => void deleteTable(table.id)}
                                    className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {tables.length === 0 && <p className="theme-panel-soft text-sm">Aucune table.</p>}
                        </div>
                      </div>
                    )}

                    {activeManageSection === 'payments' && (
                      <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                        <h3 className="theme-panel-strong text-lg font-semibold">Suivi paiements commandes</h3>
                        <p className="theme-panel-muted text-xs">
                          Marquez chaque commande comme payee, offerte, en credit ou non reglee, avec la personne
                          concernee.
                        </p>
                        <div className="space-y-3">
                          {orders.map((order) => {
                            const draft = orderSettlementDrafts[order.id] ?? toSettlementDraft(order);
                            return (
                              <div key={order.id} className="theme-panel-item rounded-xl p-3 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="theme-panel-strong font-medium">
                                      {order.tableNumber ? `Table ${order.tableNumber}` : 'Sans table'} -{' '}
                                      {order.total.toLocaleString('fr-MA', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}{' '}
                                      MAD
                                    </p>
                                    <p className="theme-panel-muted text-xs">
                                      {order.itemCount} article(s) - {new Date(order.placedAt).toLocaleString('fr-MA')}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      <span className="theme-pill rounded-full px-2 py-0.5 text-xs">
                                        Commande: {orderStatusLabel(order.status)}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-xs ${settlementStatusClass(
                                          order.settlementStatus
                                        )}`}
                                      >
                                        Reglement: {settlementStatusLabel(order.settlementStatus)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={draft.settlementStatus}
                                    onChange={(event) =>
                                      updateOrderSettlementDraft(
                                        order.id,
                                        'settlementStatus',
                                        event.target.value as SettlementStatus
                                      )
                                    }
                                    className="theme-field rounded-xl px-3 py-2 text-xs"
                                  >
                                    {SETTLEMENT_STATUSES.map((status) => (
                                      <option key={status} value={status}>
                                        {settlementStatusLabel(status)}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    value={draft.settlementCategory}
                                    onChange={(event) =>
                                      updateOrderSettlementDraft(
                                        order.id,
                                        'settlementCategory',
                                        event.target.value as SettlementCategory
                                      )
                                    }
                                    className="theme-field rounded-xl px-3 py-2 text-xs"
                                  >
                                    {SETTLEMENT_CATEGORIES.map((category) => (
                                      <option key={category} value={category}>
                                        {settlementCategoryLabel(category)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <input
                                  value={draft.settlementReference}
                                  onChange={(event) =>
                                    updateOrderSettlementDraft(order.id, 'settlementReference', event.target.value)
                                  }
                                  placeholder="Offert / credit pour: nom personne, personnel, famille..."
                                  className="theme-field w-full rounded-xl px-3 py-2 text-xs"
                                />

                                {draft.settlementStatus === 'CREDIT' && (
                                  <input
                                    value={draft.creditDueAt}
                                    onChange={(event) =>
                                      updateOrderSettlementDraft(order.id, 'creditDueAt', event.target.value)
                                    }
                                    type="datetime-local"
                                    className="theme-field w-full rounded-xl px-3 py-2 text-xs"
                                  />
                                )}

                                <textarea
                                  value={draft.settlementNote}
                                  onChange={(event) =>
                                    updateOrderSettlementDraft(order.id, 'settlementNote', event.target.value)
                                  }
                                  placeholder="Note (ex: personnel service soir, ami de la famille, client habituel en credit...)"
                                  rows={2}
                                  className="theme-field w-full rounded-xl px-3 py-2 text-xs resize-none"
                                />

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      updateOrderSettlementDraft(order.id, 'settlementStatus', 'PAID')
                                    }
                                    className="theme-action-success-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Marquer paye
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateOrderSettlementDraft(order.id, 'settlementStatus', 'WAIVED')
                                    }
                                    className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Marquer offert
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateOrderSettlementDraft(order.id, 'settlementStatus', 'CREDIT')
                                    }
                                    className="theme-action-warning-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Marquer credit
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateOrderSettlementDraft(order.id, 'settlementStatus', 'PENDING')
                                    }
                                    className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Non regle
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <p className="theme-panel-muted text-[11px]">
                                    {order.paidAt
                                      ? `Paye le ${new Date(order.paidAt).toLocaleString('fr-MA')}`
                                      : 'Paiement non confirme'}
                                    {order.creditDueAt
                                      ? ` - Echeance credit ${new Date(order.creditDueAt).toLocaleString('fr-MA')}`
                                      : ''}
                                  </p>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => void saveOrderSettlement(order.id)}
                                    className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                                  >
                                    Enregistrer
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {orders.length === 0 && (
                            <p className="theme-panel-soft text-sm">Aucune commande enregistree pour le moment.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeManageSection === 'reservations' && (
                      <div className="theme-panel-surface rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="theme-panel-strong text-lg font-semibold">Reservations</h3>
                          <button
                            disabled={actionLoading}
                            onClick={openCreateReservationModal}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Ajouter reservation
                          </button>
                        </div>

                        <div className="space-y-2">
                          {reservations.map((reservation) => (
                            <div key={reservation.id} className="theme-panel-item rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="theme-panel-strong truncate font-medium">{reservation.customerName}</p>
                                  <p className="theme-panel-muted text-xs">
                                    {reservation.partySize} pers. -{' '}
                                    {new Date(reservation.reservedAt).toLocaleString('fr-MA')}
                                  </p>
                                  <p className="theme-panel-muted text-xs">
                                    {reservation.phone || 'Telephone non renseigne'}
                                  </p>
                                  <p className={`text-xs ${reservationStatusClass(reservation.status)}`}>
                                    {reservationStatusLabel(reservation.status)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditReservationModal(reservation)}
                                    className="theme-action-info-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => void deleteReservation(reservation.id)}
                                    className="theme-action-danger-soft rounded-lg px-3 py-1 text-xs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(['CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED'] as ReservationStatus[]).map((status) => (
                                  <button
                                    key={status}
                                    disabled={reservation.status === status}
                                    onClick={() => void updateReservationStatus(reservation, status)}
                                    className={`rounded-lg px-2 py-1 text-xs ${
                                      reservation.status === status
                                        ? 'theme-badge-success'
                                        : 'theme-pill'
                                    }`}
                                  >
                                    {reservationStatusLabel(status)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {reservations.length === 0 && <p className="theme-panel-soft text-sm">Aucune reservation.</p>}
                        </div>
                      </div>
                    )}

                    <ManagementModal
                      title="Informations restaurant"
                      isOpen={isRestaurantModalOpen}
                      onClose={closeRestaurantModal}
                      maxWidthClassName="max-w-xl"
                    >
                      <div className="space-y-3">
                        <input
                          value={restaurantNameDraft}
                          onChange={(event) => setRestaurantNameDraft(event.target.value)}
                          placeholder="Nom du restaurant"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={actionLoading}
                            onClick={() => void saveRestaurantInfo()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Enregistrer
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => closeRestaurantModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>

                    <ManagementModal
                      title={editingCategoryId ? 'Modifier categorie' : 'Ajouter categorie'}
                      isOpen={isCategoryModalOpen}
                      onClose={closeCategoryModal}
                      maxWidthClassName="max-w-xl"
                    >
                      <div className="space-y-3">
                        <input
                          value={categoryNameDraft}
                          onChange={(event) => setCategoryNameDraft(event.target.value)}
                          placeholder="Nom categorie"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={actionLoading}
                            onClick={() => void saveCategory()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editingCategoryId ? 'Mettre a jour' : 'Ajouter'}
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => closeCategoryModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>

                    <ManagementModal
                      title={editingMenuItemId ? 'Modifier article menu' : 'Ajouter article menu'}
                      isOpen={isMenuModalOpen}
                      onClose={closeMenuModal}
                    >
                      <div className="space-y-2">
                        <input
                          value={menuForm.name}
                          onChange={(event) =>
                            setMenuForm((previous) => ({ ...previous, name: event.target.value }))
                          }
                          placeholder="Nom article"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <textarea
                          value={menuForm.description}
                          onChange={(event) =>
                            setMenuForm((previous) => ({ ...previous, description: event.target.value }))
                          }
                          placeholder="Description"
                          rows={2}
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm resize-none"
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            value={menuForm.price}
                            onChange={(event) =>
                              setMenuForm((previous) => ({ ...previous, price: event.target.value }))
                            }
                            placeholder="Prix base MAD"
                            type="number"
                            min="0"
                            step="0.01"
                            className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                          />
                          <select
                            value={menuForm.categoryId}
                            onChange={(event) =>
                              setMenuForm((previous) => ({ ...previous, categoryId: event.target.value }))
                            }
                            className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                          >
                            <option value="">Categorie</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="theme-panel-item rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="theme-panel-strong text-sm font-medium">Options / Formats rapides</p>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                disabled={actionLoading}
                                onClick={() => applyVariantPreset(CHICKEN_PORTION_PRESET)}
                                className="theme-action-info-soft rounded-lg px-3 py-1 text-xs disabled:opacity-60"
                              >
                                Preset poulet
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => applyVariantPreset(MEAT_PORTION_PRESET)}
                                className="theme-action-warning-soft rounded-lg px-3 py-1 text-xs disabled:opacity-60"
                              >
                                Preset viande
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={addVariantToMenuForm}
                                className="theme-action-success-soft rounded-lg px-3 py-1 text-xs disabled:opacity-60"
                              >
                                + Ajouter option
                              </button>
                            </div>
                          </div>
                          <p className="theme-panel-muted text-xs">
                            Pour le service en salle, utilise des libelles lisibles: 1 personne (1/4 kg), 2
                            personnes (1/2 kg), 4 personnes (1 kg), ou 1 personne (1/4 poulet).
                          </p>
                          {menuForm.variants.length === 0 && (
                            <p className="theme-panel-soft text-xs">
                              Aucune option definie. Dans ce cas, le prix de base sera utilise.
                            </p>
                          )}
                          <div className="space-y-2">
                            {menuForm.variants.map((variant, index) => (
                              <div key={`${variant.id ?? 'new'}-${index}`} className="theme-panel-item rounded-lg p-2">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                                  <input
                                    value={variant.name}
                                    onChange={(event) =>
                                      updateVariantInMenuForm(index, 'name', event.target.value)
                                    }
                                    placeholder="Option (1 personne, 1/4 kg, 1/2 poulet...)"
                                    className="theme-field-compact rounded-lg px-2 py-1 text-xs sm:col-span-2"
                                  />
                                  <input
                                    value={variant.price}
                                    onChange={(event) =>
                                      updateVariantInMenuForm(index, 'price', event.target.value)
                                    }
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Prix MAD"
                                    className="theme-field-compact rounded-lg px-2 py-1 text-xs"
                                  />
                                  <label className="theme-field-compact flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={variant.available}
                                      onChange={(event) =>
                                        updateVariantInMenuForm(index, 'available', event.target.checked)
                                      }
                                    />
                                    Dispo
                                  </label>
                                  <button
                                    onClick={() => removeVariantFromMenuForm(index)}
                                    className="theme-action-danger-soft rounded-lg px-2 py-1 text-xs"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <input
                          value={menuForm.imageUrl}
                          onChange={(event) =>
                            setMenuForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                          }
                          placeholder="URL photo (/uploads/menu/... ou https://...)"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                          <label className="theme-field rounded-xl px-3 py-2 text-sm cursor-pointer">
                            {uploadingPhoto ? 'Upload...' : 'Televerser photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void uploadMenuPhoto(event)}
                              disabled={uploadingPhoto}
                            />
                          </label>
                          <label className="theme-panel-muted flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={menuForm.available}
                              onChange={(event) =>
                                setMenuForm((previous) => ({ ...previous, available: event.target.checked }))
                              }
                            />
                            Disponible
                          </label>
                        </div>
                        {menuForm.imageUrl && (
                          <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-700">
                            <Image src={menuForm.imageUrl} alt="Preview article" fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            disabled={actionLoading || uploadingPhoto}
                            onClick={() => void saveMenuItem()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editingMenuItemId ? 'Mettre a jour' : 'Ajouter'}
                          </button>
                          <button
                            disabled={actionLoading || uploadingPhoto}
                            onClick={() => closeMenuModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>

                    <ManagementModal
                      title={editingStockItemId ? 'Modifier article stock' : 'Ajouter article stock'}
                      isOpen={isStockModalOpen}
                      onClose={closeStockModal}
                      maxWidthClassName="max-w-2xl"
                    >
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          <input
                            value={stockForm.name}
                            onChange={(event) =>
                              setStockForm((previous) => ({ ...previous, name: event.target.value }))
                            }
                            placeholder="Nom"
                            className="theme-field rounded-xl px-3 py-2 text-sm sm:col-span-2"
                          />
                          <input
                            value={stockForm.quantity}
                            onChange={(event) =>
                              setStockForm((previous) => ({ ...previous, quantity: event.target.value }))
                            }
                            placeholder="Qt"
                            type="number"
                            min="0"
                            className="theme-field rounded-xl px-3 py-2 text-sm"
                          />
                          <input
                            value={stockForm.minQuantity}
                            onChange={(event) =>
                              setStockForm((previous) => ({ ...previous, minQuantity: event.target.value }))
                            }
                            placeholder="Min"
                            type="number"
                            min="0"
                            className="theme-field rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <input
                          value={stockForm.unit}
                          onChange={(event) =>
                            setStockForm((previous) => ({ ...previous, unit: event.target.value }))
                          }
                          placeholder="Unite (kg, litres, pieces...)"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            disabled={actionLoading}
                            onClick={() => void saveStockItem()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editingStockItemId ? 'Mettre a jour' : 'Ajouter'}
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => closeStockModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>

                    <ManagementModal
                      title={editingTableId ? 'Modifier table' : 'Ajouter table'}
                      isOpen={isTableModalOpen}
                      onClose={closeTableModal}
                      maxWidthClassName="max-w-xl"
                    >
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            value={tableForm.number}
                            onChange={(event) =>
                              setTableForm((previous) => ({ ...previous, number: event.target.value }))
                            }
                            placeholder="Numero table"
                            type="number"
                            min="1"
                            className="theme-field rounded-xl px-3 py-2 text-sm"
                          />
                          <input
                            value={tableForm.seats}
                            onChange={(event) =>
                              setTableForm((previous) => ({ ...previous, seats: event.target.value }))
                            }
                            placeholder="Nombre de places"
                            type="number"
                            min="1"
                            className="theme-field rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            disabled={actionLoading}
                            onClick={() => void saveTable()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editingTableId ? 'Mettre a jour' : 'Ajouter'}
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => closeTableModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>

                    <ManagementModal
                      title={editingReservationId ? 'Modifier reservation' : 'Ajouter reservation'}
                      isOpen={isReservationModalOpen}
                      onClose={closeReservationModal}
                      maxWidthClassName="max-w-2xl"
                    >
                      <div className="space-y-2">
                        <input
                          value={reservationForm.customerName}
                          onChange={(event) =>
                            setReservationForm((previous) => ({ ...previous, customerName: event.target.value }))
                          }
                          placeholder="Nom client"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            value={reservationForm.phone}
                            onChange={(event) =>
                              setReservationForm((previous) => ({ ...previous, phone: event.target.value }))
                            }
                            placeholder="Telephone"
                            className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                          />
                          <input
                            value={reservationForm.partySize}
                            onChange={(event) =>
                              setReservationForm((previous) => ({ ...previous, partySize: event.target.value }))
                            }
                            placeholder="Personnes"
                            type="number"
                            min="1"
                            className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <input
                          value={reservationForm.reservedAt}
                          onChange={(event) =>
                            setReservationForm((previous) => ({ ...previous, reservedAt: event.target.value }))
                          }
                          type="datetime-local"
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <select
                          value={reservationForm.status}
                          onChange={(event) =>
                            setReservationForm((previous) => ({
                              ...previous,
                              status: event.target.value as ReservationStatus
                            }))
                          }
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm"
                        >
                          {RESERVATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {reservationStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={reservationForm.notes}
                          onChange={(event) =>
                            setReservationForm((previous) => ({ ...previous, notes: event.target.value }))
                          }
                          placeholder="Notes"
                          rows={2}
                          className="theme-field w-full rounded-xl px-3 py-2 text-sm resize-none"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            disabled={actionLoading}
                            onClick={() => void saveReservation()}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editingReservationId ? 'Mettre a jour' : 'Ajouter'}
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => closeReservationModal()}
                            className="theme-action-secondary rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </ManagementModal>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
