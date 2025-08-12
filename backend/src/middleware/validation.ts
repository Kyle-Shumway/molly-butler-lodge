import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required')
    .escape(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

export const validateUserCreation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .escape(),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .escape(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'STAFF'])
    .withMessage('Role must be either ADMIN or STAFF'),
  handleValidationErrors
];

// Reservation validation rules
export const validateReservation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .escape(),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Valid phone number is required')
    .escape(),
  body('address')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address is required and must be less than 200 characters')
    .escape(),
  body('roomId')
    .isUUID()
    .withMessage('Valid room ID is required'),
  body('checkIn')
    .isISO8601()
    .withMessage('Valid check-in date is required')
    .custom((value) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  body('checkOut')
    .isISO8601()
    .withMessage('Valid check-out date is required')
    .custom((value, { req }) => {
      const checkOut = new Date(value);
      const checkIn = new Date(req.body.checkIn);
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('guests')
    .isInt({ min: 1, max: 8 })
    .withMessage('Number of guests must be between 1 and 8'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests must be less than 500 characters')
    .escape(),
  handleValidationErrors
];

// Parameter validation
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Query validation for availability check
export const validateAvailabilityQuery = [
  query('checkIn')
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  query('checkOut')
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  query('guests')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Number of guests must be between 1 and 8'),
  handleValidationErrors
];

// Sanitize HTML input (additional protection)
export const sanitizeHtml = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential HTML/script tags from string fields
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/<[^>]*>/g, ''); // Remove HTML tags
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  next();
};