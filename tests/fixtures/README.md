# Place test fixture files here

## Expected Files:
- test-avatar.jpg (400x400px recommended)
- test-banner.jpg (1200x400px recommended)
- test-image.jpg (any size, for post uploads)
- test-video.mp4 (small video file for testing)

## How to Add:
1. Copy/download placeholder images
2. Name them according to the list above
3. Tests will use these files for upload testing

## Quick Download (PowerShell):
```powershell
Invoke-WebRequest -Uri "https://via.placeholder.com/400x400.jpg" -OutFile "test-avatar.jpg"
Invoke-WebRequest -Uri "https://via.placeholder.com/1200x400.jpg" -OutFile "test-banner.jpg"
Invoke-WebRequest -Uri "https://via.placeholder.com/800x600.jpg" -OutFile "test-image.jpg"
```

Note: These files are gitignored by default.
