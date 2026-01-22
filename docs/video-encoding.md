# Video Encoding Requirements

## Optimal Video Settings for Frame-Accurate Tracking

For smooth frame-by-frame stepping, videos should have:

1. **Frequent keyframes (I-frames)** - Ideally every frame, or at minimum every 1 second
2. **No B-frames** - B-frames require bidirectional decoding, making precise seeking difficult
3. **Constant frame rate (CFR)** - Variable frame rate (VFR) causes timing drift
4. **H.264 codec** - Best browser compatibility (HEVC/H.265 has limited support)

## Common Problem Sources

| Source | Typical Issues |
|--------|----------------|
| Video editing software exports | Sparse keyframes, heavy B-frame usage (optimized for file size) |
| Screen recordings | Usually fine |
| Smartphone cameras | Generally good, but may use VFR or HEVC |
| Professional cameras | Often fine, depends on settings |

## How to Fix Problematic Videos

Use FFmpeg to re-encode with optimal settings:

```bash
ffmpeg -i input.mp4 -c:v libx264 -x264-params keyint=1:bframes=0 -c:a copy output_fixed.mp4
```

This creates an "all-intra" encode where every frame is a keyframe. File size will increase but seeking will be instant.

### Options Explained

- `-c:v libx264` - Use H.264 codec
- `-x264-params keyint=1` - Keyframe every 1 frame (all-intra)
- `-x264-params bframes=0` - Disable B-frames
- `-c:a copy` - Copy audio without re-encoding

## Future Improvements

Consider implementing:

1. **Upload-time detection** - Analyze video on upload and warn if:
   - Sparse keyframes detected
   - HEVC codec (limited browser support)
   - Variable frame rate detected

2. **Client-side transcoding** - Optional ffmpeg.wasm conversion for problematic videos

3. **Server-side transcoding** - Auto-convert on upload (adds cost/complexity)

## Browser Compatibility

| Codec | Chrome | Firefox | Safari | Edge |
|-------|--------|---------|--------|------|
| H.264 | ✓ | ✓ | ✓ | ✓ |
| HEVC (H.265) | Partial | ✗ | ✓ | Partial |
| VP9 | ✓ | ✓ | ✗ | ✓ |
| AV1 | ✓ | ✓ | ✗ | ✓ |

H.264 remains the safest choice for cross-browser compatibility.
