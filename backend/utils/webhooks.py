import os
import requests
from fastapi import BackgroundTasks

# Retrieve n8n webhook configuration from environment
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "https://n8n.ris-tms.org/webhook")
N8N_SECRET_TOKEN = os.getenv("N8N_SECRET_TOKEN", "")

def send_n8n_webhook(event_type: str, data: dict):
    """
    Sends an HTTP POST JSON payload to the n8n webhook endpoint.
    Executed in FastAPI background tasks to ensure 0ms delay to applicant responses.
    """
    if not N8N_WEBHOOK_URL:
        return
        
    try:
        url = f"{N8N_WEBHOOK_URL.rstrip('/')}/{event_type.lstrip('/')}"
        headers = {
            "Content-Type": "application/json"
        }
        if N8N_SECRET_TOKEN:
            headers["X-N8N-Secret"] = N8N_SECRET_TOKEN

        response = requests.post(
            url,
            json={
                "event": event_type,
                "data": data
            },
            headers=headers,
            timeout=4
        )
        print(f"[n8n Webhook] Event '{event_type}' sent to {url} | Status: {response.status_code}")
    except Exception as e:
        print(f"[n8n Webhook Warning] Could not reach n8n server: {e}")

def trigger_n8n_event(background_tasks: BackgroundTasks, event_type: str, data: dict):
    """
    Helper function to register non-blocking background task in FastAPI routes.
    """
    background_tasks.add_task(send_n8n_webhook, event_type, data)
