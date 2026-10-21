
import React, { useState, useRef } from 'react';
import { categories } from '../data';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight, Search, ShoppingCart, X, Utensils } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  'All': '🍽️',
  'Soups': '🥣',
  'Starters & Tapas': '🥟',
  'Sandwich Bar': '🥪',
  'Burger Corner': '🍔',
  'Aberdeen Angus Steak Specials': '🥩',
  'Italian Pasta': '🍝',
  'Chicken Specialties': '🍗',
  'Lake Victoria Fish Specialties': '🐟',
  'Curry Pot': '🍲',
  'Rooftop Terrace Barbecue': '🍢',
  'Steak & Chops': '🥩',
  'Sizzling Specials': '🍳',
  'Desserts': '🍰'
};

export const MenuView = () => {
  const { cart, setCart, setView, setSelectedItem, menuItemsData, heroImage } = useCart();
  const [service, setService] = useState('dine');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItemToast, setAddedItemToast] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Derive unique categories from statically defined list and any dynamic DB categories
  const allCategories = ['All', ...Array.from(new Set([
    ...categories,
    ...(menuItemsData || []).map((item: any) => item.category).filter(Boolean)
  ]))];

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (cat: string, e?: React.MouseEvent) => {
    setActiveCategory(cat);
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart((prev: any) => [...prev, item]);
    setAddedItemToast(`${item.name} added to cart`);
    setTimeout(() => setAddedItemToast(null), 2000);
  };

  // Filter items by search query
  const searchFilteredItems = (menuItemsData || []).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  // Group items by category
  const categoriesToDisplay = activeCategory === 'All' 
    ? allCategories.filter(c => c !== 'All') 
    : [activeCategory];

  const groupedItems = categoriesToDisplay.map(cat => {
    const items = searchFilteredItems.filter((i: any) => i.category === cat);
    return { category: cat, items };
  }).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen relative">
      {/* Toast Notification */}
      {addedItemToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{addedItemToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-amber-100">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏰</span>
            <h1 className="font-serif text-base font-bold text-slate-900 tracking-tight">
              The Scottish Tartan Hotel
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('summary')} 
              className="relative p-2 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors border border-amber-200"
              title="Cart"
            >
              <ShoppingCart className="w-4 h-4 text-amber-900" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setView('admin')} 
              className="px-2.5 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-full shadow-xs hover:bg-slate-700 transition"
            >
              Admin
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-red-800 via-emerald-800 to-amber-700" />
      </header>

      {/* Hero Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img 
          src={heroImage} 
          className="w-full h-full object-cover opacity-90 transition-opacity duration-300" 
          alt="The Scottish Tartan Hotel Hero"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const fallback = "https://scontent.fnbo17-1.fna.fbcdn.net/v/t39.30808-6/300377550_203990028646230_8680143004002504550_n.jpg?stp=dst-jpg_tt6&cstp=mx1365x2048&ctp=s1365x2048&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEtlr0O2ydEFf3obe6tVF3zQapTm1n_KJpBqlObWf8omoaIrm1x6omZgovKI8KfqaQ&_nc_ohc=alAhoOOTrBQQ7kNvwFVPv0U&_nc_oc=AdogNr6_wz3Rcaaa2pEMUDn6QNH6dDPKU_hqmPpP1FhlfKtKITjTlpKhTA7AfmBuB-Y&_nc_zt=23&_nc_ht=scontent.fnbo17-1.fna&_nc_gid=WS7VBQW7CTesDzsia-sS3w&_nc_ss=7b2a8&oh=00_AQCo_aN9d4QYvI6RJnrTz8uKZu_hCMp2CBYoxgYydu34mA&oe=6A5537D2";
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600/90 text-white px-2 py-0.5 rounded-xs">
            Fine Dining & Barbecue
          </span>
          <h2 className="font-serif text-lg font-bold mt-0.5 drop-shadow-md">
            Authentic Highland & Kenyan Cuisine
          </h2>
        </div>
      </div>

      {/* Service Toggle & Search Bar */}
      <div className="p-3 space-y-2 bg-white border-b border-slate-200 shadow-2xs">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-medium">
          <button 
            onClick={() => setService('dine')}
            className={`flex-1 py-1.5 rounded-md transition-all ${service === 'dine' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🍽️ Dine-In
          </button>
          <button 
            onClick={() => setService('takeaway')}
            className={`flex-1 py-1.5 rounded-md transition-all ${service === 'takeaway' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🛍️ Takeaway
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Search dishes, burgers, steaks, soups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Category Carousel */}
      <div className="sticky top-12 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="relative flex items-center px-1 py-2">
          {/* Left Arrow Button */}
          <button 
            onClick={() => scrollCarousel('left')}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-white/90 shadow-2xs rounded-full border border-slate-200 z-10 shrink-0 ml-1"
            title="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Carousel Scroll Container */}
          <div 
            ref={carouselRef}
            className="flex gap-1.5 overflow-x-auto scrollbar-none px-2 py-0.5 scroll-smooth no-scrollbar items-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {allCategories.map(cat => {
              const icon = CATEGORY_ICONS[cat] || '🍽️';
              const count = cat === 'All' 
                ? (menuItemsData || []).length 
                : (menuItemsData || []).filter((i: any) => i.category === cat).length;
              const isActive = cat === activeCategory;

              return (
                <button 
                  key={cat} 
                  onClick={(e) => handleCategorySelect(cat, e)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-amber-300 shadow-xs ring-1 ring-slate-800 scale-[1.02]' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <span className="text-sm">{icon}</span>
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={() => scrollCarousel('right')}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-white/90 shadow-2xs rounded-full border border-slate-200 z-10 shrink-0 mr-1"
            title="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Menu List - Grouped by Category */}
      <div className="p-3 flex-1 space-y-6 pb-24">
        {activeCategory !== 'All' && (
          <div className="flex justify-between items-center bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80">
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORY_ICONS[activeCategory] || '🍽️'}</span>
              <div>
                <h2 className="font-serif text-xs font-bold text-amber-950">
                  {activeCategory}
                </h2>
                <p className="text-[10px] text-amber-800">
                  Showing {groupedItems.reduce((acc, g) => acc + g.items.length, 0)} dishes
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveCategory('All')}
              className="text-[11px] text-amber-900 font-semibold underline hover:text-amber-950"
            >
              Show All Categories
            </button>
          </div>
        )}

        {groupedItems.length > 0 ? (
          groupedItems.map(group => (
            <section key={group.category} className="space-y-3">
              {/* Category Group Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_ICONS[group.category] || '🍽️'}</span>
                  <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
                    {group.category}
                  </h2>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {group.items.length}
                  </span>
                </div>
                {activeCategory === 'All' && (
                  <button 
                    onClick={() => setActiveCategory(group.category)}
                    className="text-[10px] font-semibold text-amber-800 hover:text-amber-900"
                  >
                    View Category →
                  </button>
                )}
              </div>

              {/* Items in Category */}
              <div className="space-y-2.5">
                {group.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="flex bg-white p-3 rounded-xl shadow-2xs border border-slate-200/80 items-center justify-between cursor-pointer hover:border-amber-300 transition-all active:scale-[0.99]"
                    onClick={() => { setSelectedItem(item); setView('detail'); }}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-xs leading-snug">{item.name}</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-bold text-amber-900 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          KShs {item.price}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { 
                          const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'; 
                          if (e.currentTarget.src !== fallback) { e.currentTarget.src = fallback; } 
                        }}
                      />
                      <button 
                        onClick={(e) => handleAddToCart(item, e)}
                        className="absolute bottom-1 right-1 bg-slate-900 hover:bg-amber-700 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md font-bold text-sm transition-transform active:scale-90"
                        title="Add to cart"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
            <Utensils className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No dishes found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Try adjusting your search query or selecting a different category.
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-2xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Order Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-between items-center shadow-lg z-50">
        <div>
          <div className="text-[10px] font-medium text-slate-500">
            {cart.length} {cart.length === 1 ? 'Item' : 'Items'} Selected
          </div>
          <div className="text-sm font-bold text-slate-900">
            Total: <span className="text-amber-900">KShs {cart.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0)}</span>
          </div>
        </div>
        <button 
          onClick={() => setView('summary')}
          className="bg-slate-900 hover:bg-amber-800 text-white px-5 py-2 rounded-lg font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span>View Order</span>
          <span className="bg-amber-500/30 text-amber-200 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
            {cart.length}
          </span>
        </button>
      </div>
    </div>
  );
};

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1.323l1.954-1.954a1 1 0 011.414 1.414L12.414 5.7l1.954 1.954a1 1 0 01-1.414 1.414L11 7.114V8.5a1 1 0 11-2 0V7.114L7.046 9.068a1 1 0 01-1.414-1.414L7.586 5.7 5.632 3.746a1 1 0 011.414-1.414L9 4.288V3a1 1 0 011-1z" />
    </svg>
  );
}


