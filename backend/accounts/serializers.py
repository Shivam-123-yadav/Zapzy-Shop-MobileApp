from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Profile
        fields = ['name', 'email', 'phone', 'avatar']
