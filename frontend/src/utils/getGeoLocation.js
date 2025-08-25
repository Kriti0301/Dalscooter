/**
 * Returns {lat, long}.  Tries fast low-accuracy fix first,
 * falls back to cached reading (≤60 s old), then returns null.
 */
export async function safeGeolocate() {
    if (!navigator.geolocation) return null;          // not supported
  
    // Promise wrapper
    const tryOnce = (opts) =>
      new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: p.coords.latitude, long: p.coords.longitude }),
          rej,
          opts
        )
      );
  
    // ① quick, low-accuracy (8 s)
    try {
      return await tryOnce({ enableHighAccuracy: false, timeout: 8000 });
    } catch (err) {
      if (err.code !== err.TIMEOUT) throw err;        // permission denied → bail
    }
  
    // ② allow cached (<60 s) – resolves instantly if available
    try {
      return await tryOnce({ maximumAge: 60000, timeout: 2000 });
    } catch {
      return null;                                    // still no fix
    }
  }
  