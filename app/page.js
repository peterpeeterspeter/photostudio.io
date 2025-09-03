"use client";

export default function LandingPage() {
  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      margin: 0,
      padding: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#333'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              borderRadius: '8px'
            }}></div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Photostudio.io
            </h1>
          </div>
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#features" style={{ textDecoration: 'none', color: '#666', fontWeight: '500' }}>Features</a>
            <a href="#pricing" style={{ textDecoration: 'none', color: '#666', fontWeight: '500' }}>Pricing</a>
            <a href="/editor" style={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'transform 0.2s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Start Editing
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'transparent'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            margin: '0 0 1rem 0',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)'
          }}>
            AI-Powered Fashion Photo Editing
          </h2>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
            margin: '0 0 2rem 0',
            opacity: '0.9',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Transform your fashion photography with professional AI editing. Ghost mannequins, studio backgrounds, and lifestyle scenes in seconds.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/editor" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#333',
              padding: '1rem 2rem',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              transition: 'all 0.3s',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
            >
              Try Free Editor
            </a>
            <button style={{
              background: 'transparent',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.8)',
              padding: '1rem 2rem',
              borderRadius: '30px',
              fontWeight: '600',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }}
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '4rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            margin: '0 0 3rem 0',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Professional Features
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {[
              {
                title: "Ghost Mannequin Effect",
                description: "Remove models while preserving natural garment shape and inner openings",
                icon: "👻"
              },
              {
                title: "Studio Backgrounds",
                description: "Replace backgrounds with professional white studio sweeps and lighting",
                icon: "🎯"
              },
              {
                title: "Lifestyle Scenes",
                description: "Place garments in beautiful lifestyle settings with perfect lighting",
                icon: "🏠"
              },
              {
                title: "Flatlay Compositions",
                description: "Transform into top-down flatlay shots on marble or other surfaces",
                icon: "📐"
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h4 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
                  {feature.title}
                </h4>
                <p style={{ color: '#666', margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'transparent'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          color: 'white'
        }}>
          <h3 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 1rem 0',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)'
          }}>
            Ready to Transform Your Photos?
          </h3>
          <p style={{
            fontSize: '1.2rem',
            margin: '0 0 2rem 0',
            opacity: '0.9'
          }}>
            Join thousands of fashion brands using AI to create professional product photos in seconds.
          </p>
          <a href="/editor" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            padding: '1.2rem 3rem',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '1.2rem',
            transition: 'all 0.3s',
            display: 'inline-block',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
          }}
          >
            Start Editing Now - Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          © 2024 Photostudio.io - AI-Powered Fashion Photo Editing
        </p>
      </footer>
    </div>
  );
}