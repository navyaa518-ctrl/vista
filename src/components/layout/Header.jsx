'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { LoginModal } from '@/components/auth/LoginModal';

/**
 * Enterprise Header component with unified login state management
 * across desktop and mobile viewports.
 */
export function Header({
  onOpenLogin,
  setIsLoginModalOpen: externalSetIsLoginModalOpen,
  isLoginModalOpen: externalIsLoginModalOpen,
}) {
  // Local state fallback if not controlled by parent component
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof externalIsLoginModalOpen === 'boolean';
  const modalOpen = isControlled ? externalIsLoginModalOpen : internalIsOpen;

  const setOpenModal = (open) => {
    if (externalSetIsLoginModalOpen) {
      externalSetIsLoginModalOpen(open);
    }
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    if (open && onOpenLogin) {
      onOpenLogin();
    }
  };

  // Unified login handler across desktop and mobile headers
  const handleOpenLogin = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    console.log("Login triggered from device viewport width:", width);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <>
      <Navbar
        onOpenLogin={handleOpenLogin}
        setIsLoginModalOpen={setOpenModal}
        isLoginModalOpen={modalOpen}
      />
      {/* Modal renders directly into document.body via React Portal */}
      <LoginModal isOpen={modalOpen} onClose={handleCloseModal} />
    </>
  );
}

export { Navbar };
export default Header;
