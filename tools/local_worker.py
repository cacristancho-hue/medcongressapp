import os
import time
import requests
from dotenv import load_dotenv

# Cargar variables del entorno
load_dotenv(dotenv_path='app/.env.local')

URL = "http://localhost:3000/api/jobs/worker"
SECRET = os.getenv("CRON_SECRET")

if not SECRET:
    print("Error: CRON_SECRET no configurado en .env.local")
    exit(1)

print(f"--- INICIANDO WORKER LOCAL MDCONGRESS ---")
print(f"Triggering {URL} cada 5 segundos...")

while True:
    try:
        r = requests.post(
            URL, 
            headers={"Authorization": f"Bearer {SECRET}"}
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("jobId"):
                print(f"[{time.strftime('%H:%M:%S')}] Job procesado: {data['jobId']}")
            else:
                # No habÃa jobs pendientes
                pass
        elif r.status_code == 404:
            print(f"[{time.strftime('%H:%M:%S')}] Error 404: Endpoint no encontrado. Â¿EstÃ¡ el servidor Next.js corriendo?")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error de conexiÃ³n: {e}")
    
    time.sleep(5)
