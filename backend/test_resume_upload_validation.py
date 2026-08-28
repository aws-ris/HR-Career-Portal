import pytest

from main import MAX_RESUME_FILE_SIZE_BYTES, validate_resume_upload


def test_validate_resume_upload_accepts_pdf_and_docx():
    validate_resume_upload("candidate_resume.pdf", "application/pdf", 1024)
    validate_resume_upload("candidate_resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1024)


def test_validate_resume_upload_rejects_unsupported_file_type():
    with pytest.raises(ValueError, match="PDF or DOCX"):
        validate_resume_upload("candidate_resume.txt", "text/plain", 1024)


def test_validate_resume_upload_rejects_large_file():
    with pytest.raises(ValueError, match="5MB"):
        validate_resume_upload("candidate_resume.pdf", "application/pdf", MAX_RESUME_FILE_SIZE_BYTES + 1)
