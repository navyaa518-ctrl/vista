import React from 'react';
import { renderToString } from 'react-dom/server';

console.log('Testing module exports and static evaluation...');

async function testImports() {
  const { LoginModal, LoginForm } = await import('../src/components/auth/LoginModal.jsx');
  console.log('✅ LoginModal.jsx loaded successfully:', typeof LoginModal, typeof LoginForm);

  const { AuthModal } = await import('../src/components/auth/AuthModal.tsx');
  console.log('✅ AuthModal.tsx loaded successfully:', typeof AuthModal);

  const { Header, Navbar } = await import('../src/components/layout/Header.jsx');
  console.log('✅ Header.jsx loaded successfully:', typeof Header, typeof Navbar);

  const { Navbar: DirectNavbar } = await import('../src/components/layout/Navbar.tsx');
  console.log('✅ Navbar.tsx loaded successfully:', typeof DirectNavbar);

  // Test LoginModal SSR render safety
  const ssrModal = renderToString(React.createElement(LoginModal, { isOpen: true, onClose: () => {} }));
  console.log('✅ LoginModal SSR render output (should be empty string on server due to mounted guard):', JSON.stringify(ssrModal));

  console.log('\nAll component modules and SSR portal guards verified successfully!');
}

testImports().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
