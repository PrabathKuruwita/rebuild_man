"""
AI/OCR Service for processing uploaded documents and extracting need items.
This service uses Google's Gemini AI model to extract structured data from documents.
"""

import json
import os
from typing import Dict, List, Optional
import PyPDF2
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from django.conf import settings


class AIDocumentProcessor:
    """
    Process documents using AI to extract need items.
    """
    
    def __init__(self):
        """Initialize the Gemini AI client."""
        # Get API key from Django settings (loaded from .env file)
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Using gemini-1.5-flash for free tier with good performance
            # gemini-1.5-pro is also available but has lower free quota
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text()
                
                return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def process_with_ai(self, text: str, organization_name: str = "") -> Dict:
        """
        Process extracted text using Gemini AI to identify need items.
        
        Args:
            text: Extracted text from document
            organization_name: Name of the organization (optional context)
            
        Returns:
            Dictionary containing extracted need items
        """
        if not self.model:
            raise Exception("Gemini API key not configured. Set GEMINI_API_KEY environment variable.")
        
        prompt = f"""
You are an expert at analyzing hospital and organization needs documents. You extract structured data from text and classify items by priority.

You are analyzing a document from {organization_name if organization_name else 'a hospital/organization'} that contains a list of needed items for disaster relief or regular operations.

Extract all need items from the following text and return them in a structured JSON format.

For each item, identify:
1. name: The name of the item (e.g., "Saline Bottles", "Surgical Masks", "Rice")
2. priority: Classify as "CRITICAL", "ESSENTIAL", or "NICE" based on urgency
   - CRITICAL: Life-saving, emergency medical supplies, essential medicines
   - ESSENTIAL: Important operational items, basic medical supplies, food staples
   - NICE: Nice to have items, comfort items, non-urgent supplies
3. quantity_required: The numeric quantity needed
4. unit: The unit of measurement ("UNIT", "BOX", "KG", "LITER")
5. description: Any additional details or specifications
6. section: Try to categorize into sections like "Emergency Ward", "OPD", "Kitchen", "Pharmacy", etc.

Text to analyze:
{text}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{{
    "sections": [
        {{
            "name": "Section Name",
            "items": [
                {{
                    "name": "Item Name",
                    "priority": "CRITICAL|ESSENTIAL|NICE",
                    "quantity_required": 100,
                    "unit": "UNIT|BOX|KG|LITER",
                    "description": "Additional details"
                }}
            ]
        }}
    ]
}}

If no clear sections are identified, use "General Needs" as the section name.
"""
        
        try:
            # Configure generation settings for better JSON output
            generation_config = GenerationConfig(
                temperature=0.3,  # Lower temperature for more consistent output
                top_p=0.8,
                top_k=40,
                max_output_tokens=8192,
            )
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini AI model")
            
            # Clean the response text (remove markdown code blocks if present)
            result_text = response.text.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:]  # Remove ```json
            if result_text.startswith("```"):
                result_text = result_text[3:]  # Remove ```
            if result_text.endswith("```"):
                result_text = result_text[:-3]  # Remove trailing ```
            result_text = result_text.strip()
            
            return json.loads(result_text)
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing with Gemini AI: {str(e)}")
    
    def process_document(self, document_upload) -> Dict:
        """
        Main method to process a document upload.
        
        Args:
            document_upload: DocumentUpload model instance
            
        Returns:
            Dictionary containing extracted data
        """
        try:
            # Get the file path
            file_path = document_upload.file.path
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(file_path)
            
            if not text or len(text.strip()) < 50:
                raise Exception("Could not extract sufficient text from PDF. The file might be empty or image-based.")
            
            # Process with AI
            organization_name = document_upload.organization.name if document_upload.organization else ""
            result = self.process_with_ai(text, organization_name)
            
            return {
                "status": "success",
                "extracted_text_length": len(text),
                "data": result
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def create_needs_from_json(self, json_data: Dict, document_upload) -> List:
        """
        Create NeedItem and Section objects from the extracted JSON data.
        
        Args:
            json_data: The structured JSON data from AI processing
            document_upload: The DocumentUpload instance
            
        Returns:
            List of created NeedItem objects
        """
        from .models import Section, NeedItem
        
        created_items = []
        organization = document_upload.organization
        
        try:
            sections_data = json_data.get('data', {}).get('sections', [])
            
            for section_data in sections_data:
                section_name = section_data.get('name', 'General Needs')
                
                # Get or create the section
                section, created = Section.objects.get_or_create(
                    organization=organization,
                    name=section_name,
                    defaults={'head_of_section': ''}
                )
                
                # Create need items
                items_data = section_data.get('items', [])
                for item_data in items_data:
                    need_item = NeedItem.objects.create(
                        section=section,
                        name=item_data.get('name', 'Unknown Item'),
                        priority=item_data.get('priority', 'ESSENTIAL'),
                        quantity_required=item_data.get('quantity_required', 1),
                        unit=item_data.get('unit', 'UNIT'),
                        description=item_data.get('description', '')
                    )
                    created_items.append(need_item)
            
            return created_items
            
        except Exception as e:
            raise Exception(f"Error creating needs from JSON: {str(e)}")


# Singleton instance
_processor = None

def get_document_processor() -> AIDocumentProcessor:
    """Get or create the document processor singleton."""
    global _processor
    if _processor is None:
        _processor = AIDocumentProcessor()
    return _processor
