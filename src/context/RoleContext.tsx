'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Prop } from '@/types/database';

export interface CartItem {
  prop: Prop;
  quantity: number;
}

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  executiveName: string;
  setExecutiveName: (name: string) => void;
  activeFloor: 1 | 2;
  setActiveFloor: (floor: 1 | 2) => void;
  // RFQ Cart
  cart: CartItem[];
  addToCart: (prop: Prop) => void;
  removeFromCart: (propId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('client');
  const [executiveName, setExecutiveName] = useState('Ravi Kumar (Floor 1 Specialist)');
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from localStorage on client
  useEffect(() => {
    const savedRole = localStorage.getItem('ashwa_role') as UserRole;
    if (savedRole) {
      setRoleState(savedRole);
    }
    const savedCart = localStorage.getItem('ashwa_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        // ignore
      }
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('ashwa_role', newRole);
    if (newRole === 'executive') {
      setExecutiveName('Ravi Kumar (Floor 1 Specialist)');
    }
  };

  const addToCart = (prop: Prop) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.prop.id === prop.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.prop.id === prop.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, { prop, quantity: 1 }];
      }
      localStorage.setItem('ashwa_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (propId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.prop.id !== propId);
      localStorage.setItem('ashwa_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ashwa_cart');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        executiveName,
        setExecutiveName,
        activeFloor,
        setActiveFloor,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    return {
      role: 'client' as UserRole,
      setRole: () => {},
      executiveName: '',
      setExecutiveName: () => {},
      activeFloor: 1 as 1 | 2,
      setActiveFloor: () => {},
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      cartCount: 0,
    };
  }
  return context;
}
