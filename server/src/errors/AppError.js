class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

class AuthError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTH_ERROR");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

class UpstreamError extends AppError {
  constructor(message = "Upstream service error") {
    super(message, 502, "UPSTREAM_ERROR");
  }
}

class InsufficientHistoryError extends AppError {
  constructor(daysTracked, daysRequired = 30) {
    super("Insufficient activity history", 422, "INSUFFICIENT_HISTORY");
    this.reason = "insufficient_history";
    this.daysTracked = daysTracked;
    this.daysRequired = daysRequired;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UpstreamError,
  InsufficientHistoryError,
};