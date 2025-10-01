'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-gray-800">
        ShopShare
      </Link>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <Link href="/shops">
              <Button variant="ghost">Shops</Button>
            </Link>
          </li>
          <li>
            <Link href="/add-shop">
              <Button variant="ghost">Add Shop</Button>
            </Link>
          </li>
          <li>
            <Button>Sign In</Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;