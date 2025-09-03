'use client';
import styled from 'styled-components';
import { Container } from '../atoms/Container';
import { Button } from '../atoms/Button';
import { track } from '@/lib/analytics';

const Wrap = styled.section`
  padding: 80px 0 40px; background: radial-gradient(1200px 600px at 70% -10%, #1a1a20 0%, transparent 60%);
`;
const Eyebrow = styled.div`
  display:inline-flex; gap: 8px; align-items:center;
  background: ${p => p.theme.colors.card}; border:1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.subtext}; padding: 6px 10px; border-radius: 999px; font-size: 12px;
`;
const H1 = styled.h1`font-size: clamp(32px, 5vw, 56px); margin: 16px 0 10px; line-height:1.05;`;
const Sub = styled.p`max-width:680px; color:${p=>p.theme.colors.subtext}; font-size: clamp(16px, 2.2vw, 18px);`;

export default function Hero() {
  return (
    <Wrap aria-labelledby="hero-title">
      <Container>
        <Eyebrow aria-label="Social proof">✨ Loved by indie boutiques</Eyebrow>
        <H1 id="hero-title">Turn raw shop photos into <em>studio-grade</em> product images</H1>
        <Sub>Ghost mannequin, lifestyle backgrounds, relighting & multi-aspect exports — in minutes, not days.</Sub>
        <div style={{display:'flex', gap:12, marginTop:20, flexWrap:'wrap'}}>
          <a href="/editor/batch" onClick={() => track({ name:'cta_primary_click', params:{ from:'hero' }})}>
            <Button>Open Batch Editor</Button>
          </a>
          <a href="/integrations/shopify" onClick={() => track({ name:'cta_shopify_click', params:{ from:'hero' }})}>
            <Button variant="ghost" aria-label="Connect Shopify">Connect Shopify</Button>
          </a>
        </div>
      </Container>
    </Wrap>
  );
}