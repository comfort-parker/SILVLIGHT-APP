import { Cart } from "../Models/Cart_Mod.js";
import { Product } from "../Models/Product_Mod.js";

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantId, quantity } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find selected variant
    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    // Find or create cart
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) cart = new Cart({ user: userId, items: [], totalPrice: 0 });

    // Check if product + variant already exists
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product._id.toString() === productId &&
        item.variantId?.toString() === variantId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variantId,
        quantity,
        price: variant.price, // ✅ snapshot price
      });
    }

    // Recalculate totalPrice
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { variantId } = req.params; // ✅ optional query param

    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product?._id.toString() === productId &&
          (!variantId || item.variantId?.toString() === variantId)
        )
    );

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// Get user cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) return res.status(200).json({ items: [], totalPrice: 0 });

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Clear cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ items: [], totalPrice: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Find the item
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product._id.toString() === productId &&
        (!variantId || item.variantId?.toString() === variantId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update quantity (and remove if <=0)
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    // Recalculate total
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: err.message });
  }
};
