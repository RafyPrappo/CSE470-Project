import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        // Try to get cart from local storage on initial load
        const savedCart = localStorage.getItem('tech_aesthetics_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Sync cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('tech_aesthetics_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, quantity) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item => item._id === product._id);

            if (existingItemIndex > -1) {
                // Update quantity if item already exists
                const newCart = [...prevCart];
                const newQuantity = newCart[existingItemIndex].cartQuantity + quantity;

                // Prevent exceeding stock limit
                if (newQuantity > product.stock) {
                    newCart[existingItemIndex].cartQuantity = product.stock;
                } else {
                    newCart[existingItemIndex].cartQuantity = newQuantity;
                }
                return newCart;
            } else {
                // Add new item
                return [...prevCart, { ...product, cartQuantity: quantity, addedAt: new Date().toISOString() }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item._id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart(prevCart => prevCart.map(item => {
            if (item._id === productId) {
                // Ensure quantity is between 1 and available stock
                const validQuantity = Math.max(1, Math.min(newQuantity, item.stock));
                return { ...item, cartQuantity: validQuantity };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('tech_aesthetics_cart');
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.retailPrice * item.cartQuantity), 0);
    };

    const getCartItemCount = () => {
        return cart.reduce((count, item) => count + item.cartQuantity, 0);
    };

    const value = useMemo(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount
    }), [cart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
