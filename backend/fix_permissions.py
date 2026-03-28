#!/usr/bin/env python
"""
Quick fix script to set up user permissions for testing
Usage: python fix_permissions.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Organization

def main():
    print("\n" + "="*60)
    print("  Permission Fix Script")
    print("="*60 + "\n")
    
    # List all users
    users = User.objects.all()
    
    if not users.exists():
        print("❌ No users found. Please create a superuser first:")
        print("   python manage.py createsuperuser")
        return
    
    print("Available users:")
    for i, user in enumerate(users, 1):
        role_display = user.role if user.role else "NO ROLE"
        print(f"  [{i}] {user.username} - Role: {role_display}")
    
    # Select user
    while True:
        try:
            choice = int(input("\nSelect user number to fix permissions: "))
            if 1 <= choice <= len(users):
                user = list(users)[choice - 1]
                break
            else:
                print("❌ Invalid number. Try again.")
        except ValueError:
            print("❌ Please enter a number.")
        except KeyboardInterrupt:
            print("\n\n❌ Cancelled by user")
            return
    
    print(f"\n📝 Current settings for {user.username}:")
    print(f"   Role: {user.role if user.role else 'NONE'}")
    print(f"   Staff status: {user.is_staff}")
    print(f"   Superuser: {user.is_superuser}")
    
    # Ask what role to set
    print("\nWhat role do you want to assign?")
    print("  [1] ADMIN - Full system access")
    print("  [2] ORG_ADMIN - Manage own organization")
    print("  [3] DONOR - Read-only access")
    
    while True:
        try:
            role_choice = int(input("\nEnter choice (1-3): "))
            if role_choice == 1:
                user.role = 'ADMIN'
                user.is_staff = True
                break
            elif role_choice == 2:
                user.role = 'ORG_ADMIN'
                user.is_staff = True
                break
            elif role_choice == 3:
                user.role = 'DONOR'
                break
            else:
                print("❌ Invalid choice. Enter 1, 2, or 3.")
        except ValueError:
            print("❌ Please enter a number.")
        except KeyboardInterrupt:
            print("\n\n❌ Cancelled by user")
            return
    
    user.save()
    print(f"\n✅ User {user.username} role set to: {user.role}")
    
    # If ORG_ADMIN, ask about linking to organization
    if user.role == 'ORG_ADMIN':
        orgs = Organization.objects.all()
        
        if not orgs.exists():
            print("\n⚠️  No organizations found.")
            print("   ORG_ADMIN users need to be linked to an organization.")
            print("   Create an organization in the admin panel first.")
        else:
            print("\nAvailable organizations:")
            for i, org in enumerate(orgs, 1):
                linked = " (currently linked)" if org.admin_user == user else ""
                print(f"  [{i}] {org.name} - {org.district}{linked}")
            
            print("  [0] Skip linking")
            
            while True:
                try:
                    org_choice = int(input("\nLink to organization number (or 0 to skip): "))
                    if org_choice == 0:
                        break
                    elif 1 <= org_choice <= len(orgs):
                        org = list(orgs)[org_choice - 1]
                        org.admin_user = user
                        org.save()
                        print(f"\n✅ User {user.username} linked to: {org.name}")
                        break
                    else:
                        print("❌ Invalid number.")
                except ValueError:
                    print("❌ Please enter a number.")
                except KeyboardInterrupt:
                    print("\n\n❌ Cancelled by user")
                    return
    
    # Summary
    print("\n" + "="*60)
    print("  ✅ Permission Setup Complete!")
    print("="*60)
    print(f"\nUser: {user.username}")
    print(f"Role: {user.role}")
    print(f"Staff: {user.is_staff}")
    
    if user.role == 'ORG_ADMIN':
        managed_orgs = Organization.objects.filter(admin_user=user)
        if managed_orgs.exists():
            first_org = managed_orgs.first()
            if first_org:
                print(f"Manages: {first_org.name}")
            else:
                print("⚠️  Not linked to any organization yet")
        else:
            print("⚠️  Not linked to any organization yet")
    
    print("\n🎯 You can now:")
    print(f"   - Login with: {user.username}")
    print("   - Access admin panel: http://localhost:8000/admin/")
    print("   - Use API with these credentials")
    
    if user.role == 'ADMIN':
        print("\n   As ADMIN, you have full access to all endpoints!")
    elif user.role == 'ORG_ADMIN':
        print("\n   As ORG_ADMIN, you can manage your organization's data!")
    else:
        print("\n   As DONOR, you have read-only access.")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
