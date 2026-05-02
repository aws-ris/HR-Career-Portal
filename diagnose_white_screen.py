import subprocess
import os
import time
import sys

def start_and_capture():
    base = r"c:\Users\Viraal\Desktop\HRForm"
    f_path = os.path.join(base, "frontend")
    b_path = os.path.join(base, "backend")
    
    print("Restarting servers and capturing logs...")
    
    # Kill node (frontend)
    subprocess.run(["taskkill", "/F", "/IM", "node.exe", "/T"], shell=True)
    # Don't kill python.exe, just try to bind to port 8000. If it fails, then we know uvicorn is there.
    
    time.sleep(2)
    
    with open("frontend_debug.log", "w") as f_log:
        f_proc = subprocess.Popen(["npm.cmd", "run", "dev"], cwd=f_path, stdout=f_log, stderr=f_log, shell=True)
        
        print("Waiting 10 seconds for frontend output...")
        time.sleep(10)
        
    print("--- FRONTEND LOG ---")
    if os.path.exists("frontend_debug.log"):
        with open("frontend_debug.log", "r") as f:
            print(f.read())

if __name__ == "__main__":
    start_and_capture()
