import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth'

const STYLE_PILLS = [
  { label: 'Casual', icon: '☁️' },
  { label: 'Smart Casual', icon: '✦' },
  { label: 'Business', icon: '◈' },
  { label: 'Formal', icon: '♛' },
  { label: 'Sporty', icon: '◎' },
  { label: 'Evening', icon: '◇' },
  { label: 'Weekend', icon: '○' },
]

const FEATURES = [
  {
    icon: '📸',
    title: 'Photograph Your Wardrobe',
    desc: 'Upload photos of every piece — tops, bottoms, dresses, shoes, bags, and accessories. AI automatically identifies and categorises each item.',
  },
  {
    icon: '✦',
    title: 'AI Outfit Curation',
    desc: 'Describe your occasion or select a style direction and receive expert outfit recommendations drawn from your own wardrobe.',
  },
  {
    icon: '🎨',
    title: 'Colour Harmony',
    desc: 'Every recommendation considers colour theory — complementary tones, analogous palettes, and seasonal colour stories.',
  },
  {
    icon: '♛',
    title: 'Personal Style Memory',
    desc: 'Save your favourite combinations into your personal Lookbook. Your style preferences are remembered across every session.',
  },
]

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
}
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        {/* Decorative elements */}
        <div style={styles.heroBg} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.06, scale: 1 }}
          transition={{ duration: 2 }}
          style={styles.heroCircle}
        />

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={styles.heroContent}
        >
          <motion.div variants={fadeUp} style={styles.badge}>
            <Crown size={10} color="var(--gold)" />
            <span>Royal Wardrobe Intelligence</span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={styles.heroTitle}>
            Your Personal<br />
            <em>Atelier Privé</em>
          </motion.h1>

          <motion.div variants={fadeUp}>
            <span className="gold-line" />
          </motion.div>

          <motion.p variants={fadeUp} style={styles.heroSub}>
            Photograph your wardrobe. Let AI curate perfect outfits from what you already own —
            colour-coordinated, occasion-appropriate, and styled to perfection.
          </motion.p>

          {/* Style pills */}
          <motion.div variants={fadeUp} style={styles.stylePills}>
            {STYLE_PILLS.map(s => (
              <span key={s.label} style={styles.pill}>
                <span style={styles.pillIcon}>{s.icon}</span>
                {s.label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} style={styles.ctaRow}>
            <Link to={user ? '/wardrobe' : '/auth'} style={styles.ctaPrimary}>
              <Sparkles size={14} strokeWidth={1.5} />
              Begin Your Wardrobe
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            {user && (
              <Link to="/outfits" style={styles.ctaSecondary}>
                Generate an Outfit
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="divider" style={{ margin: '0 4rem' }} />

      {/* Features */}
      <section style={styles.features}>
        <div style={styles.featuresHeader}>
          <p className="section-label">The Experience</p>
          <h2 style={styles.featuresTitle}>Dressed Like Royalty</h2>
          <p style={styles.featuresSub}>Every morning, an expert stylist at your service.</p>
        </div>

        <div style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={styles.featureCard}
            >
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={styles.ctaBanner}>
        <div style={styles.ctaBannerInner}>
          <Crown size={20} color="var(--gold)" strokeWidth={1} />
          <h2 style={styles.ctaBannerTitle}>Begin Your Collection</h2>
          <p style={styles.ctaBannerSub}>
            Add your first pieces and let your personal stylist get to work.
          </p>
          <Link to={user ? '/wardrobe' : '/auth'} style={styles.ctaPrimary}>
            {user ? 'Open My Wardrobe' : 'Create Your Account'}
          </Link>
        </div>
      </section>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh' },
  hero: {
    position: 'relative',
    padding: '8rem 4rem 6rem',
    overflow: 'hidden',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse 60% 80% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)',
  },
  heroCircle: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    border: '1px solid var(--gold)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  heroContent: {
    maxWidth: 700,
    position: 'relative',
    zIndex: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid var(--gold-dark)',
    padding: '0.35rem 1rem',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '2rem',
    fontWeight: 400,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(3rem, 6vw, 5.5rem)',
    fontWeight: 300,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    marginBottom: '1rem',
    color: 'var(--ivory)',
  },
  heroSub: {
    fontSize: '1rem',
    color: 'var(--ivory-dim)',
    fontWeight: 300,
    lineHeight: 1.7,
    maxWidth: 520,
    marginBottom: '2rem',
  },
  stylePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '2.5rem',
  },
  pill: {
    border: '1px solid var(--border)',
    padding: '0.35rem 0.875rem',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: 'var(--ivory-dim)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontFamily: 'var(--font-body)',
  },
  pillIcon: { fontSize: '0.75rem' },
  ctaRow: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    textDecoration: 'none',
    padding: '0.875rem 2rem',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    transition: 'background 0.2s',
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid var(--border)',
    color: 'var(--ivory-dim)',
    textDecoration: 'none',
    padding: '0.875rem 2rem',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
  },
  features: {
    padding: '6rem 4rem',
  },
  featuresHeader: {
    maxWidth: 480,
    marginBottom: '4rem',
  },
  featuresTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    margin: '0.5rem 0 0.75rem',
  },
  featuresSub: {
    color: 'var(--ivory-dim)',
    fontSize: '0.9rem',
    fontWeight: 300,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1px',
    background: 'var(--border)',
  },
  featureCard: {
    background: 'var(--obsidian)',
    padding: '2.5rem 2rem',
    borderTop: '2px solid transparent',
    transition: 'border-color 0.2s',
  },
  featureIcon: {
    fontSize: '1.5rem',
    display: 'block',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 400,
    marginBottom: '0.75rem',
  },
  featureDesc: {
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    fontWeight: 300,
    lineHeight: 1.7,
  },
  ctaBanner: {
    padding: '6rem 4rem',
    borderTop: '1px solid var(--border)',
  },
  ctaBannerInner: {
    maxWidth: 500,
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  ctaBannerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem',
    fontWeight: 400,
    fontStyle: 'italic',
  },
  ctaBannerSub: {
    color: 'var(--ivory-dim)',
    fontSize: '0.9rem',
    fontWeight: 300,
    marginBottom: '0.5rem',
  },
}
