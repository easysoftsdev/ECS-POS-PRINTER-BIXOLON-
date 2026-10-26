'use client';

import React, { useState } from 'react';

interface CartItem {
  name: string;
  qty: number;
  price: number;
}

export default function CheckoutReceipt() {
  const [status, setStatus] = useState<string>('Idle');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Sample dynamic cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { name: 'Kopi Latte', qty: 2, price: 20000 },
    { name: 'Roti Toast', qty: 1, price: 15000 },
  ]);

  const handleAddItem = () => {
    setCartItems([
      ...cartItems,
      { name: 'Mineral Water', qty: 1, price: 5000 }
    ]);
  };

  const handlePrintOrder = async () => {
    setIsPrinting(true);
    setStatus('Sending order to printer...');

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierName: 'Ahmad',
          invoiceNo: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          cartItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to print');
      }

      setStatus('Receipt printed successfully!');
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 border">
      <h2 className="text-xl font-bold text-gray-800">POS Checkout Counter</h2>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-2">Current Cart Items:</h3>
        <ul className="space-y-1 text-sm">
          {cartItems.map((item, index) => (
            <li key={index} className="flex justify-between">
              <span>{item.name} ({item.qty}x)</span>
              <span>IDR {(item.qty * item.price).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleAddItem}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
        >
          + Add Item
        </button>

        <button
          onClick={handlePrintOrder}
          disabled={isPrinting || cartItems.length === 0}
          className={`flex-1 px-4 py-2 font-semibold text-white rounded-lg shadow-md transition-colors ${
            isPrinting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPrinting ? 'Printing Receipt...' : 'Print Order via CUPS'}
        </button>
      </div>

      <div className="text-sm font-medium text-gray-700">
        Status: <span className="font-normal text-blue-600">{status}</span>
      </div>
    </div>
  );
}