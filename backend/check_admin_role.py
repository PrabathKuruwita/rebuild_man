#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

admin_user = User.objects.filter(username='admin').first()
if admin_user:
    print(f'Admin User Found!')
    print(f'Username: {admin_user.username}')
    print(f'Email: {admin_user.email}')
    print(f'Role: {admin_user.role}')
    print(f'Is Staff: {admin_user.is_staff}')
    print(f'Is Superuser: {admin_user.is_superuser}')
else:
    print('Admin user not found in database!')
    print('All users:')
    for user in User.objects.all():
        print(f'  - {user.username} (Role: {user.role})')
