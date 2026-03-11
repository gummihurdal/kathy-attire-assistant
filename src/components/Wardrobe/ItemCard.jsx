import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Tag } from 'lucide-react'

const CATEGORY_ICONS = {
  tops: '◈', bottoms: '◇', dresses: '◉', outerwear: '◎',
  shoes: '○', bags: '◆', accessories: '✦', activewear: '◈',
  swimwear: '◇', lingerie: '◉',
}

export default function ItemCard({ item, onDelete, selectable, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 2500)
      return
    }
    onDelete(item)
  }

  const handleClick = () => {
    if (selectable && onSelect) onSelect(item)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleClick}
      style={{
        ...styles.card,
        cursor: selectable ? 'pointer' : 'default',
        outline: selected ? '2px solid var(--gold)' : 'none',
        outlineOffset: selected ? '2px' : '0',
      }}
    >
      {/* Image */}
      <div style={styles.imageWrap}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} style={styles.image} />
        ) : (
          <div style={styles.noImage}>
            <span style={{ fontSize: '2rem' }}>{CATEGORY_ICONS[item.category] || '◈'}</span>
          </div>
        )}

        {/* Overlay on hover */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.overlay}
          >
            {onDelete && (
              <button
                onClick={handleDelete}
                style={{
                  ...styles.deleteBtn,
                  background: confirming ? 'var(--crimson)' : 'rgba(0,0,0,0.8)',
                  borderColor: confirming ? 'var(--crimson)' : 'var(--border)',
                }}
              >
                <Trash2 size={12} strokeWidth={1.5} />
                <span>{confirming ? 'Confirm' : 'Remove'}</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Selected badge */}
        {selected && (
          <div style={styles.selectedBadge}>✓</div>
        )}

        {/* Category badge */}
        <div style={styles.categoryBadge}>
          {CATEGORY_ICONS[item.category] || '◈'}
        </div>
      </div>

      {/* Info */}
      <div style={styles.info}>
        <p style={styles.name}>{item.name}</p>
        {item.brand && <p style={styles.brand}>{item.brand}</p>}

        {/* Colors */}
        {item.colors?.length > 0 && (
          <div style={styles.colorRow}>
            <Tag size={9} color="var(--ivory-faint)" strokeWidth={1.5} />
            <span style={styles.colorText}>{item.colors.slice(0, 2).join(', ')}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const styles = {
  card: {
    background: 'var(--charcoal)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    position: 'relative',
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: '3/4',
    overflow: 'hidden',
    background: 'var(--muted)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--ivory-faint)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0.75rem',
  },
  deleteBtn: {
    border: '1px solid',
    color: 'var(--ivory)',
    padding: '0.4rem 0.75rem',
    fontSize: '0.65rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'background 0.2s',
    textTransform: 'uppercase',
  },
  selectedBadge: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: 22,
    height: 22,
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  categoryBadge: {
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem',
    fontSize: '0.7rem',
    color: 'var(--gold)',
  },
  info: {
    padding: '0.75rem',
  },
  name: {
    fontSize: '0.8rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    color: 'var(--ivory)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '0.01em',
  },
  brand: {
    fontSize: '0.65rem',
    color: 'var(--ivory-faint)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginTop: '0.15rem',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    marginTop: '0.4rem',
  },
  colorText: {
    fontSize: '0.65rem',
    color: 'var(--ivory-faint)',
  },
}
