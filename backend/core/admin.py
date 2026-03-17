from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization, Section, NeedItem, DocumentUpload

# 1. Register the Custom User Model
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    fieldsets = list(UserAdmin.fieldsets) + [
        ('Custom Fields', {'fields': ('role', 'phone_number')}),
    ]


# 2. Register Organization
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'registration_number')
    search_fields = ('name', 'district')


# 3. Register Sections
class NeedItemInline(admin.TabularInline):
    model = NeedItem
    extra = 1  # Show one empty row for adding new needs quickly


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'head_of_section')
    list_filter = ('organization',)
    inlines = [NeedItemInline] # This lets you add needs directly inside a Section page


# 4. Register Needs (Global View)
@admin.register(NeedItem)
class NeedItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'priority', 'section', 'quantity_required', 'quantity_received')
    list_filter = ('priority', 'section__organization')
    search_fields = ('name',)


# 5. Register Document Uploads
@admin.register(DocumentUpload)
class DocumentUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'organization', 'uploaded_by', 'status', 'uploaded_at')
    list_filter = ('status', 'organization')
