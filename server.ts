import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const upload = multer({ storage: multer.memoryStorage() });

  // Try to initialize Supabase
  const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  let supabase = null;
  if (rawSupabaseUrl && rawSupabaseKey) {
      try {
          // Extremely resilient parsing: trim whitespace and remove wrapping quotes
          let cleanUrl = rawSupabaseUrl.trim().replace(/^['"]|['"]$/g, '');
          cleanUrl = cleanUrl.replace(/^VITE_/, '');
          cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
          
          let cleanKey = rawSupabaseKey.trim().replace(/^['"]|['"]$/g, '');
          cleanKey = cleanKey.replace(/^VITE_/, '');
          
          supabase = createClient(cleanUrl, cleanKey);
          console.log("[Supabase] Successfully initialized with project URL:", cleanUrl);
      } catch (err) {
          console.error("[Supabase] Failed to initialize client:", err);
      }
  }

  // Request logger middleware
  app.use((req, res, next) => {
      console.log(`[API_LOG] ${req.method} ${req.path}`);
      next();
  });

  app.use(express.json());

  // Database status check
  app.get("/api/db-status", async (req, res) => {
    if (!supabase) {
        return res.json({ connected: false, message: "Supabase credentials not configured." });
    }
    
    try {
        const { error } = await supabase.from('menu_items').select('id').limit(1);
        if (error) {
            console.error("Supabase connection error:", error);
            res.json({ connected: false, message: error.message });
        } else {
            res.json({ connected: true });
        }
    } catch (e) {
        console.error("Supabase connection error:", e);
        res.json({ connected: false, message: "Connection failed" });
    }
  });

  const HERO_IMAGE_PATH = path.join(process.cwd(), "hero_image.json");
  const DEFAULT_HERO_IMAGE = "https://scontent.fnbo17-1.fna.fbcdn.net/v/t39.30808-6/300377550_203990028646230_8680143004002504550_n.jpg?stp=dst-jpg_tt6&cstp=mx1365x2048&ctp=s1365x2048&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEtlr0O2ydEFf3obe6tVF3zQapTm1n_KJpBqlObWf8omoaIrm1x6omZgovKI8KfqaQ&_nc_ohc=alAhoOOTrBQQ7kNvwFVPv0U&_nc_oc=AdogNr6_wz3Rcaaa2pEMUDn6QNH6dDPKU_hqmPpP1FhlfKtKITjTlpKhTA7AfmBuB-Y&_nc_zt=23&_nc_ht=scontent.fnbo17-1.fna&_nc_gid=WS7VBQW7CTesDzsia-sS3w&_nc_ss=7b2a8&oh=00_AQCo_aN9d4QYvI6RJnrTz8uKZu_hCMp2CBYoxgYydu34mA&oe=6A5537D2";

  // GET hero config
  app.get("/api/hero-config", (req, res) => {
    try {
      if (fs.existsSync(HERO_IMAGE_PATH)) {
        const fileContent = fs.readFileSync(HERO_IMAGE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        return res.json({ url: parsed.url || DEFAULT_HERO_IMAGE });
      }
    } catch (e) {
      console.error("[Hero Config] Read failed:", e);
    }
    res.json({ url: DEFAULT_HERO_IMAGE });
  });

  // POST hero config
  app.post("/api/hero-config", (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }
      fs.writeFileSync(HERO_IMAGE_PATH, JSON.stringify({ url }), "utf-8");
      return res.json({ success: true, url });
    } catch (e: any) {
      console.error("[Hero Config] Write failed:", e);
      return res.status(500).json({ error: e.message || "Failed to save hero config" });
    }
  });

  // API route to get menu items
  app.get("/api/menu-items", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { data, error } = await supabase.from('menu_items').select('*').order('id', { ascending: true });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Map database shape to front-end shape
    const mapped = data.map(item => ({
      id: item.id,
      name: item.title || item.name,
      description: item.description,
      price: item.price,
      image: item.image_url || item.image,
      category_id: item.category_id,
      category: item.category
    }));
    
    res.json(mapped);
  });

  // API route to update a menu item
  app.put("/api/menu-items/:id", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { id } = req.params;
    const { name, image, ...rest } = req.body;
    
    // Convert frontend properties back to DB properties
    const updateData = {
      title: name,
      description: rest.description,
      price: rest.price,
      image_url: image
      // Note: we intentionally do not write 'category' directly, as DB uses 'category_id'.
    };
    
    const numericId = Number(id);
    const queryId = isNaN(numericId) ? id : numericId;

    // Check if item exists before updating
    const { data: existing, error: fetchErr } = await supabase.from('menu_items').select('id').eq('id', queryId).single();
    
    if (!existing) {
        // Since we might be migrating from local data to supabase, let's insert if it doesn't exist.
        const { data, error } = await supabase.from('menu_items').insert([{ id: queryId, ...updateData }]).select();
        if (error) return res.status(500).json({ error: error.message });
        if (!data || data.length === 0) return res.status(403).json({ error: "Insert blocked by database policies (RLS). Please check Supabase permissions." });
        return res.json(data[0]);
    } else {
        const { data, error } = await supabase.from('menu_items').update(updateData).eq('id', queryId).select();
        if (error) return res.status(500).json({ error: error.message });
        if (!data || data.length === 0) return res.status(403).json({ error: "Update blocked by database policies (RLS). Please check Supabase permissions or provide a Service Role Key." });
        return res.json(data[0]);
    }
  });

  // API route to delete a menu item
  app.delete("/api/menu-items/:id", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { id } = req.params;
    const numericId = Number(id);
    const queryId = isNaN(numericId) ? id : numericId;

    const { data, error } = await supabase.from('menu_items').delete().eq('id', queryId).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, deleted: data });
  });

  // API route to create a menu item
  app.post("/api/menu-items", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { name, image, description, price, category } = req.body;
    
    // Find next available/unique ID
    const { data: items, error: fetchErr } = await supabase
      .from('menu_items')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    let nextId = 1001; // start above static list just in case
    if (items && items.length > 0) {
      const maxId = items[0].id;
      // if maxId is a system setting like 10000, find the max below 10000
      if (maxId >= 10000) {
        const { data: realItems } = await supabase
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

    const insertData = {
      id: nextId,
      title: name,
      description,
      price: Number(price) || 0,
      image_url: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
      category: category || null
    };

    const { data, error } = await supabase.from('menu_items').insert([insertData]).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data?.[0] || insertData);
  });

  // API route for image upload
  app.post("/api/admin/menu-upload", upload.single("image"), async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: "Supabase not configured" });
    }
    
    if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
    }

    try {
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('menu-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
            });

        if (error) {
            console.error("Upload error:", error);
            let userMessage = error.message;
            if (error.message.includes("bucket") || error.message.includes("Bucket")) {
                userMessage += " (Tip: Ensure you have created a public bucket named 'menu-images' in your Supabase storage dashboard under 'Storage' -> 'New bucket').";
            } else if (error.message.includes("row-level policy") || error.message.includes("RLS") || error.message.includes("policy")) {
                userMessage += " (Tip: Ensure bucket 'menu-images' has public insert access or you have authenticated with your Supabase Service Role Key).";
            }
            return res.status(500).json({ error: userMessage });
        }

        const { data: publicUrlData } = supabase.storage
            .from('menu-images')
            .getPublicUrl(fileName);

        res.json({ url: publicUrlData.publicUrl });
    } catch (e: any) {
        console.error("Upload exception:", e);
        res.status(500).json({ error: e.message || "Upload failed" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Global Error Handler to guarantee JSON response is always returned (never HTML)
  app.use((err: any, req: any, res: any, next: any) => {
      console.error("[SERVER_UNHANDLED_ERROR]", err);
      res.status(err.status || 500).json({
          error: err.message || "An unexpected server error occurred"
      });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
