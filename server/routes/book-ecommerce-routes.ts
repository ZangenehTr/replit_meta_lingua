import type { Express } from "express";
import express from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "../storage";
import { 
  insertBookSchema, 
  insertBookCategorySchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertUserAddressSchema,
  insertDictionaryLookupSchema,
  type Book,
  type Cart,
  type CartItem,
  type Order,
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
  category_id: z.string().transform(val => parseInt(val, 10)).optional(),
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
          categoryId: filters.category_id,
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
          category_id: book.category_id,
          description: book.description,
          price: book.price_minor / 100, // Convert from cents to dollars
          price_minor: book.price_minor,
          currency_code: book.currency_code,
          is_free: book.is_free,
          pdf_file_path: book.pdf_file_path,
          hardcopy_available: book.hardcopy_available,
          created_at: book.createdAt,
          updated_at: book.updatedAt
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
        createdAt: true, 
        updatedAt: true 
      }).parse({
        ...req.body,
        category_id: req.body.category_id,
        price_minor: req.body.price_minor || Math.round((req.body.price || 0) * 100), // Convert dollars to cents
        currency_code: req.body.currency_code || 'USD',
        is_free: req.body.is_free || false,
        pdf_file_path: req.body.pdf_file_path,
        hardcopy_available: req.body.hardcopy_available || false
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
          category_id: book.category_id,
          description: book.description,
          price: book.price_minor / 100, // Convert from cents to dollars
          price_minor: book.price_minor,
          currency_code: book.currency_code,
          is_free: book.is_free,
          pdf_file_path: book.pdf_file_path,
          hardcopy_available: book.hardcopy_available,
          created_at: book.createdAt,
          updated_at: book.updatedAt
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
          category_id: book.category_id,
          description: book.description,
          price: book.price_minor / 100, // Convert from cents to dollars
          price_minor: book.price_minor,
          currency_code: book.currency_code,
          is_free: book.is_free,
          pdf_file_path: book.pdf_file_path,
          hardcopy_available: book.hardcopy_available,
          assets: bookAssets,
          created_at: book.createdAt,
          updated_at: book.updatedAt
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
        createdAt: true, 
        updatedAt: true 
      }).parse({
        ...req.body,
        category_id: req.body.category_id,
        price_minor: req.body.price_minor !== undefined ? req.body.price_minor : (req.body.price ? Math.round(req.body.price * 100) : undefined),
        currency_code: req.body.currency_code,
        is_free: req.body.is_free,
        pdf_file_path: req.body.pdf_file_path,
        hardcopy_available: req.body.hardcopy_available
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
          category_id: updatedBook.category_id,
          description: updatedBook.description,
          price: updatedBook.price_minor / 100, // Convert from cents to dollars
          price_minor: updatedBook.price_minor,
          currency_code: updatedBook.currency_code,
          is_free: updatedBook.is_free,
          pdf_file_path: updatedBook.pdf_file_path,
          hardcopy_available: updatedBook.hardcopy_available,
          created_at: updatedBook.createdAt,
          updated_at: updatedBook.updatedAt
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

      // Update book pdf_file_path if needed
      await storage.updateBook(bookId, {
        pdf_file_path: req.file.path
      });

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
        sum + (item.book.price_minor * item.quantity), 0
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
              price: item.book.price_minor / 100, // Convert from cents to dollars
              price_minor: item.book.price_minor,
              currency_code: item.book.currency_code,
              is_free: item.book.is_free,
              pdf_file_path: item.book.pdf_file_path,
              hardcopy_available: item.book.hardcopy_available
            },
            quantity: item.quantity,
            subtotal: item.book.price_minor * item.quantity,
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
          updated_at: updatedItem!.updated_at
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
        sum + (item.book.price_minor * item.quantity), 0
      );

      const hasFreeItems = cartItems.some(item => item.book.is_free);
      const hasPaidItems = cartItems.some(item => !item.book.is_free);

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
          unitPrice: cartItem.book.price
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
              price: item.book.price_minor
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
              cover_image_url: item.book.pdf_file_path
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
          notes: order.notes,
          items: order.items.map(item => ({
            id: item.id,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              isbn: item.book.isbn,
              price: item.book.price_minor,
              cover_image_url: item.book.pdf_file_path
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
      const pdfAsset = bookAssets.find(asset => asset.assetType === 'pdf');
      
      if (!pdfAsset) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not available for this book'
        });
      }

      // Check if file exists
      if (!fs.existsSync(pdfAsset.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not found on server'
        });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfAsset.fileName}"`);
      res.setHeader('Content-Length', pdfAsset.fileSize || 0);

      // Stream the file
      const fileStream = fs.createReadStream(pdfAsset.filePath);
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
        isDefault: req.body.is_default || false
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
      
      if (!existingAddress || existingAddress.userId !== userId) {
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
        isDefault: req.body.is_default
      });

      const updatedAddress = await storage.updateUserAddress(addressId, updateData);

      // If this is set as default, update other addresses
      if (updateData.isDefault) {
        await storage.setDefaultAddress(userId, addressId);
      }

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: {
          id: updatedAddress!.id,
          label: updatedAddress!.label,
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
}