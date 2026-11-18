import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import LoginPage from '../pages/LoginPage';

describe('Frontend Component Tests', () => {
  describe('Button Component', () => {
    it('renders button with label and responds to click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner when isLoading=true and is disabled', () => {
      render(<Button isLoading={true}>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });
  });

  describe('Modal Component', () => {
    it('does not render when isOpen=false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Hidden Content</p>
        </Modal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders title and content when isOpen=true and closes on X click', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Active Modal">
          <p>Visible Content</p>
        </Modal>
      );
      expect(screen.getByText('Active Modal')).toBeInTheDocument();
      expect(screen.getByText('Visible Content')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Badge Component', () => {
    it('renders text with variant styling', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('LoginPage Component', () => {
    it('renders official work email, password inputs, forgot password button and sign-in button', () => {
      render(<LoginPage onLoginSuccess={() => {}} />);
      expect(screen.getByPlaceholderText(/name@/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in to portal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forgot password\?/i })).toBeInTheDocument();
    });
  });
});
