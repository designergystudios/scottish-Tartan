import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { categories } from '../data';
import { checkDbStatus, updateMenuItem, uploadImage, createMenuItem, deleteMenuItem } from '../supabaseService';

export const AdminUpload: React.FC = () => {
  const { setView, menuItemsData, refreshMenu, heroImage, updateHeroImage } = useCart();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string }>({ connected: false });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // States for Hero Config
  const [heroUrl, setHeroUrl] = useState(heroImage || '');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroStatus, setHeroStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // States for record deletion
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [deleteStatus, setDeleteStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (heroImage) {
      setHeroUrl(heroImage);
    }
  }, [heroImage]);

  useEffect(() => {
    if (authenticated) {
        checkDbStatus()
            .then(status => setDbStatus(status))
            .catch((err) => setDbStatus({ connected: false, message: `Status check failed: ${err.message}` }));
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="p-4 flex flex-col gap-2 max-w-sm mx-auto mt-10">
        <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border border-gray-300 p-3 rounded"
        />
        <button 
          onClick={() => {
            if (password === 'scottishtartanhotel@2026!') {
              setAuthenticated(true);
            } else {
              setDbStatus({ connected: false, message: 'Incorrect password' });
            }
          }} 
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition-colors mt-2"
        >
          Login
        </button>
        {dbStatus.message === 'Incorrect password' && <p className="text-red-500 text-sm mt-2">Incorrect password</p>}
        <button onClick={() => setView('menu')} className="bg-gray-100 p-3 rounded text-gray-700 font-semibold mt-2">Back to Menu</button>
      </div>
    );
  }

  const handleUpdate = async (e?: any) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!dbStatus.connected) {
          setUpdateStatus({ type: 'error', message: 'Database not connected. Please configure Supabase in settings.' });
          return;
      }
      if (!editingItem.name) {
          setUpdateStatus({ type: 'error', message: 'Please provide a name for the menu item.' });
          return;
      }
      setSaving(true);
      setUpdateStatus(null);
      try {
          const payload = { ...editingItem, price: Number(editingItem.price) || 0 };
          const isNew = !editingItem.id;

          const result = isNew 
              ? await createMenuItem(payload)
              : await updateMenuItem(editingItem.id, payload);

          if (result.success) {
              setUpdateStatus({ 
                  type: 'success', 
                  message: isNew ? "Item created successfully!" : "Item updated successfully!" 
              });
              refreshMenu();
              setTimeout(() => {
                 setEditingItem(null);
                 setUpdateStatus(null);
              }, 1500);
          } else {
              setUpdateStatus({ type: 'error', message: `Operation failed: ${result.error}` });
          }
      } catch (err: any) {
          setUpdateStatus({ type: 'error', message: err.message || 'Operation failed' });
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteConfirm = async () => {
      if (!deleteConfirmItem) return;
      setDeleting(true);
      setDeleteStatus(null);
      try {
          const result = await deleteMenuItem(deleteConfirmItem.id);
          if (result.success) {
              setDeleteStatus({ type: 'success', message: `"${deleteConfirmItem.name}" deleted successfully!` });
              refreshMenu();
              setTimeout(() => {
                  setDeleteConfirmItem(null);
                  setDeleteStatus(null);
              }, 1500);
          } else {
              setDeleteStatus({ type: 'error', message: `Delete failed: ${result.error}` });
          }
      } catch (err: any) {
          setDeleteStatus({ type: 'error', message: err.message || 'Delete failed' });
      } finally {
          setDeleting(false);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!dbStatus.connected) {
          setUpdateStatus({ type: 'error', message: 'Database not connected. Please configure Supabase URL and Key in settings.' });
          return;
      }
      const file = e.target.files?.[0];
      if (!file) return;
      
      setUploading(true);
      setUpdateStatus(null);

      try {
          const result = await uploadImage(file);
          if (result.url) {
              setEditingItem({ ...editingItem, image: result.url });
              setUpdateStatus({ type: 'success', message: 'Image uploaded! Click Save Changes.' });
          } else {
              setUpdateStatus({ type: 'error', message: result.error || 'Upload failed' });
          }
      } catch (error: any) {
          console.error('Upload exception:', error);
          setUpdateStatus({ type: 'error', message: error.message || 'Upload failed' });
      } finally {
          setUploading(false);
          if (e.target) e.target.value = '';
      }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setHeroUploading(true);
      setHeroStatus(null);

      try {
          const result = await uploadImage(file);
          if (result.url) {
              setHeroUrl(result.url);
              setHeroStatus({ type: 'success', message: 'Hero banner uploaded! Click Save Banner to apply.' });
          } else {
              setHeroStatus({ type: 'error', message: result.error || 'Upload failed' });
          }
      } catch (error: any) {
          console.error('Hero upload exception:', error);
          setHeroStatus({ type: 'error', message: error.message || 'Upload failed' });
      } finally {
          setHeroUploading(false);
          if (e.target) e.target.value = '';
      }
  };

  const handleSaveHero = async () => {
      setHeroStatus(null);
      try {
          const result = await updateHeroImage(heroUrl);
          if (result.success) {
              setHeroStatus({ type: 'success', message: 'Hero banner updated successfully!' });
              setTimeout(() => setHeroStatus(null), 3000);
          } else {
              setHeroStatus({ type: 'error', message: `Failed to update banner: ${result.error}` });
          }
      } catch (err: any) {
          setHeroStatus({ type: 'error', message: err.message || 'Failed' });
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-10 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Menu Administration</h2>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">{dbStatus.connected ? 'Connected to Supabase' : `Not Connected (${dbStatus.message})`}</span>
            </div>
        </div>
        <button onClick={() => setView('menu')} className="bg-gray-200 px-3 py-1.5 rounded text-sm font-semibold text-gray-700">Exit</button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {editingItem ? (
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 max-w-lg mx-auto">
                <h3 className="text-lg font-bold mb-4">Edit Item: {editingItem.name}</h3>
                {updateStatus && (
                    <div className={`mb-4 p-3 rounded font-medium text-sm ${updateStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {updateStatus.message}
                    </div>
                )}
                <form className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                        <input className="w-full border p-2 rounded" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                        <select className="w-full border p-2 rounded bg-white" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                            <option value="">Select a category...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <textarea className="w-full border p-2 rounded min-h-[100px]" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Price (KShs)</label>
                        <input type="number" className="w-full border p-2 rounded" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                        <div className="flex gap-2">
                            <input className="flex-1 border p-2 rounded text-sm" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} />
                            <label className="bg-blue-100 text-blue-700 px-3 py-2 rounded cursor-pointer font-semibold text-sm whitespace-nowrap flex items-center">
                                {uploading ? 'Uploading...' : 'Upload'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                        {editingItem.image && <img src={editingItem.image} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded shadow-sm border" onError={(e) => { const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'; if (e.currentTarget.src !== fallback) { e.currentTarget.src = fallback; } }} />}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={(e) => handleUpdate(e as any)} disabled={saving || uploading} className="flex-1 bg-green-600 disabled:bg-gray-400 text-white py-2 rounded font-semibold hover:bg-green-700 transition cursor-pointer">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" disabled={saving} onClick={() => setEditingItem(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300 transition cursor-pointer">Cancel</button>
                    </div>
                </form>
            </div>
        ) : (
            <div className="flex flex-col gap-6">
                {/* Hero Banner Editor Block */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-xl">image</span>
                        <h3 className="text-lg font-bold text-gray-800">Hotel Hero Banner Image</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Change the main hero header banner image displayed at the top of the restaurant menu. You can input an image URL or upload a new photo directly.
                    </p>

                    {heroStatus && (
                        <div className={`mb-4 p-3 rounded font-medium text-sm ${heroStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {heroStatus.message}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full gap-3 flex flex-col">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Hero Image URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 border p-2.5 rounded text-sm bg-gray-50 text-gray-800" 
                                        value={heroUrl} 
                                        onChange={e => setHeroUrl(e.target.value)} 
                                        placeholder="https://example.com/banner.jpg"
                                    />
                                    <label className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm px-4 py-2.5 rounded cursor-pointer whitespace-nowrap flex items-center transition-colors">
                                        {heroUploading ? 'Uploading...' : 'Upload Image'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} disabled={heroUploading} />
                                    </label>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveHero} 
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2 px-4 rounded transition-colors self-start cursor-pointer shadow-sm"
                            >
                                Save Banner Change
                            </button>
                        </div>

                        {heroUrl && (
                            <div className="w-full md:w-48 bg-gray-50 p-2 rounded-lg border">
                                <span className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Banner Preview</span>
                                <img 
                                    src={heroUrl} 
                                    alt="Hero Preview" 
                                    className="w-full h-24 object-cover rounded shadow-sm border" 
                                    onError={(e) => { 
                                        const fallback = 'https://scontent.fnbo17-1.fna.fbcdn.net/v/t39.30808-6/300377550_203990028646230_8680143004002504550_n.jpg?stp=dst-jpg_tt6&cstp=mx1365x2048&ctp=s1365x2048&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEtlr0O2ydEFf3obe6tVF3zQapTm1n_KJpBqlObWf8omoaIrm1x6omZgovKI8KfqaQ&_nc_ohc=alAhoOOTrBQQ7kNvwFVPv0U&_nc_oc=AdogNr6_wz3Rcaaa2pEMUDn6QNH6dDPKU_hqmPpP1FhlfKtKITjTlpKhTA7AfmBuB-Y&_nc_zt=23&_nc_ht=scontent.fnbo17-1.fna&_nc_gid=WS7VBQW7CTesDzsia-sS3w&_nc_ss=7b2a8&oh=00_AQCo_aN9d4QYvI6RJnrTz8uKZu_hCMp2CBYoxgYydu34mA&oe=6A5537D2'; 
                                        if (e.currentTarget.src !== fallback) { e.currentTarget.src = fallback; } 
                                    }} 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">restaurant_menu</span>
                        <h3 className="text-lg font-bold text-gray-800 font-serif">Menu Items Management</h3>
                    </div>
                    <button
                        onClick={() => setEditingItem({
                            name: '',
                            category: categories[0] || '',
                            description: '',
                            price: '',
                            image: ''
                        })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition duration-200 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        Create Record
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {menuItemsData.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover border" onError={(e) => { const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'; if (e.currentTarget.src !== fallback) { e.currentTarget.src = fallback; } }} />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{item.category}</p>
                                <p className="text-xs font-bold text-gray-700 mt-1">KShs {item.price}</p>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <button 
                                    onClick={() => setEditingItem(item)}
                                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-[11px] font-bold hover:bg-blue-100 cursor-pointer transitions-colors text-center whitespace-nowrap border border-blue-100/50"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => setDeleteConfirmItem(item)}
                                    className="text-red-500 hover:text-red-700 font-medium text-[11px] cursor-pointer hover:underline text-center whitespace-nowrap"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100 flex flex-col gap-4 animate-scale-up">
                  <div className="flex items-center gap-3 text-red-600">
                      <span className="material-symbols-outlined text-3xl">warning</span>
                      <h3 className="text-lg font-bold text-gray-900 font-serif">Delete Menu Item?</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                      Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirmItem.name}"</span>? This will permanently remove it from the Scottish Tartan Hotel menu database.
                  </p>

                  {deleteStatus && (
                      <div className={`p-3 rounded text-sm font-medium ${deleteStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                          {deleteStatus.message}
                      </div>
                  )}

                  <div className="flex gap-3 mt-2">
                      <button 
                          onClick={handleDeleteConfirm}
                          disabled={deleting}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm py-2.5 rounded transition cursor-pointer"
                      >
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button 
                          onClick={() => {
                              if (!deleting) {
                                  setDeleteConfirmItem(null);
                                  setDeleteStatus(null);
                              }
                          }}
                          disabled={deleting}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm py-2.5 rounded transition cursor-pointer"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
