import subprocess
import os
import time

def launch():
    base = r"c:\Users\Viraal\Desktop\HRForm"
    frontend_path = os.path.join(base, "frontend")
    backend_path = os.path.join(base, "backend")
    
    python_exe = os.path.join(backend_path, "venv", "Scripts", "python.exe")
    npm_cmd = "npm.cmd" # Standard for Windows node installs
    
    print(f"Using Python: {python_exe}")
    print(f"Using Frontend Path: {frontend_path}")
    
    # 1. Kill existing node and previous windows
    subprocess.run(["taskkill", "/F", "/IM", "node.exe", "/T"], shell=True, capture_output=True)
    subprocess.run(["taskkill", "/F", "/FI", "WINDOWTITLE eq RIS_BACKEND"], shell=True, capture_output=True)
    subprocess.run(["taskkill", "/F", "/FI", "WINDOWTITLE eq RIS_FRONTEND"], shell=True, capture_output=True)
    
    # 2. Launch Backend
    print("Launching Backend...")
    backend_cmd = f'venv\\Scripts\\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload'
    subprocess.Popen(f'start "RIS_BACKEND" /D "{backend_path}" cmd /c "{backend_cmd}"', shell=True)
    
    # 3. Launch Frontend
    print("Launching Frontend...")
    frontend_cmd = f'{npm_cmd} run dev'
    subprocess.Popen(f'start "RIS_FRONTEND" /D "{frontend_path}" cmd /k "{frontend_cmd}"', shell=True)
    
    print("\nCheck for two new command windows. Refresh in 10s.")

if __name__ == "__main__":
    launch()
