'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  FolderPlus,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type { Category, MenuItem, MenuMediaItem } from '@/types/database';
import { cn, formatCurrencyBRL, generateUUID } from '@/lib/utils';

interface MenuManagementViewProps {
  restaurantId: string;
  items: MenuItem[];
  categories: Category[];
  initialEditItemId?: string | null;
  onClearEditRequest?: () => void;
  onSaveItems: (updated: MenuItem[]) => void;
  onSaveCategories: (updated: Category[]) => void;
  onResetDefaults: () => void;
}

const AVAILABLE_BADGES = [
  'Best Seller',
  'Novo',
  'Sugestão do Chef',
  'Fornada Quente',
  'Fermentação Natural 48h',
  'Edição Limitada',
  'Vegano',
];

export function MenuManagementView({
  restaurantId,
  items,
  categories,
  initialEditItemId,
  onClearEditRequest,
  onSaveItems,
  onSaveCategories,
  onResetDefaults,
}: MenuManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Category creation state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Dish Form State
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPriceBRL, setFormPriceBRL] = useState('48,90');
  const [formDescription, setFormDescription] = useState('');
  const [formPairing, setFormPairing] = useState('');
  const [formPrepMinutes, setFormPrepMinutes] = useState('10');
  const [formCalories, setFormCalories] = useState('520');
  const [formBadges, setFormBadges] = useState<string[]>(['Novo']);
  const [formAllergens, setFormAllergens] = useState('Glúten (Trigo), Lactose');
  const [formIngredients, setFormIngredients] = useState(
    'Farinha italiana Tipo 00, Levain 48h, Azeite extravirgem'
  );
  const [formMediaType, setFormMediaType] = useState<'video' | 'image'>('image');
  const [formMediaUrl, setFormMediaUrl] = useState(
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80'
  );
  const [formPosterUrl, setFormPosterUrl] = useState(
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80'
  );
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(true);

  const openEditorForItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategoryId(item.category_id);
    setFormPriceBRL((item.price_cents / 100).toFixed(2).replace('.', ','));
    setFormDescription(item.description);
    setFormPairing(item.pairing_suggestion || '');
    setFormPrepMinutes(String(item.prep_time_minutes || 10));
    setFormCalories(String(item.calories || 450));
    setFormBadges(item.badges);
    setFormAllergens(item.allergens.join(', '));
    setFormIngredients(item.ingredients.join(', '));
    const primaryMedia = item.media_urls[0];
    setFormMediaType(primaryMedia?.type || 'image');
    setFormMediaUrl(primaryMedia?.url || '');
    setFormPosterUrl(primaryMedia?.poster || primaryMedia?.url || '');
    setFormIsAvailable(item.is_available);
    setFormIsFeatured(Boolean(item.is_featured));
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategoryId(
      categories.find((c) => c.slug !== 'destaques')?.id ||
        categories[0]?.id ||
        'cat-focaccias'
    );
    setFormPriceBRL('44,90');
    setFormDescription('');
    setFormPairing('Harmoniza com Espresso Tonic Siciliano');
    setFormPrepMinutes('8');
    setFormCalories('490');
    setFormBadges(['Novo', 'Sugestão do Chef']);
    setFormAllergens('Glúten (Trigo), Lactose');
    setFormIngredients('Massa de fermentação natural 48h, Queijo artesanal, Flor de sal');
    setFormMediaType('image');
    setFormMediaUrl(
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80'
    );
    setFormPosterUrl(
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80'
    );
    setFormIsAvailable(true);
    setFormIsFeatured(true);
    setIsModalOpen(true);
  };

  // Handle jump-to-edit triggered from Behavioral Intelligence view
  useEffect(() => {
    if (initialEditItemId) {
      const target = items.find((i) => i.id === initialEditItemId);
      if (target) {
        openEditorForItem(target);
      }
      onClearEditRequest?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditItemId]);

  const handleToggleAvailability = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, is_available: !item.is_available } : item
    );
    onSaveItems(updated);
  };

  const handleToggleFeatured = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, is_featured: !item.is_featured } : item
    );
    onSaveItems(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    onSaveItems(updated);
  };

  const handleToggleBadgeInForm = (badge: string) => {
    setFormBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const normalizedPrice = Number(
      formPriceBRL.replace(/[^\d.,]/g, '').replace(',', '.')
    );
    const priceCents = Number.isFinite(normalizedPrice)
      ? Math.round(normalizedPrice * 100)
      : 3990;

    const primaryMedia: MenuMediaItem = {
      id: `media-${generateUUID().slice(0, 8)}`,
      type: formMediaType,
      url: formMediaUrl.trim(),
      poster:
        formMediaType === 'video'
          ? formPosterUrl.trim() || formMediaUrl.trim()
          : undefined,
      alt: formName.trim(),
      aspectRatio: '9:16',
    };

    const existingExtraMedia = editingItem
      ? editingItem.media_urls.slice(1)
      : [];

    const payload: MenuItem = {
      id: editingItem ? editingItem.id : `item-${generateUUID().slice(0, 8)}`,
      restaurant_id: restaurantId,
      category_id: formCategoryId || categories[0]?.id || 'cat-focaccias',
      name: formName.trim(),
      description: formDescription.trim(),
      price_cents: priceCents,
      media_urls: [primaryMedia, ...existingExtraMedia],
      badges: formBadges,
      allergens: formAllergens
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      ingredients: formIngredients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      prep_time_minutes: Number(formPrepMinutes) || 8,
      calories: Number(formCalories) || 450,
      pairing_suggestion: formPairing.trim() || undefined,
      is_available: formIsAvailable,
      is_featured: formIsFeatured,
      sort_order: editingItem ? editingItem.sort_order : items.length + 1,
      likes_initial_count: editingItem?.likes_initial_count ?? 85,
    };

    if (editingItem) {
      onSaveItems(items.map((i) => (i.id === editingItem.id ? payload : i)));
    } else {
      onSaveItems([payload, ...items]);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    const newCat: Category = {
      id: `cat-${generateUUID().slice(0, 8)}`,
      restaurant_id: restaurantId,
      name: newCategoryName.trim(),
      slug,
      icon_name: 'Sparkles',
      sort_order: categories.length + 1,
      is_active: true,
    };

    onSaveCategories([...categories, newCat]);
    setNewCategoryName('');
    setShowCategoryForm(false);
  };

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      categoryFilter === 'all' || item.category_id === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.badges.some((b) => b.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-5 rounded-3xl bg-obsidian-900 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">
            Gestão de Cardápio & Disponibilidade em Tempo Real
          </h2>
          <p className="text-xs text-zinc-400">
            Qualquer alteração de preço, vídeo ou toggle de &ldquo;Esgotado&rdquo; reflete instantaneamente no cardápio social `/nomade-bistro`.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCategoryForm((prev) => !prev)}
            className="px-3.5 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-xs font-bold text-zinc-200 flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>+ Nova Categoria</span>
          </button>

          <button
            type="button"
            onClick={onResetDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
            title="Restaurar cardápio padrão de demonstração"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Demo</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-brand/25 hover:brightness-110"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Prato / Vídeo</span>
          </button>
        </div>
      </div>

      {/* Quick Category Creator */}
      {showCategoryForm && (
        <form
          onSubmit={handleAddCategory}
          className="p-4 rounded-2xl bg-obsidian-900 border border-amber-500/40 flex flex-col sm:flex-row items-center gap-3"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da categoria (ex: Vinhos Naturais, Sobremesas)..."
            className="flex-1 w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 text-obsidian-950 text-xs font-bold"
            >
              Salvar Categoria
            </button>
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="p-2 rounded-xl bg-obsidian-800 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prato por nome, ingrediente ou badge..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-obsidian-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all',
              categoryFilter === 'all'
                ? 'bg-white text-obsidian-950'
                : 'bg-obsidian-900 text-zinc-400 hover:text-white border border-white/5'
            )}
          >
            Todas ({items.length})
          </button>
          {categories
            .filter((c) => c.slug !== 'destaques')
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all',
                  categoryFilter === cat.id
                    ? 'bg-brand text-obsidian-950'
                    : 'bg-obsidian-900 text-zinc-400 hover:text-white border border-white/5'
                )}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const primaryMedia = item.media_urls[0];
          const thumb = primaryMedia?.poster || primaryMedia?.url;
          const hasVideo = item.media_urls.some((m) => m.type === 'video');

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-2xl bg-obsidian-900 border transition-all flex gap-4',
                item.is_available
                  ? 'border-white/[0.08]'
                  : 'border-rose-500/30 opacity-75 bg-obsidian-950'
              )}
            >
              {/* Thumbnail */}
              <div className="relative h-28 w-24 rounded-2xl overflow-hidden bg-obsidian-950 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white flex items-center gap-1">
                  {hasVideo ? (
                    <>
                      <Video className="w-2.5 h-2.5 text-amber-400" />
                      <span>Vídeo</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-2.5 h-2.5 text-sky-400" />
                      <span>Foto</span>
                    </>
                  )}
                </span>
              </div>

              {/* Details & Controls */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {categoryNameMap.get(item.category_id) || 'Cardápio'}
                      </span>
                      <h3 className="text-sm font-extrabold text-white truncate">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-sm font-black text-amber-400 shrink-0">
                      {formatCurrencyBRL(item.price_cents)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {item.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-0.5 rounded-md bg-obsidian-800 text-zinc-300 text-[10px] font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row: Real-Time Availability Toggle + Edit/Delete */}
                <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all',
                        item.is_available
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          item.is_available ? 'bg-emerald-400' : 'bg-rose-400'
                        )}
                      />
                      {item.is_available ? 'Em Estoque' : 'Esgotado Hoje'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item.id)}
                      className={cn(
                        'px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition-all',
                        item.is_featured
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-obsidian-800 border-white/5 text-zinc-500 hover:text-zinc-300'
                      )}
                      title="Destacar na aba Destaques"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Destaque</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditorForItem(item)}
                      className="px-2.5 py-1 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                      aria-label="Excluir prato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT DISH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-obsidian-900 border border-white/15 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                {editingItem ? `Editar: ${editingItem.name}` : 'Cadastrar Novo Prato no Cardápio Social'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-obsidian-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-zinc-300">Nome do Prato *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Focaccia Burrata & Pistache"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-white focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Preço (R$) *</label>
                  <input
                    type="text"
                    required
                    value={formPriceBRL}
                    onChange={(e) => setFormPriceBRL(e.target.value)}
                    placeholder="54,90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-amber-400 font-bold focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Categoria</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-white focus:outline-none focus:border-brand"
                  >
                    {categories
                      .filter((c) => c.slug !== 'destaques')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Preparo (min)</label>
                  <input
                    type="number"
                    value={formPrepMinutes}
                    onChange={(e) => setFormPrepMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Calorias (kcal)</label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300">
                  Descrição Apetitosa (Foco em Conversão) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva texturas, origem dos ingredientes e preparo..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-white focus:outline-none focus:border-brand"
                />
              </div>

              {/* Media Section */}
              <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Mídia Principal do Card (9:16 Vertical)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormMediaType('video')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1',
                        formMediaType === 'video'
                          ? 'bg-brand text-obsidian-950'
                          : 'bg-obsidian-800 text-zinc-400'
                      )}
                    >
                      <Video className="w-3 h-3" />
                      Vídeo Autoplay
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMediaType('image')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1',
                        formMediaType === 'image'
                          ? 'bg-brand text-obsidian-950'
                          : 'bg-obsidian-800 text-zinc-400'
                      )}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Foto HD
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-zinc-400">
                      URL da Mídia ({formMediaType === 'video' ? 'MP4 Vertical' : 'JPG/WebP'})
                    </label>
                    <input
                      type="url"
                      required
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white font-mono text-[11px]"
                    />
                  </div>
                  {formMediaType === 'video' && (
                    <div>
                      <label className="text-[11px] text-zinc-400">
                        URL do Poster (Imagem de Capa Instantânea 4G)
                      </label>
                      <input
                        type="url"
                        value={formPosterUrl}
                        onChange={(e) => setFormPosterUrl(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white font-mono text-[11px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Badges Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Badges de Destaque</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_BADGES.map((badge) => {
                    const active = formBadges.includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => handleToggleBadgeInForm(badge)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1',
                          active
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-obsidian-950 border-white/10 text-zinc-400'
                        )}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergens & Ingredients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">
                    Alergênicos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    placeholder="Glúten, Lactose, Pistache"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">
                    Sugestão de Harmonização
                  </label>
                  <input
                    type="text"
                    value={formPairing}
                    onChange={(e) => setFormPairing(e.target.value)}
                    placeholder="Ex: Harmoniza com Espresso Tonic"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300">
                  Ficha de Ingredientes (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-obsidian-800 text-zinc-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 font-extrabold shadow-lg shadow-brand/25"
                >
                  {editingItem ? 'Salvar Alterações' : 'Publicar no Cardápio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
