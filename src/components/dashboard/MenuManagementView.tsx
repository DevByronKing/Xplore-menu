'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Check,
  Edit3,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Ruler,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import type { Category, MenuItem, MenuMediaItem } from '@/types/database';
import {
  upload3DModelToStorage,
  uploadMediaFromGallery,
} from '@/lib/supabase/storageUpload';
import { cn, formatCurrencyBRL, generateUUID } from '@/lib/utils';

const DishARViewer = dynamic(
  () =>
    import('@/components/menu/DishARViewer').then((mod) => mod.DishARViewer),
  { ssr: false }
);

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
  'Mais Pedido',
  'Novidade',
  'Sugestão do Chef',
  'Fornada Quente',
  'Fermentação 48h',
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

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPriceBRL, setFormPriceBRL] = useState('48,90');
  const [formDescription, setFormDescription] = useState('');
  const [formPairing, setFormPairing] = useState('');
  const [formPrepMinutes, setFormPrepMinutes] = useState('10');
  const [formCalories, setFormCalories] = useState('520');
  const [formBadges, setFormBadges] = useState<string[]>(['Mais Pedido']);
  const [formAllergens, setFormAllergens] = useState('Glúten (Trigo), Lactose');
  const [formIngredients, setFormIngredients] = useState(
    'Farinha italiana Tipo 00, Levain 48h, Azeite extravirgem'
  );
  const [formMediaType, setFormMediaType] = useState<'video' | 'image'>('video');
  const [formMediaUrl, setFormMediaUrl] = useState('/videos/prep-focaccia-burrata.mp4?v=4');
  const [formPosterUrl, setFormPosterUrl] = useState(
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80'
  );
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(true);

  // Estados de Realidade Aumentada 3D (WebAR 1:1)
  const [formModelGlbUrl, setFormModelGlbUrl] = useState<string>('');
  const [formModelUsdzUrl, setFormModelUsdzUrl] = useState<string>('');
  const [formArScaleFixed, setFormArScaleFixed] = useState<boolean>(true);
  const [formDimWidth, setFormDimWidth] = useState<string>('24');
  const [formDimDepth, setFormDimDepth] = useState<string>('18');
  const [formDimHeight, setFormDimHeight] = useState<string>('9');
  const [isUploading3D, setIsUploading3D] = useState<boolean>(false);
  const [model3DStatusMsg, setModel3DStatusMsg] = useState<string | null>(null);
  const glbFileInputRef = useRef<HTMLInputElement | null>(null);
  const usdzFileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados de Upload Direto da Galeria do Celular (Supabase Storage / API local)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryPosterInputRef = useRef<HTMLInputElement | null>(null);

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
    setFormMediaType(primaryMedia?.type || 'video');
    setFormMediaUrl(primaryMedia?.url || '');
    setFormPosterUrl(primaryMedia?.poster || primaryMedia?.url || '');
    setFormIsAvailable(item.is_available);
    setFormIsFeatured(Boolean(item.is_featured));
    setFormModelGlbUrl(item.model_glb_url || '');
    setFormModelUsdzUrl(item.model_usdz_url || '');
    setFormArScaleFixed(item.ar_scale_fixed ?? true);
    setFormDimWidth(String(item.dimensions_cm?.width ?? 24));
    setFormDimDepth(String(item.dimensions_cm?.depth ?? 18));
    setFormDimHeight(String(item.dimensions_cm?.height ?? 9));
    setModel3DStatusMsg(null);
    setUploadedFileName(null);
    setUploadStatusMsg(null);
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
    setFormBadges(['Novidade', 'Sugestão do Chef']);
    setFormAllergens('Glúten (Trigo), Lactose');
    setFormIngredients(
      'Massa de fermentação natural 48h, Queijo artesanal, Flor de sal'
    );
    setFormMediaType('video');
    setFormMediaUrl('/videos/prep-focaccia-burrata.mp4?v=4');
    setFormPosterUrl(
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80'
    );
    setFormIsAvailable(true);
    setFormIsFeatured(true);
    setFormModelGlbUrl('/models/focaccia-burrata.glb');
    setFormModelUsdzUrl('');
    setFormArScaleFixed(true);
    setFormDimWidth('24');
    setFormDimDepth('18');
    setFormDimHeight('9');
    setModel3DStatusMsg(null);
    setUploadedFileName(null);
    setUploadStatusMsg(null);
    setIsModalOpen(true);
  };

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

  const handleGalleryFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadedFileName(file.name);
    setUploadStatusMsg('Enviando mídia da galeria do celular...');

    try {
      const result = await uploadMediaFromGallery(file);
      setFormMediaType(result.mediaType);
      setFormMediaUrl(result.mediaUrl);
      if (result.posterUrl) {
        setFormPosterUrl(result.posterUrl);
      } else if (result.mediaType === 'image') {
        setFormPosterUrl(result.mediaUrl);
      }
      setUploadStatusMsg(
        result.mediaType === 'video'
          ? 'Vídeo enviado e capa gerada automaticamente!'
          : 'Foto enviada com sucesso!'
      );
    } catch {
      setUploadStatusMsg('Não foi possível enviar o arquivo. Tente novamente.');
    } finally {
      setIsUploadingMedia(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleGalleryPosterSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadStatusMsg('Enviando foto de capa da galeria...');
    try {
      const result = await uploadMediaFromGallery(file);
      setFormPosterUrl(result.mediaUrl);
      setUploadStatusMsg('Foto de capa atualizada da galeria!');
    } catch {
      setUploadStatusMsg('Não foi possível enviar a foto de capa.');
    } finally {
      setIsUploadingMedia(false);
      if (galleryPosterInputRef.current) {
        galleryPosterInputRef.current.value = '';
      }
    }
  };

  const handle3DFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    format: 'glb' | 'usdz'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading3D(true);
    setModel3DStatusMsg(`Enviando modelo 3D (.${format}) para models-3d...`);
    try {
      const publicUrl = await upload3DModelToStorage(file, format);
      if (format === 'glb') {
        setFormModelGlbUrl(publicUrl);
      } else {
        setFormModelUsdzUrl(publicUrl);
      }
      setModel3DStatusMsg(
        `Modelo 3D (.${format}) salvo e pronto para projeção 1:1 na mesa!`
      );
    } catch {
      setModel3DStatusMsg(`Erro ao enviar arquivo .${format}.`);
    } finally {
      setIsUploading3D(false);
      if (format === 'glb' && glbFileInputRef.current) {
        glbFileInputRef.current.value = '';
      }
      if (format === 'usdz' && usdzFileInputRef.current) {
        usdzFileInputRef.current.value = '';
      }
    }
  };

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
      model_glb_url: formModelGlbUrl.trim() || null,
      model_usdz_url: formModelUsdzUrl.trim() || null,
      ar_scale_fixed: formArScaleFixed,
      dimensions_cm: formModelGlbUrl.trim()
        ? {
            width: Number(formDimWidth) || 24,
            depth: Number(formDimDepth) || 18,
            height: Number(formDimHeight) || 9,
          }
        : null,
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
      {/* Barra Superior */}
      <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Seus Pratos, Vídeos Reais & Disponibilidade
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Envie vídeos ou fotos direto da galeria do celular, ajuste preços ou marque um prato como &ldquo;Esgotado&rdquo; com 1 toque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCategoryForm((prev) => !prev)}
            className="px-3.5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>+ Nova Categoria</span>
          </button>

          <button
            type="button"
            onClick={onResetDefaults}
            className="px-3.5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-zinc-300 flex items-center gap-1.5"
            title="Restaurar cardápio padrão com vídeos reais de preparo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center gap-1.5 hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Prato</span>
          </button>
        </div>
      </div>

      {/* Formulário Rápido de Categoria */}
      {showCategoryForm && (
        <form
          onSubmit={handleAddCategory}
          className="p-4 rounded-2xl bg-[#161616] border border-white/20 flex flex-col sm:flex-row items-center gap-3"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da categoria (ex: Vinhos, Sobremesas)..."
            className="flex-1 w-full px-3.5 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white focus:outline-none focus:border-white/40"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold"
            >
              Salvar Categoria
            </button>
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="p-2 rounded-full bg-white/10 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Busca e Filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prato pelo nome ou ingrediente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#161616] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all',
              categoryFilter === 'all'
                ? 'bg-white text-[#0F0F0F]'
                : 'bg-[#161616] text-zinc-400 hover:text-white border border-white/5'
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
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all',
                  categoryFilter === cat.id
                    ? 'bg-white text-[#0F0F0F]'
                    : 'bg-[#161616] text-zinc-400 hover:text-white border border-white/5'
                )}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      {/* Lista de Pratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const primaryMedia = item.media_urls[0];
          const thumb = primaryMedia?.poster || primaryMedia?.url;
          const hasVideo = item.media_urls.some((m) => m.type === 'video');

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-2xl bg-[#161616] border transition-all flex gap-4',
                item.is_available
                  ? 'border-white/[0.08]'
                  : 'border-rose-500/30 opacity-75 bg-[#0F0F0F]'
              )}
            >
              <div className="relative h-28 w-24 rounded-2xl overflow-hidden bg-[#0F0F0F] shrink-0 keep-dark-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-semibold text-white flex items-center gap-1">
                  {hasVideo ? (
                    <>
                      <Video className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Vídeo</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-2.5 h-2.5 text-sky-400" />
                      <span>Foto</span>
                    </>
                  )}
                </span>
                {item.model_glb_url && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-600/90 text-[9px] font-bold text-white flex items-center gap-1 shadow">
                    <Box className="w-2.5 h-2.5" />
                    <span>3D / AR 1:1</span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {categoryNameMap.get(item.category_id) || 'Cardápio'}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-white shrink-0">
                      {formatCurrencyBRL(item.price_cents)}
                    </span>
                  </div>

                  <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all',
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
                      {item.is_available ? 'Disponível' : 'Esgotado Hoje'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 border transition-all',
                        item.is_featured
                          ? 'bg-white/15 border-white/30 text-white'
                          : 'bg-white/[0.04] border-white/5 text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Destaque</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditorForItem(item)}
                      className="px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-[11px] font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-full bg-white/[0.06] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
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

      {/* MODAL DE EDIÇÃO / CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-[#161616] border border-white/15 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-serif text-xl text-white">
                {editingItem
                  ? `Editar: ${editingItem.name}`
                  : 'Adicionar Novo Prato'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs"
            >
              {/* UPLOAD DIRETO DA GALERIA DO CELULAR (SUPABASE STORAGE) */}
              <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/15 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Vídeo ou Foto do Prato (Galeria do Celular)
                    </span>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Envie direto da galeria do celular para o servidor (Supabase Storage).
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-white">
                    {formMediaType === 'video' ? 'Vídeo MP4' : 'Foto'}
                  </span>
                </div>

                {/* Inputs ocultos acionados pelos botões da galeria */}
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleGalleryFileSelect}
                  className="hidden"
                />
                <input
                  ref={galleryPosterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryPosterSelect}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Preview ao vivo da mídia selecionada */}
                  <div className="relative h-32 w-24 rounded-2xl overflow-hidden bg-[#161616] border border-white/15 shrink-0 mx-auto sm:mx-0">
                    {formMediaType === 'video' ? (
                      <video
                        key={formMediaUrl}
                        src={formMediaUrl}
                        poster={formPosterUrl}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formMediaUrl}
                        alt="Prévia do prato"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl bg-white text-[#0F0F0F] font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-60"
                    >
                      {isUploadingMedia ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando da Galeria...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Escolher Vídeo da Galeria do Celular</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => galleryPosterInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Trocar Foto de Capa da Galeria (Opcional)</span>
                    </button>

                    {uploadStatusMsg && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {uploadStatusMsg}
                          {uploadedFileName ? ` (${uploadedFileName})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Nome do Prato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Focaccia Burrata & Pistache"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPriceBRL}
                    onChange={(e) => setFormPriceBRL(e.target.value)}
                    placeholder="54,90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white font-semibold focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Categoria
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-white/40"
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
                  <label className="font-semibold text-zinc-300">
                    Tempo de Preparo (min)
                  </label>
                  <input
                    type="number"
                    value={formPrepMinutes}
                    onChange={(e) => setFormPrepMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Calorias (kcal)
                  </label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">
                  Descrição do Prato *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva os ingredientes, o preparo e se serve 1 ou 2 pessoas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Selo de Destaque */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">
                  Selo no Topo do Card
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_BADGES.map((badge) => {
                    const active = formBadges.includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => handleToggleBadgeInForm(badge)}
                        className={cn(
                          'px-3 py-1 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1',
                          active
                            ? 'bg-white text-[#0F0F0F] border-white'
                            : 'bg-[#0F0F0F] border-white/10 text-zinc-400'
                        )}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Alergênicos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    placeholder="Glúten, Lactose, Pistache"
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">
                    Ingredientes (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    placeholder="Farinha Tipo 00, Burrata, Pistache"
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* MÓDULO WEBAR 3D ("VER NA SUA MESA" ESCALA REAL 1:1) */}
              <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-blue-500/30 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-blue-400" />
                      Modelo 3D & Realidade Aumentada (&ldquo;Ver na sua mesa&rdquo;)
                    </span>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Envie o arquivo 3D (.glb / .usdz) ou escolha um modelo 1:1 pronto para projetar o prato na mesa.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] font-bold text-blue-300 shrink-0">
                    Escala 1:1
                  </span>
                </div>

                {/* Inputs ocultos para upload .glb e .usdz */}
                <input
                  ref={glbFileInputRef}
                  type="file"
                  accept=".glb,model/gltf-binary"
                  onChange={(e) => handle3DFileSelect(e, 'glb')}
                  className="hidden"
                />
                <input
                  ref={usdzFileInputRef}
                  type="file"
                  accept=".usdz,model/vnd.usdz+zip"
                  onChange={(e) => handle3DFileSelect(e, 'usdz')}
                  className="hidden"
                />

                {/* Botões de Upload .GLB e .USDZ + Seletor Rápido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isUploading3D}
                    onClick={() => glbFileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    {isUploading3D ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Modelo .GLB (Android / Web 3D)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploading3D}
                    onClick={() => usdzFileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                    <span>Enviar .USDZ (iPhone AR Quick Look)</span>
                  </button>
                </div>

                {/* Modelos 3D Gastronômicos Pré-Calibrados em 1:1 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Ou selecione um Modelo 3D 1:1 da biblioteca ou cole o link (.glb):
                  </label>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {[
                      {
                        label: 'Focaccia Burrata (24×18cm)',
                        url: '/models/focaccia-burrata.glb',
                        w: '24',
                        d: '18',
                        h: '9',
                      },
                      {
                        label: 'Focaccia Figo & Parma (26×20cm)',
                        url: '/models/focaccia-figo.glb',
                        w: '26',
                        d: '20',
                        h: '8',
                      },
                      {
                        label: 'Brioche French Toast (22×22cm)',
                        url: '/models/french-toast.glb',
                        w: '22',
                        d: '22',
                        h: '11',
                      },
                      {
                        label: 'Pistachio Latte (14×14cm)',
                        url: '/models/pistachio-latte.glb',
                        w: '14',
                        d: '14',
                        h: '12',
                      },
                      {
                        label: 'Sem Modelo 3D',
                        url: '',
                        w: '24',
                        d: '18',
                        h: '9',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormModelGlbUrl(preset.url);
                          setFormDimWidth(preset.w);
                          setFormDimDepth(preset.d);
                          setFormDimHeight(preset.h);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all',
                          formModelGlbUrl === preset.url
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-[#161616] text-zinc-300 border-white/10 hover:border-white/30'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formModelGlbUrl}
                    onChange={(e) => setFormModelGlbUrl(e.target.value)}
                    placeholder="Caminho ou URL do arquivo .glb (ex: /models/focaccia-burrata.glb)"
                    className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white text-[11px]"
                  />
                </div>

                {/* Dimensões Físicas Reais em Centímetros (Escala 1:1) */}
                {formModelGlbUrl && (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-blue-400" />
                          Largura (cm)
                        </label>
                        <input
                          type="number"
                          value={formDimWidth}
                          onChange={(e) => setFormDimWidth(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#161616] border border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400">
                          Profundidade (cm)
                        </label>
                        <input
                          type="number"
                          value={formDimDepth}
                          onChange={(e) => setFormDimDepth(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#161616] border border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400">
                          Altura (cm)
                        </label>
                        <input
                          type="number"
                          value={formDimHeight}
                          onChange={(e) => setFormDimHeight(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#161616] border border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {/* Pré-visualização 3D Interativa Instantânea no Modal */}
                    <div className="pt-1">
                      <span className="block text-[10px] font-semibold text-blue-300 mb-1.5">
                        Prévia 3D Interativa em Escala Real (Gire com o mouse ou dedo):
                      </span>
                      <DishARViewer
                        modelGlbUrl={formModelGlbUrl}
                        modelUsdzUrl={formModelUsdzUrl || null}
                        posterUrl={formPosterUrl}
                        itemName={formName || 'Prévia 3D do Prato'}
                        arScaleFixed={formArScaleFixed}
                        dimensionsCm={{
                          width: Number(formDimWidth) || 24,
                          depth: Number(formDimDepth) || 18,
                          height: Number(formDimHeight) || 9,
                        }}
                        showBuiltInButton={false}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {model3DStatusMsg && (
                  <div className="px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-[11px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span>{model3DStatusMsg}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-white/10 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold"
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
