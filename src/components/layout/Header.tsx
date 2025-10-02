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
        <ul className="flex space-x-4 items-center">
          <li>
            <Link href="/submit-shop">
              <Button variant="outline" className="text-gray-800">Add Shop</Button>
            </Link>
          </li>
          <li>
            <Link href="/my-page">
              <Button variant="outline" className="text-gray-800">マイページ</Button>
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