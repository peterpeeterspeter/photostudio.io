'use client';
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { padding:0; margin:0; background:${p => p.theme.colors.bg}; color:${p => p.theme.colors.text}; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, 'Helvetica Neue', Arial, sans-serif; }
  a { color: inherit; text-decoration: none; }
  img { max-width: 100%; height: auto; }
  .visually-hidden { position:absolute; clip:rect(0 0 0 0); clip-path: inset(50%); width:1px; height:1px; overflow:hidden; white-space:nowrap; }
`;