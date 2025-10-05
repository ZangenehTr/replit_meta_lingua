import type { Express } from "express";
import express from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "../storage";
import { AIProviderManager } from "../ai-providers/ai-provider-manager";
import { 
  insertBookSchema, 
  insertBookCategorySchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertBookOrderSchema,
  insertUserAddressSchema,
  insertDictionaryLookupSchema,
  type Book,
  type Cart,
  type CartItem,
  type Order,
  type BookOrder,
  type UserAddress,
  type DictionaryLookup
} from "@shared/schema";

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'book-pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, `book-${uniqueSuffix}.pdf`);
  }
});

const uploadPDF = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for PDFs
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    req.user = { id: decoded.userId, role: decoded.role || 'Student' };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role || 'Student';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Validation schemas
const bookFiltersSchema = z.object({
  category: z.string().optional(),
  is_free: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

const addToCartSchema = z.object({
  book_id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1)
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
});

const checkoutSchema = z.object({
  address_id: z.number().int().positive(),
  payment_method: z.enum(['wallet', 'card', 'cash']).default('wallet'),
  notes: z.string().optional()
});

const dictionaryLookupSchema = z.object({
  word: z.string().min(1, "Word is required"),
  lang: z.enum(['en', 'fa', 'ar']).default('en'),
  context: z.string().optional()
});

export function setupBookEcommerceRoutes(app: Express) {
  
  // ============================================================================
  // BOOK MANAGEMENT ROUTES (Admin only)
  // ============================================================================

  // GET /api/books - List all books with filtering
  app.get("/api/books", async (req: any, res) => {
    try {
      const filters = bookFiltersSchema.parse(req.query);
      
      let books: Book[] = [];
      
      if (filters.search) {
        books = await storage.searchBooks(filters.search);
      } else {
        books = await storage.getBooks({
          category: filters.category,
          isFree: filters.is_free,
          limit: filters.limit,
          offset: filters.offset
        });
      }

      res.json({
        success: true,
        data: books.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          description: book.description,
          price: book.price, // Use actual database price field (decimal)
          cover_image: book.cover_image, // Include cover image from database
          stock_quantity: book.stock_quantity,
          publication_year: book.publication_year,
          created_at: book.created_at
        }))
      });
    } catch (error: any) {
      console.error('Error fetching books:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch books'
      });
    }
  });

  // POST /api/books - Create new book (Admin only)
  app.post("/api/books", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const bookData = insertBookSchema.omit({ 
        id: true, 
        created_at: true
      }).parse({
        ...req.body,
        category: req.body.category,
        price: req.body.price || 0, // Use actual price field
        stock_quantity: req.body.stock_quantity || 0,
        publication_year: req.body.publication_year
      });

      const book = await storage.createBook(bookData);

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          description: book.description,
          price: book.price, // Use actual database price field
          cover_image: book.cover_image,
          stock_quantity: book.stock_quantity,
          publication_year: book.publication_year,
          created_at: book.created_at
        }
      });
    } catch (error: any) {
      console.error('Error creating book:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create book'
      });
    }
  });

  // GET /api/books/:id - Get single book details
  app.get("/api/books/:id", async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      const bookAssets = await storage.getBookAssets(bookId);

      res.json({
        success: true,
        data: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          description: book.description,
          price: book.price, // Use actual database price field
          cover_image: book.cover_image,
          stock_quantity: book.stock_quantity,
          publication_year: book.publication_year,
          assets: bookAssets,
          created_at: book.created_at
        }
      });
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book details'
      });
    }
  });

  // PATCH /api/books/:id - Update book (Admin only)
  app.patch("/api/books/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      const updateData = insertBookSchema.partial().omit({ 
        id: true, 
        created_at: true
      }).parse({
        ...req.body,
        category: req.body.category,
        price: req.body.price,
        stock_quantity: req.body.stock_quantity,
        publication_year: req.body.publication_year
      });

      const updatedBook = await storage.updateBook(bookId, updateData);
      if (!updatedBook) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        message: 'Book updated successfully',
        data: {
          id: updatedBook.id,
          title: updatedBook.title,
          author: updatedBook.author,
          isbn: updatedBook.isbn,
          category: updatedBook.category,
          description: updatedBook.description,
          price: updatedBook.price, // Use actual database price field
          cover_image: updatedBook.cover_image,
          stock_quantity: updatedBook.stock_quantity,
          publication_year: updatedBook.publication_year,
          created_at: updatedBook.created_at
        }
      });
    } catch (error: any) {
      console.error('Error updating book:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update book'
      });
    }
  });

  // DELETE /api/books/:id - Delete book (Admin only)
  app.delete("/api/books/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      await storage.deleteBook(bookId);

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete book'
      });
    }
  });

  // POST /api/books/:id/upload-pdf - Upload PDF file (Admin only)
  app.post("/api/books/:id/upload-pdf", authenticateToken, requireRole(['Admin']), uploadPDF.single('pdf'), async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'PDF file is required'
        });
      }

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Create book asset record
      const bookAsset = await storage.createBookAsset({
        book_id: bookId,
        file_type: 'pdf',
        file_path: req.file.path,
        file_size: req.file.size
      });

      // Note: PDF files are stored as assets, not directly in book record

      res.json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          asset_id: bookAsset.id,
          file_path: bookAsset.file_path,
          file_size: bookAsset.file_size,
          upload_date: bookAsset.upload_date
        }
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload PDF'
      });
    }
  });

  // ============================================================================
  // CART MANAGEMENT ROUTES
  // ============================================================================

  // GET /api/cart - Get user's cart
  app.get("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      let cart = await storage.getUserCart(userId);
      
      // Create cart if it doesn't exist
      if (!cart) {
        cart = await storage.createCart({ user_id: userId });
      }

      const cartItems = await storage.getCartItems(cart.id);
      
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.book.price.toString()) * item.quantity), 0
      );

      res.json({
        success: true,
        data: {
          id: cart.id,
          user_id: cart.user_id,
          items: cartItems.map(item => ({
            id: item.id,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              price: item.book.price, // Use actual database price field
              cover_image: item.book.cover_image,
              stock_quantity: item.book.stock_quantity,
              publication_year: item.book.publication_year
            },
            quantity: item.quantity,
            subtotal: parseFloat(item.book.price.toString()) * item.quantity,
            added_at: item.added_at
          })),
          total_items: cartItems.length,
          total_amount: totalAmount,
          updated_at: cart.updated_at
        }
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart'
      });
    }
  });

  // POST /api/cart/items - Add item to cart
  app.post("/api/cart/items", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { book_id, quantity } = addToCartSchema.parse(req.body);

      // Verify book exists and is available
      const book = await storage.getBook(book_id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Note: Removed availability check as book schema doesn't have isAvailable field
      // Could check hardcopy_available if needed for physical books

      // Get or create user cart
      let cart = await storage.getUserCart(userId);
      if (!cart) {
        cart = await storage.createCart({ userId });
      }

      // Add item to cart
      const cartItem = await storage.addToCart(cart.id, book_id, quantity);

      res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: {
          id: cartItem.id,
          book_id: cartItem.book_id,
          quantity: cartItem.quantity,
          added_at: cartItem.added_at
        }
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart'
      });
    }
  });

  // PATCH /api/cart/items/:id - Update cart item quantity
  app.patch("/api/cart/items/:id", authenticateToken, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.id, 10);
      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      const { quantity } = updateCartItemSchema.parse(req.body);

      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Verify ownership through cart
      const cart = await storage.getUserCart(req.user.id);
      if (!cart || cartItem.cart_id !== cart.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedItem = await storage.updateCartItem(itemId, quantity);

      res.json({
        success: true,
        message: 'Cart item updated',
        data: {
          id: updatedItem!.id,
          quantity: updatedItem!.quantity,
          added_at: updatedItem!.added_at
        }
      });
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item'
      });
    }
  });

  // DELETE /api/cart/items/:id - Remove item from cart
  app.delete("/api/cart/items/:id", authenticateToken, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.id, 10);
      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Verify ownership through cart
      const cart = await storage.getUserCart(req.user.id);
      if (!cart || cartItem.cart_id !== cart.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await storage.removeFromCart(itemId);

      res.json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart'
      });
    }
  });

  // DELETE /api/cart - Clear entire cart
  app.delete("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.clearCart(userId);

      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart'
      });
    }
  });

  // ============================================================================
  // ORDER MANAGEMENT ROUTES
  // ============================================================================

  // POST /api/checkout - Create order from cart
  app.post("/api/checkout", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { address_id, payment_method, notes } = checkoutSchema.parse(req.body);

      // Get user's cart
      const cart = await storage.getUserCart(userId);
      if (!cart) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      const cartItems = await storage.getCartItems(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Verify address belongs to user
      const address = await storage.getUserAddress(address_id);
      if (!address || address.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.book.price.toString()) * item.quantity), 0
      );

      // All books have a price, check if price is 0 for free items
      const hasFreeItems = cartItems.some(item => parseFloat(item.book.price.toString()) === 0);
      const hasPaidItems = cartItems.some(item => parseFloat(item.book.price.toString()) > 0);

      // Create order
      const order = await storage.createOrder({
        user_id: userId,
        total_amount_minor: totalAmount,
        status: totalAmount === 0 ? 'completed' : 'pending',
        currency_code: 'USD'
      });

      // Create order items
      for (const cartItem of cartItems) {
        await storage.createOrderItem({
          order_id: order.id,
          book_id: cartItem.book_id,
          quantity: cartItem.quantity,
          price_minor: Math.round(parseFloat(cartItem.book.price.toString()) * 100) // Convert price to cents
        });
      }

      // Clear cart after successful order creation
      await storage.clearCart(userId);

      const orderDetails = await storage.getOrder(order.id);

      res.status(201).json({
        success: true,
        message: totalAmount === 0 ? 'Order completed successfully' : 'Order created successfully',
        data: {
          id: order.id,
          status: order.status,
          payment_status: order.status,
          total_amount: order.total_amount_minor,
          payment_method: order.status,
          items: orderDetails!.items.map(item => ({
            id: item.id,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              price: parseFloat(item.book.price.toString())
            },
            quantity: item.quantity,
            unit_price: item.price_minor
          })),
          created_at: order.created_at
        }
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }
  });

  // GET /api/orders - Get user's orders
  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getOrders(userId);

      res.json({
        success: true,
        data: orders.map(order => ({
          id: order.id,
          status: order.status,
          payment_status: order.status,
          total_amount: order.total_amount_minor,
          payment_method: order.status,
          items_count: order.items.length,
          items: order.items.map(item => ({
            id: item.id,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              cover_image_url: item.book.cover_image
            },
            quantity: item.quantity,
            unit_price: item.price_minor
          })),
          created_at: order.created_at,
          updated_at: order.created_at
        }))
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  });

  // GET /api/orders/:id - Get single order details
  app.get("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify ownership
      if (order.user_id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          id: order.id,
          status: order.status,
          payment_status: order.status,
          total_amount: order.total_amount_minor,
          payment_method: order.status,
          // notes: order.notes, // Property doesn't exist on order object
          items: order.items.map(item => ({
            id: item.id,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              isbn: item.book.isbn,
              price: parseFloat(item.book.price.toString()),
              cover_image_url: item.book.cover_image
            },
            quantity: item.quantity,
            unit_price: item.price_minor,
            subtotal: item.price_minor * item.quantity
          })),
          created_at: order.created_at,
          updated_at: order.created_at
        }
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order details'
      });
    }
  });

  // GET /api/orders/:id/download/:book_id - Download purchased PDF
  app.get("/api/orders/:id/download/:book_id", authenticateToken, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const bookId = parseInt(req.params.book_id, 10);
      
      if (isNaN(orderId) || isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order or book ID'
        });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify ownership
      if (order.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Verify order is completed and payment is successful
      if (order.status !== 'completed' || order.status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Order must be completed before downloading'
        });
      }

      // Verify book is in the order
      const orderItem = order.items.find(item => item.book_id === bookId);
      if (!orderItem) {
        return res.status(404).json({
          success: false,
          message: 'Book not found in this order'
        });
      }

      // Get book assets
      const bookAssets = await storage.getBookAssets(bookId);
      const pdfAsset = bookAssets.find(asset => asset.file_type === 'pdf');
      
      if (!pdfAsset) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not available for this book'
        });
      }

      // Check if file exists
      if (!fs.existsSync(pdfAsset.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not found on server'
        });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(pdfAsset.file_path)}"`);
      res.setHeader('Content-Length', pdfAsset.file_size || 0);

      // Stream the file
      const fileStream = fs.createReadStream(pdfAsset.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download PDF'
      });
    }
  });

  // ============================================================================
  // ADDRESS MANAGEMENT ROUTES
  // ============================================================================

  // GET /api/addresses - Get user addresses
  app.get("/api/addresses", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getUserAddresses(userId);

      res.json({
        success: true,
        data: addresses.map(address => ({
          id: address.id,
          full_name: address.full_name,
          phone: address.phone,
          address_line_1: address.address_line1,
          address_line_2: address.address_line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
          is_default: address.is_default,
          created_at: address.createdAt,
          updated_at: address.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch addresses'
      });
    }
  });

  // POST /api/addresses - Create new address
  app.post("/api/addresses", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressData = insertUserAddressSchema.omit({ 
        id: true, 
        userId: true,
        createdAt: true, 
        updatedAt: true 
      }).parse({
        ...req.body,
        fullName: req.body.full_name,
        addressLine1: req.body.address_line_1,
        addressLine2: req.body.address_line_2,
        postalCode: req.body.postal_code,
        is_default: req.body.is_default || false
      });

      const address = await storage.createUserAddress({
        ...addressData,
        userId
      });

      // If this is set as default, update other addresses
      if (address.is_default) {
        await storage.setDefaultAddress(userId, address.id);
      }

      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: {
          id: address.id,
          label: address.label,
          full_name: address.full_name,
          phone: address.phone,
          address_line_1: address.address_line1,
          address_line_2: address.address_line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
          is_default: address.is_default,
          created_at: address.createdAt,
          updated_at: address.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error creating address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create address'
      });
    }
  });

  // PATCH /api/addresses/:id - Update address
  app.patch("/api/addresses/:id", authenticateToken, async (req: any, res) => {
    try {
      const addressId = parseInt(req.params.id, 10);
      if (isNaN(addressId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID'
        });
      }

      const userId = req.user.id;
      const existingAddress = await storage.getUserAddress(addressId);
      
      if (!existingAddress || existingAddress.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      const updateData = insertUserAddressSchema.partial().omit({ 
        id: true, 
        userId: true,
        createdAt: true, 
        updatedAt: true 
      }).parse({
        ...req.body,
        fullName: req.body.full_name,
        addressLine1: req.body.address_line_1,
        addressLine2: req.body.address_line_2,
        postalCode: req.body.postal_code,
        is_default: req.body.is_default
      });

      const updatedAddress = await storage.updateUserAddress(addressId, updateData);

      // If this is set as default, update other addresses
      if (updateData.is_default) {
        await storage.setDefaultAddress(userId, addressId);
      }

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: {
          id: updatedAddress!.id,
          full_name: updatedAddress!.full_name,
          phone: updatedAddress!.phone,
          address_line_1: updatedAddress!.address_line1,
          address_line_2: updatedAddress!.address_line2,
          city: updatedAddress!.city,
          state: updatedAddress!.state,
          postal_code: updatedAddress!.postal_code,
          country: updatedAddress!.country,
          is_default: updatedAddress!.is_default,
          created_at: updatedAddress!.createdAt,
          updated_at: updatedAddress!.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error updating address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update address'
      });
    }
  });

  // DELETE /api/addresses/:id - Delete address
  app.delete("/api/addresses/:id", authenticateToken, async (req: any, res) => {
    try {
      const addressId = parseInt(req.params.id, 10);
      if (isNaN(addressId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID'
        });
      }

      const userId = req.user.id;
      const address = await storage.getUserAddress(addressId);
      
      if (!address || address.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      await storage.deleteUserAddress(addressId);

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete address'
      });
    }
  });

  // ============================================================================
  // DICTIONARY API
  // ============================================================================

  // GET /api/dictionary/lookup - Look up word definition
  app.get("/api/dictionary/lookup", authenticateToken, async (req: any, res) => {
    try {
      const { word, lang, context } = dictionaryLookupSchema.parse(req.query);

      // Mock dictionary service - in real implementation, integrate with actual dictionary API
      const mockDefinitions: Record<string, Record<string, any>> = {
        en: {
          hello: {
            word: "hello",
            pronunciation: "/həˈloʊ/",
            partOfSpeech: "noun, exclamation",
            definitions: [
              {
                definition: "used as a greeting or to begin a phone conversation",
                example: "hello there, Katie!"
              }
            ],
            synonyms: ["hi", "greetings", "good morning"],
            language: "en"
          },
          book: {
            word: "book",
            pronunciation: "/bʊk/",
            partOfSpeech: "noun, verb",
            definitions: [
              {
                definition: "a written or printed work consisting of pages",
                example: "a book of poetry"
              },
              {
                definition: "to reserve (accommodation, a place, etc.)",
                example: "I have booked a table for two"
              }
            ],
            synonyms: ["tome", "volume", "publication"],
            language: "en"
          }
        },
        fa: {
          کتاب: {
            word: "کتاب",
            pronunciation: "/ketɒːb/",
            partOfSpeech: "اسم",
            definitions: [
              {
                definition: "مجموعه‌ای از برگه‌های نوشته شده یا چاپ شده",
                example: "کتاب شعر"
              }
            ],
            synonyms: ["کتابچه", "دفتر", "اثر"],
            language: "fa"
          }
        }
      };

      const languageDict = mockDefinitions[lang];
      const definition = languageDict?.[word.toLowerCase()];

      if (!definition) {
        return res.status(404).json({
          success: false,
          message: 'Word not found in dictionary'
        });
      }

      res.json({
        success: true,
        data: definition
      });
    } catch (error: any) {
      console.error('Error looking up word:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to lookup word'
      });
    }
  });

  // POST /api/dictionary/log - Log dictionary usage
  app.post("/api/dictionary/log", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const logData = insertDictionaryLookupSchema.omit({ 
        id: true, 
        userId: true,
        createdAt: true 
      }).parse({
        ...req.body,
        lookupLanguage: req.body.lookup_language,
        sourceText: req.body.source_text
      });

      const lookupLog = await storage.createDictionaryLookup({
        ...logData,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Dictionary usage logged',
        data: {
          id: lookupLog.id,
          word: lookupLog.word,
          language: lookupLog.language,
          lookup_language: lookupLog.language,
          created_at: lookupLog.lookup_date
        }
      });
    } catch (error: any) {
      console.error('Error logging dictionary usage:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to log dictionary usage'
      });
    }
  });

  // ============================================================================
  // AI DESCRIPTION GENERATION (Admin only)
  // ============================================================================

  // POST /api/books/:id/generate-description - Generate AI description for book
  app.post("/api/books/:id/generate-description", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Initialize AI provider
      const aiProvider = new AIProviderManager();
      await aiProvider.initialize();

      // Generate Farsi description (100-200 words)
      const prompt = `Generate a professional book description in Persian (Farsi) language for the following book. The description should be 100-200 words and suitable for an e-commerce book store.

Book Title: ${book.title}
Author: ${book.author || 'Unknown'}
${book.description ? `English Description: ${book.description}` : ''}
${book.category ? `Category: ${book.category}` : ''}
${book.level ? `Level: ${book.level}` : ''}
${book.language ? `Language: ${book.language}` : ''}

Please write a compelling description in Persian that highlights the book's value and target audience. Write ONLY the description in Persian, nothing else.`;

      const aiResponse = await aiProvider.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a professional book description writer. Generate engaging, accurate descriptions in Persian (Farsi) for books.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiDescription = (aiResponse.message?.content || '').trim();
      const wordCount = aiDescription.split(/\s+/).filter(word => word.length > 0).length;

      // Validate word count (100-200 words)
      if (wordCount < 100 || wordCount > 200) {
        return res.status(422).json({
          success: false,
          message: `AI description must be 100-200 words. Generated ${wordCount} words.`,
          data: {
            wordCount,
            description: aiDescription
          }
        });
      }

      // Update book with AI description
      await storage.updateBook(bookId, {
        aiDescription
      });

      res.json({
        success: true,
        message: 'AI description generated successfully',
        data: {
          bookId,
          aiDescription,
          wordCount
        }
      });
    } catch (error: any) {
      console.error('Error generating AI description:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate AI description'
      });
    }
  });

  // ============================================================================
  // BOOK ORDERS ROUTES
  // ============================================================================

  // GET /api/book-ecommerce/orders - Get all book orders (Admin only)
  app.get("/api/book-ecommerce/orders", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const orders = await storage.getAllBookOrders();
      
      res.json({
        success: true,
        data: orders.map(order => ({
          id: order.id,
          userId: order.userId,
          bookId: order.bookId,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          currency: order.currency,
          downloadCount: order.downloadCount,
          lastDownloadAt: order.lastDownloadAt,
          downloadLimit: order.downloadLimit,
          shippingStatus: order.shippingStatus,
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }))
      });
    } catch (error: any) {
      console.error('Error fetching book orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book orders'
      });
    }
  });

  // GET /api/book-ecommerce/student/orders - Get student's book orders
  app.get("/api/book-ecommerce/student/orders", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getUserBookOrders(userId);
      
      res.json({
        success: true,
        data: orders.map(order => ({
          id: order.id,
          bookId: order.bookId,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          currency: order.currency,
          downloadCount: order.downloadCount,
          lastDownloadAt: order.lastDownloadAt,
          downloadLimit: order.downloadLimit,
          shippingStatus: order.shippingStatus,
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt
        }))
      });
    } catch (error: any) {
      console.error('Error fetching user book orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your orders'
      });
    }
  });

  // PATCH /api/book-ecommerce/orders/:id/shipping - Update shipping status (Admin only)
  app.patch("/api/book-ecommerce/orders/:id/shipping", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }

      const updateData = {
        shippingStatus: req.body.shippingStatus,
        trackingNumber: req.body.trackingNumber,
        shippedAt: req.body.shippedAt ? new Date(req.body.shippedAt) : undefined,
        deliveredAt: req.body.deliveredAt ? new Date(req.body.deliveredAt) : undefined
      };

      const updated = await storage.updateBookOrderShipping(orderId, updateData);

      res.json({
        success: true,
        message: 'Shipping status updated successfully',
        data: updated
      });
    } catch (error: any) {
      console.error('Error updating shipping status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shipping status'
      });
    }
  });

  // POST /api/book-ecommerce/orders/:id/download - Record PDF download
  app.post("/api/book-ecommerce/orders/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const userId = req.user.id;
      
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }

      const order = await storage.getBookOrder(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (order.downloadCount >= order.downloadLimit) {
        return res.status(403).json({
          success: false,
          message: `Download limit reached (${order.downloadLimit} downloads)`
        });
      }

      await storage.recordBookDownload(orderId);

      res.json({
        success: true,
        message: 'Download recorded successfully',
        data: {
          downloadCount: order.downloadCount + 1,
          downloadLimit: order.downloadLimit
        }
      });
    } catch (error: any) {
      console.error('Error recording download:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record download'
      });
    }
  });

  // POST /api/book-ecommerce/books/:id/purchase - Purchase a book
  app.post("/api/book-ecommerce/books/:id/purchase", authenticateToken, async (req: any, res) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const { paymentMethod = 'wallet', shippingAddress } = req.body;
      
      if (isNaN(bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid book ID'
        });
      }

      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // For hardcopy books, shipping address is required
      if (book.bookType === 'hardcopy' && !shippingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Shipping address is required for hardcopy books'
        });
      }

      // Import required modules for transaction
      const { db } = await import("../db");
      const { users, walletTransactions, book_orders } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      // Handle wallet payment with atomic transaction
      let order;
      if (paymentMethod === 'wallet') {
        const user = await storage.getUser(userId);
        if (!user || user.walletBalance < book.price) {
          return res.status(400).json({ 
            success: false,
            message: 'Insufficient wallet balance',
            required: book.price,
            current: user?.walletBalance || 0
          });
        }

        // Atomic transaction: deduct wallet, create transaction, create order
        order = await db.transaction(async (tx) => {
          // Deduct from wallet
          await tx.update(users)
            .set({ 
              walletBalance: sql`${users.walletBalance} - ${book.price}`,
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));

          // Create wallet transaction record
          await tx.insert(walletTransactions).values({
            userId,
            type: 'payment',
            amount: book.price.toString(),
            currency: book.currency || 'IRR',
            description: `Book purchase: ${book.title}`,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Create book order
          const orderData: any = {
            userId,
            bookId,
            orderStatus: 'completed',
            paymentStatus: 'paid',
            totalAmount: book.price,
            currency: book.currency || 'IRR',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Set download limit for PDF books
          if (book.bookType === 'pdf') {
            orderData.downloadLimit = 5;
            orderData.downloadCount = 0;
          }

          // Set shipping info for hardcopy books
          if (book.bookType === 'hardcopy' && shippingAddress) {
            orderData.shippingStatus = 'pending';
            orderData.shippingAddress = shippingAddress;
          }

          const result = await tx.insert(book_orders).values(orderData).returning();
          return result[0];
        });
      } else {
        // For other payment methods, just create the order
        const orderData: any = {
          userId,
          bookId,
          orderStatus: 'pending',
          paymentStatus: 'pending',
          totalAmount: book.price,
          currency: book.currency || 'IRR',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        if (book.bookType === 'pdf') {
          orderData.downloadLimit = 5;
          orderData.downloadCount = 0;
        }

        if (book.bookType === 'hardcopy' && shippingAddress) {
          orderData.shippingStatus = 'pending';
          orderData.shippingAddress = shippingAddress;
        }

        order = await storage.createBookOrder(orderData);
      }

      res.json({
        success: true,
        message: 'Book purchased successfully',
        data: order
      });
    } catch (error: any) {
      console.error('Error purchasing book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase book'
      });
    }
  });
}