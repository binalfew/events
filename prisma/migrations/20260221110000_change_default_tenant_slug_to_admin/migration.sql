-- Change the default tenant slug from "default-org" to "admin"
UPDATE "Tenant" SET "slug" = 'admin' WHERE "slug" = 'default-org';
