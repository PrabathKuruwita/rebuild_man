"""
Custom exception handlers for better error messages
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides helpful error messages.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If it's an unsupported media type error
    if response is not None and response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE:
        custom_response = {
            'error': 'Unsupported Media Type',
            'message': 'You are using the wrong Content-Type for file uploads.',
            'received': context['request'].content_type,
            'help': {
                'issue': 'File uploads require multipart/form-data format, not JSON or other formats.',
                'solution': 'Use multipart/form-data format for sending files.',
                'common_mistakes': [
                    '❌ Setting Content-Type: application/json',
                    '❌ Setting Content-Type: application/pdf',
                    '❌ Trying to send file path as a string',
                    '❌ Using JSON format for file uploads'
                ],
                'correct_examples': {
                    'curl': {
                        'command': 'curl -X POST http://localhost:8000/api/documents/ -u username:password -F "organization=1" -F "file=@hospital_needs.pdf"',
                        'explanation': 'Use -F flag for form data. It automatically sets the correct Content-Type.'
                    },
                    'python_requests': {
                        'code': '''import requests

files = {'file': open('hospital_needs.pdf', 'rb')}
data = {'organization': 1}

response = requests.post(
    'http://localhost:8000/api/documents/',
    auth=('username', 'password'),
    files=files,  # Use 'files' parameter
    data=data     # Use 'data' parameter (not 'json')
)''',
                        'explanation': 'Open file in binary mode (rb) and use the files parameter.'
                    },
                    'postman': {
                        'steps': [
                            '1. Set method to POST',
                            '2. Set URL to http://localhost:8000/api/documents/',
                            '3. Go to Auth tab → Select Basic Auth',
                            '4. Go to Body tab → Select "form-data"',
                            '5. Add key "organization" with value "1" (type: Text)',
                            '6. Add key "file" and click "Select Files" to choose your PDF (type: File)',
                            '7. Click Send'
                        ],
                        'explanation': 'Do NOT use "raw" or "binary" body types for file uploads.'
                    },
                    'javascript_fetch': {
                        'code': '''const formData = new FormData();
formData.append('organization', '1');
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/api/documents/', {
    method: 'POST',
    headers: {
        'Authorization': 'Basic ' + btoa('username:password')
        // DON'T set Content-Type - browser does it automatically
    },
    body: formData
});''',
                        'explanation': 'Use FormData and let the browser set Content-Type automatically.'
                    }
                }
            }
        }
        return Response(custom_response, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
    
    # If it's a parser error (wrong format)
    if response is not None and response.status_code == status.HTTP_400_BAD_REQUEST:
        if isinstance(response.data, dict) and 'detail' in response.data and 'parse' in str(response.data['detail']).lower():
            custom_response = {
                'error': 'Parse Error',
                'message': str(response.data.get('detail', 'Unable to parse the request data.')),
                'help': {
                    'common_causes': [
                        'Using wrong Content-Type header',
                        'Malformed JSON data',
                        'Mixing JSON and form data',
                        'Incorrect file upload format'
                    ],
                    'for_file_uploads': 'Use multipart/form-data format. See examples in the documentation.',
                    'documentation': 'http://localhost:8000/api/'
                }
            }
            return Response(custom_response, status=status.HTTP_400_BAD_REQUEST)
    
    # Return the default response for other errors
    return response
