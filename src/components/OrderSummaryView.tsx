import { useCart } from '../context/CartContext';

export const OrderSummaryView = () => {
    const { cart, setView } = useCart();
    
    console.log('Cart Items:', cart);
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    return (
        <div className="p-4 bg-white min-h-screen">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
                {cart.map((item, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>KShs {item.price}</span>
                    </div>
                ))}
            </div>
            <div className="border-t mt-4 pt-4 font-bold flex justify-between">
                <span>Total</span>
                <span>KShs {total}</span>
            </div>
            
            <button 
                onClick={() => setView('menu')}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg mt-6"
            >
                Back to Menu
            </button>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg mt-2">
                Send to WhatsApp
            </button>
        </div>
    );
};
