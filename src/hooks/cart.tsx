import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace-Cart');
      if (cart) setProducts(JSON.parse(cart));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (!productExists) {
        const { id, title, image_url, price } = product;
        const quantity = 1;
        const addProduct = {
          id,
          title,
          image_url,
          price,
          quantity,
        };

        const updateProducts = products;
        updateProducts.push(addProduct);

        setProducts([...updateProducts]);

        await AsyncStorage.setItem(
          '@GoMarketplace-Cart',
          JSON.stringify(updateProducts),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updateProducts = products.map(product => {
        if (product.id === id) {
          const { title, image_url, price } = product;
          const quantity = product.quantity + 1;
          return { id, title, image_url, price, quantity };
        }
        return product;
      });

      setProducts(updateProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace-Cart',
        JSON.stringify(updateProducts),
      );
    },
    [setProducts, products],
  );

  const decrement = useCallback(
    async id => {
      const updateProducts: Product[] = [];

      products.map(product => {
        if (product.id === id) {
          if (product.quantity === 1) return false;

          const { title, image_url, price } = product;
          const quantity = product.quantity - 1;
          updateProducts.push({ id, title, image_url, price, quantity });
          return true;
        }
        updateProducts.push(product);
        return true;
      });

      setProducts(updateProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace-Cart',
        JSON.stringify(updateProducts),
      );
    },
    [setProducts, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
