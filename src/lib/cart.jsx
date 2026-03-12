import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const LS_CART = 'kathy_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CART) || '[]') } catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(LS_CART, JSON.stringify(items))
  }, [items])

  const add = (listing) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === listing.id)
      if (exists) return prev
      return [...prev, { ...listing, qty: 1 }]
    })
  }

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)

  const count = items.length

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total, count, open, setOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
