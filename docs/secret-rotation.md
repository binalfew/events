# Secret Rotation Procedures

## Overview

This document describes how to rotate each category of secret used by the application.

## Rotation Procedures

### DATABASE_URL

1. Create a new database user with the required privileges
2. Update `DATABASE_URL` in the deployment environment
3. Restart the application
4. Revoke the old database user credentials
5. Verify application connectivity

### SESSION_SECRET

1. Generate a new random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update `SESSION_SECRET` in the deployment environment
3. Restart the application
4. **Note:** All existing sessions will be invalidated — users must re-authenticate

### AZURE_STORAGE_CONNECTION_STRING

1. Rotate the access key in the Azure Portal
2. Copy the new connection string
3. Update `AZURE_STORAGE_CONNECTION_STRING` in the deployment environment
4. Restart the application

### AZURE_COMM_CONNECTION_STRING

1. Rotate the key in Azure Communication Services
2. Update `AZURE_COMM_CONNECTION_STRING` in the deployment environment
3. Restart the application

### SMTP_PASS

1. Generate a new SMTP password/app password from the email provider
2. Update `SMTP_PASS` in the deployment environment
3. Restart the application
4. Send a test email to verify

### SENTRY_DSN

1. Rotate the DSN in Sentry project settings
2. Update `SENTRY_DSN` in the deployment environment
3. Restart the application

## General Guidelines

- Rotate all secrets at least every 90 days
- Never commit secrets to version control
- Use a secrets manager (Azure Key Vault, etc.) in production
- After rotation, verify the application starts and key features work
- Keep a log of rotation dates for compliance
