import React, { createContext, useContext, useState, useEffect } from 'react';
import { menuItems as defaultMenuItems } from '../data';
import { getMenuItems, getHeroConfig, saveHeroConfig } from '../supabaseService';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [view, setView] = useState<'menu' | 'detail' | 'summary' | 'admin'>('menu');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuItemsData, setMenuItemsData] = useState<any[]>(defaultMenuItems);
  const [heroImage, setHeroImage] = useState<string>("https://scontent.fnbo17-1.fna.fbcdn.net/v/t39.30808-6/300377550_203990028646230_8680143004002504550_n.jpg?stp=dst-jpg_tt6&cstp=mx1365x2048&ctp=s1365x2048&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEtlr0O2ydEFf3obe6tVF3zQapTm1n_KJpBqlObWf8omoaIrm1x6omZgovKI8KfqaQ&_nc_ohc=alAhoOOTrBQQ7kNvwFVPv0U&_nc_oc=AdogNr6_wz3Rcaaa2pEMUDn6QNH6dDPKU_hqmPpP1FhlfKtKITjTlpKhTA7AfmBuB-Y&_nc_zt=23&_nc_ht=scontent.fnbo17-1.fna&_nc_gid=WS7VBQW7CTesDzsia-sS3w&_nc_ss=7b2a8&oh=00_AQCo_aN9d4QYvI6RJnrTz8uKZu_hCMp2CBYoxgYydu34mA&oe=6A5537D2");

  const mergeData = (fetchedData: any[]) => {
    const realFetched = (fetchedData || []).filter(
      (item: any) => item.id !== 10000 && item.title !== "Hero Config Setting" && item.name !== "Hero Config Setting"
    );

    if (!realFetched || realFetched.length === 0) {
      setMenuItemsData(defaultMenuItems);
      return;
    }

    // Combine default items with fetched DB items
    const itemMap = new Map<number | string, any>();
    
    // Seed with all default menu items first
    defaultMenuItems.forEach((item: any) => {
      itemMap.set(item.id, item);
    });

    // Override or append items fetched from DB
    realFetched.forEach((fetchedItem: any) => {
      const idKey = fetchedItem.id;
      const existing = itemMap.get(idKey);
      itemMap.set(idKey, {
        ...existing,
        ...fetchedItem,
        name: fetchedItem.name || fetchedItem.title || (existing ? existing.name : 'Dish'),
        category: fetchedItem.category || (existing ? existing.category : 'Soups'),
        price: fetchedItem.price ?? (existing ? existing.price : 0),
        image: fetchedItem.image || fetchedItem.image_url || (existing ? existing.image : ''),
        description: fetchedItem.description || (existing ? existing.description : '')
      });
    });

    setMenuItemsData(Array.from(itemMap.values()));
  };

  useEffect(() => {
    getMenuItems()
      .then(data => {
        if (data && data.length > 0) {
           mergeData(data);
        } else {
           setMenuItemsData(defaultMenuItems);
        }
      })
      .catch(err => {
         console.error("Could not fetch from Supabase:", err);
         setMenuItemsData(defaultMenuItems);
      });

    getHeroConfig()
      .then(url => {
        if (url) setHeroImage(url);
      })
      .catch(err => console.warn("Could not fetch hero config on init:", err));
  }, []);

  const refreshMenu = () => {
    getMenuItems()
      .then(data => {
        if (data && data.length > 0) {
           mergeData(data);
        } else {
           setMenuItemsData(defaultMenuItems);
        }
      })
      .catch(err => {
         console.error("Could not refresh from Supabase:", err);
         setMenuItemsData(defaultMenuItems);
      });

    getHeroConfig()
      .then(url => {
        if (url) setHeroImage(url);
      })
      .catch(err => console.warn("Could not refresh hero config:", err));
  };

  const updateHeroImage = async (url: string) => {
    setHeroImage(url);
    const result = await saveHeroConfig(url);
    return result;
  };

  const addToCart = (item: any) => {
    setCart((prev) => [...prev, item]);
  };

  return (
    <CartContext.Provider value={{ 
        cart, setCart, addToCart, view, setView, selectedItem, setSelectedItem,
        menuItemsData, setMenuItemsData, refreshMenu, heroImage, updateHeroImage
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
