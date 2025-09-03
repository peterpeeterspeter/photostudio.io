'use client';
import styled from 'styled-components';
import { Container } from '../atoms/Container';

const Wrap = styled.section`padding: 24px 0 8px; border-top:1px solid ${p=>p.theme.colors.border};`;
const Row = styled.div`
  display:flex; gap:16px; flex-wrap:wrap; align-items:center; color:${p=>p.theme.colors.subtext};
`;
const Pill = styled.div`
  border:1px dashed ${p=>p.theme.colors.border}; padding:8px 12px; border-radius: 999px; font-size: 12px;
`;
export default function SocialProof(){
  return (
    <Wrap aria-label="Social proof">
      <Container>
        <Row>
          <span className="visually-hidden">Metrics</span>
          <Pill>+35% faster product listing</Pill>
          <Pill>+22% CTR on ads</Pill>
          <Pill>Trusted by 120+ boutiques</Pill>
        </Row>
      </Container>
    </Wrap>
  );
}