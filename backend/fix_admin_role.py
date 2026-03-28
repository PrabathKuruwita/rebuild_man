#!/usr/bin/env python
"""
Fix script to set admin user to ADMIN role
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

admin_user = User.objects.filter(username='admin').first()
if admin_user:
    print(f'Found admin user: {admin_user.username}')
    print(f'Current role: {admin_user.role}')
    
    # Update role to ADMIN
    admin_user.role = 'ADMIN'
    admin_user.save()
    
    print(f'✅ Role updated to: {admin_user.role}')
    print(f'The admin user can now access all admin features!')
    print(f'Please logout and login again to refresh your dashboard.')
else:
    print('❌ Admin user not found!')
    print('Please run: python manage.py create_default_admin')
