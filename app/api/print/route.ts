import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const PRINTER_NAME = 'BIXOLON_SRP-350V'; 

interface CartItem {
  name: string;
  qty: number;
  price: number;
}

function formatReceiptRow(item: CartItem): string {
  const nameWidth = 26;
  const qtyWidth = 6;
  const priceWidth = 16;

  const formattedName = item.name.padEnd(nameWidth, ' ').substring(0, nameWidth);
  const formattedQty = `${item.qty}x`.padStart(qtyWidth, ' ');
  const lineTotal = item.qty * item.price;
  const formattedPrice = `IDR ${lineTotal.toLocaleString()}`.padStart(priceWidth, ' ');

  return `${formattedName}${formattedQty}${formattedPrice}\n`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cashierName, invoiceNo, cartItems, openDrawer } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No cart items provided' }, { status: 400 });
    }

    const itemRowsText = cartItems.map((item: CartItem) => formatReceiptRow(item)).join('');
    const subtotal = cartItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

    // ESC/POS Hardware Control Bytes
    const ESC = '\x1B';
    const GS = '\x1D';
    
    // Cash drawer kick command (Pin 2)
    const cashDrawerCommand = openDrawer ? `${ESC}\x70\x00\x19\xFA` : '';
    
    // Auto-cut paper command (Full cut)
    const paperCutCommand = `${GS}\x56\x41\x03`;

    // Construct raw receipt payload including hardware control characters
    const receiptContent = [
      cashDrawerCommand, // Opens drawer before printing if requested
      "================================================\n",
      "                 TOKO UTAMA JAYA                \n",
      "            Jl. Mawar No. 88, Jakarta           \n",
      "================================================\n",
      `No Nota : ${invoiceNo || 'TRX-2026-001'}\n`,
      `Kasir   : ${cashierName || 'Budi'}\n`,
      `Tanggal : ${new Date().toLocaleString()}\n`,
      "------------------------------------------------\n",
      "ITEM                       QTY             PRICE\n",
      "------------------------------------------------\n",
      itemRowsText,
      "------------------------------------------------\n",
      `TOTAL PAID:                IDR ${subtotal.toLocaleString()}\n`,
      "================================================\n",
      "           Terima Kasih Atas Kunjungan Anda!    \n\n\n",
      paperCutCommand,   // Triggers physical auto-cutter at the end
    ].join('');

    // Write raw content to a temp file
    const tempFilePath = path.join(os.tmpdir(), `receipt-${Date.now()}.bin`);
    await fs.writeFile(tempFilePath, receiptContent, 'binary');

    // CRITICAL: Use `-oraw` option so CUPS passes raw escape characters directly to the printer
    await execAsync(`lp -d "${PRINTER_NAME}" -oraw "${tempFilePath}"`);

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {});

    return NextResponse.json({ success: true, message: 'Printed, cut, and drawer opened successfully!' });
  } catch (error: any) {
    console.error('CUPS Raw Print Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Print failed' }, { status: 500 });
  }
}