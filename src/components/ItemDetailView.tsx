import { useCart } from '../context/CartContext';

export const ItemDetailView = () => {
    const { selectedItem, setView, addToCart } = useCart();
    
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="relative h-64">
                <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'; if (e.currentTarget.src !== fallback) { e.currentTarget.src = fallback; } }}
                />
                <button 
                    onClick={() => setView('menu')}
                    className="absolute top-4 left-4 bg-white/80 p-2 rounded-full"
                >
                    Back
                </button>
            </div>
            <div className="p-4">
                <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                <div className="text-2xl font-bold text-primary mt-4">KShs {selectedItem.price}</div>
                
                <button 
                    onClick={() => {
                        addToCart(selectedItem);
                        setView('menu');
                    }}
                    className="w-full bg-primary text-white py-3 rounded-lg mt-6 font-semibold"
                >
                    Add to Order
                </button>
            </div>
        </div>
    );
};
