# System Admin Login Guide

## System Owner Login
The system owner (super admin) has full control over the entire SaaS platform.

### Login Credentials:
- **Email**: owner@system.com
- **Password**: owner123

### Access URL:
1. Go to the regular login page: `/login`
2. Login with the system owner credentials above
3. After login, navigate to: `/system-admin`

### System Owner Capabilities:
- View all organizations and their subscription status
- Manage all users across the platform
- View system statistics (revenue, active users, new organizations)
- Access system configuration and maintenance tools

## Organization Owner Access
Organization owners (regular clients who own their company account) have different access:

### Example Organization Owner:
- **Email**: widi@teknologimaju.com  
- **Password**: widi123
- **Organization**: PT Teknologi Maju

### Organization Owner Capabilities:
- Access "Pengaturan Organisasi" in the sidebar
- Manage their organization settings
- View and manage their subscription
- Add/remove members (coming soon)

## Role Hierarchy:
1. **System Owner** (isSystemOwner = true)
   - Full platform control
   - Access to /system-admin dashboard
   - Can manage all organizations

2. **Organization Owner** (ownerId in organizations table)
   - Manages their specific organization
   - Access to /organization-settings
   - Limited to their organization only

3. **Regular Users** (members)
   - Standard OKR platform access
   - No administrative capabilities