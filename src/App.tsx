/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {CartProvider, useCart} from './context/CartContext';
import {MenuView} from './components/MenuView';
import {ItemDetailView} from './components/ItemDetailView';
import {OrderSummaryView} from './components/OrderSummaryView';
import {AdminUpload} from './components/AdminUpload';

function AppContent() {
  const {view} = useCart();
  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
        <div className="w-full max-w-[390px] bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col">
          {view === 'menu' && <MenuView />}
          {view === 'detail' && <ItemDetailView />}
          {view === 'summary' && <OrderSummaryView />}
          {view === 'admin' && <AdminUpload />}
        </div>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
