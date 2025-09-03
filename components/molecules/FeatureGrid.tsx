'use client';
import styled from 'styled-components';
import { Container } from '../atoms/Container';
import { useReveal } from '@/hooks/useReveal';

const Section = styled.section`padding: 48px 0;`;
const Grid = styled.div`
  display:grid; gap:16px; grid-template-columns: 1fr;
  @media (min-width:768px){ grid-template-columns: repeat(3, 1fr); }
`;
const Card = styled.article.withConfig({
  shouldForwardProp: (prop) => !['show'].includes(prop),
})<{ show:boolean }>`
  border:1px solid ${p=>p.theme.colors.border}; background:${p=>p.theme.colors.card}; border-radius:${p=>p.theme.radius.lg};
  padding:18px; transform: translateY(${p=>p.show?0:8}px); opacity:${p=>p.show?1:0};
  transition: all .5s ease;
  h3 { margin:8px 0; font-size:18px; }
  p { color:${p=>p.theme.colors.subtext}; font-size:14px; }
`;

export default function FeatureGrid() {
  const a = useReveal<HTMLDivElement>(), b = useReveal<HTMLDivElement>(), c = useReveal<HTMLDivElement>();
  return (
    <Section aria-label="Key features">
      <Container>
        <Grid>
          <Card ref={a.ref} show={a.visible}>
            <h3>Background swap</h3>
            <p>Clean white, branded, or lifestyle scenes — optimized for marketplaces & ads.</p>
          </Card>
          <Card ref={b.ref} show={b.visible}>
            <h3>Ghost mannequin</h3>
            <p>Remove models and preserve garment shape & textures for catalog-ready shots.</p>
          </Card>
          <Card ref={c.ref} show={c.visible}>
            <h3>Aspect ratio exporter</h3>
            <p>1:1, 4:5, 9:16, 16:9 — one click. Smart contain/cover, sharp output.</p>
          </Card>
        </Grid>
      </Container>
    </Section>
  );
}