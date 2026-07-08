# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in NepNep, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### GitHub Private Vulnerability Reporting

Go to the repository's Security tab and click "Report a vulnerability" to submit a private report.

### What to Expect

- We will acknowledge your report within 48 hours
- We will investigate and provide an initial assessment within 7 days
- We will work on a fix and coordinate the release with you
- We will credit you in the release notes (unless you prefer to remain anonymous)

## Security Considerations

### API Key Storage

NepNep stores your DashScope API key locally using Electron's `safeStorage` API, which encrypts the key on macOS and Linux. On Windows, it uses DPAPI encryption.

**Recommendation**: Never share your API key or commit it to version control.

### DRM Protection Mode

The DRM protection mode prevents screen capture of the app window. Note:
- macOS: Uses `setContentProtection` and hides from dock
- Windows: Uses `setContentProtection` and prevents minimizing
- Linux X11: Similar to Windows
- Linux Wayland: Native security is already built-in

### Network Communication

NepNep communicates with:
- DashScope WebSocket API (`wss://dashscope.aliyuncs.com`)
- No other external services

All audio data is streamed directly to DashScope for processing.

## Best Practices for Users

1. Keep NepNep updated to the latest version
2. Use DRM mode when translating sensitive content
3. Review your API key permissions in DashScope console
4. Report any suspicious behavior immediately

---

Thank you for helping keep NepNep secure! 🔒