'use client';
import styled from 'styled-components';
import { Container } from '../atoms/Container';
import { Button } from '../atoms/Button';
import { track } from '@/lib/analytics';

const Box = styled.section`
  padding: 56px 0 80px; border-top:1px solid ${p=>p.theme.colors.border};
`;
const Panel = styled.div`
  background: linear-gradient(180deg, #17171b, #141418);
  border:1px solid ${p=>p.theme.colors.border}; border-radius:${p=>p.theme.radius.lg};
  padding:24px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; justify-content:space-between;
`;
const Copy = styled.div`max-width:640px; p{ color:${p=>p.theme.colors.subtext}; }`;

export default function CTA(){
  return (
    <Box>
      <Container>
        <Panel>
          <Copy>
            <h2 style={{margin:'4px 0 6px'}}>Ready to ship better product photos?</h2>
            <p>Start free, upgrade when you're ready. Keep your workflow — we'll handle the glow-up.</p>
          </Copy>
          <a href="/editor/batch" onClick={() => track({ name:'cta_start_free' })}><Button>Start free</Button></a>
        </Panel>
      </Container>
    </Box>
  );
}