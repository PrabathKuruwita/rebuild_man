from django.db import migrations, models

def update_government_donor_types(apps, schema_editor):
    Donation = apps.get_model('core', 'Donation')
    Donation.objects.filter(donor_type='government').update(donor_type='organization')

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0024_alter_notification_notification_type'),
    ]

    operations = [
        migrations.RenameField(
            model_name='donation',
            old_name='government_department',
            new_name='organization_name',
        ),
        migrations.RenameField(
            model_name='donation',
            old_name='government_program',
            new_name='organization_program',
        ),
        migrations.RenameField(
            model_name='donation',
            old_name='government_officer_name',
            new_name='organization_officer_name',
        ),
        migrations.RenameField(
            model_name='donation',
            old_name='government_officer_designation',
            new_name='organization_officer_designation',
        ),
        migrations.RenameField(
            model_name='donation',
            old_name='government_officer_contact',
            new_name='organization_officer_contact',
        ),
        migrations.RenameField(
            model_name='donation',
            old_name='government_email',
            new_name='organization_email',
        ),
        migrations.AlterField(
            model_name='donation',
            name='donor_type',
            field=models.CharField(
                choices=[('private', 'Private Donor'), ('organization', 'Organization')],
                default='private',
                max_length=20
            ),
        ),
        migrations.RunPython(update_government_donor_types, reverse_code=migrations.RunPython.noop),
    ]
