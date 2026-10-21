import { clientSupabase } from "./supabaseClient";

export interface DbStatus {
  connected: boolean;
  message?: string;
}

/**
 * Checks connectivity to the database.
 * Tries server-side first; if that fails or returns 404/error, it tests direct client-side SDK querying.
 */
export async function checkDbStatus(): Promise<DbStatus> {
  // 1. Try server-side first
  try {
    const res = await fetch("/api/db-status?_t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data && data.connected) {
        return { connected: true, message: "Connected to Server API" };
      }
      if (data && data.message) {
        console.warn("[Database Service] Server reported error, trying client fallback. Error:", data.message);
      }
    } else {
      console.warn("[Database Service] Server-side status responded non-200. Testing client fallback.");
    }
  } catch (err: any) {
    console.warn("[Database Service] Server status fetch failed (expected if hosted on Vercel without a server):", err.message);
  }

  // 2. Client-side fallback
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from("menu_items").select("id").limit(1);
      if (!error) {
        return { connected: true, message: "Connected directly via Supabase Client SDK" };
      } else {
        return { 
          connected: false, 
          message: `Direct Supabase SDK error: ${error.message}. Ensure your RLS policies allow reading and that credentials are correct.` 
        };
      }
    } catch (e: any) {
      return { connected: false, message: `Direct SDK connection exception: ${e.message}` };
    }
  }

  return {
    connected: false,
    message: "Could not establish database connection. Neither the dynamic server nor Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are configured/reachable."
  };
}

/**
 * Fetches all menu items.
 * Tries the Express server database; falls back to direct client-side Supabase REST APIs.
 */
export async function getMenuItems(): Promise<any[]> {
  // 1. Try server-side
  try {
    const res = await fetch("/api/menu-items?_t=" + Date.now());
    if (res.ok) {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned non-JSON response");
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err: any) {
    console.warn("[Database Service] Server menu query fail, using client SDK:", err.message);
  }

  // 2. Client-side fallback
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from("menu_items").select("*").order("id", { ascending: true });
      if (error) {
        console.error("[Database Service] Direct Supabase fetch error:", error.message);
        return [];
      }
      if (data) {
        return data
          .filter(item => item.id !== 10000 && item.title !== "Hero Config Setting" && item.name !== "Hero Config Setting")
          .map(item => ({
            id: item.id,
            name: item.title || item.name,
            description: item.description,
            price: item.price,
            image: item.image_url || item.image,
            category_id: item.category_id,
            category: item.category
          }));
      }
    } catch (e) {
      console.error("[Database Service] Direct Supabase exception:", e);
    }
  }

  return [];
}

/**
 * Update a menu item's details.
 * Communicates with custom Express routes or runs direct database UPSERT via client SDK.
 */
export async function updateMenuItem(id: any, itemData: any): Promise<{ success: boolean; error?: string }> {
  const { name, image, description, price, category_id, category } = itemData;
  const rawPayload = {
    name,
    description,
    price: Number(price),
    image,
    category_id,
    category
  };

  // Convert for direct Supabase DB shape
  const dbData = {
    title: name,
    description,
    price: Number(price),
    image_url: image, // Supabase expects image_url
    category_id: category_id ? Number(category_id) : null,
    category: category || null
  };

  // 1. Try server API
  try {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawPayload)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      throw new Error(`Non-JSON database response: ${text.substring(0, 100)}`);
    }

    if (res.ok && !data.error) {
      return { success: true };
    }
    if (data && data.error) {
      // If server returned structured database error, try direct SDK bypass before giving up
      console.warn("[Database Service] Server update returned error:", data.error);
    }
  } catch (err: any) {
    console.warn("[Database Service] Server update endpoint failed, trying client direct SDK update:", err.message);
  }

  // 2. Direct client-side SDK UPSERT fallback
  if (clientSupabase) {
    try {
      // Check if item exists
      const { data: existing, error: existErr } = await clientSupabase
        .from("menu_items")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (existing) {
        const { error } = await clientSupabase
          .from("menu_items")
          .update(dbData)
          .eq("id", id);
        
        if (error) {
          return { success: false, error: `${error.message} (Direct SDK Error)` };
        }
      } else {
        const { error } = await clientSupabase
          .from("menu_items")
          .insert([{ id, ...dbData }]);
        
        if (error) {
          return { success: false, error: `${error.message} (Direct SDK Error)` };
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Direct SDK Exception: ${e.message}` };
    }
  }

  return { success: false, error: "No running backend server detected and VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured for client SDK write." };
}

/**
 * Creates a new menu item.
 * Communicates with custom Express post route or runs direct database INSERT via client SDK.
 */
export async function createMenuItem(itemData: any): Promise<{ success: boolean; error?: string; item?: any }> {
  const { name, image, description, price, category } = itemData;
  const payload = {
    name,
    description,
    price: Number(price),
    image,
    category
  };

  // Convert for direct Supabase DB shape
  const dbData = {
    title: name,
    description,
    price: Number(price),
    image_url: image,
    category
  };

  // 1. Try server API
  try {
    const res = await fetch("/api/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      throw new Error(`Non-JSON database response: ${text.substring(0, 100)}`);
    }

    if (res.ok && !data.error) {
      return { success: true, item: data };
    }
    if (data && data.error) {
      console.warn("[Database Service] Server create returned error:", data.error);
    }
  } catch (err: any) {
    console.warn("[Database Service] Server create endpoint failed, trying client direct SDK:", err.message);
  }

  // 2. Direct client SDK fallback
  if (clientSupabase) {
    try {
      // Find next available/unique ID on client side
      const { data: items } = await clientSupabase
        .from('menu_items')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      let nextId = 1001;
      if (items && items.length > 0) {
        const maxId = items[0].id;
        if (maxId >= 10000) {
          const { data: realItems } = await clientSupabase
            .from('menu_items')
            .select('id')
            .lt('id', 10000)
            .order('id', { ascending: false })
            .limit(1);
          if (realItems && realItems.length > 0) {
            nextId = Number(realItems[0].id) + 1;
          }
        } else {
          nextId = Number(maxId) + 1;
        }
      }

      const { data, error } = await clientSupabase
        .from("menu_items")
        .insert([{ id: nextId, ...dbData }])
        .select();

      if (error) {
        return { success: false, error: `${error.message} (Direct SDK Error)` };
      }
      return { success: true, item: data?.[0] };
    } catch (e: any) {
      return { success: false, error: `Direct client SDK exception: ${e.message}` };
    }
  }

  return { success: false, error: "No running backend server detected and VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured for client SDK write." };
}

/**
 * Deletes a menu item.
 * Communicates with custom Express delete route or runs direct database DELETE via client SDK.
 */
export async function deleteMenuItem(id: any): Promise<{ success: boolean; error?: string }> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: "DELETE"
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      throw new Error(`Non-JSON response from server: ${text.substring(0, 100)}`);
    }

    if (res.ok && !data.error) {
      return { success: true };
    }
    if (data && data.error) {
      console.warn("[Database Service] Server delete returned error:", data.error);
    }
  } catch (err: any) {
    console.warn("[Database Service] Server delete endpoint failed, trying client direct SDK:", err.message);
  }

  // 2. Direct client SDK fallback
  if (clientSupabase) {
    try {
      const { error } = await clientSupabase
        .from("menu_items")
        .delete()
        .eq("id", id);
      
      if (error) {
        return { success: false, error: `${error.message} (Direct SDK Error)` };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Direct client SDK exception: ${e.message}` };
    }
  }

  return { success: false, error: "No running backend server detected and VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured for client SDK write." };
}

/**
 * Uploads an image either with server endpoint or direct to Supabase Storage.
 */
export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  // 1. Try server-side first
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/admin/menu-upload", {
        method: "POST",
        body: formData,
    });
    
    const text = await response.text();
    let data;
    try {
       data = JSON.parse(text);
    } catch(e) {
       throw new Error(`Non-JSON response received: ${text.substring(0, 100)}`);
    }

    if (response.ok && data && data.url) {
      return { url: data.url };
    } else if (data && data.error) {
      throw new Error(data.error);
    } else {
      throw new Error("Server image upload failed");
    }
  } catch (err: any) {
    console.warn("[Database Service] Server image upload failed, running client fallback:", err.message);
    
    // Check if the error is due to non-JSON response (meaning server is down/not configured on Vercel)
    // Or if Supabase is offline.
  }

  // 2. Client-side Storage upload fallback
  if (clientSupabase) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await clientSupabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (error) {
        console.warn("[Database Service] Supabase Storage upload failed (likely RLS policy or missing bucket):", error.message);
        // Fallback to Data URL so the user is never blocked from saving an image
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
          return { url: dataUrl };
        } catch (dataUrlErr) {
          let errMsg = error.message;
          if (errMsg.includes("bucket") || errMsg.includes("Bucket")) {
            errMsg += " (Tip: Ensure you have created a public bucket named 'menu-images' in your Supabase storage dashboard under 'Storage' -> 'New bucket').";
          } else if (errMsg.includes("row-level policy") || errMsg.includes("RLS") || errMsg.includes("policy")) {
            errMsg += " (Tip: Ensure your bucket has public insert policies enabled. Go to Supabase Storage -> Policies and allow upload/insert for everyone).";
          }
          return { error: errMsg };
        }
      }

      const { data: publicUrlData } = clientSupabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (e: any) {
      console.warn("[Database Service] Direct client Storage exception, falling back to Data URL:", e.message);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
        return { url: dataUrl };
      } catch (err) {
        return { error: `Direct client Storage exception: ${e.message}` };
      }
    }
  }

  // 3. Ultimate Fallback to Data URL if no SDK or server endpoint
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl };
  } catch (e: any) {
    return { 
      error: "Image processing failed. Please paste a direct image URL or enable Supabase Storage policies." 
    };
  }
}

export async function getHeroConfig(): Promise<string> {
  const DEFAULT_HERO = "https://scontent.fnbo17-1.fna.fbcdn.net/v/t39.30808-6/300377550_203990028646230_8680143004002504550_n.jpg?stp=dst-jpg_tt6&cstp=mx1365x2048&ctp=s1365x2048&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEtlr0O2ydEFf3obe6tVF3zQapTm1n_KJpBqlObWf8omoaIrm1x6omZgovKI8KfqaQ&_nc_ohc=alAhoOOTrBQQ7kNvwFVPv0U&_nc_oc=AdogNr6_wz3Rcaaa2pEMUDn6QNH6dDPKU_hqmPpP1FhlfKtKITjTlpKhTA7AfmBuB-Y&_nc_zt=23&_nc_ht=scontent.fnbo17-1.fna&_nc_gid=WS7VBQW7CTesDzsia-sS3w&_nc_ss=7b2a8&oh=00_AQCo_aN9d4QYvI6RJnrTz8uKZu_hCMp2CBYoxgYydu34mA&oe=6A5537D2";
  
  // Try server first
  try {
    const res = await fetch("/api/hero-config?_t=" + Date.now());
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.url) {
          localStorage.setItem("tartan_hotel_hero_image", data.url);
          return data.url;
        }
      } else {
        console.warn("[Database Service] Server hero get returned non-JSON content. Usually happens on serverless static host fallbacks.");
      }
    }
  } catch (err) {
    console.warn("[Database Service] Server hero get error:", err);
  }

  // Fallback 1: LocalStorage
  const localVal = localStorage.getItem("tartan_hotel_hero_image");
  if (localVal) {
    return localVal;
  }

  // Fallback 2: Direct Supabase from menu_items if a config row exists
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase
        .from("menu_items")
        .select("image_url")
        .eq("id", 10000)
        .maybeSingle();
      if (!error && data && data.image_url) {
        localStorage.setItem("tartan_hotel_hero_image", data.image_url);
        return data.image_url;
      }
    } catch (e) {
      console.warn("[Database Service] SDK hero query exception:", e);
    }
  }

  return DEFAULT_HERO;
}

export async function saveHeroConfig(url: string): Promise<{ success: boolean; error?: string }> {
  localStorage.setItem("tartan_hotel_hero_image", url);

  let serverSuccess = false;
  // 1. Try server first
  try {
    const res = await fetch("/api/hero-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      serverSuccess = true;
    }
  } catch (err: any) {
    console.warn("[Database Service] Server save hero error:", err);
  }

  // 2. Direct Supabase Client fallback
  if (clientSupabase) {
    try {
      const { error } = await clientSupabase
        .from("menu_items")
        .upsert([{ id: 10000, title: "Hero Config Setting", image_url: url, price: 0, description: "System Setting" }]);
      if (error) {
        console.warn("[Database Service] Supabase hero config upsert returned error (RLS or table permission):", error.message);
        // Hero is already saved in LocalStorage, so return success so client UI updates cleanly
        return { success: true };
      }
    } catch (e: any) {
      console.warn("[Database Service] Direct SDK Exception on hero save:", e.message);
      return { success: true };
    }
  }

  return { success: true };
}
