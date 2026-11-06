"""Inspect signing metadata and sign disposable files; never export private keys."""

import ctypes
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import tempfile


def run(*args, timeout=15):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return result.returncode, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return 124, "Timed out waiting for unattended access"


print("Runner user:", run("id", "-un")[1].strip())
print("Console user:", run("stat", "-f", "%Su", "/dev/console")[1].strip())
print("Runner LaunchAgents:")
for path in sorted((Path.home() / "Library/LaunchAgents").glob("*actions*runner*.plist")):
    with path.open("rb") as stream:
        config = plistlib.load(stream)
    print(json.dumps({
        "file": path.name,
        "label": config.get("Label"),
        "SessionCreate": config.get("SessionCreate", "absent"),
        "LimitLoadToSessionType": config.get("LimitLoadToSessionType", "absent"),
    }))

print("User keychain search list:", run("security", "list-keychains", "-d", "user")[1])
print("Default keychain:", run("security", "default-keychain", "-d", "user")[1])
security = ctypes.CDLL("/System/Library/Frameworks/Security.framework/Security")
security.SecKeychainOpen.argtypes = [ctypes.c_char_p, ctypes.POINTER(ctypes.c_void_p)]
security.SecKeychainGetStatus.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint32)]
core = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
core.CFRelease.argtypes = [ctypes.c_void_p]
for path in sorted((Path.home() / "Library/Keychains").glob("*.keychain-db")):
    handle = ctypes.c_void_p()
    opened = security.SecKeychainOpen(os.fsencode(path), ctypes.byref(handle))
    status = ctypes.c_uint32()
    result = security.SecKeychainGetStatus(handle, ctypes.byref(status)) if opened == 0 else opened
    print(json.dumps({"keychain": path.name, "status_error": result,
                      "unlocked": bool(status.value & 1) if result == 0 else None}))
    if handle.value:
        core.CFRelease(handle)

code, identities = run("security", "find-identity", "-v", "-p", "codesigning")
print("Signing identities:", identities)
for identity, name in re.findall(r'\d+\) ([0-9A-F]{40}) "([^"]+)"', identities):
    if not name.startswith(("Apple Distribution:", "iPhone Distribution:")):
        continue
    with tempfile.TemporaryDirectory(prefix="runcount-signing-probe-") as directory:
        probe = Path(directory) / "probe"
        shutil.copyfile("/usr/bin/true", probe)
        probe.chmod(0o700)
        code, output = run("/usr/bin/codesign", "--force", "--sign", identity,
                           "--timestamp=none", str(probe), timeout=20)
        print(json.dumps({"identity": name, "sign_exit": code, "output": output.strip()}))

login_keychain = Path.home() / "Library/Keychains/login.keychain-db"
code, identities = run("security", "find-identity", "-v", "-p", "codesigning", str(login_keychain))
print("Login keychain identities:", identities)
seen = set()
for identity, name in re.findall(r'\d+\) ([0-9A-F]{40}) "([^"]+)"', identities):
    if identity in seen or not name.startswith(("Apple Distribution:", "iPhone Distribution:")):
        continue
    seen.add(identity)
    with tempfile.TemporaryDirectory(prefix="runcount-login-signing-probe-") as directory:
        probe = Path(directory) / "probe"
        shutil.copyfile("/usr/bin/true", probe)
        probe.chmod(0o700)
        code, output = run("/usr/bin/codesign", "--force", "--sign", identity,
                           "--keychain", str(login_keychain),
                           "--timestamp=none", str(probe), timeout=20)
        print(json.dumps({"keychain": "login", "identity": name, "sign_exit": code,
                          "output": output.strip()}))
