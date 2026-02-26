import subprocess
import os

# Find the PID of the python uvicorn process
out = subprocess.check_output("ps aux | grep uvicorn | grep -v grep", shell=True).decode()
print("Uvicorn processes:")
print(out)
