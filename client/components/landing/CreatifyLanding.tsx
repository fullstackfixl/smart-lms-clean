'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { Section } from './Section'
import {
  ArrowRight,
  Search as SearchIcon,
  Sparkles,
  Wand2,
  Layers,
  Box,
  Image as ImageIcon,
  Shapes,
  Download,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react'

const pillOptions = ['All', 'Vectors', 'Photos', 'Icons', 'Templates', 'AI Images', '3D']

const categoryCards = [
  { name: 'Vectors', icon: Shapes, background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  { name: 'Photos', icon: ImageIcon, background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { name: 'Icons', icon: Sparkles, background: 'linear-gradient(135deg, #2d1b69, #4a235a, #6b2d5e)' },
  { name: 'Templates', icon: Layers, background: 'linear-gradient(135deg, #0d2137, #1a4a5a, #0f766e)' },
  { name: 'AI Images', icon: Wand2, background: 'linear-gradient(135deg, #1a2e1a, #1f4a2e, #166534)' },
  { name: '3D', icon: Box, background: 'linear-gradient(135deg, #2d1515, #4a1c1c, #7f1d1d)' },
]

const masonryCards = [
  { h: 280, bg: 'linear-gradient(160deg, #a8edea 0%, #fed6e3 100%)' },
  { h: 340, bg: 'linear-gradient(160deg, #5f72bd 0%, #9b23ea 100%)' },
  { h: 220, bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { h: 300, bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { h: 260, bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { h: 380, bg: 'linear-gradient(160deg, #f093fb 0%, #f5576c 100%)' },
  { h: 240, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { h: 310, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { h: 270, bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
]

const testimonials = [
  { name: 'Ayesha', role: 'Product Designer', text: 'The fastest way I\'ve found to generate production-ready assets without losing quality.' },
  { name: 'Rohan', role: 'Founder', text: 'Search feels instant and the results are actually usable. Massive time saver for my team.' },
  { name: 'Meera', role: 'Marketing', text: 'Templates + AI Images are a killer combo. We ship campaigns in hours now.' },
  { name: 'Kabir', role: 'Developer', text: 'Clean UI, great spacing, and no weird layout jumps. Everything just feels premium.' },
  { name: 'Sana', role: '3D Artist', text: 'The 3D category is surprisingly solid — and the previews are buttery smooth.' },
]

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? {
              background: '#E8FF47',
              color: '#000',
              borderColor: '#E8FF47',
            }
          : {
              background: 'transparent',
              color: '#888880',
              borderColor: '#2a2a2a',
            }
      }
      className="rounded-full border px-4 py-1.5 text-[13px] transition-colors"
    >
      {label}
    </button>
  )
}

function TestimonialCard({ t }: { t: { name: string; role: string; text: string } }) {
  return (
    <div
      style={{
        width: 300,
        marginRight: 16,
        background: '#0d0d0d',
        border: '1px solid #1f1f1f',
        borderRadius: 18,
        padding: 18,
        color: '#F5F5F0',
      }}
      className="shrink-0"
    >
      <p style={{ color: '#888880', fontSize: 14, lineHeight: 1.5 }}>{t.text}</p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p>
          <p style={{ fontSize: 12, color: '#888880' }}>{t.role}</p>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #E8FF47, #FF6B35)',
          }}
        />
      </div>
    </div>
  )
}

export function CreatifyLanding() {
  const [activePill, setActivePill] = useState('All')

  const allTestimonials = useMemo(() => [...testimonials, ...testimonials], [])

  const marqueeRow1 = useMemo(() => Array.from({ length: 18 }).map((_, i) => i), [])
  const marqueeRow2 = useMemo(() => Array.from({ length: 22 }).map((_, i) => i), [])

  return (
    <main style={{ background: '#080808', minHeight: '100vh', color: '#F5F5F0' }}>
      {/* HERO */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          alignItems: 'center',
          padding: '0 80px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background:
              'radial-gradient(ellipse at 70% 50%, rgba(232,255,71,0.05) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(255,107,53,0.04) 0%, transparent 50%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 80 }}>
          <p style={{ color: '#888880', fontSize: 14, fontWeight: 600, letterSpacing: '0.12em' }}>CREATIFY</p>
          <h1 style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.95, marginTop: 16 }}>
            Create better
            <br />
            assets in minutes.
          </h1>
          <p style={{ marginTop: 20, maxWidth: 520, color: '#888880', fontSize: 16, lineHeight: 1.6 }}>
            Search, remix and download high-quality vectors, photos, icons, templates, AI images and 3D.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#search"
              style={{
                background: '#E8FF47',
                color: '#000',
                fontWeight: 800,
                borderRadius: 12,
                padding: '12px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Start Exploring
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#pricing"
              style={{
                background: 'transparent',
                color: '#F5F5F0',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                padding: '12px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* RIGHT ORB */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="relative flex w-full items-center justify-center" style={{ minHeight: '600px' }}>
            <div
              style={{
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                position: 'absolute',
                background:
                  'radial-gradient(circle at 35% 35%, rgba(232,255,71,0.15), rgba(255,107,53,0.08) 50%, transparent 70%)',
                boxShadow:
                  '0 0 120px 60px rgba(232,255,71,0.06), 0 0 200px 100px rgba(255,107,53,0.04)',
                animation: 'orbPulse 6s ease-in-out infinite',
                willChange: 'transform',
              }}
            />
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                position: 'absolute',
                background: 'radial-gradient(circle, rgba(232,255,71,0.2) 0%, transparent 70%)',
                animation: 'orbPulse 4s ease-in-out infinite reverse',
                willChange: 'transform',
              }}
            />
            <div
              style={{
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                position: 'absolute',
                border: '1px solid rgba(232,255,71,0.08)',
                animation: 'orbRotate 20s linear infinite',
                willChange: 'transform',
              }}
            />
            <div
              style={{
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                position: 'absolute',
                border: '1px solid rgba(255,107,53,0.05)',
                animation: 'orbRotate 30s linear infinite reverse',
                willChange: 'transform',
              }}
            />
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <Section className="!pt-20" >
        <div id="search" style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div
            className="creatify-search-bar"
            style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: 16,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
            }}
          >
            <SearchIcon size={18} color="#888880" />
            <input
              placeholder="Search anything…"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                flex: 1,
                color: '#F5F5F0',
                fontSize: 16,
              }}
            />
            <button
              type="button"
              style={{
                background: '#E8FF47',
                color: '#000',
                fontWeight: 700,
                borderRadius: 10,
                padding: '8px 20px',
                whiteSpace: 'nowrap',
              }}
            >
              Search
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {pillOptions.map((p) => (
              <Pill key={p} label={p} active={activePill === p} onClick={() => setActivePill(p)} />
            ))}
          </div>
        </div>
      </Section>

      {/* CATEGORIES */}
      <Section>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Categories</h2>
          <p style={{ marginTop: 8, color: '#888880' }}>Pick a lane. Or explore everything.</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 16,
              marginTop: 28,
            }}
          >
            {categoryCards.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.name}
                  style={{
                    borderRadius: 20,
                    overflow: 'hidden',
                    aspectRatio: '1',
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid #1f1f1f',
                    background: c.background,
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = '#E8FF47'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1f1f1f'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      padding: 20,
                      textAlign: 'center',
                    }}
                  >
                    <Icon size={36} color="rgba(255,255,255,0.9)" />
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 12 }}>{c.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* VIDEO MARQUEE */}
      <Section fullBleed className="creatify-marquee">
        <div style={{ padding: '0 80px', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Trending previews</h2>
          <p style={{ marginTop: 8, color: '#888880' }}>A live feed of what creators are downloading right now.</p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          {/* ROW 1 */}
          <div className="creatify-row-wrapper" style={{ height: 220, overflow: 'hidden', position: 'relative', width: '100%' }}>
            <div
              className="creatify-track"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                height: '100%',
                animation: 'marqueeLeft 35s linear infinite',
              }}
            >
              {[...marqueeRow1, ...marqueeRow1].map((i) => (
                <div
                  key={`r1-${i}`}
                  style={{
                    width: 200,
                    height: 200,
                    flexShrink: 0,
                    marginRight: 14,
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'inline-block',
                    background:
                      'linear-gradient(135deg, rgba(232,255,71,0.18), rgba(255,107,53,0.08) 55%, rgba(255,255,255,0.02))',
                    border: '1px solid #1f1f1f',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ROW 2 */}
          <div className="creatify-row-wrapper" style={{ height: 160, overflow: 'hidden', position: 'relative', width: '100%' }}>
            <div
              className="creatify-track"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                height: '100%',
                animation: 'marqueeRight 45s linear infinite',
                filter: 'brightness(0.7)',
              }}
            >
              {[...marqueeRow2, ...marqueeRow2].map((i) => (
                <div
                  key={`r2-${i}`}
                  style={{
                    width: 150,
                    height: 140,
                    flexShrink: 0,
                    marginRight: 12,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background:
                      'linear-gradient(135deg, rgba(255,107,53,0.14), rgba(232,255,71,0.06) 55%, rgba(255,255,255,0.02))',
                    border: '1px solid #1f1f1f',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* MASONRY */}
      <Section>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Fresh drops</h2>
          <p style={{ marginTop: 8, color: '#888880' }}>A proper masonry grid with clean hover overlays.</p>

          <div
            style={{
              columnCount: 3,
              columnGap: 16,
              marginTop: 28,
            }}
          >
            {masonryCards.map((c, idx) => (
              <div
                key={idx}
                style={{
                  breakInside: 'avoid',
                  display: 'inline-block',
                  width: '100%',
                  marginBottom: 16,
                  borderRadius: 20,
                  overflow: 'hidden',
                  position: 'relative',
                  height: c.h,
                  background: c.bg,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  }}
                  className="group-hover:opacity-100"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.opacity = '0'
                  }}
                >
                  <div style={{ position: 'absolute', left: 16, bottom: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Creator {idx + 1}</div>
                    <button
                      type="button"
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 999,
                        padding: '4px 12px',
                        color: '#fff',
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* AI TOOLS */}
      <Section>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>AI Tools that feel native</h2>
            <p style={{ color: '#888880', lineHeight: 1.6 }}>
              Generate variations, upscale, remove backgrounds and remix styles — without leaving your workflow.
            </p>

            {[
              { title: 'Instant variations', desc: 'Create multiple styles from a single prompt.', icon: Sparkles },
              { title: 'Smart edits', desc: 'Background remove, cleanup, and re-color in one click.', icon: Wand2 },
              { title: 'Export ready', desc: 'Assets that look crisp in real products.', icon: Layers },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      borderRadius: 8,
                      background: 'rgba(232,255,71,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color="#E8FF47" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 700 }}>{f.title}</div>
                    <div style={{ color: '#888880', fontSize: 14 }}>{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div
              style={{
                width: 420,
                borderRadius: 24,
                background: '#0d0d0d',
                border: '1px solid #1f1f1f',
                padding: 22,
                boxShadow: '0 0 60px rgba(232,255,71,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800 }}>AI Remix</div>
                <div style={{ color: '#888880', fontSize: 13 }}>Preview</div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  height: 220,
                  borderRadius: 18,
                  background:
                    'radial-gradient(circle at 35% 35%, rgba(232,255,71,0.12), rgba(255,107,53,0.06) 55%, rgba(255,255,255,0.02))',
                  border: '1px solid #1f1f1f',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#111111',
                    border: '1px solid #2a2a2a',
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: '#F5F5F0',
                    fontWeight: 700,
                  }}
                >
                  Variation
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#E8FF47',
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: '#000',
                    fontWeight: 800,
                  }}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section fullBleed className="creatify-marquee">
        <div style={{ padding: '0 80px', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Loved by creators</h2>
          <p style={{ marginTop: 8, color: '#888880' }}>5 real opinions — cloned once for smooth scrolling.</p>
        </div>

        <div style={{ overflow: 'hidden' }}>
          <div
            className="creatify-row-wrapper"
            style={{ height: 170, overflow: 'hidden', position: 'relative', width: '100%' }}
          >
            <div
              className="creatify-track"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                height: '100%',
                animation: 'marqueeLeft 45s linear infinite',
              }}
            >
              {allTestimonials.map((t, idx) => (
                <TestimonialCard key={`${t.name}-${idx}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section>
        <div id="pricing" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Pricing</h2>
          <p style={{ marginTop: 8, color: '#888880' }}>Clean, aligned cards with one standout plan.</p>

          <div
            style={{
              marginTop: 28,
              display: 'grid',
              gridTemplateColumns: '1fr 1.1fr 1fr',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* Free */}
            <div style={{ padding: 32, borderRadius: 24, background: '#0d0d0d', border: '1px solid #1f1f1f' }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>Free</h3>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: 'Clash Display, ui-sans-serif', fontSize: 52, fontWeight: 700 }}>$0</div>
                <div style={{ color: '#888880' }}>/mo</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Basic search', 'Limited downloads', 'Community access'].map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888880', fontSize: 14 }}>
                    <span style={{ color: '#E8FF47', fontSize: 16 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  width: '100%',
                  borderRadius: 14,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  color: '#F5F5F0',
                  fontWeight: 800,
                }}
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div
              style={{
                padding: 32,
                borderRadius: 24,
                background: '#0d0d0d',
                border: '2px solid #E8FF47',
                position: 'relative',
                boxShadow: '0 0 60px rgba(232,255,71,0.12)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: -16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#E8FF47',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: '6px 20px',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                }}
              >
                Most Popular
              </span>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>Pro</h3>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: 'Clash Display, ui-sans-serif', fontSize: 52, fontWeight: 700 }}>$19</div>
                <div style={{ color: '#888880' }}>/mo</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Unlimited downloads', 'AI tools included', 'Commercial license', 'Priority support'].map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888880', fontSize: 14 }}>
                    <span style={{ color: '#E8FF47', fontSize: 16 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  width: '100%',
                  borderRadius: 14,
                  padding: '12px 16px',
                  background: '#E8FF47',
                  border: 'none',
                  color: '#000',
                  fontWeight: 900,
                }}
              >
                Start Pro
              </button>
            </div>

            {/* Enterprise */}
            <div style={{ padding: 32, borderRadius: 24, background: '#0d0d0d', border: '1px solid #1f1f1f' }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>Enterprise</h3>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: 'Clash Display, ui-sans-serif', fontSize: 52, fontWeight: 700 }}>$99</div>
                <div style={{ color: '#888880' }}>/mo</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Team seats', 'SSO + admin controls', 'Custom license', 'Dedicated support'].map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888880', fontSize: 14 }}>
                    <span style={{ color: '#E8FF47', fontSize: 16 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  width: '100%',
                  borderRadius: 14,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  color: '#F5F5F0',
                  fontWeight: 800,
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 80px',
          textAlign: 'center',
          background: '#080808',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,255,71,0.12) 0%, transparent 70%)',
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'blobFloat 8s ease-in-out infinite',
            zIndex: 0,
            willChange: 'transform',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
            bottom: -50,
            right: '10%',
            transform: 'translateX(0)',
            animation: 'orbPulse 10s ease-in-out infinite reverse',
            zIndex: 0,
            willChange: 'transform',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto' }}>
          <h2 style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.02 }}>
            <span style={{ display: 'inline', color: '#F5F5F0' }}>Start creating </span>
            <span style={{ display: 'inline', color: '#E8FF47', fontStyle: 'italic' }}>today.</span>
          </h2>
          <p style={{ marginTop: 20, color: '#888880', fontSize: 16, lineHeight: 1.6 }}>
            Build faster. Ship cleaner. Download assets your users actually love.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="#search"
              style={{
                background: '#E8FF47',
                color: '#000',
                fontWeight: 900,
                borderRadius: 12,
                padding: '12px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Start creating
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#"
              style={{
                background: 'transparent',
                color: '#F5F5F0',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                padding: '12px 20px',
              }}
            >
              View docs
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Section>
        <footer style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Creatify</div>
              <p style={{ marginTop: 10, color: '#888880', lineHeight: 1.6, maxWidth: 380 }}>
                Search and download premium creative assets. Built for speed, designed for quality.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {[
                  { Icon: Twitter, label: 'Twitter' },
                  { Icon: Instagram, label: 'Instagram' },
                  { Icon: Linkedin, label: 'LinkedIn' },
                  { Icon: Youtube, label: 'Youtube' },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: '1px solid #1f1f1f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888880',
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.color = '#F5F5F0'
                      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#2a2a2a'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.color = '#888880'
                      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#1f1f1f'
                    }}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: ['Search', 'Categories', 'AI Tools', 'Pricing'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Support', links: ['Help Center', 'Terms', 'Privacy', 'Status'] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontWeight: 800, marginBottom: 12 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((l) => (
                    <a key={l} href="#" style={{ color: '#888880', fontSize: 14 }}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 50,
              paddingTop: 24,
              borderTop: '1px solid #1f1f1f',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              color: '#888880',
              fontSize: 13,
            }}
          >
            <div>© {new Date().getFullYear()} Creatify. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Privacy', 'Terms', 'Security'].map((t) => (
                <a key={t} href="#" style={{ color: '#888880' }}>
                  {t}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </Section>
    </main>
  )
}
