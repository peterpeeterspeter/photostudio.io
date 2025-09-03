'use client';
import styled from 'styled-components';

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{
  variant?: 'primary' | 'ghost';
}>`
  display:inline-flex; align-items:center; justify-content:center;
  min-height: 48px; padding: 12px 18px; border-radius: 12px;
  border: 1px solid ${p => p.variant === 'ghost' ? p.theme.colors.border : p.theme.colors.primary};
  background: ${p => p.variant === 'ghost' ? 'transparent' : p.theme.colors.primary};
  color: ${p => p.variant === 'ghost' ? p.theme.colors.text : '#fff'};
  font-weight: 600; cursor: pointer;
  transition: transform .06s ease, background .2s ease, border-color .2s ease;
  &:hover { transform: translateY(-1px); background: ${p => p.variant === 'ghost' ? 'transparent' : p.theme.colors.primaryHover}; }
  &:focus-visible { outline: 2px solid ${p => p.theme.colors.accent}; outline-offset: 2px; }
`;