# Logs Directory

This directory contains immutable logs for the Pay Fusion platform.

## Structure

- `/logs/system/` - System logs (rotated daily)
- `/logs/security/` - Security and audit logs (immutable)
- `/logs/transactions/` - Transaction logs (immutable)
- `/logs/errors/` - Error logs
- `/logs/access/` - Access logs

## Log Format

All logs follow this JSON format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warning|error|security",
  "service": "auth|payment|wallet|crypto|freefire|admin",
  "userId": "USER_ID_OR_NULL",
  "ip": "CLIENT_IP",
  "userAgent": "USER_AGENT",
  "action": "ACTION_NAME",
  "message": "Human readable message",
  "details": {
    "key": "value",
    "additional": "data"
  },
  "transactionId": "TRANSACTION_ID_OR_NULL"
}
